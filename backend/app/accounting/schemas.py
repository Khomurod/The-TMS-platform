"""Accounting schemas — Pydantic models for settlements, invoices, and pay calculations."""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


# ── Settlement Schemas ───────────────────────────────────────────

class CustomItem(BaseModel):
    type: str
    description: str
    amount: Decimal

class SettlementGenerateRequest(BaseModel):
    """POST /settlements/generate — generate draft for driver + period."""
    driver_id: str
    period_start: date
    period_end: date
    custom_items: list[CustomItem] = []


class SettlementLineItemResponse(BaseModel):
    id: UUID
    type: str  # load_pay | accessorial | deduction | bonus
    description: Optional[str] = None
    amount: Decimal
    load_id: Optional[UUID] = None
    trip_id: Optional[UUID] = None

    model_config = {"from_attributes": True}


class SettlementResponse(BaseModel):
    """Full settlement detail."""
    id: UUID
    driver_id: UUID
    settlement_number: str
    period_start: date
    period_end: date
    gross_pay: Decimal
    total_accessorials: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    status: str
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    line_items: list[SettlementLineItemResponse] = []
    # Populated by service
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None

    model_config = {"from_attributes": True}


class SettlementListItem(BaseModel):
    """Lightweight settlement for list views."""
    id: UUID
    driver_id: UUID
    settlement_number: str
    period_start: date
    period_end: date
    gross_pay: Decimal
    net_pay: Decimal
    status: str
    driver_name: Optional[str] = None
    load_count: int = 0

    model_config = {"from_attributes": True}


class SettlementListResponse(BaseModel):
    items: list[SettlementListItem]
    total: int
    page: int
    page_size: int


# ── Invoice Schemas ──────────────────────────────────────────────

class InvoiceResponse(BaseModel):
    """Broker invoice detail."""
    id: UUID
    load_id: UUID
    load_number: str
    broker_name: Optional[str] = None
    base_rate: Decimal
    accessorials_total: Decimal
    total_amount: Decimal
    status: str
    created_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    page_size: int
