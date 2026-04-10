"""Loads service — business logic including state machine, Trip creation, dispatch, and board tabs.

Fixes Applied:
  - HIGH-3: broker_id conversion consolidated into safe_update_dict()
  - HIGH-4: LoadUpdate uses safe_update_dict() for explicit allowlisting
  - HIGH-5: dispatch_load() now follows state machine transitions properly
  - HIGH-6: Trip assignment query now includes company_id filter
  - Cancelled status now releases resources (driver/equipment)
  - Added structured logging for all state transitions
  - MEDIUM-3: inspect.signature() cached at module load time
"""

import inspect
import logging
from datetime import date, datetime, timezone
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

logger = logging.getLogger("safehaul.loads")


# ══════════════════════════════════════════════════════════════════
#   STATE MACHINE — 8-Stage Load Lifecycle
# ══════════════════════════════════════════════════════════════════

LOAD_TRANSITIONS: dict[LoadStatus, list[LoadStatus]] = {
    LoadStatus.offer:       [LoadStatus.booked, LoadStatus.cancelled],
    LoadStatus.booked:      [LoadStatus.assigned, LoadStatus.cancelled],
    LoadStatus.assigned:    [LoadStatus.dispatched, LoadStatus.booked, LoadStatus.cancelled],
    LoadStatus.dispatched:  [LoadStatus.in_transit, LoadStatus.assigned, LoadStatus.cancelled],
    LoadStatus.in_transit:  [LoadStatus.delivered, LoadStatus.cancelled],
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
    ("dispatched", "in_transit"): [
        "_effect_set_trip_in_transit",
    ],
    ("in_transit", "delivered"): [
        "_effect_record_delivery_time",
        "_effect_release_driver",
        "_effect_release_equipment",
    ],
    ("delivered", "invoiced"): [
        "_effect_lock_load_financials",
    ],
    # Cancellation from active states releases resources
    ("dispatched", "cancelled"): [
        "_effect_release_driver",
        "_effect_release_equipment",
    ],
    ("in_transit", "cancelled"): [
        "_effect_release_driver",
        "_effect_release_equipment",
    ],
    ("assigned", "cancelled"): [
        "_effect_release_driver",
        "_effect_release_equipment",
    ],
    # Audit fix #10: Rollback transitions — reverse side-effects
    ("assigned", "booked"): [
        "_effect_deactivate_trip",
    ],
    ("dispatched", "assigned"): [
        "_effect_release_driver",
        "_effect_release_equipment",
        "_effect_revert_trip_to_assigned",
    ],
}


# ── Pre-computed side-effect signature cache (audit fix MEDIUM-3) ─
# Avoids calling inspect.signature() on every state transition.
# Built once at module load time.
_EFFECTS_ACCEPTING_TARGET_STATUS: set[str] = set()


