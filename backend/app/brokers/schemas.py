"""Brokers schemas — Pydantic request/response models."""

from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────────

class BrokerCreate(BaseModel):
    """POST /brokers — create a new broker."""
    name: str
    mc_number: Optional[str] = None
    billing_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


class BrokerUpdate(BaseModel):
    """PUT /brokers/{id} — update a broker (all fields optional)."""
    name: Optional[str] = None
    mc_number: Optional[str] = None
    billing_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


# ── Response Schemas ─────────────────────────────────────────────

class BrokerResponse(BaseModel):
    """Single broker response."""
    id: str
    name: str
    mc_number: Optional[str] = None
    billing_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrokerListResponse(BaseModel):
    """Paginated list of brokers."""
    items: list[BrokerResponse]
    total: int
    page: int
    page_size: int


class BrokerSearchResult(BaseModel):
    """Lightweight result for auto-complete."""
    id: str
    name: str
    mc_number: Optional[str] = None

    model_config = {"from_attributes": True}
