"""Loads router — load management, dispatch, assignment, and board tabs.

Phase 4 Endpoints:
  4.1 — CRUD:
    GET    /loads              — List with filters
    POST   /loads              — Create load with stops + accessorials
    GET    /loads/{id}         — Full detail
    PUT    /loads/{id}         — Update
    DELETE /loads/{id}         — Soft delete (only if planned)

  4.2 — State Machine:
    PATCH  /loads/{id}/status  — Transition status with side effects

  4.3 — Assignment:
    PATCH  /loads/{id}/assign  — Assign driver + truck + trailer with validation

  4.4 — Board Tabs:
    GET    /loads/live         — dispatched, at_pickup, in_transit, delayed
    GET    /loads/upcoming     — planned
    GET    /loads/completed    — delivered, billed, paid
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.loads.schemas import (
    LoadCreate,
    LoadUpdate,
    LoadResponse,
    LoadListResponse,
    StatusUpdateRequest,
    AssignmentRequest,
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
#   4.4 — Board Tab Endpoints (BEFORE /{id} to avoid path conflicts)
# ══════════════════════════════════════════════════════════════════

@router.get("/live", response_model=LoadListResponse)
async def get_live_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Live loads: dispatched, at_pickup, in_transit, delayed."""
    return await svc.get_live_loads(page, page_size)


@router.get("/upcoming", response_model=LoadListResponse)
async def get_upcoming_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Upcoming: status = planned."""
    return await svc.get_upcoming_loads(page, page_size)


@router.get("/completed", response_model=LoadListResponse)
async def get_completed_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LoadService = Depends(_get_service),
):
    """Completed: delivered, billed, paid."""
    return await svc.get_completed_loads(page, page_size)


# ══════════════════════════════════════════════════════════════════
#   4.1 — CRUD Endpoints
# ══════════════════════════════════════════════════════════════════

@router.get("", response_model=LoadListResponse)
async def list_loads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    driver_id: str = Query(None),
    date_from: date = Query(None),
    date_to: date = Query(None),
    svc: LoadService = Depends(_get_service),
):
    """List loads with optional filters."""
    return await svc.list_loads(page, page_size, status, driver_id, date_from, date_to)


@router.post("", response_model=LoadResponse, status_code=201)
async def create_load(
    data: LoadCreate,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Create a new load with stops and accessorials."""
    return await svc.create_load(data)


@router.get("/{load_id}", response_model=LoadResponse)
async def get_load(
    load_id: UUID,
    svc: LoadService = Depends(_get_service),
):
    """Get full load detail."""
    return await svc.get_load(load_id)


@router.put("/{load_id}", response_model=LoadResponse)
async def update_load(
    load_id: UUID,
    data: LoadUpdate,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Update load info."""
    return await svc.update_load(load_id, data)


@router.delete("/{load_id}", status_code=204)
async def delete_load(
    load_id: UUID,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Soft delete — only status=planned."""
    await svc.delete_load(load_id)


# ══════════════════════════════════════════════════════════════════
#   4.2 — Status Transition
# ══════════════════════════════════════════════════════════════════

@router.patch("/{load_id}/status", response_model=LoadResponse)
async def update_load_status(
    load_id: UUID,
    data: StatusUpdateRequest,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Transition load status — enforces state machine."""
    return await svc.update_status(load_id, data.status)


# ══════════════════════════════════════════════════════════════════
#   4.3 — Assignment with Failsafes
# ══════════════════════════════════════════════════════════════════

@router.patch("/{load_id}/assign", response_model=LoadResponse)
async def assign_load(
    load_id: UUID,
    data: AssignmentRequest,
    svc: LoadService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Assign driver + truck + trailer — validates compliance."""
    return await svc.assign_load(
        load_id, data.driver_id, data.truck_id, data.trailer_id
    )
