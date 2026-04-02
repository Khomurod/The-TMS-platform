"""Drivers router — driver management endpoints.

Endpoints:
  GET    /drivers                    — Paginated list with filters
  POST   /drivers                    — Create driver profile
  GET    /drivers/available           — Available drivers only
  GET    /drivers/expiring            — Expiring CDL/medical within 30 days
  GET    /drivers/{id}                — Full driver profile
  GET    /drivers/{id}/compliance     — 3-tier compliance check
  PUT    /drivers/{id}                — Update driver
  DELETE /drivers/{id}                — Soft delete (blocked if active trips → 409)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.drivers.schemas import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverListResponse,
    DriverAvailableResponse,
    DriverExpiringResponse,
    ComplianceResponse,
)
from app.drivers.service import DriverService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/drivers", tags=["Drivers"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> DriverService:
    return DriverService(db, company_id)


# ── List (paginated, filterable) ─────────────────────────────────

@router.get("", response_model=DriverListResponse)
async def list_drivers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    employment_type: str = Query(None),
    svc: DriverService = Depends(_get_service),
):
    """List drivers with optional filters."""
    return await svc.list_drivers(page, page_size, search, status, employment_type)


# ── Available Drivers ────────────────────────────────────────────

@router.get("/available", response_model=list[DriverAvailableResponse])
async def get_available_drivers(
    svc: DriverService = Depends(_get_service),
):
    """Available drivers for load assignment."""
    return await svc.get_available()


# ── Expiring Documents ──────────────────────────────────────────

@router.get("/expiring", response_model=list[DriverExpiringResponse])
async def get_expiring_drivers(
    days: int = Query(30, ge=1, le=365),
    svc: DriverService = Depends(_get_service),
):
    """Drivers with CDL or medical card expiring within N days."""
    return await svc.get_expiring(days)


# ── Create ───────────────────────────────────────────────────────

@router.post("", response_model=DriverResponse, status_code=201)
async def create_driver(
    data: DriverCreate,
    svc: DriverService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Create a new driver profile."""
    return await svc.create_driver(data)


# ── Get by ID ────────────────────────────────────────────────────

@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: UUID,
    svc: DriverService = Depends(_get_service),
):
    """Get full driver profile."""
    return await svc.get_driver(driver_id)


# ── Compliance Check ─────────────────────────────────────────────

@router.get("/{driver_id}/compliance", response_model=ComplianceResponse)
async def check_compliance(
    driver_id: UUID,
    svc: DriverService = Depends(_get_service),
):
    """3-tier compliance check: good | upcoming | critical | expired."""
    return await svc.get_compliance(driver_id)


# ── Update ───────────────────────────────────────────────────────

@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: UUID,
    data: DriverUpdate,
    svc: DriverService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Update driver fields."""
    return await svc.update_driver(driver_id, data)


# ── Soft Delete ──────────────────────────────────────────────────

@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: UUID,
    svc: DriverService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Soft delete driver. Returns 409 if attached to active trip."""
    await svc.delete_driver(driver_id)
