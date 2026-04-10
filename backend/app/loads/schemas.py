"""Loads schemas — Pydantic request/response models for loads, trips, stops, and accessorials."""

from datetime import date, datetime, time
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


# ── Stop Schemas ─────────────────────────────────────────────────

class StopCreate(BaseModel):
    stop_type: str  # pickup | delivery
    stop_sequence: int
    facility_name: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=1000)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=20)
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    notes: Optional[str] = Field(None, max_length=2000)


class StopResponse(BaseModel):
    id: UUID
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
    trip_id: Optional[UUID] = None

    model_config = {"from_attributes": True}


# ── Accessorial Schemas ──────────────────────────────────────────

class AccessorialCreate(BaseModel):
    type: str  # fuel_surcharge | detention | layover | lumper | stop_off | tarp | other
    amount: Decimal
    description: Optional[str] = Field(None, max_length=255)


class AccessorialResponse(BaseModel):
    id: UUID
    type: str
    amount: Decimal
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Trip Schemas ─────────────────────────────────────────────────

class TripResponse(BaseModel):
    """Trip detail — bridge between Load and Driver/Truck."""
    id: UUID
    trip_number: str
    sequence_number: int
    status: str
    driver_id: Optional[UUID] = None
    truck_id: Optional[UUID] = None
    trailer_id: Optional[UUID] = None
    loaded_miles: Optional[Decimal] = None
    empty_miles: Optional[Decimal] = None
    driver_gross: Optional[Decimal] = None
    # Populated from relationships
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None
    trailer_number: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Load Request Schemas ─────────────────────────────────────────

class LoadCreate(BaseModel):
    """POST /loads — create load with broker, stops, financials."""
    broker_id: Optional[str] = None
    broker_load_id: Optional[str] = Field(None, max_length=100)
    contact_agent: Optional[str] = Field(None, max_length=255)
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    stops: list[StopCreate]
    accessorials: list[AccessorialCreate] = []
    notes: Optional[str] = Field(None, max_length=5000)


# ── Update schema: explicit allowlist of editable fields ─────────

class LoadUpdate(BaseModel):
    """PUT /loads/{id} -- update load info.

    Only explicitly allowed fields are included. Fields like status,
    load_number, company_id, is_locked are NOT editable via this endpoint.
    """
    broker_id: Optional[str] = None
    broker_load_id: Optional[str] = Field(None, max_length=100)
    contact_agent: Optional[str] = Field(None, max_length=255)
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    notes: Optional[str] = Field(None, max_length=5000)

    # Explicit allowlist of fields that can be set via update
    # broker_id is included but converted from str → UUID inside safe_update_dict()
    _ALLOWED_UPDATE_FIELDS = frozenset({
        "broker_id", "broker_load_id", "contact_agent", "base_rate", "total_miles", "notes",
    })

    def safe_update_dict(self) -> dict:
        """Return only the explicitly allowed fields, excluding unset ones.

        Handles broker_id str → UUID conversion inline so the service layer
        doesn't need special-case code (audit fix MEDIUM-2).
        """
        from uuid import UUID as _UUID
        data = self.model_dump(exclude_unset=True)
        safe = {k: v for k, v in data.items() if k in self._ALLOWED_UPDATE_FIELDS}
        # Convert broker_id from string to UUID if present
        if "broker_id" in safe and safe["broker_id"] is not None:
            safe["broker_id"] = _UUID(safe["broker_id"])
        return safe


class StatusUpdateRequest(BaseModel):
    """PATCH /loads/{id}/status — change load status."""
    status: str


class DispatchRequest(BaseModel):
    """POST /loads/{id}/dispatch — full dispatch workflow."""
    driver_id: str
    truck_id: str
    trailer_id: Optional[str] = None


class AssignTripRequest(BaseModel):
    """PATCH /loads/{id}/trips/{trip_id}/assign — assign assets to trip."""
    driver_id: Optional[str] = None
    truck_id: Optional[str] = None
    trailer_id: Optional[str] = None


# ── Load Response Schemas ────────────────────────────────────────

class LoadResponse(BaseModel):
    """Full load detail."""
    id: UUID
    load_number: str
    shipment_id: Optional[str] = None
    broker_load_id: Optional[str] = None
    broker_id: Optional[UUID] = None
    status: str
    is_locked: bool = False
    base_rate: Optional[Decimal] = None
    total_miles: Optional[Decimal] = None
    total_rate: Optional[Decimal] = None
    contact_agent: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stops: list[StopResponse] = []
    accessorials: list[AccessorialResponse] = []
    trips: list[TripResponse] = []

    model_config = {"from_attributes": True}


class LoadListItem(BaseModel):
    """Lightweight load for board listings."""
    id: str  # Consistent string serialization
    load_number: str
    shipment_id: Optional[str] = None
    broker_load_id: Optional[str] = None
    status: str
    base_rate: Optional[Decimal] = None
    total_rate: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    # Populated from stops
    pickup_city: Optional[str] = None
    pickup_date: Optional[date] = None
    delivery_city: Optional[str] = None
    delivery_date: Optional[date] = None
    # Populated from relationships (via Trip)
    broker_name: Optional[str] = None
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None
    trip_count: int = 0

    model_config = {"from_attributes": True}


class LoadListResponse(BaseModel):
    """Paginated load list."""
    items: list[LoadListItem]
    total: int
    page: int
    page_size: int
