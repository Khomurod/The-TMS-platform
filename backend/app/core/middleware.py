"""Multi-tenancy middleware — extracts company_id from JWT and injects into request context.

The Golden Rule: It must be programmatically impossible for Company A to see Company B's data.
"""

import contextvars
from uuid import UUID

from jwt.exceptions import InvalidTokenError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.security import decode_token

# ── Request-scoped tenant context ────────────────────────────────
current_company_id: contextvars.ContextVar[UUID | None] = contextvars.ContextVar(
    "current_company_id", default=None
)
current_user_id: contextvars.ContextVar[UUID | None] = contextvars.ContextVar(
    "current_user_id", default=None
)
current_user_role: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "current_user_role", default=None
)


class TenantMiddleware(BaseHTTPMiddleware):
    """Extracts company_id from JWT and sets it in contextvars.

    Every repository query MUST filter by this company_id.
    """

    EXEMPT_PATHS = {
        "/api/v1/health",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Skip auth-exempt paths
        if path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Extract Bearer token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth_header.replace("Bearer ", "")
        try:
            payload = decode_token(token)
        except InvalidTokenError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        # Validate token type
        if payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token type"},
            )

        # Set context vars for the duration of this request
        user_id_str = payload.get("sub")
        company_id_str = payload.get("company_id")
        role = payload.get("role")

        try:
            user_id = UUID(user_id_str) if user_id_str else None
            company_id = UUID(company_id_str) if company_id_str else None
        except (ValueError, AttributeError):
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token — malformed identifiers"},
            )

        user_id_token = current_user_id.set(user_id)
        company_id_token = current_company_id.set(company_id)
        role_token = current_user_role.set(role)

        try:
            response = await call_next(request)
        finally:
            # Reset context vars after request completes
            current_user_id.reset(user_id_token)
            current_company_id.reset(company_id_token)
            current_user_role.reset(role_token)

        return response
