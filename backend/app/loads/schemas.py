"""Loads schemas — Pydantic request/response models for loads, stops, and accessorials."""

from datetime import date, datetime, time
from decimal import Decimal
from pydantic import BaseModel
from typing import Optional


# ── Stop Schemas ─────────────────────────────────────────────────

class StopCreate(BaseModel):
    stop_type: str  # pickup | delivery
    stop_sequence: int
    facility_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    notes: Optional[str] = None


class StopResponse(BaseModel):
    id: str
    stop_type: str
    stop_sequence: int
    facility_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    arrival_date: Optional[datetime] = None
    departure_date: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Accessorial Schemas ──────────────────────────────────────────

class AccessorialCreate(BaseModel):
    type: str  # fuel_surcharge | detention | layover | lumper | stop_off | tarp | other
    amount: Decimal
    description: Optional[str] = None


class AccessorialResponse(BaseModel):
    id: str
    type: str
    amount: Decimal
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Load Request Schemas ─────────────────────────────────────────

class LoadCreate(BaseModel):
    """POST /loads — create load with broker, stops, financials."""
    broker_id: Optional[str] = None
    broker_load_id: Optional[str] = None
    contact_agent: Optional[str] = None
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    stops: list[StopCreate]
    accessorials: list[AccessorialCreate] = []
    driver_id: Optional[str] = None
    truck_id: Optional[str] = None
    trailer_id: Optional[str] = None
    notes: Optional[str] = None


class LoadUpdate(BaseModel):
    """PUT /loads/{id} — update load info."""
    broker_id: Optional[str] = None
    broker_load_id: Optional[str] = None
    contact_agent: Optional[str] = None
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    notes: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    """PATCH /loads/{id}/status — change load status."""
    status: str


class AssignmentRequest(BaseModel):
    """PATCH /loads/{id}/assign — assign driver + truck + trailer."""
    driver_id: Optional[str] = None
    truck_id: Optional[str] = None
    trailer_id: Optional[str] = None


# ── Load Response Schemas ────────────────────────────────────────

class LoadResponse(BaseModel):
    """Full load detail."""
    id: str
    load_number: str
    broker_load_id: Optional[str] = None
    broker_id: Optional[str] = None
    driver_id: Optional[str] = None
    truck_id: Optional[str] = None
    trailer_id: Optional[str] = None
    status: str
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    total_rate: Optional[Decimal] = None
    contact_agent: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stops: list[StopResponse] = []
    accessorials: list[AccessorialResponse] = []

    model_config = {"from_attributes": True}


class LoadListItem(BaseModel):
    """Lightweight load for board listings."""
    id: str
    load_number: str
    broker_load_id: Optional[str] = None
    status: str
    base_rate: Optional[Decimal] = None
    total_rate: Optional[Decimal] = None
    driver_id: Optional[str] = None
    truck_id: Optional[str] = None
    created_at: datetime
    # Populated from stops
    pickup_city: Optional[str] = None
    pickup_date: Optional[date] = None
    delivery_city: Optional[str] = None
    delivery_date: Optional[date] = None
    # Populated from relationships
    broker_name: Optional[str] = None
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None

    model_config = {"from_attributes": True}


class LoadListResponse(BaseModel):
    """Paginated load list."""
    items: list[LoadListItem]
    total: int
    page: int
    page_size: int
