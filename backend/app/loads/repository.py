"""Loads repository — async database queries for loads, stops, and accessorials."""

from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.load import Load, LoadStop, LoadStatus
from app.models.accounting import LoadAccessorial
from app.models.broker import Broker
from app.models.driver import Driver
from app.models.fleet import Truck, Trailer


class LoadRepository:
    """Load DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        """Base query with eager loading of all relationships."""
        return (
            select(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
            .options(
                selectinload(Load.stops),
                selectinload(Load.accessorials),
                selectinload(Load.broker),
                selectinload(Load.driver),
                selectinload(Load.truck),
                selectinload(Load.trailer),
            )
        )

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        driver_id: Optional[UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> tuple[list[Load], int]:
        """Paginated list with filters."""
        query = self._base_query()
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
        )

        if status:
            query = query.where(Load.status == status)
            count_query = count_query.where(Load.status == status)

        if driver_id:
            query = query.where(Load.driver_id == driver_id)
            count_query = count_query.where(Load.driver_id == driver_id)

        if date_from:
            query = query.where(Load.created_at >= date_from)
            count_query = count_query.where(Load.created_at >= date_from)

        if date_to:
            query = query.where(Load.created_at <= date_to)
            count_query = count_query.where(Load.created_at <= date_to)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = (
            query.order_by(Load.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_by_id(self, load_id: UUID) -> Optional[Load]:
        query = self._base_query().where(Load.id == load_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_next_load_number(self) -> str:
        """Generate next load number for this company."""
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
        )
        count = (await self.db.execute(count_query)).scalar() or 0
        return f"LD-{count + 1:05d}"

    async def create(self, stops_data: list, accessorials_data: list, **kwargs) -> Load:
        """Create load with nested stops and accessorials."""
        load_number = await self.get_next_load_number()
        load = Load(
            company_id=self.company_id,
            load_number=load_number,
            **kwargs,
        )
        self.db.add(load)
        await self.db.flush()  # Get load.id for FK references

        # Create stops
        for stop_data in stops_data:
            stop = LoadStop(
                company_id=self.company_id,
                load_id=load.id,
                **stop_data,
            )
            self.db.add(stop)

        # Create accessorials
        for acc_data in accessorials_data:
            acc = LoadAccessorial(
                company_id=self.company_id,
                load_id=load.id,
                **acc_data,
            )
            self.db.add(acc)

        await self.db.commit()
        await self.db.refresh(load)

        # Re-fetch with eager loading
        return await self.get_by_id(load.id)

    async def update(self, load: Load, **kwargs) -> Load:
        for key, value in kwargs.items():
            if value is not None:
                setattr(load, key, value)
        await self.db.commit()
        await self.db.refresh(load)
        return load

    async def soft_delete(self, load: Load) -> None:
        load.is_active = False
        await self.db.commit()

    # ── Board Tab Queries ────────────────────────────────────────

    async def get_live(self, page: int = 1, page_size: int = 20) -> tuple[list[Load], int]:
        """Live loads: dispatched, at_pickup, in_transit, delayed."""
        live_statuses = [
            LoadStatus.dispatched,
            LoadStatus.at_pickup,
            LoadStatus.in_transit,
            LoadStatus.delayed,
        ]
        query = self._base_query().where(Load.status.in_(live_statuses))
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
            .where(Load.status.in_(live_statuses))
        )
        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Load.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_upcoming(self, page: int = 1, page_size: int = 20) -> tuple[list[Load], int]:
        """Upcoming: status = planned."""
        query = self._base_query().where(Load.status == LoadStatus.planned)
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
            .where(Load.status == LoadStatus.planned)
        )
        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Load.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_completed(self, page: int = 1, page_size: int = 20) -> tuple[list[Load], int]:
        """Completed: delivered, billed, paid."""
        completed_statuses = [
            LoadStatus.delivered,
            LoadStatus.billed,
            LoadStatus.paid,
        ]
        query = self._base_query().where(Load.status.in_(completed_statuses))
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
            .where(Load.status.in_(completed_statuses))
        )
        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Load.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total
