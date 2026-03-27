"""Security middleware — rate limiting and HTTPS enforcement.

Phase 6.3 — Security Hardening:
  - Rate limiting on auth endpoints (login, register, refresh)
  - HTTPS redirect in production

NOTE: Uses pure ASGI middleware (not BaseHTTPMiddleware) to avoid streaming deadlocks
when combined with yield-based FastAPI dependencies like get_db().
"""

import json
import time
from collections import defaultdict

from starlette.types import ASGIApp, Receive, Scope, Send


# ── Rate Limiter ─────────────────────────────────────────────────

class RateLimitStore:
    """In-memory rate limit store. Replace with Redis in production."""

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds

        # Clean expired entries
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

        if len(self._requests[key]) >= max_requests:
            return True

        self._requests[key].append(now)
        return False


rate_limit_store = RateLimitStore()

# Auth endpoints to rate limit
AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh"}
AUTH_RATE_LIMIT = 10  # max requests per window
AUTH_WINDOW = 60  # seconds


class RateLimitMiddleware:
    """Rate limiting for auth endpoints — 10 requests per minute per IP.
    
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

        if path in AUTH_PATHS and method == "POST":
            # Get client IP from scope
            client = scope.get("client")
            client_ip = client[0] if client else "unknown"
            key = f"rate:{client_ip}:{path}"

            if rate_limit_store.is_rate_limited(key, AUTH_RATE_LIMIT, AUTH_WINDOW):
                body = json.dumps({"detail": "Too many requests. Please try again later."}).encode()
                await send({
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"content-length", str(len(body)).encode()],
                        [b"retry-after", str(AUTH_WINDOW).encode()],
                    ],
                })
                await send({"type": "http.response.body", "body": body})
                return

        await self.app(scope, receive, send)


# ── HTTPS Redirect ───────────────────────────────────────────────

class HTTPSRedirectMiddleware:
    """Redirect HTTP → HTTPS in production. Pure ASGI implementation."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Skip for localhost development
        headers = dict(scope.get("headers", []))
        host = headers.get(b"host", b"localhost").decode()

        if host.startswith("localhost") or host.startswith("127.0.0.1"):
            await self.app(scope, receive, send)
            return

        # Check X-Forwarded-Proto (Cloud Run sets this)
        proto = headers.get(b"x-forwarded-proto", b"https").decode()
        if proto == "http":
            # Build HTTPS URL
            path = scope.get("path", "/")
            qs = scope.get("query_string", b"").decode()
            url = f"https://{host}{path}"
            if qs:
                url += f"?{qs}"

            body = json.dumps({"detail": "Redirecting to HTTPS"}).encode()
            await send({
                "type": "http.response.start",
                "status": 301,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"location", url.encode()],
                    [b"content-length", str(len(body)).encode()],
                ],
            })
            await send({"type": "http.response.body", "body": body})
            return

        await self.app(scope, receive, send)
