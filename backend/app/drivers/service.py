"""Drivers service — business logic for driver CRUD operations."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.drivers.repository import DriverRepository
from app.drivers.schemas import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverListResponse,
    DriverAvailableResponse,
    DriverExpiringResponse,
)
from app.core.exceptions import NotFoundError


class DriverService:
    """Driver business logic with compliance checks."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.repo = DriverRepository(db, company_id)

    async def list_drivers(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        employment_type: Optional[str] = None,
    ) -> DriverListResponse:
        """Paginated driver list with filters."""
        items, total = await self.repo.list(page, page_size, search, status, employment_type)
        return DriverListResponse(
            items=[DriverResponse.model_validate(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_driver(self, driver_id: UUID) -> DriverResponse:
        """Get single driver by ID."""
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")
        return DriverResponse.model_validate(driver)

    async def create_driver(self, data: DriverCreate) -> DriverResponse:
        """Create a new driver."""
        driver = await self.repo.create(**data.model_dump())
        return DriverResponse.model_validate(driver)

    async def update_driver(
        self, driver_id: UUID, data: DriverUpdate
    ) -> DriverResponse:
        """Update existing driver."""
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")
        updated = await self.repo.update(
            driver, **data.model_dump(exclude_unset=True)
        )
        return DriverResponse.model_validate(updated)

    async def delete_driver(self, driver_id: UUID) -> None:
        """Soft delete — blocked if driver has active loads (409)."""
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")

        if await self.repo.has_active_loads(driver_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot delete driver assigned to an active load",
            )

        await self.repo.soft_delete(driver)

    async def get_available(self) -> list[DriverAvailableResponse]:
        """Only drivers with status=available for assignment."""
        drivers = await self.repo.get_available()
        return [DriverAvailableResponse.model_validate(d) for d in drivers]

    async def get_expiring(self, days: int = 30) -> list[DriverExpiringResponse]:
        """Drivers with CDL or medical card expiring within N days."""
        drivers = await self.repo.get_expiring(days)
        today = date.today()
        results = []
        for d in drivers:
            # Find earliest expiring date
            expires = []
            if d.cdl_expiry_date:
                expires.append(d.cdl_expiry_date)
            if d.medical_card_expiry_date:
                expires.append(d.medical_card_expiry_date)
            earliest = min(expires) if expires else today
            days_until = (earliest - today).days

            results.append(
                DriverExpiringResponse(
                    id=str(d.id),
                    first_name=d.first_name,
                    last_name=d.last_name,
                    cdl_expiry_date=d.cdl_expiry_date,
                    medical_card_expiry_date=d.medical_card_expiry_date,
                    days_until_expiry=days_until,
                )
            )
        return results
