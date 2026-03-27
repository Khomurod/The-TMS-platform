"""Auth schemas — Pydantic models for request/response validation."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Onboarding: create a new company + admin user."""

    # Company fields
    company_name: str = Field(..., min_length=1, max_length=255)
    mc_number: str | None = Field(None, max_length=50)
    dot_number: str | None = Field(None, max_length=50)

    # User fields
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Email or username + password login."""

    email: str
    password: str


class RefreshRequest(BaseModel):
    """Refresh an expired access token."""

    refresh_token: str


# ── Response Schemas ─────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token pair returned on login/register/refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User profile returned by /auth/me."""

    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    company_id: UUID | None = None
    company_name: str | None = None

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    """Response for successful registration."""

    user: UserResponse
    tokens: TokenResponse
    message: str = "Company and admin user created successfully"
