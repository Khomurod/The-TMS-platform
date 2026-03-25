"""Admin router — Super Admin endpoints for tenant management and impersonation.

Only accessible by users with role 'super_admin'.
"""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user_id, require_roles
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.security import create_access_token, hash_password
from app.models.company import Company
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Super Admin"],
    dependencies=[Depends(require_roles("super_admin"))],
)


# ── Schemas ──────────────────────────────────────────────────────

class CreateTenantRequest(BaseModel):
    """Create a new company + admin user."""
    company_name: str = Field(..., min_length=1, max_length=255)
    mc_number: str | None = None
    dot_number: str | None = None
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=128)
    admin_first_name: str = Field(..., min_length=1, max_length=100)
    admin_last_name: str = Field(..., min_length=1, max_length=100)


class CompanyListItem(BaseModel):
    id: UUID
    name: str
    mc_number: str | None
    dot_number: str | None
    is_active: bool
    model_config = {"from_attributes": True}


class ImpersonateResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str


# ── Endpoints ────────────────────────────────────────────────────

@router.get("/companies", response_model=list[CompanyListItem])
async def list_companies(db: AsyncSession = Depends(get_db)):
    """List all tenant companies."""
    result = await db.execute(select(Company).order_by(Company.created_at.desc()))
    return result.scalars().all()


@router.post("/companies", response_model=CompanyListItem, status_code=201)
async def create_tenant(data: CreateTenantRequest, db: AsyncSession = Depends(get_db)):
    """Create a new tenant company + admin user."""
    # Check for duplicate email
    existing = await db.execute(select(User).where(User.email == data.admin_email))
    if existing.scalar_one_or_none():
        raise BadRequestError(f"Email '{data.admin_email}' already in use")

    company = Company(
        name=data.company_name,
        mc_number=data.mc_number,
        dot_number=data.dot_number,
    )
    db.add(company)
    await db.flush()

    admin_user = User(
        company_id=company.id,
        email=data.admin_email,
        hashed_password=hash_password(data.admin_password),
        first_name=data.admin_first_name,
        last_name=data.admin_last_name,
        role=UserRole.company_admin,
    )
    db.add(admin_user)
    await db.flush()
    return company


@router.patch("/companies/{company_id}")
async def toggle_company_status(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Suspend or reactivate a company."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise NotFoundError("Company not found")

    company.is_active = not company.is_active
    await db.flush()
    status = "activated" if company.is_active else "suspended"
    logger.info(
        "Company %s has been %s", company_id, status,
        extra={"company_id": str(company_id), "action": f"company_{status}"},
    )
    return {"message": f"Company '{company.name}' has been {status}", "is_active": company.is_active}


@router.post("/impersonate/{company_id}", response_model=ImpersonateResponse)
async def impersonate_company(
    company_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a short-lived (30 min) access token scoped to a target company.

    The impersonation token has the Super Admin's user_id but the target company_id.
    """
    # Verify company exists
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise NotFoundError("Company not found")

    if not company.is_active:
        raise BadRequestError("Cannot impersonate a suspended company")

    # Log impersonation for audit trail
    logger.warning(
        "Super Admin %s impersonating company %s (%s)",
        user_id, company_id, company.name,
        extra={
            "admin_id": user_id,
            "target_company_id": str(company_id),
            "action": "impersonate",
        },
    )

    # Create a short-lived token with target company_id
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": user_id,
        "company_id": str(company_id),
        "role": "super_admin",
        "exp": expire,
        "type": "access",
        "impersonating": True,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    return ImpersonateResponse(
        access_token=token,
        message=f"Impersonating company '{company.name}' — token valid for 30 minutes",
    )
