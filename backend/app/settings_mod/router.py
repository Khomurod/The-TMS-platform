"""Settings router — company profile, users & permissions, defaults.

Endpoints:
  GET  /settings/company     — Get company profile
  PUT  /settings/company     — Update company profile
  GET  /settings/users       — List company users
  POST /settings/users       — Create/invite internal user
  PUT  /settings/users/{id}  — Change role / deactivate
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings_mod.schemas import (
    CompanyProfileResponse,
    CompanyProfileUpdate,
    UserCreateRequest,
    UserUpdateRequest,
    UserResponse,
    UserListResponse,
)
from app.settings_mod.service import SettingsService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/settings", tags=["Settings"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> SettingsService:
    return SettingsService(db, company_id)


# ── Company Profile ──────────────────────────────────────────────

@router.get("/company", response_model=CompanyProfileResponse)
async def get_company_profile(
    svc: SettingsService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Get company profile."""
    return await svc.get_company()


@router.put("/company", response_model=CompanyProfileResponse)
async def update_company_profile(
    data: CompanyProfileUpdate,
    svc: SettingsService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Update company profile."""
    return await svc.update_company(data)


# ── User Management ──────────────────────────────────────────────

@router.get("/users", response_model=UserListResponse)
async def list_users(
    svc: SettingsService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """List all company users."""
    return await svc.list_users()


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreateRequest,
    svc: SettingsService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Create/invite an internal user."""
    return await svc.create_user(data)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdateRequest,
    svc: SettingsService = Depends(_get_service),
    _role=Depends(require_roles("company_admin")),
):
    """Change user role or deactivate."""
    return await svc.update_user(user_id, data)
