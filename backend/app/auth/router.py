"""Auth router — registration, login, token refresh, logout, profile."""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.exceptions import UnauthorizedError
from app.core.security import blacklist_token, decode_token
from app.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from app.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Onboarding: Create a new company + admin user.

    Returns user profile + JWT token pair.
    """
    service = AuthService(db)
    user, company, tokens = await service.register(
        company_name=data.company_name,
        mc_number=data.mc_number,
        dot_number=data.dot_number,
        email=data.email,
        password=data.password,
        first_name=data.first_name,
        last_name=data.last_name,
    )
    return RegisterResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role.value,
            company_id=company.id,
            company_name=company.name,
        ),
        tokens=TokenResponse(**tokens),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password. Returns JWT token pair."""
    service = AuthService(db)
    user, tokens = await service.login(email=data.email, password=data.password)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an expired access token using a valid refresh token."""
    service = AuthService(db)
    tokens = await service.refresh(refresh_token=data.refresh_token)
    return TokenResponse(**tokens)


@router.post("/logout", status_code=200)
async def logout(
    user_id: str = Depends(get_current_user_id),
    authorization: str = Header(default=None),
):
    """Logout — blacklists the current access token JTI.

    The client should also discard tokens locally.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                blacklist_token(jti)
        except Exception:
            pass  # Token may already be invalid — still return success
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    from uuid import UUID
    service = AuthService(db)
    user = await service.get_current_user(UUID(user_id))

    # Get company name if user has a company
    company_name = None
    if user.company_id:
        from app.models.company import Company
        from sqlalchemy import select
        result = await db.execute(select(Company.name).where(Company.id == user.company_id))
        company_name = result.scalar_one_or_none()

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role.value,
        company_id=user.company_id,
        company_name=company_name,
    )
