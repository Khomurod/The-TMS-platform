"""Loads service — business logic including state machine, assignment validation, and board tabs.

Phase 4 tasks covered:
  4.1 — Load CRUD
  4.2 — Load State Machine (transitions + side effects)
  4.3 — Load Assignment with Failsafes
  4.4 — Load Board Tabs (live / upcoming / completed)
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.loads.repository import LoadRepository
from app.loads.schemas import (
    LoadCreate,
    LoadUpdate,
    LoadResponse,
    LoadListItem,
    LoadListResponse,
    StopResponse,
    AccessorialResponse,
)
from app.core.exceptions import NotFoundError
from app.models.load import LoadStatus
from app.models.driver import Driver, DriverStatus
from app.models.fleet import Truck, Trailer, EquipmentStatus


# ── State Machine Transition Map (4.2) ───────────────────────────

VALID_TRANSITIONS: dict[str, list[str]] = {
    "planned":    ["dispatched", "cancelled"],
    "dispatched": ["at_pickup", "cancelled"],
    "at_pickup":  ["in_transit"],
    "in_transit": ["delivered", "delayed"],
    "delayed":    ["in_transit", "delivered"],
    "delivered":  ["billed"],
    "billed":     ["paid"],
}


class LoadService:
    """Load business logic — CRUD, state machine, assignment, board tabs."""

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
        driver_name = (
            f"{load.driver.first_name} {load.driver.last_name}"
            if load.driver else None
        )
        truck_number = load.truck.unit_number if load.truck else None

        return LoadListItem(
            id=str(load.id),
            load_number=load.load_number,
            broker_load_id=load.broker_load_id,
            status=load.status.value if hasattr(load.status, 'value') else load.status,
            base_rate=load.base_rate,
            total_rate=load.total_rate,
            driver_id=str(load.driver_id) if load.driver_id else None,
            truck_id=str(load.truck_id) if load.truck_id else None,
            created_at=load.created_at,
            pickup_city=pickup_city,
            pickup_date=pickup_date,
            delivery_city=delivery_city,
            delivery_date=delivery_date,
            broker_name=broker_name,
            driver_name=driver_name,
            truck_number=truck_number,
        )

    def _calculate_total_rate(self, base_rate, accessorials_data: list) -> Decimal:
        """Calculate total_rate = base_rate + sum(accessorials)."""
        base = Decimal(str(base_rate)) if base_rate else Decimal("0")
        acc_total = sum(Decimal(str(a.get("amount", 0))) for a in accessorials_data)
        return base + acc_total

    # ── 4.1 — CRUD ──────────────────────────────────────────────

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
        if data.driver_id:
            load_kwargs["driver_id"] = UUID(data.driver_id)
        if data.truck_id:
            load_kwargs["truck_id"] = UUID(data.truck_id)
        if data.trailer_id:
            load_kwargs["trailer_id"] = UUID(data.trailer_id)

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
        updated = await self.repo.update(load, **data.model_dump(exclude_unset=True))
        return LoadResponse.model_validate(updated)

    async def delete_load(self, load_id: UUID) -> None:
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")
        if load.status != LoadStatus.planned:
            raise HTTPException(
                status_code=400,
                detail="Only loads with status 'planned' can be deleted",
            )
        await self.repo.soft_delete(load)

    # ── 4.2 — State Machine ─────────────────────────────────────

    async def update_status(self, load_id: UUID, new_status: str) -> LoadResponse:
        """Enforce valid transitions and apply side effects."""
        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        current = load.status.value if hasattr(load.status, 'value') else load.status

        allowed = VALID_TRANSITIONS.get(current, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition: '{current}' → '{new_status}'. Allowed: {allowed}",
            )

        # Apply side effects
        await self._apply_side_effects(load, new_status)

        load.status = new_status
        await self.db.commit()
        await self.db.refresh(load)

        return LoadResponse.model_validate(load)

    async def _apply_side_effects(self, load, new_status: str) -> None:
        """Side effects when transitioning status."""
        from sqlalchemy import select

        if new_status == "dispatched":
            # Truck/Trailer → in_use, Driver → on_route
            if load.truck_id:
                truck = (await self.db.execute(
                    select(Truck).where(Truck.id == load.truck_id)
                )).scalar_one_or_none()
                if truck:
                    truck.status = EquipmentStatus.in_use

            if load.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == load.trailer_id)
                )).scalar_one_or_none()
                if trailer:
                    trailer.status = EquipmentStatus.in_use

            if load.driver_id:
                driver = (await self.db.execute(
                    select(Driver).where(Driver.id == load.driver_id)
                )).scalar_one_or_none()
                if driver:
                    driver.status = DriverStatus.on_route

        elif new_status in ("delivered", "cancelled"):
            # Release all assets back to available
            if load.truck_id:
                truck = (await self.db.execute(
                    select(Truck).where(Truck.id == load.truck_id)
                )).scalar_one_or_none()
                if truck:
                    truck.status = EquipmentStatus.available

            if load.trailer_id:
                trailer = (await self.db.execute(
                    select(Trailer).where(Trailer.id == load.trailer_id)
                )).scalar_one_or_none()
                if trailer:
                    trailer.status = EquipmentStatus.available

            if load.driver_id:
                driver = (await self.db.execute(
                    select(Driver).where(Driver.id == load.driver_id)
                )).scalar_one_or_none()
                if driver:
                    driver.status = DriverStatus.available

    # ── 4.3 — Assignment with Failsafes ─────────────────────────

    async def assign_load(self, load_id: UUID, driver_id: Optional[str],
                          truck_id: Optional[str], trailer_id: Optional[str]) -> LoadResponse:
        """Assign driver + truck + trailer with compliance validation."""
        from sqlalchemy import select

        load = await self.repo.get_by_id(load_id)
        if not load:
            raise NotFoundError("Load not found")

        today = date.today()
        errors = []

        # Validate driver
        if driver_id:
            driver = (await self.db.execute(
                select(Driver).where(Driver.id == UUID(driver_id))
                .where(Driver.company_id == self.company_id)
            )).scalar_one_or_none()

            if not driver:
                errors.append("Driver not found")
            elif not driver.is_active:
                errors.append("Driver is not active")
            elif driver.status != DriverStatus.available:
                errors.append(f"Driver status is '{driver.status.value}', must be 'available'")
            elif driver.cdl_expiry_date and driver.cdl_expiry_date <= today:
                errors.append(f"Driver CDL expired on {driver.cdl_expiry_date}")

        # Validate truck
        if truck_id:
            truck = (await self.db.execute(
                select(Truck).where(Truck.id == UUID(truck_id))
                .where(Truck.company_id == self.company_id)
            )).scalar_one_or_none()

            if not truck:
                errors.append("Truck not found")
            elif truck.status != EquipmentStatus.available:
                errors.append(f"Truck status is '{truck.status.value}', must be 'available'")
            elif truck.dot_inspection_expiry and truck.dot_inspection_expiry <= today:
                errors.append(f"Truck DOT inspection expired on {truck.dot_inspection_expiry}")

        # Validate trailer
        if trailer_id:
            trailer = (await self.db.execute(
                select(Trailer).where(Trailer.id == UUID(trailer_id))
                .where(Trailer.company_id == self.company_id)
            )).scalar_one_or_none()

            if not trailer:
                errors.append("Trailer not found")
            elif trailer.status != EquipmentStatus.available:
                errors.append(f"Trailer status is '{trailer.status.value}', must be 'available'")
            elif trailer.dot_inspection_expiry and trailer.dot_inspection_expiry <= today:
                errors.append(f"Trailer DOT inspection expired on {trailer.dot_inspection_expiry}")

        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))

        # Apply assignment
        update_kwargs = {}
        if driver_id:
            update_kwargs["driver_id"] = UUID(driver_id)
        if truck_id:
            update_kwargs["truck_id"] = UUID(truck_id)
        if trailer_id:
            update_kwargs["trailer_id"] = UUID(trailer_id)

        updated = await self.repo.update(load, **update_kwargs)
        return LoadResponse.model_validate(updated)

    # ── 4.4 — Board Tab Queries ──────────────────────────────────

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
