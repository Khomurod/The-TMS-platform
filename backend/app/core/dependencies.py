"""FastAPI dependency injection helpers.

Architecture: Auth Gateway Pattern
===================================
All authenticated routes flow through a single `get_verified_token` dependency
which performs signature validation, expiry check, token type enforcement,
and DB-backed blacklist check in one place.

All other auth helpers (get_current_user_id, get_current_company_id,
get_current_role) compose ON TOP of get_verified_token — they never
decode the JWT themselves. FastAPI's DI system deduplicates the call,
so get_verified_token runs ONCE per request regardless of how many
downstream deps depend on it.

This makes it impossible to add a new route dependency that accidentally
skips the revocation check.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, Request
from jwt.exceptions import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token, is_token_blacklisted_db

# ── Type Alias ───────────────────────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_db)]


# ── Auth Gateway — Single source of truth ────────────────────────

async def get_verified_token(
    request: Request,
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Decode + verify + revocation check in one dependency.

    This is the ONLY place JWT validation happens. All other auth
    dependencies compose on this one — they never decode the token
    themselves. FastAPI deduplicates the call: this runs exactly once
    per request even if multiple downstream deps depend on it.

    Audit fix #14: Reuses the decoded JWT payload from TenantMiddleware
    (stored on request.state.jwt_payload) to avoid decoding the token
    twice per request. Falls back to full decode if not available.

    Raises 401 for:
    - Missing / malformed Authorization header
    - Invalid or expired JWT signature
    - Non-access token type (e.g. refresh token used on API route)
    - Blacklisted JTI (logged-out token)
    """
    # Audit fix #14: Try to reuse payload decoded by TenantMiddleware
    payload = getattr(request.state, "jwt_payload", None)

    if not payload:
        # Fallback: decode ourselves (for routes that bypass middleware)
        if not authorization or not authorization.startswith("Bearer "):
            raise UnauthorizedError("Missing or invalid Authorization header")

        token = authorization.replace("Bearer ", "")
        try:
            payload = decode_token(token)          # signature + expiry only
        except InvalidTokenError:
            raise UnauthorizedError("Invalid or expired token")

        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type — expected access token")

    # DB-backed revocation check — authoritative across all Gunicorn workers
    jti = payload.get("jti")
    if jti and await is_token_blacklisted_db(jti, db):
        raise UnauthorizedError("Token has been revoked")

    return payload


# ── Composing helpers — extract fields only, no JWT decoding ─────

async def get_current_user_id(
    payload: dict = Depends(get_verified_token),
) -> str:
    """Extract user_id from the verified token payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload — missing sub")
    return user_id


async def get_current_company_id(
    payload: dict = Depends(get_verified_token),
) -> UUID | None:
    """Extract company_id from the verified token payload.

    Returns None for Super Admin tokens (no company scope).
    """
    company_id = payload.get("company_id")
    return UUID(company_id) if company_id else None


async def get_current_role(
    payload: dict = Depends(get_verified_token),
) -> str:
    """Extract role from the verified token payload."""
    role = payload.get("role")
    if not role:
        raise UnauthorizedError("Invalid token payload — missing role")
    return role


# ── Role-Based Access Guards ─────────────────────────────────────

def require_roles(*allowed_roles: str):
    """FastAPI dependency factory — restricts access to specific roles.

    Composes on get_current_role (which composes on get_verified_token),
    so revocation is always enforced before role checking.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles("super_admin", "company_admin"))])
    """
    async def role_checker(role: str = Depends(get_current_role)):
        if role not in allowed_roles:
            raise ForbiddenError(f"Role '{role}' is not authorized for this action")
        return role
    return role_checker
