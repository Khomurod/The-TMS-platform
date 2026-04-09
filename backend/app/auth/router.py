"""Auth router — registration, login, token refresh, logout, profile."""

from fastapi import APIRouter, Cookie, Depends, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.exceptions import UnauthorizedError
from app.core.security import blacklist_token_db, decode_token
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

# ── Cookie configuration ─────────────────────────────────────────
ACCESS_TOKEN_MAX_AGE = 15 * 60          # 15 minutes
REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def _set_auth_cookies(response: Response, tokens: dict) -> None:
    """Set httpOnly, Secure, SameSite auth cookies on a response.

    Audit fix #7: Moves tokens from localStorage (XSS-vulnerable)
    to httpOnly cookies (invisible to JavaScript).
    """
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_MAX_AGE,
        path="/api",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=REFRESH_TOKEN_MAX_AGE,
        path="/api/v1/auth",  # Only sent to auth endpoints
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies on logout."""
    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(data: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Onboarding: Create a new company + admin user.

    Returns user profile + JWT token pair.
    Also sets httpOnly auth cookies (audit fix #7).
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
    _set_auth_cookies(response, tokens)
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
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password. Returns JWT token pair.

    Also sets httpOnly auth cookies (audit fix #7).
    """
    service = AuthService(db)
    user, tokens = await service.login(email=data.email, password=data.password)
    _set_auth_cookies(response, tokens)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    data: RefreshRequest = None,
    refresh_token_cookie: str = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    """Refresh an expired access token using a valid refresh token.

    Accepts refresh token from:
      1. Request body (data.refresh_token) — for Bearer-based clients
      2. httpOnly cookie (refresh_token) — for cookie-based clients (audit fix #7)
    """
    token = None
    if data and data.refresh_token:
        token = data.refresh_token
    elif refresh_token_cookie:
        token = refresh_token_cookie

    if not token:
        raise UnauthorizedError("No refresh token provided")

    service = AuthService(db)
    tokens = await service.refresh(refresh_token=token)
    _set_auth_cookies(response, tokens)
    return TokenResponse(**tokens)


@router.post("/logout", status_code=200)
async def logout(
    response: Response,
    user_id: str = Depends(get_current_user_id),
    authorization: str = Header(default=None),
    data: RefreshRequest = None,
    refresh_token_cookie: str = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    """Logout — blacklists both access and refresh token JTIs in DB.

    This ensures neither the access token nor the refresh token can be
    reused after logout, even across multiple Cloud Run workers.
    Also clears httpOnly auth cookies (audit fix #7).
    """
    # 1. Blacklist the access token (from Authorization header)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                await blacklist_token_db(jti, db)
        except Exception:
            pass  # Token may already be invalid — still return success

    # 2. Blacklist the refresh token (from body or cookie)
    refresh_token_value = None
    if data and data.refresh_token:
        refresh_token_value = data.refresh_token
    elif refresh_token_cookie:
        refresh_token_value = refresh_token_cookie

    if refresh_token_value:
        try:
            payload = decode_token(refresh_token_value)
            jti = payload.get("jti")
            if jti and payload.get("type") == "refresh":
                await blacklist_token_db(jti, db)
        except Exception:
            pass  # Refresh token may already be invalid

    # 3. Clear httpOnly cookies
    _clear_auth_cookies(response)

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
