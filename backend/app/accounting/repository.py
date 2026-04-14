"""Accounting repository — async DB queries for settlements, trips, deductions, and invoices."""

from __future__ import annotations

import binascii
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.accounting import (
    DriverSettlement,
    SettlementLineItem,
    CompanyDefaultDeduction,
    LoadAccessorial,
)
from app.models.base import LoadStatus, SettlementBatchStatus
from app.models.load import Load, Trip
from app.models.driver import Driver


class SettlementRepository:
    """Settlement DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        driver_id: Optional[UUID] = None,
    ) -> tuple[list[DriverSettlement], int]:
        query = (
            select(DriverSettlement)
            .where(DriverSettlement.company_id == self.company_id)
            .options(selectinload(DriverSettlement.line_items), selectinload(DriverSettlement.driver))
        )
        count_query = (
            select(func.count())
            .select_from(DriverSettlement)
            .where(DriverSettlement.company_id == self.company_id)
        )

        if status:
            query = query.where(DriverSettlement.status == status)
            count_query = count_query.where(DriverSettlement.status == status)
        if driver_id:
            query = query.where(DriverSettlement.driver_id == driver_id)
            count_query = count_query.where(DriverSettlement.driver_id == driver_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(DriverSettlement.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_by_id(self, settlement_id: UUID) -> Optional[DriverSettlement]:
        query = (
            select(DriverSettlement)
            .where(DriverSettlement.company_id == self.company_id)
            .where(DriverSettlement.id == settlement_id)
            .options(selectinload(DriverSettlement.line_items), selectinload(DriverSettlement.driver))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _advisory_lock(self, lock_key: int) -> None:
        """Acquire a PostgreSQL advisory lock for the current transaction.

        Skips gracefully on non-PostgreSQL dialects (e.g. SQLite in tests)
        so that unit/integration tests can run without crashing.

        Matches the pattern in loads/repository.py.
        """
        from sqlalchemy import text

        try:
            dialect = self.db.bind.dialect.name if self.db.bind else "unknown"
        except Exception:
            dialect = "unknown"

        if dialect == "postgresql":
            await self.db.execute(text(f"SELECT pg_advisory_xact_lock({lock_key})"))

    async def get_next_settlement_number(self) -> str:
        """Generate next settlement number using deterministic advisory lock (race-condition safe).

        Uses pg_advisory_xact_lock on PostgreSQL to prevent duplicate numbers
        under concurrent inserts. Falls back gracefully on other dialects.
        """
        # Offset +100 to separate from load_number (+0) and shipment_id (+1) locks
        lock_key = (binascii.crc32(str(self.company_id).encode()) + 100) & 0x7FFFFFFF
        await self._advisory_lock(lock_key)

        count_query = (
            select(func.count())
            .select_from(DriverSettlement)
            .where(DriverSettlement.company_id == self.company_id)
        )
        count = (await self.db.execute(count_query)).scalar() or 0
        return f"TMS-{count + 1:05d}"

    async def create(self, **kwargs) -> DriverSettlement:
        settlement = DriverSettlement(company_id=self.company_id, **kwargs)
        self.db.add(settlement)
        await self.db.flush()
        return settlement

    async def add_line_item(self, **kwargs) -> SettlementLineItem:
        item = SettlementLineItem(company_id=self.company_id, **kwargs)
        self.db.add(item)
        return item

    async def commit_and_refresh(self, settlement: DriverSettlement) -> DriverSettlement:
        await self.db.commit()
        await self.db.refresh(settlement)
        return await self.get_by_id(settlement.id)

    async def get_driver_trips(
        self, driver_id: UUID, period_start: date, period_end: date
    ) -> list[Trip]:
        """Get delivered trips for a driver within a settlement period.

        Filters by COALESCE(Load.delivered_at, Load.created_at) to use the
        actual delivery completion date. Historical loads without delivered_at
        fall back to created_at. This ensures payroll periods reflect when
        work was completed, not when the load was created.
        """
        from sqlalchemy import func as sa_func

        # Effective date: delivered_at if populated, else created_at (historical fallback)
        effective_date = sa_func.coalesce(Load.delivered_at, Load.created_at)

        query = (
            select(Trip)
            .where(Trip.company_id == self.company_id)
            .where(Trip.driver_id == driver_id)
            .join(Load, Trip.load_id == Load.id)
            .where(Load.status.in_([
                LoadStatus.delivered,
                LoadStatus.invoiced,
                LoadStatus.paid,
            ]))
            .where(Load.is_active == True)
            .where(effective_date >= period_start)
            .where(effective_date <= period_end)
            .options(
                selectinload(Trip.load).selectinload(Load.accessorials),
                selectinload(Trip.load).selectinload(Load.stops),
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def get_company_deductions(self) -> list[CompanyDefaultDeduction]:
        query = (
            select(CompanyDefaultDeduction)
            .where(CompanyDefaultDeduction.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_driver(self, driver_id: UUID) -> Optional[Driver]:
        query = (
            select(Driver)
            .where(Driver.id == driver_id)
            .where(Driver.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
