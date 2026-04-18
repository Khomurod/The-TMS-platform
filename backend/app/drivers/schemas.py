"""Drivers schemas — Pydantic request/response models."""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
from uuid import UUID

# Valid enum values matching DB constraints
EmploymentTypeStr = Literal["company_w2", "owner_operator_1099", "lease_operator"]
PayRateTypeStr = Literal["cpm", "percentage", "fixed_per_load", "hourly", "salary"]


# ── Request Schemas ──────────────────────────────────────────────

class DriverCreate(BaseModel):
    """POST /drivers — create a new driver."""
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    home_address: Optional[str] = None
    employment_type: EmploymentTypeStr  # company_w2 | owner_operator_1099 | lease_operator
    cdl_number: Optional[str] = None
    cdl_class: Optional[str] = None
    cdl_expiry_date: Optional[date] = None
    medical_card_expiry_date: Optional[date] = None
    experience_years: Optional[int] = None
    pay_rate_type: Optional[PayRateTypeStr] = None  # cpm | percentage | fixed_per_load | hourly | salary
    pay_rate_value: Optional[Decimal] = None
    payment_tariff_type: Optional[str] = None
    payment_tariff_value: Optional[Decimal] = None
    tax_classification: Optional[str] = None
    use_company_defaults: bool = False
    bank_name: Optional[str] = None
    bank_routing_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    hire_date: Optional[date] = None


class DriverUpdate(BaseModel):
    """PUT /drivers/{id} — update driver (all fields optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    home_address: Optional[str] = None
    employment_type: Optional[EmploymentTypeStr] = None
    cdl_number: Optional[str] = None
    cdl_class: Optional[str] = None
    cdl_expiry_date: Optional[date] = None
    medical_card_expiry_date: Optional[date] = None
    experience_years: Optional[int] = None
    pay_rate_type: Optional[PayRateTypeStr] = None
    pay_rate_value: Optional[Decimal] = None
    payment_tariff_type: Optional[str] = None
    payment_tariff_value: Optional[Decimal] = None
    tax_classification: Optional[str] = None
    use_company_defaults: Optional[bool] = None
    status: Optional[str] = None
    bank_name: Optional[str] = None
    bank_routing_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    hire_date: Optional[date] = None
    notes: Optional[str] = None


# ── Response Schemas ─────────────────────────────────────────────

class DriverResponse(BaseModel):
    """Single driver response."""
    id: UUID
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    home_address: Optional[str] = None
    employment_type: Optional[str] = None
    cdl_number: Optional[str] = None
    cdl_class: Optional[str] = None
    cdl_expiry_date: Optional[date] = None
    medical_card_expiry_date: Optional[date] = None
    experience_years: Optional[int] = None
    pay_rate_type: Optional[str] = None
    pay_rate_value: Optional[Decimal] = None
    payment_tariff_type: Optional[str] = None
    payment_tariff_value: Optional[Decimal] = None
    tax_classification: Optional[str] = None
    use_company_defaults: Optional[bool] = False
    status: Optional[str] = "available"
    is_active: Optional[bool] = True
    hire_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DriverListResponse(BaseModel):
    """Paginated driver list."""
    items: list[DriverResponse]
    total: int
    page: int
    page_size: int


class DriverAvailableResponse(BaseModel):
    """Lightweight driver info for assignment dropdowns."""
    id: UUID
    first_name: str
    last_name: str
    cdl_class: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


class DriverExpiringResponse(BaseModel):
    """Driver with upcoming document expiration."""
    id: UUID
    first_name: str
    last_name: str
    cdl_expiry_date: Optional[date] = None
    medical_card_expiry_date: Optional[date] = None
    days_until_expiry: int

    model_config = {"from_attributes": True}


# ── Compliance Schemas ───────────────────────────────────────────

class ComplianceViolation(BaseModel):
    """Single compliance violation."""
    field: str       # cdl | medical_card
    severity: str    # critical | warning
    message: str


class ComplianceResponse(BaseModel):
    """Full compliance status for a driver."""
    driver_id: str
    driver_name: str
    urgency: str     # good | upcoming | critical | expired
    violations: list[ComplianceViolation] = []
