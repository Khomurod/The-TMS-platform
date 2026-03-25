"""Brokers router — broker directory & auto-complete.

Endpoints:
  GET    /brokers           — Paginated list (searchable)
  GET    /brokers/search    — Auto-complete for load creation
  POST   /brokers           — Create new broker
  GET    /brokers/{id}      — Detail view
  PUT    /brokers/{id}      — Update broker
  DELETE /brokers/{id}      — Soft delete (is_active = false)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.brokers.schemas import (
    BrokerCreate,
    BrokerUpdate,
    BrokerResponse,
    BrokerListResponse,
    BrokerSearchResult,
)
from app.brokers.service import BrokerService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/brokers", tags=["Brokers"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> BrokerService:
    return BrokerService(db, company_id)


# ── List (paginated, searchable) ─────────────────────────────────

@router.get("", response_model=BrokerListResponse)
async def list_brokers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    svc: BrokerService = Depends(_get_service),
):
    """List brokers with optional search filter."""
    return await svc.list_brokers(page, page_size, search)


# ── Auto-Complete Search ─────────────────────────────────────────

@router.get("/search", response_model=list[BrokerSearchResult])
async def search_brokers(
    q: str = Query(..., min_length=1),
    svc: BrokerService = Depends(_get_service),
):
    """Auto-complete search for load creation."""
    return await svc.search_brokers(q)


# ── Create ───────────────────────────────────────────────────────

@router.post("", response_model=BrokerResponse, status_code=201)
async def create_broker(
    data: BrokerCreate,
    svc: BrokerService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Create a new broker."""
    return await svc.create_broker(data)


# ── Get by ID ────────────────────────────────────────────────────

@router.get("/{broker_id}", response_model=BrokerResponse)
async def get_broker(
    broker_id: UUID,
    svc: BrokerService = Depends(_get_service),
):
    """Get broker detail."""
    return await svc.get_broker(broker_id)


# ── Update ───────────────────────────────────────────────────────

@router.put("/{broker_id}", response_model=BrokerResponse)
async def update_broker(
    broker_id: UUID,
    data: BrokerUpdate,
    svc: BrokerService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Update broker fields."""
    return await svc.update_broker(broker_id, data)


# ── Soft Delete ──────────────────────────────────────────────────

@router.delete("/{broker_id}", status_code=204)
async def delete_broker(
    broker_id: UUID,
    svc: BrokerService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Soft delete broker (is_active = false)."""
    await svc.delete_broker(broker_id)
