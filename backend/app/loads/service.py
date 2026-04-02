"""Loads service — business logic including state machine, Trip creation, dispatch, and board tabs.

Step 2 tasks covered:
  - LOAD_TRANSITIONS state machine (8-stage pipeline with guardrails)
  - advance_load_status with side effects per transition
  - dispatch_load (Trip creation, compliance validation)
  - Board tab queries (updated for new statuses)
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.loads.repository import LoadRepository
from app.loads.schemas import (
    LoadCreate,
    LoadUpdate,
    LoadResponse,
    LoadListItem,
    LoadListResponse,
    StopResponse,
    AccessorialResponse,
    TripResponse,
    DispatchRequest,
)
from app.core.exceptions import NotFoundError
from app.models.base import LoadStatus, TripStatus, DriverStatus
from app.models.load import Load, Trip, LoadStop
from app.models.driver import Driver
from app.models.fleet import Truck, Trailer, EquipmentStatus
from app.models.company import Company


# ══════════════════════════════════════════════════════════════════
#   STATE MACHINE — 8-Stage Load Lifecycle
# ══════════════════════════════════════════════════════════════════

LOAD_TRANSITIONS: dict[LoadStatus, list[LoadStatus]] = {
    LoadStatus.offer:       [LoadStatus.booked, LoadStatus.cancelled],
    LoadStatus.booked:      [LoadStatus.assigned, LoadStatus.cancelled],
    LoadStatus.assigned:    [LoadStatus.dispatched, LoadStatus.booked, LoadStatus.cancelled],
    LoadStatus.dispatched:  [LoadStatus.in_transit, LoadStatus.assigned],
    LoadStatus.in_transit:  [LoadStatus.delivered],
    LoadStatus.delivered:   [LoadStatus.invoiced],
    LoadStatus.invoiced:    [LoadStatus.paid],
    LoadStatus.paid:        [],  # Terminal
    LoadStatus.cancelled:   [],  # Terminal
}


# Side-effects triggered on specific transitions
# Each effect is a method name on LoadService
TRANSITION_SIDE_EFFECTS: dict[tuple[str, str], list[str]] = {
    ("booked", "assigned"): [
        "_effect_create_trip",
    ],
    ("assigned", "dispatched"): [
        "_effect_validate_driver_compliance",
        "_effect_validate_truck_availability",
        "_effect_set_driver_on_trip",
        "_effect_set_equipment_in_use",
    ],
    ("in_transit", "delivered"): [
        "_effect_release_driver",
        "_effect_release_equipment",
    ],
    ("delivered", "invoiced"): [
        "_effect_lock_load_financials",
    ],
}


class LoadService:
    """Load business logic — CRUD, state machine, dispatch, Trip management, board tabs."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.repo = LoadRepository(db, company_id)
        self.company_id = company_id

    # ── Helpers ──────────────────────────────────────────────────

    def _to_list_item(self, load) -> LoadListItem:
        """Transform a Load ORM object into a LoadListItem."""
        pickup_city = None
        pickup_date = None
        delivery_city = None
        delivery_date = None

        if load.stops:
            sorted_stops = sorted(load.stops, key=lambda s: s.stop_sequence)
            for s in sorted_stops:
                if s.stop_type == "pickup" and pickup_city is None:
                    pickup_city = s.city
                    pickup_date = s.scheduled_date
                if s.stop_type == "delivery":
                    delivery_city = s.city
                    delivery_date = s.scheduled_date

        broker_name = load.broker.name if load.broker else None

        # Driver/truck info comes from the primary trip (sequence 1)
        driver_name = None
        truck_number = None
        if load.trips:
            primary_trip = next(
                (t for t in load.trips if t.sequence_number == 1), load.trips[0]
            )
            if primary_trip.driver:
                driver_name = f"{primary_trip.driver.first_name} {primary_trip.driver.last_name}"
            if primary_trip.truck:
                truck_number = primary_trip.truck.unit_number

        return LoadListItem(
            id=str(load.id),
            load_number=load.load_number,
            shipment_id=load.shipment_id,
            broker_load_id=load.broker_load_id,
            status=load.status.value if hasattr(load.status, 'value') else load.status,
            base_rate=load.base_rate,
            total_rate=load.total_rate,
            created_at=load.created_at,
            pickup_city=pickup_city,
            pickup_date=pickup_date,
            delivery_city=delivery_city,
            delivery_date=delivery_date,
            broker_name=broker_name,
            driver_name=driver_name,
            truck_number=truck_number,
            trip_count=len(load.trips) if load.trips else 0,
        )

    def _calculate_total_rate(self, base_rate, accessorials_data: list) -> Decimal:
        """Calculate total_rate = base_rate + sum(accessorials)."""
        base = Decimal(str(base_rate)) if base_rate else Decimal("0")
        acc_total = sum(Decimal(str(a.get("amount", 0))) for a in accessorials_data)
        return base + acc_total

    # ── CRUD ─────────────────────────────────────────────────────

    async def list_loads(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        driver_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> LoadListResponse:
        d_id = UUID(driver_id) if driver_id else None
        items, total = await self.repo.list(page, page_size, status, d_id, date_from, date_to)
        return LoadListResponse(
            items=[self._to_list_item(load) for load in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_load(self, load_id: UUID) -> LoadResponse:
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")
        return LoadResponse.model_validate(load)

    async def create_load(self, data: LoadCreate) -> LoadResponse:
        # Prepare kwargs for Load model
        load_kwargs = {}
        if data.broker_id:
            load_kwargs["broker_id"] = UUID(data.broker_id)

        load_kwargs["broker_load_id"] = data.broker_load_id
        load_kwargs["contact_agent"] = data.contact_agent
        load_kwargs["base_rate"] = data.base_rate
        load_kwargs["total_miles"] = data.total_miles
        load_kwargs["notes"] = data.notes

        # Calculate total_rate
        acc_data = [a.model_dump() for a in data.accessorials]
        load_kwargs["total_rate"] = self._calculate_total_rate(data.base_rate, acc_data)

        stops_data = [s.model_dump() for s in data.stops]

        load = await self.repo.create(
            stops_data=stops_data,
            accessorials_data=acc_data,
            **load_kwargs,
        )
        return LoadResponse.model_validate(load)

    async def update_load(self, load_id: UUID, data: LoadUpdate) -> LoadResponse:
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        # Block edits on locked loads (post-invoiced)
        if load.is_locked:
            raise HTTPException(
                status_code=400,
                detail="Load is locked (invoiced). Financial fields cannot be edited.",
            )

        updated = await self.repo.update(load, **data.model_dump(exclude_unset=True))
        return LoadResponse.model_validate(updated)

    async def delete_load(self, load_id: UUID) -> None:
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")
        if load.status != LoadStatus.offer:
            raise HTTPException(
                status_code=400,
                detail="Only loads with status 'offer' can be deleted",
            )
        await self.repo.soft_delete(load)

    # ══════════════════════════════════════════════════════════════
    #   STATE MACHINE — Advance Load Status
    # ══════════════════════════════════════════════════════════════

    async def advance_status(self, load_id: UUID, target_status: str) -> LoadResponse:
        """Enforce valid transitions, execute side-effects, and update status."""
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        current = LoadStatus(load.status.value if hasattr(load.status, 'value') else load.status)
        try:
            target = LoadStatus(target_status)
        except ValueError:
            raise HTTPException(400, f"Invalid status: '{target_status}'")

        # 1. Validate transition is allowed
        allowed = LOAD_TRANSITIONS.get(current, [])
        if target not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{current.value}' to '{target.value}'. Allowed: {[s.value for s in allowed]}",
            )

        # 2. Execute side-effects for this transition
        side_effect_key = (current.value, target.value)
        if side_effect_key in TRANSITION_SIDE_EFFECTS:
            for effect_name in TRANSITION_SIDE_EFFECTS[side_effect_key]:
                effect_fn = getattr(self, effect_name)
                await effect_fn(load)

        # 3. Update status
        load.status = target
        await self.db.commit()
        await self.db.refresh(load)

        return LoadResponse.model_validate(load)

    # ── Side-Effect Methods ──────────────────────────────────────

    async def _effect_create_trip(self, load: Load) -> None:
        """Create a Trip entity when Load transitions booked → assigned.
        Only creates if no trips exist yet (first assignment).
        """
        if load.trips and len(load.trips) > 0:
            return  # Trip already exists

        # Generate trip number: TR-{load_number suffix}-01
        load_suffix = load.load_number.replace("LD-", "")
        seq = 1
        trip_number = f"TR-{load_suffix}-{seq:02d}"

        trip = Trip(
            company_id=self.company_id,
            trip_number=trip_number,
            load_id=load.id,
            sequence_number=seq,
            status=TripStatus.assigned,
        )
        self.db.add(trip)
        await self.db.flush()

    async def _effect_validate_driver_compliance(self, load: Load) -> None:
        """Validate driver compliance before dispatch (assigned → dispatched)."""
        if not load.trips:
            raise HTTPException(400, "No trip exists for this load. Assign a driver first.")

        primary_trip = load.trips[0]
        if not primary_trip.driver_id:
            raise HTTPException(400, "Driver must be assigned to the trip before dispatching.")

        driver = (await self.db.execute(
            select(Driver).where(Driver.id == primary_trip.driver_id)
        )).scalar_one_or_none()

        if not driver:
            raise HTTPException(400, "Assigned driver not found.")

        # Check compliance — get company enforcement setting
        company = (await self.db.execute(
            select(Company).where(Company.id == self.company_id)
        )).scalar_one_or_none()

        from app.drivers.service import check_driver_compliance
        violations = check_driver_compliance(driver)

        if violations and company and company.enforce_compliance:
            critical = [v for v in violations if v["severity"] == "critical"]
            if critical:
                messages = [v["message"] for v in critical]
                raise HTTPException(
                    status_code=422,
                    detail={
                        "compliance_violations": messages,
                        "message": "Driver has critical compliance violations. Dispatch blocked.",
                    },
                )

    async def _effect_validate_truck_availability(self, load: Load) -> None:
        """Validate truck is available before dispatch."""
        if not load.trips:
            return

        primary_trip = load.trips[0]
        if not primary_trip.truck_id:
            raise HTTPException(400, "Truck must be assigned to the trip before dispatching.")

        truck = (await self.db.execute(
            select(Truck).where(Truck.id == primary_trip.truck_id)
        )).scalar_one_or_none()

        if not truck:
            raise HTTPException(400, "Assigned truck not found.")

        if truck.status != EquipmentStatus.available:
            raise HTTPException(409, f"Truck '{truck.unit_number}' is not available (status: {truck.status.value}).")

    async def _effect_set_driver_on_trip(self, load: Load) -> None:
        """Set driver status to ON_TRIP when dispatched."""
        if not load.trips:
            return

        for trip in load.trips:
            if trip.driver_id:
                driver = (await self.db.execute(
                    select(Driver).where(Driver.id == trip.driver_id)
                )).scalar_one_or_none()
                if driver:
                    driver.status = DriverStatus.on_trip
                trip.status = TripStatus.dispatched

    async def _effect_set_equipment_in_use(self, load: Load) -> None:
        """Set truck/trailer status to IN_USE when dispatched."""
        if not load.trips:
            return

        for trip in load.trips:
            if trip.truck_id:
                truck = (await self.db.execute(
                    select(Truck).where(Truck.id == trip.truck_id)
                )).scalar_one_or_none()
                if truck:
                    truck.status = EquipmentStatus.in_use

            if trip.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == trip.trailer_id)
                )).scalar_one_or_none()
                if trailer:
                    trailer.status = EquipmentStatus.in_use

    async def _effect_release_driver(self, load: Load) -> None:
        """Release driver back to AVAILABLE when delivered."""
        if not load.trips:
            return

        for trip in load.trips:
            if trip.driver_id:
                driver = (await self.db.execute(
                    select(Driver).where(Driver.id == trip.driver_id)
                )).scalar_one_or_none()
                if driver:
                    driver.status = DriverStatus.available
                trip.status = TripStatus.delivered

    async def _effect_release_equipment(self, load: Load) -> None:
        """Release truck/trailer back to AVAILABLE when delivered."""
        if not load.trips:
            return

        for trip in load.trips:
            if trip.truck_id:
                truck = (await self.db.execute(
                    select(Truck).where(Truck.id == trip.truck_id)
                )).scalar_one_or_none()
                if truck:
                    truck.status = EquipmentStatus.available
            if trip.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == trip.trailer_id)
                )).scalar_one_or_none()
                if trailer:
                    trailer.status = EquipmentStatus.available

    async def _effect_lock_load_financials(self, load: Load) -> None:
        """Lock load financial fields when invoiced."""
        load.is_locked = True

    # ══════════════════════════════════════════════════════════════
    #   DISPATCH WORKFLOW — Create/Assign Trip in one shot
    # ══════════════════════════════════════════════════════════════

    async def dispatch_load(self, load_id: UUID, data: DispatchRequest) -> LoadResponse:
        """Full dispatch workflow: validate → create Trip → assign driver/truck → advance status.

        This is the power-user endpoint that combines Trip creation + dispatch in one call.
        For granular control, use advance_status + manual trip assignment.
        """
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        current = LoadStatus(load.status.value if hasattr(load.status, 'value') else load.status)

        # Must be in offer, booked, or assigned to dispatch
        if current not in (LoadStatus.offer, LoadStatus.booked, LoadStatus.assigned):
            raise HTTPException(
                400,
                f"Load cannot be dispatched from status '{current.value}'. Must be offer, booked, or assigned.",
            )

        driver_id = UUID(data.driver_id)
        truck_id = UUID(data.truck_id)
        trailer_id = UUID(data.trailer_id) if data.trailer_id else None

        # 1. Validate driver
        driver = (await self.db.execute(
            select(Driver).where(Driver.id == driver_id).where(Driver.company_id == self.company_id)
        )).scalar_one_or_none()
        if not driver:
            raise NotFoundError("Driver not found")
        if not driver.is_active:
            raise HTTPException(400, "Driver is not active.")
        if driver.status != DriverStatus.available:
            raise HTTPException(409, f"Driver is not available (status: {driver.status.value}).")

        # 2. Validate truck
        truck = (await self.db.execute(
            select(Truck).where(Truck.id == truck_id).where(Truck.company_id == self.company_id)
        )).scalar_one_or_none()
        if not truck:
            raise NotFoundError("Truck not found")
        if truck.status != EquipmentStatus.available:
            raise HTTPException(409, f"Truck is not available (status: {truck.status.value}).")

        # 3. Validate trailer (optional)
        if trailer_id:
            trailer = (await self.db.execute(
                select(Trailer).where(Trailer.id == trailer_id).where(Trailer.company_id == self.company_id)
            )).scalar_one_or_none()
            if not trailer:
                raise NotFoundError("Trailer not found")
            if trailer.status != EquipmentStatus.available:
                raise HTTPException(409, f"Trailer is not available (status: {trailer.status.value}).")

        # 4. Compliance check
        from app.drivers.service import check_driver_compliance
        company = (await self.db.execute(
            select(Company).where(Company.id == self.company_id)
        )).scalar_one_or_none()

        violations = check_driver_compliance(driver)
        if violations and company and company.enforce_compliance:
            critical = [v for v in violations if v["severity"] == "critical"]
            if critical:
                raise HTTPException(422, detail={
                    "compliance_violations": [v["message"] for v in critical],
                    "message": "Dispatch blocked due to compliance violations.",
                })

        # 5. Create Trip
        load_suffix = load.load_number.replace("LD-", "")
        existing_trips = len(load.trips) if load.trips else 0
        seq = existing_trips + 1
        trip_number = f"TR-{load_suffix}-{seq:02d}"

        trip = Trip(
            company_id=self.company_id,
            trip_number=trip_number,
            load_id=load.id,
            driver_id=driver_id,
            truck_id=truck_id,
            trailer_id=trailer_id,
            sequence_number=seq,
            status=TripStatus.dispatched,
        )
        self.db.add(trip)

        # 6. Cascade status updates
        load.status = LoadStatus.dispatched
        driver.status = DriverStatus.on_trip
        truck.status = EquipmentStatus.in_use
        if trailer_id:
            trailer_obj = (await self.db.execute(
                select(Trailer).where(Trailer.id == trailer_id)
            )).scalar_one_or_none()
            if trailer_obj:
                trailer_obj.status = EquipmentStatus.in_use

        await self.db.commit()
        await self.db.refresh(load)
        return LoadResponse.model_validate(load)

    # ══════════════════════════════════════════════════════════════
    #   TRIP MANAGEMENT — Assign driver/truck to existing trip
    # ══════════════════════════════════════════════════════════════

    async def assign_trip(
        self, load_id: UUID, trip_id: UUID,
        driver_id: Optional[str], truck_id: Optional[str], trailer_id: Optional[str],
    ) -> LoadResponse:
        """Assign driver + truck + trailer to an existing Trip."""
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        trip = (await self.db.execute(
            select(Trip).where(Trip.id == trip_id).where(Trip.load_id == load_id)
        )).scalar_one_or_none()
        if not trip:
            raise NotFoundError("Trip not found for this load")

        today = date.today()
        errors = []

        if driver_id:
            driver = (await self.db.execute(
                select(Driver).where(Driver.id == UUID(driver_id)).where(Driver.company_id == self.company_id)
            )).scalar_one_or_none()
            if not driver:
                errors.append("Driver not found")
            elif not driver.is_active:
                errors.append("Driver is not active")
            elif driver.status != DriverStatus.available:
                errors.append(f"Driver status is '{driver.status.value}', must be 'available'")
            elif driver.cdl_expiry_date and driver.cdl_expiry_date <= today:
                errors.append(f"Driver CDL expired on {driver.cdl_expiry_date}")
            else:
                trip.driver_id = UUID(driver_id)

        if truck_id:
            truck = (await self.db.execute(
                select(Truck).where(Truck.id == UUID(truck_id)).where(Truck.company_id == self.company_id)
            )).scalar_one_or_none()
            if not truck:
                errors.append("Truck not found")
            elif truck.status != EquipmentStatus.available:
                errors.append(f"Truck status is '{truck.status.value}', must be 'available'")
            else:
                trip.truck_id = UUID(truck_id)

        if trailer_id:
            trailer = (await self.db.execute(
                select(Trailer).where(Trailer.id == UUID(trailer_id)).where(Trailer.company_id == self.company_id)
            )).scalar_one_or_none()
            if not trailer:
                errors.append("Trailer not found")
            elif trailer.status != EquipmentStatus.available:
                errors.append(f"Trailer status is '{trailer.status.value}', must be 'available'")
            else:
                trip.trailer_id = UUID(trailer_id)

        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))

        await self.db.commit()
        await self.db.refresh(load)
        return LoadResponse.model_validate(load)

    # ── Board Tab Queries ────────────────────────────────────────

    async def get_live_loads(self, page: int = 1, page_size: int = 20) -> LoadListResponse:
        items, total = await self.repo.get_live(page, page_size)
        return LoadListResponse(
            items=[self._to_list_item(load) for load in items],
            total=total, page=page, page_size=page_size,
        )

    async def get_upcoming_loads(self, page: int = 1, page_size: int = 20) -> LoadListResponse:
        items, total = await self.repo.get_upcoming(page, page_size)
        return LoadListResponse(
            items=[self._to_list_item(load) for load in items],
            total=total, page=page, page_size=page_size,
        )

    async def get_completed_loads(self, page: int = 1, page_size: int = 20) -> LoadListResponse:
        items, total = await self.repo.get_completed(page, page_size)
        return LoadListResponse(
            items=[self._to_list_item(load) for load in items],
            total=total, page=page, page_size=page_size,
        )
