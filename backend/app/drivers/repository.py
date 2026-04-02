"""Drivers repository — async database queries with tenant isolation."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import DriverStatus, LoadStatus
from app.models.driver import Driver
from app.models.load import Trip, Load


class DriverRepository:
    """All driver DB operations. Every query MUST filter by company_id."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        employment_type: Optional[str] = None,
    ) -> tuple[list[Driver], int]:
        """Paginated list with optional filters."""
        query = (
            select(Driver)
            .where(Driver.company_id == self.company_id)
            .where(Driver.is_active == True)
        )
        count_query = (
            select(func.count())
            .select_from(Driver)
            .where(Driver.company_id == self.company_id)
            .where(Driver.is_active == True)
        )

        if search:
            like_pattern = f"%{search}%"
            search_filter = or_(
                Driver.first_name.ilike(like_pattern),
                Driver.last_name.ilike(like_pattern),
                Driver.cdl_number.ilike(like_pattern),
                Driver.phone.ilike(like_pattern),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        if status:
            query = query.where(Driver.status == status)
            count_query = count_query.where(Driver.status == status)

        if employment_type:
            query = query.where(Driver.employment_type == employment_type)
            count_query = count_query.where(Driver.employment_type == employment_type)

        total = (await self.db.execute(count_query)).scalar() or 0

        query = (
            query.order_by(Driver.last_name, Driver.first_name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_by_id(self, driver_id: UUID) -> Optional[Driver]:
        """Get single driver by ID (tenant-scoped)."""
        query = (
            select(Driver)
            .where(Driver.id == driver_id)
            .where(Driver.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_available(self) -> list[Driver]:
        """Get drivers with status = available and is_active = true."""
        query = (
            select(Driver)
            .where(Driver.company_id == self.company_id)
            .where(Driver.is_active == True)
            .where(Driver.status == DriverStatus.available)
            .order_by(Driver.last_name, Driver.first_name)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_expiring(self, days: int = 30) -> list[Driver]:
        """Get drivers with CDL or medical card expiring within N days."""
        threshold = date.today() + timedelta(days=days)
        query = (
            select(Driver)
            .where(Driver.company_id == self.company_id)
            .where(Driver.is_active == True)
            .where(
                or_(
                    and_(
                        Driver.cdl_expiry_date.isnot(None),
                        Driver.cdl_expiry_date <= threshold,
                    ),
                    and_(
                        Driver.medical_card_expiry_date.isnot(None),
                        Driver.medical_card_expiry_date <= threshold,
                    ),
                )
            )
            .order_by(Driver.cdl_expiry_date)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def has_active_trips(self, driver_id: UUID) -> bool:
        """Check if driver has active (non-delivered) trips."""
        query = (
            select(func.count())
            .select_from(Trip)
            .where(Trip.driver_id == driver_id)
            .where(Trip.company_id == self.company_id)
            .join(Load, Trip.load_id == Load.id)
            .where(Load.status.notin_([
                LoadStatus.delivered,
                LoadStatus.invoiced,
                LoadStatus.paid,
                LoadStatus.cancelled,
            ]))
        )
        result = (await self.db.execute(query)).scalar() or 0
        return result > 0

    async def create(self, **kwargs) -> Driver:
        """Insert new driver record."""
        driver = Driver(company_id=self.company_id, **kwargs)
        self.db.add(driver)
        await self.db.commit()
        await self.db.refresh(driver)
        return driver

    async def update(self, driver: Driver, **kwargs) -> Driver:
        """Update driver fields."""
        for key, value in kwargs.items():
            if value is not None:
                setattr(driver, key, value)
        await self.db.commit()
        await self.db.refresh(driver)
        return driver

    async def soft_delete(self, driver: Driver) -> None:
        """Soft delete — sets is_active = False."""
        driver.is_active = False
        await self.db.commit()
