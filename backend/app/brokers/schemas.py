"""Brokers schemas — Pydantic request/response models."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────────

class BrokerCreate(BaseModel):
    """POST /brokers — create a new broker."""
    name: str = Field(..., max_length=255)
    mc_number: Optional[str] = Field(None, max_length=50)
    billing_address: Optional[str] = None
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


class BrokerUpdate(BaseModel):
    """PUT /brokers/{id} — update a broker (all fields optional)."""
    name: Optional[str] = Field(None, max_length=255)
    mc_number: Optional[str] = Field(None, max_length=50)
    billing_address: Optional[str] = None
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


# ── Response Schemas ─────────────────────────────────────────────

class BrokerResponse(BaseModel):
    """Single broker response."""
    id: UUID
    name: str
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    billing_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BrokerListResponse(BaseModel):
    """Paginated list of brokers."""
    items: list[BrokerResponse]
    total: int
    page: int
    page_size: int


class BrokerSearchResult(BaseModel):
    """Lightweight result for auto-complete."""
    id: UUID
    name: str
    mc_number: Optional[str] = None

    model_config = {"from_attributes": True}
