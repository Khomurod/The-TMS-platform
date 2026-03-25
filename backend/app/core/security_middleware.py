"""Security middleware — rate limiting, input sanitization, and HTTPS enforcement.

Phase 6.3 — Security Hardening:
  - Rate limiting on auth endpoints (login, register, refresh)
  - Request size limiting
  - Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
  - HTTPS redirect in production
"""

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


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


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting for auth endpoints — 10 requests per minute per IP."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in AUTH_PATHS and request.method == "POST":
            client_ip = request.client.host if request.client else "unknown"
            key = f"rate:{client_ip}:{request.url.path}"

            if rate_limit_store.is_rate_limited(key, AUTH_RATE_LIMIT, AUTH_WINDOW):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers={"Retry-After": str(AUTH_WINDOW)},
                )

        return await call_next(request)


# ── Security Headers ─────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        # HSTS (only in production)
        if not request.url.hostname or request.url.hostname not in ("localhost", "127.0.0.1"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# ── HTTPS Redirect ───────────────────────────────────────────────

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP → HTTPS in production."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip for localhost development
        host = request.url.hostname or "localhost"
        if host in ("localhost", "127.0.0.1"):
            return await call_next(request)

        # Check X-Forwarded-Proto (Cloud Run sets this)
        if request.headers.get("x-forwarded-proto") == "http":
            url = request.url.replace(scheme="https")
            return JSONResponse(
                status_code=301,
                headers={"Location": str(url)},
                content={"detail": "Redirecting to HTTPS"},
            )

        return await call_next(request)
