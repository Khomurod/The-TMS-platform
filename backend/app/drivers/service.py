"""Drivers service — business logic for driver CRUD, compliance checking, and availability.

Step 2 tasks covered:
  - check_driver_compliance() — 3-tier compliance urgency system
  - Updated delete validation to use Trip (not direct Load FK)
"""

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
    ComplianceResponse,
    ComplianceViolation,
)
from app.core.exceptions import NotFoundError
from app.models.driver import Driver


# ══════════════════════════════════════════════════════════════════
#   COMPLIANCE ENGINE — Standalone function (used by loads service)
# ══════════════════════════════════════════════════════════════════

def check_driver_compliance(driver: Driver) -> list[dict]:
    """Check driver compliance. Returns list of violations (empty = 'Ready to go').

    3-Tier Urgency System:
      🟢 GOOD     — All docs current, >30 days to expiry
      🟡 WARNING  — Any doc expiring within 30 days
      🔴 CRITICAL — Any doc expired OR expiring within 7 days

    This is a pure function — no DB calls, synchronous.
    """
    violations = []
    today = date.today()

    # CDL checks
    if not driver.cdl_number:
        violations.append({
            "field": "cdl",
            "severity": "critical",
            "message": "No CDL number on file",
        })
    elif driver.cdl_expiry_date:
        days_until = (driver.cdl_expiry_date - today).days
        if days_until < 0:
            violations.append({
                "field": "cdl",
                "severity": "critical",
                "message": f"CDL expired {abs(days_until)} days ago (expired {driver.cdl_expiry_date})",
            })
        elif days_until <= 7:
            violations.append({
                "field": "cdl",
                "severity": "critical",
                "message": f"CDL expires in {days_until} days ({driver.cdl_expiry_date})",
            })
        elif days_until <= 30:
            violations.append({
                "field": "cdl",
                "severity": "warning",
                "message": f"CDL expires in {days_until} days ({driver.cdl_expiry_date})",
            })

    # Medical card checks
    if driver.medical_card_expiry_date:
        days_until = (driver.medical_card_expiry_date - today).days
        if days_until < 0:
            violations.append({
                "field": "medical_card",
                "severity": "critical",
                "message": f"Medical card expired {abs(days_until)} days ago (expired {driver.medical_card_expiry_date})",
            })
        elif days_until <= 7:
            violations.append({
                "field": "medical_card",
                "severity": "critical",
                "message": f"Medical card expires in {days_until} days ({driver.medical_card_expiry_date})",
            })
        elif days_until <= 30:
            violations.append({
                "field": "medical_card",
                "severity": "warning",
                "message": f"Medical card expires in {days_until} days ({driver.medical_card_expiry_date})",
            })

    return violations


def get_compliance_urgency(violations: list[dict]) -> str:
    """Derive the overall compliance urgency from a list of violations.

    Returns: 'good' | 'upcoming' | 'critical' | 'expired'
    """
    if not violations:
        return "good"

    has_critical = any(v["severity"] == "critical" for v in violations)
    has_expired = any("expired" in v["message"].lower() for v in violations)

    if has_expired:
        return "expired"
    elif has_critical:
        return "critical"
    else:
        return "upcoming"


class DriverService:
    """Driver business logic with compliance checks."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.repo = DriverRepository(db, company_id)
        self.company_id = company_id

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
        """Soft delete — blocked if driver has active trips (409)."""
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")

        if await self.repo.has_active_trips(driver_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot delete driver assigned to an active trip",
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

    async def get_compliance(self, driver_id: UUID) -> ComplianceResponse:
        """Get full compliance status for a driver."""
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")

        violations = check_driver_compliance(driver)
        urgency = get_compliance_urgency(violations)

        return ComplianceResponse(
            driver_id=str(driver.id),
            driver_name=f"{driver.first_name} {driver.last_name}",
            urgency=urgency,
            violations=[
                ComplianceViolation(
                    field=v["field"],
                    severity=v["severity"],
                    message=v["message"],
                )
                for v in violations
            ],
        )
