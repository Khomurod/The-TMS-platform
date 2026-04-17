"""Loads router — load management, dispatch, Trip assignment, and board tabs.

Endpoints:
  CRUD:
    GET    /loads              — List with filters
    POST   /loads              — Create load with stops + accessorials
    GET    /loads/{id}         — Full detail
    PUT    /loads/{id}         — Update
    DELETE /loads/{id}         — Soft delete (only if offer)

  State Machine:
    PATCH  /loads/{id}/status  — Advance load status (8-stage pipeline)

  Dispatch:
    POST   /loads/{id}/dispatch — Create Trip + assign Driver/Truck + dispatch

  Trip Assignment:
    PATCH  /loads/{id}/trips/{trip_id}/assign — Assign assets to existing trip

  Board Tabs:
    GET    /loads/live         — assigned, dispatched, in_transit
    GET    /loads/upcoming     — offer, booked
    GET    /loads/completed    — delivered, invoiced, paid
"""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.loads.schemas import (
    LoadCreate,
    LoadUpdate,
    LoadResponse,
    LoadListResponse,
    StatusUpdateRequest,
    DispatchRequest,
    AssignTripRequest,
)
from app.loads.service import LoadService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/loads", tags=["Loads"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> LoadService:
    return LoadService(db, company_id)


# ══════════════════════════════════════════════════════════════════
#   Board Tab Endpoints (BEFORE /{id} to avoid path conflicts)
# ══════════════════════════════════════════════════════════════════

@router.get("/live", response_model=LoadListResponse)
async def get_live_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Live loads: assigned, dispatched, in_transit."""
    return await svc.get_live_loads(page, page_size)


@router.get("/upcoming", response_model=LoadListResponse)
async def get_upcoming_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Upcoming: offer, booked."""
    return await svc.get_upcoming_loads(page, page_size)


@router.get("/completed", response_model=LoadListResponse)
async def get_completed_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Completed: delivered, invoiced, paid."""
    return await svc.get_completed_loads(page, page_size)


# ══════════════════════════════════════════════════════════════════
#   CRUD Endpoints
# ══════════════════════════════════════════════════════════════════

@router.get("", response_model=LoadListResponse)
async def list_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    driver_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    svc: LoadService = Depends(_get_service),
):
    """List loads with optional filters."""
    return await svc.list_loads(page, page_size, status, str(driver_id) if driver_id else None, date_from, date_to)


@router.post("", response_model=LoadResponse, status_code=201)
async def create_load(
    data: LoadCreate,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Create a new load with stops and accessorials. Status starts at 'offer'."""
    return await svc.create_load(data)


@router.post("/parse-document")
async def parse_freight_document(
    file: UploadFile = File(...),
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Upload and parse a freight document (BOL/Rate Con) using Yandex AI."""
    return await svc.parse_freight_document(file)


@router.get("/{load_id}", response_model=LoadResponse)
async def get_load(
    load_id: UUID,
    svc: LoadService = Depends(_get_service),
):
    """Get full load detail including trips."""
    return await svc.get_load(load_id)


@router.put("/{load_id}", response_model=LoadResponse)
async def update_load(
    load_id: UUID,
    data: LoadUpdate,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Update load info. Blocked if load is locked (post-invoiced)."""
    return await svc.update_load(load_id, data)


@router.delete("/{load_id}", status_code=204)
async def delete_load(
    load_id: UUID,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Soft delete — only status=offer."""
    await svc.delete_load(load_id)


# ══════════════════════════════════════════════════════════════════
#   State Machine — Status Transition
# ══════════════════════════════════════════════════════════════════

@router.patch("/{load_id}/status", response_model=LoadResponse)
async def advance_load_status(
    load_id: UUID,
    data: StatusUpdateRequest,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Advance load status — enforces 8-stage state machine with side-effects."""
    return await svc.advance_status(load_id, data.status)


# ══════════════════════════════════════════════════════════════════
#   Dispatch — Full workflow in one shot
# ══════════════════════════════════════════════════════════════════

@router.post("/{load_id}/dispatch", response_model=LoadResponse)
async def dispatch_load(
    load_id: UUID,
    data: DispatchRequest,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Full dispatch: validate compliance → create Trip → assign assets → set dispatched."""
    return await svc.dispatch_load(load_id, data)


# ══════════════════════════════════════════════════════════════════
#   Trip Assignment
# ══════════════════════════════════════════════════════════════════

@router.patch("/{load_id}/trips/{trip_id}/assign", response_model=LoadResponse)
async def assign_trip(
    load_id: UUID,
    trip_id: UUID,
    data: AssignTripRequest,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Assign assets and trip financials to an existing Trip."""
    return await svc.assign_trip(
        load_id,
        trip_id,
        data.driver_id,
        data.truck_id,
        data.trailer_id,
        data.loaded_miles,
        data.empty_miles,
        data.driver_gross,
    )
