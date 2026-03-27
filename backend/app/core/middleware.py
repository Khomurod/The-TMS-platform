"""Multi-tenancy middleware — extracts company_id from JWT and injects into request context.

The Golden Rule: It must be programmatically impossible for Company A to see Company B's data.

NOTE: Uses pure ASGI middleware (not BaseHTTPMiddleware) to avoid streaming deadlocks
when combined with yield-based FastAPI dependencies like get_db().
"""

import contextvars
from uuid import UUID

from jwt.exceptions import InvalidTokenError
from starlette.types import ASGIApp, Receive, Scope, Send

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


class TenantMiddleware:
    """Extracts company_id from JWT and sets it in contextvars.

    Every repository query MUST filter by this company_id.
    Pure ASGI implementation to avoid BaseHTTPMiddleware deadlocks.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "GET")

        # Skip CORS preflight (OPTIONS never carries Bearer token)
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Skip auth-exempt paths
        if path in EXEMPT_PATHS:
            await self.app(scope, receive, send)
            return

        # Extract Bearer token from headers
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode("utf-8", errors="ignore")

        if not auth_header.startswith("Bearer "):
            # Return 401 JSON response
            await self._send_json(send, 401, {"detail": "Missing or invalid Authorization header"})
            return

        token = auth_header.replace("Bearer ", "")
        try:
            payload = decode_token(token)
        except (InvalidTokenError, Exception):
            await self._send_json(send, 401, {"detail": "Invalid or expired token"})
            return

        # Validate token type
        if payload.get("type") != "access":
            await self._send_json(send, 401, {"detail": "Invalid token type"})
            return

        # Set context vars for the duration of this request
        user_id = payload.get("sub")
        company_id = payload.get("company_id")
        role = payload.get("role")

        user_id_token = current_user_id.set(UUID(user_id) if user_id else None)
        company_id_token = current_company_id.set(UUID(company_id) if company_id else None)
        role_token = current_user_role.set(role)

        try:
            await self.app(scope, receive, send)
        finally:
            # Reset context vars after request completes
            current_user_id.reset(user_id_token)
            current_company_id.reset(company_id_token)
            current_user_role.reset(role_token)

    async def _send_json(self, send: Send, status: int, body: dict):
        """Send a JSON error response directly via ASGI."""
        import json
        body_bytes = json.dumps(body).encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": status,
            "headers": [
                [b"content-type", b"application/json"],
                [b"content-length", str(len(body_bytes)).encode()],
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body_bytes,
        })
