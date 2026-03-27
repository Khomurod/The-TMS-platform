"""Fleet schemas — Pydantic request/response models for Trucks & Trailers."""

from datetime import date, datetime
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


# ── Truck Schemas ────────────────────────────────────────────────

class TruckCreate(BaseModel):
    unit_number: str
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None


class TruckUpdate(BaseModel):
    unit_number: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None
    status: Optional[str] = None


class TruckResponse(BaseModel):
    id: UUID
    unit_number: str
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None
    status: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TruckListResponse(BaseModel):
    items: list[TruckResponse]
    total: int
    page: int
    page_size: int


class TruckAvailableResponse(BaseModel):
    id: UUID
    unit_number: str
    make: Optional[str] = None
    model: Optional[str] = None
    dot_inspection_expiry: Optional[date] = None

    model_config = {"from_attributes": True}


# ── Trailer Schemas ──────────────────────────────────────────────

class TrailerCreate(BaseModel):
    unit_number: str
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    trailer_type: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None


class TrailerUpdate(BaseModel):
    unit_number: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    trailer_type: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None
    status: Optional[str] = None


class TrailerResponse(BaseModel):
    id: UUID
    unit_number: str
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    trailer_type: Optional[str] = None
    ownership_type: Optional[str] = None
    dot_inspection_date: Optional[date] = None
    dot_inspection_expiry: Optional[date] = None
    status: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TrailerListResponse(BaseModel):
    items: list[TrailerResponse]
    total: int
    page: int
    page_size: int


class TrailerAvailableResponse(BaseModel):
    id: UUID
    unit_number: str
    trailer_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    dot_inspection_expiry: Optional[date] = None

    model_config = {"from_attributes": True}
