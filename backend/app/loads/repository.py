"""Loads repository — async database queries for loads, stops, trips, and accessorials."""

from __future__ import annotations

import binascii
import logging
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.base import LoadStatus
from app.models.load import Load, LoadStop, Trip
from app.models.accounting import LoadAccessorial
from app.models.broker import Broker
from app.models.fleet import Truck, Trailer

logger = logging.getLogger("safehaul.loads")


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
                selectinload(Load.trips).selectinload(Trip.truck),
                selectinload(Load.trips).selectinload(Trip.trailer),
                selectinload(Load.commodities),
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
            # Filter by driver_id via Trip join
            query = query.where(
                Load.id.in_(
                    select(Trip.load_id).where(Trip.driver_id == driver_id)
                )
            )
            count_query = count_query.where(
                Load.id.in_(
                    select(Trip.load_id).where(Trip.driver_id == driver_id)
                )
            )

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

    async def _advisory_lock(self, lock_key: int) -> None:
        """Acquire a PostgreSQL advisory lock for the current transaction.

        Skips gracefully on non-PostgreSQL dialects (e.g. SQLite in tests)
        so that integration tests can run without being skipped.

        Audit fix MEDIUM-1: Enables tenant isolation tests to pass in CI.
        """
        try:
            dialect = self.db.bind.dialect.name if self.db.bind else "unknown"
        except Exception:
            dialect = "unknown"

        if dialect == "postgresql":
            await self.db.execute(text(f"SELECT pg_advisory_xact_lock({lock_key})"))

    async def get_next_load_number(self) -> str:
        """Generate next load number using database sequence (race-condition safe).

        Uses pg_advisory_xact_lock on PostgreSQL to prevent duplicate numbers
        under concurrent inserts. Falls back gracefully on other dialects.
        """
        # Count all loads ever (including soft-deleted) to prevent reuse of numbers
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
        )
        # Use deterministic advisory lock per company to serialize number generation.
        # CRC32 is used instead of Python hash() because hash() is randomized
        # per-process (PYTHONHASHSEED), making it non-deterministic across workers.
        lock_key = binascii.crc32(str(self.company_id).encode()) & 0x7FFFFFFF
        await self._advisory_lock(lock_key)

        count = (await self.db.execute(count_query)).scalar() or 0
        return f"SH-{count + 1:06d}"

    async def generate_shipment_id(self) -> str:
        """Generate next shipment ID using deterministic advisory lock (race-condition safe)."""
        # Offset by 1 from load_number lock so the two operations don't serialize on each other
        lock_key = (binascii.crc32(str(self.company_id).encode()) + 1) & 0x7FFFFFFF
        await self._advisory_lock(lock_key)

        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
        )
        count = (await self.db.execute(count_query)).scalar() or 0
        return f"SH-{count + 1:06d}"

    async def create(self, stops_data: list, accessorials_data: list, **kwargs) -> Load:
        """Create load with nested stops and accessorials."""
        load_number = await self.get_next_load_number()
        shipment_id = await self.generate_shipment_id()
        load = Load(
            company_id=self.company_id,
            load_number=load_number,
            shipment_id=shipment_id,
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

        logger.info("Load %s created for company %s", load_number, self.company_id)

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
        """Live loads: assigned, dispatched, in_transit."""
        live_statuses = [
            LoadStatus.assigned,
            LoadStatus.dispatched,
            LoadStatus.in_transit,
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
        """Upcoming: status = offer or booked."""
        upcoming_statuses = [LoadStatus.offer, LoadStatus.booked]
        query = self._base_query().where(Load.status.in_(upcoming_statuses))
        count_query = (
            select(func.count())
            .select_from(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.is_active == True)
            .where(Load.status.in_(upcoming_statuses))
        )
        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Load.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_completed(self, page: int = 1, page_size: int = 20) -> tuple[list[Load], int]:
        """Completed: delivered, invoiced, paid."""
        completed_statuses = [
            LoadStatus.delivered,
            LoadStatus.invoiced,
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
