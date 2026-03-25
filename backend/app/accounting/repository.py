"""Accounting repository — async DB queries for settlements, deductions, and invoices."""

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
    SettlementStatus,
    CompanyDefaultDeduction,
    LoadAccessorial,
)
from app.models.load import Load, LoadStatus
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

    async def get_next_settlement_number(self) -> str:
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

    async def get_driver_loads(self, driver_id: UUID, period_start: date, period_end: date) -> list[Load]:
        """Get delivered/billed/paid loads for a driver within a period."""
        query = (
            select(Load)
            .where(Load.company_id == self.company_id)
            .where(Load.driver_id == driver_id)
            .where(Load.status.in_([LoadStatus.delivered, LoadStatus.billed, LoadStatus.paid]))
            .where(Load.is_active == True)
            .where(Load.created_at >= period_start)
            .where(Load.created_at <= period_end)
            .options(selectinload(Load.accessorials), selectinload(Load.stops))
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
