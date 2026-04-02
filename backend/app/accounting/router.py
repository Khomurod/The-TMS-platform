"""Accounting router — settlements, invoices, and PDF generation.

Endpoints:
  Settlement Management:
    POST   /settlements/generate         — Generate draft settlement (Trip-level math)
    GET    /settlements                  — List settlements
    GET    /settlements/{id}             — Full detail with line items
    PATCH  /settlements/{id}/post        — Post (freeze line items)
    PATCH  /settlements/{id}/undo        — Undo post (unfreeze)
    PATCH  /settlements/{id}/pay         — Mark as paid (terminal)
  PDF:
    GET    /settlements/{id}/pdf         — Download PDF paystub
  Invoicing:
    POST   /loads/{load_id}/invoice      — Generate broker invoice
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.accounting.schemas import (
    SettlementGenerateRequest,
    SettlementResponse,
    SettlementListResponse,
    InvoiceResponse,
)
from app.accounting.service import AccountingService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/accounting", tags=["Accounting"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> AccountingService:
    return AccountingService(db, company_id)


# ══════════════════════════════════════════════════════════════════
#   Settlement Management
# ══════════════════════════════════════════════════════════════════

@router.post("/settlements/generate", response_model=SettlementResponse, status_code=201)
async def generate_settlement(
    data: SettlementGenerateRequest,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Generate a draft settlement for a driver over a date range (Trip-level math)."""
    return await svc.generate_settlement(data)


@router.get("/settlements", response_model=SettlementListResponse)
async def list_settlements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    driver_id: str = Query(None),
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "accountant")),
):
    """List settlements with optional filters."""
    return await svc.list_settlements(page, page_size, status, driver_id)


@router.get("/settlements/{settlement_id}", response_model=SettlementResponse)
async def get_settlement(
    settlement_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "accountant")),
):
    """Get full settlement detail with line items."""
    return await svc.get_settlement(settlement_id)


@router.patch("/settlements/{settlement_id}/post", response_model=SettlementResponse)
async def post_settlement(
    settlement_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Post settlement — freeze line items (unposted → posted)."""
    return await svc.post_settlement(settlement_id)


@router.patch("/settlements/{settlement_id}/undo", response_model=SettlementResponse)
async def unpost_settlement(
    settlement_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Undo post — revert to editable (posted → unposted)."""
    return await svc.unpost_settlement(settlement_id)


@router.patch("/settlements/{settlement_id}/pay", response_model=SettlementResponse)
async def pay_settlement(
    settlement_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Mark as paid — terminal state (posted → paid)."""
    return await svc.pay_settlement(settlement_id)


# ══════════════════════════════════════════════════════════════════
#   PDF Generation
# ══════════════════════════════════════════════════════════════════

@router.get("/settlements/{settlement_id}/pdf")
async def download_settlement_pdf(
    settlement_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "accountant")),
):
    """Download settlement as PDF paystub."""
    return await svc.generate_pdf(settlement_id)


# ══════════════════════════════════════════════════════════════════
#   Broker Invoicing
# ══════════════════════════════════════════════════════════════════

@router.post("/loads/{load_id}/invoice", response_model=InvoiceResponse)
async def generate_invoice(
    load_id: UUID,
    svc: AccountingService = Depends(_get_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    """Generate broker invoice for a load."""
    return await svc.generate_invoice(load_id)
