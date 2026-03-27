"""Settings schemas — Pydantic models for company profile, users & defaults."""

from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


# ── Company Profile ──────────────────────────────────────────────

class CompanyProfileResponse(BaseModel):
    id: UUID
    name: str
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CompanyProfileUpdate(BaseModel):
    name: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


# ── User Management ─────────────────────────────────────────────

class UserCreateRequest(BaseModel):
    """Invite/create internal user."""
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    role: str  # dispatcher | accountant | company_admin


class UserUpdateRequest(BaseModel):
    """Change role / deactivate."""
    role: Optional[str] = None
    is_active: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
