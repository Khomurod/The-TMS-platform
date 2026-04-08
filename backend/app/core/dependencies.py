"""FastAPI dependency injection helpers.

Provides:
- DBSession type alias
- JWT Bearer token extraction
- Current user retrieval
- Role-based access guards
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from jwt.exceptions import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token, is_token_blacklisted_db

# ── Type Alias ───────────────────────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_db)]


# ── JWT Bearer Extraction ────────────────────────────────────────

async def get_current_user_id(
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Extract and validate user_id from the Authorization: Bearer <token> header.

    Performs full revocation check against the DB blacklist — authoritative
    across all Gunicorn workers (fixes in-memory-only bypass).

    Returns user_id as string.
    Raises 401 if token is missing, invalid, expired, or revoked.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
    except InvalidTokenError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type — expected access token")

    jti = payload.get("jti")
    if jti and await is_token_blacklisted_db(jti, db):
        raise UnauthorizedError("Token has been revoked")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    return user_id


async def get_current_company_id(authorization: str = Header(default=None)) -> UUID | None:
    """Extract company_id from the JWT token.

    Returns UUID or None (for Super Admin).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
    except InvalidTokenError:
        raise UnauthorizedError("Invalid or expired token")

    company_id = payload.get("company_id")
    return UUID(company_id) if company_id else None


async def get_current_role(authorization: str = Header(default=None)) -> str:
    """Extract role from the JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
    except InvalidTokenError:
        raise UnauthorizedError("Invalid or expired token")

    role = payload.get("role")
    if not role:
        raise UnauthorizedError("Invalid token payload — missing role")

    return role


# ── Role-Based Access Guards ─────────────────────────────────────

def require_roles(*allowed_roles: str):
    """FastAPI dependency factory — restricts access to specific roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles("super_admin", "company_admin"))])
    """
    async def role_checker(role: str = Depends(get_current_role)):
        if role not in allowed_roles:
            raise ForbiddenError(f"Role '{role}' is not authorized for this action")
        return role
    return role_checker
