"""Settings service — business logic for company profile & user management."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings_mod.repository import CompanyRepository, UserRepository
from app.settings_mod.schemas import (
    CompanyProfileResponse,
    CompanyProfileUpdate,
    UserCreateRequest,
    UserUpdateRequest,
    UserResponse,
    UserListResponse,
)
from app.core.exceptions import NotFoundError
from app.core.security import hash_password


class SettingsService:
    """Company settings business logic."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.company_repo = CompanyRepository(db, company_id)
        self.user_repo = UserRepository(db, company_id)

    # ── Company Profile ──────────────────────────────────────────

    async def get_company(self) -> CompanyProfileResponse:
        company = await self.company_repo.get()
        if not company:
            raise NotFoundError("Company not found")
        return CompanyProfileResponse.model_validate(company)

    async def update_company(self, data: CompanyProfileUpdate) -> CompanyProfileResponse:
        company = await self.company_repo.get()
        if not company:
            raise NotFoundError("Company not found")
        updated = await self.company_repo.update(
            company, **data.model_dump(exclude_unset=True)
        )
        return CompanyProfileResponse.model_validate(updated)

    # ── User Management ──────────────────────────────────────────

    async def list_users(self) -> UserListResponse:
        items, total = await self.user_repo.list()
        return UserListResponse(
            items=[UserResponse.model_validate(u) for u in items],
            total=total,
        )

    async def create_user(self, data: UserCreateRequest) -> UserResponse:
        # Check for duplicate email
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")

        hashed = hash_password(data.password)
        user = await self.user_repo.create(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            hashed_password=hashed,
            role=data.role,
        )
        return UserResponse.model_validate(user)

    async def update_user(self, user_id: UUID, data: UserUpdateRequest) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        updated = await self.user_repo.update(
            user, **data.model_dump(exclude_unset=True)
        )
        return UserResponse.model_validate(updated)