def _build_effect_signature_cache() -> None:
    """Inspect all side-effect methods on LoadService to determine which accept target_status."""
    for effects_list in TRANSITION_SIDE_EFFECTS.values():
        for effect_name in effects_list:
            if effect_name in _EFFECTS_ACCEPTING_TARGET_STATUS:
                continue
            method = getattr(LoadService, effect_name, None)
            if method is not None:
                sig = inspect.signature(method)
                if 'target_status' in sig.parameters:
                    _EFFECTS_ACCEPTING_TARGET_STATUS.add(effect_name)


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
            broker_uuid = UUID(data.broker_id)
            # Validate broker exists in this tenant
            from app.models.broker import Broker
            broker = (await self.db.execute(
                select(Broker).where(Broker.id == broker_uuid).where(Broker.company_id == self.company_id)
            )).scalar_one_or_none()
            if not broker:
                raise NotFoundError("Broker not found")
            load_kwargs["broker_id"] = broker_uuid

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

        # safe_update_dict() handles broker_id str→UUID conversion + allowlisting
        update_data = data.safe_update_dict()

        updated = await self.repo.update(load, **update_data)
        logger.info("Load %s updated, fields: %s", load.load_number, list(update_data.keys()))
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
        logger.info("Load %s soft-deleted", load.load_number)
        await self.repo.soft_delete(load)

    # ══════════════════════════════════════════════════════════════
    #   STATE MACHINE — Advance Load Status
    # ══════════════════════════════════════════════════════════════

    async def advance_status(self, load_id: UUID, target_status: str) -> LoadResponse:
        """Enforce valid transitions, execute side-effects, and update status.

        Uses SELECT ... FOR UPDATE to prevent concurrent status races.
        """
        # Use advisory lock to serialize concurrent status transitions
        from sqlalchemy import text as sa_text
        lock_key = load_id.int % (2**31 - 1)
        try:
            dialect = self.db.bind.dialect.name if self.db.bind else "unknown"
        except Exception:
            dialect = "unknown"
        if dialect == "postgresql":
            await self.db.execute(sa_text(f"SELECT pg_advisory_xact_lock({lock_key})"))

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
                # Use pre-computed cache instead of inspect.signature() per call
                if effect_name in _EFFECTS_ACCEPTING_TARGET_STATUS:
                    await effect_fn(load, target_status=target)
                else:
                    await effect_fn(load)

        # 3. Update status
        load.status = target
        await self.db.commit()
        await self.db.refresh(load)

        logger.info(
            "Load %s status: %s → %s (company=%s)",
            load.load_number, current.value, target.value, self.company_id,
        )

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
        logger.info("Trip %s created for load %s", trip_number, load.load_number)

    async def _effect_validate_driver_compliance(self, load: Load) -> None:
        """Validate driver compliance before dispatch (assigned → dispatched)."""
        if not load.trips:
            raise HTTPException(400, "No trip exists for this load. Assign a driver first.")

        primary_trip = load.trips[0]
        if not primary_trip.driver_id:
            raise HTTPException(400, "Driver must be assigned to the trip before dispatching.")

        driver = (await self.db.execute(
            select(Driver).where(Driver.id == primary_trip.driver_id).where(Driver.company_id == self.company_id)
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
                logger.warning(
                    "Dispatch blocked for load %s — driver compliance: %s",
                    load.load_number, messages,
                )
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
            select(Truck).where(Truck.id == primary_trip.truck_id).where(Truck.company_id == self.company_id)
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
                    select(Driver).where(Driver.id == trip.driver_id).where(Driver.company_id == self.company_id)
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
                    select(Truck).where(Truck.id == trip.truck_id).where(Truck.company_id == self.company_id)
                )).scalar_one_or_none()
                if truck:
                    truck.status = EquipmentStatus.in_use

            if trip.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == trip.trailer_id).where(Trailer.company_id == self.company_id)
                )).scalar_one_or_none()
                if trailer:
                    trailer.status = EquipmentStatus.in_use

    async def _effect_set_trip_in_transit(self, load: Load) -> None:
        """Update trip status to in_transit when load moves dispatched → in_transit."""
        if not load.trips:
            return
        for trip in load.trips:
            if trip.status == TripStatus.dispatched:
                trip.status = TripStatus.in_transit

    async def _effect_record_delivery_time(self, load: Load) -> None:
        """Stamp load.delivered_at with the actual delivery completion time.

        This timestamp is used by settlement period filtering to ensure
        drivers are paid in the correct pay period (when they worked,
        not when the load record was created).
        """
        load.delivered_at = datetime.now(timezone.utc)

    async def _effect_release_driver(self, load: Load, target_status: LoadStatus = None) -> None:
        """Release driver back to AVAILABLE when delivered or cancelled.

        Sets trip status to match the load's final status:
        - delivered → TripStatus.delivered
        - cancelled → TripStatus.cancelled (prevents misreporting)

        NOTE: target_status is passed explicitly because this side effect
        fires BEFORE load.status is updated. Without it, a cancellation
        from 'dispatched' would incorrectly set trip status to 'delivered'.
        """
        if not load.trips:
            return

        # Use target_status if provided, otherwise fall back to load.status
        effective_status = target_status or LoadStatus(
            load.status.value if hasattr(load.status, 'value') else load.status
        )

        # Determine the correct terminal trip status based on destination
        terminal_trip_status = (
            TripStatus.cancelled
            if effective_status == LoadStatus.cancelled
            else TripStatus.delivered
        )

        for trip in load.trips:
            if trip.driver_id:
                driver = (await self.db.execute(
                    select(Driver).where(Driver.id == trip.driver_id).where(Driver.company_id == self.company_id)
                )).scalar_one_or_none()
                if driver and driver.status == DriverStatus.on_trip:
                    driver.status = DriverStatus.available
            trip.status = terminal_trip_status

    async def _effect_release_equipment(self, load: Load) -> None:
        """Release truck/trailer back to AVAILABLE when delivered or cancelled."""
        if not load.trips:
            return

        for trip in load.trips:
            if trip.truck_id:
                truck = (await self.db.execute(
                    select(Truck).where(Truck.id == trip.truck_id).where(Truck.company_id == self.company_id)
                )).scalar_one_or_none()
                if truck and truck.status == EquipmentStatus.in_use:
                    truck.status = EquipmentStatus.available
            if trip.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == trip.trailer_id).where(Trailer.company_id == self.company_id)
                )).scalar_one_or_none()
                if trailer and trailer.status == EquipmentStatus.in_use:
                    trailer.status = EquipmentStatus.available

    async def _effect_deactivate_trip(self, load: Load) -> None:
        """Deactivate trips when rolling back assigned → booked.

        Audit fix #10: Ensures Trip entities don't persist as orphans
        when a load is rolled back from assigned to booked.
        """
        if not load.trips:
            return
        for trip in load.trips:
            trip.status = TripStatus.cancelled

    async def _effect_revert_trip_to_assigned(self, load: Load) -> None:
        """Revert trip status back to assigned when rolling back dispatched → assigned.

        Audit fix #10: Ensures trip status stays consistent with load status
        when a dispatch is rolled back.
        """
        if not load.trips:
            return
        for trip in load.trips:
            if trip.status == TripStatus.dispatched:
                trip.status = TripStatus.assigned

    async def _effect_lock_load_financials(self, load: Load) -> None:
        """Lock load financial fields when invoiced."""
        load.is_locked = True

    # ══════════════════════════════════════════════════════════════
    #   DISPATCH WORKFLOW — Uses state machine properly (HIGH-5 fix)
    # ══════════════════════════════════════════════════════════════

    async def dispatch_load(self, load_id: UUID, data: DispatchRequest) -> LoadResponse:
        """Full dispatch workflow: validate → assign driver/truck to trip → advance through state machine.

        Uses the single authoritative transition engine (_advance_status_no_commit)
        for all status changes, eliminating duplicated state mutation logic.

        Pipeline: offer → booked → assigned (Trip created here) → dispatched
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

        # 1. Validate driver (with tenant isolation + row lock for concurrency)
        driver = (await self.db.execute(
            select(Driver).where(Driver.id == driver_id).where(Driver.company_id == self.company_id)
            .with_for_update()
        )).scalar_one_or_none()
        if not driver:
            raise NotFoundError("Driver not found")
        if not driver.is_active:
            raise HTTPException(400, "Driver is not active.")
        if driver.status != DriverStatus.available:
            raise HTTPException(409, f"Driver is not available (status: {driver.status.value}).")

        # 2. Validate truck (with tenant isolation + row lock for concurrency)
        truck = (await self.db.execute(
            select(Truck).where(Truck.id == truck_id).where(Truck.company_id == self.company_id)
            .with_for_update()
        )).scalar_one_or_none()
        if not truck:
            raise NotFoundError("Truck not found")
        if truck.status != EquipmentStatus.available:
            raise HTTPException(409, f"Truck is not available (status: {truck.status.value}).")

        # 3. Validate trailer (optional, with tenant isolation)
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

        # 5. Step through state machine via single authoritative engine
        # offer → booked
        if current == LoadStatus.offer:
            await self._advance_status_no_commit(load, LoadStatus.booked)
            logger.info("Load %s auto-advanced: offer → booked", load.load_number)

        # booked → assigned (side effect: _effect_create_trip)
        if load.status == LoadStatus.booked:
            await self._advance_status_no_commit(load, LoadStatus.assigned)
            # Flush so trip is visible, then refresh to re-populate the trips relationship
            await self.db.flush()
            await self.db.refresh(load, ["trips"])

        # Assign driver/truck to the primary trip
        if load.trips:
            primary_trip = load.trips[0]
            primary_trip.driver_id = driver_id
            primary_trip.truck_id = truck_id
            primary_trip.trailer_id = trailer_id
            await self.db.flush()
        else:
            raise HTTPException(500, "Trip was not created during dispatch - internal error.")

        # assigned → dispatched (side effects: compliance check, set driver on trip, set equipment in use)
        # Note: compliance + equipment side effects inside advance_status use the trip data we just set.
        await self._advance_status_no_commit(load, LoadStatus.dispatched)

        await self.db.commit()
        await self.db.refresh(load)

        logger.info(
            "Load %s dispatched: driver=%s, truck=%s (company=%s)",
            load.load_number, data.driver_id, data.truck_id, self.company_id,
        )

        return LoadResponse.model_validate(load)

    async def _advance_status_no_commit(self, load: Load, target: LoadStatus) -> None:
        """Internal helper: run side effects + status change WITHOUT committing.

        Used by dispatch_load() to chain multiple transitions in a single
        transaction. The caller is responsible for calling db.commit().
        """
        current = LoadStatus(load.status.value if hasattr(load.status, 'value') else load.status)

        allowed = LOAD_TRANSITIONS.get(current, [])
        if target not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{current.value}' to '{target.value}'.",
            )

        side_effect_key = (current.value, target.value)
        if side_effect_key in TRANSITION_SIDE_EFFECTS:
            for effect_name in TRANSITION_SIDE_EFFECTS[side_effect_key]:
                effect_fn = getattr(self, effect_name)
                # Use pre-computed cache instead of inspect.signature() per call
                if effect_name in _EFFECTS_ACCEPTING_TARGET_STATUS:
                    await effect_fn(load, target_status=target)
                else:
                    await effect_fn(load)

        load.status = target
        logger.info(
            "Load %s status: %s → %s (company=%s)",
            load.load_number, current.value, target.value, self.company_id,
        )

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

        # HIGH-6 FIX: Add company_id filter to trip query
        trip = (await self.db.execute(
            select(Trip)
            .where(Trip.id == trip_id)
            .where(Trip.load_id == load_id)
            .where(Trip.company_id == self.company_id)
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

        logger.info(
            "Trip %s assigned: driver=%s, truck=%s, trailer=%s",
            trip.trip_number, driver_id, truck_id, trailer_id,
        )

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


# Build the signature cache now that LoadService is fully defined
_build_effect_signature_cache()
