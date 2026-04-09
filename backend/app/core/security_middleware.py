"""Security middleware — rate limiting and HTTPS enforcement.

Phase 6.3 — Security Hardening:
  - Rate limiting on auth endpoints (login, register, refresh)
  - HTTPS redirect in production

NOTE: Uses pure ASGI middleware (not BaseHTTPMiddleware) to avoid streaming deadlocks
when combined with yield-based FastAPI dependencies like get_db().
"""

import json
import logging
import os
import time
from collections import defaultdict

from starlette.types import ASGIApp, Receive, Scope, Send

logger = logging.getLogger(__name__)


# ── Rate Limiter ─────────────────────────────────────────────────

class RateLimitStore:
    """Rate limit store with Redis support and in-memory fallback.

    Uses Redis sorted sets (sliding window) when REDIS_URL is configured.
    Falls back to per-worker in-memory storage for local development.

    Audit fix #12: Centralised rate limiting across all workers/instances.
    """

    MAX_KEYS = 10_000  # Guard against OOM (in-memory only)

    def __init__(self):
        self._redis = None
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._last_cleanup: float = time.time()

        # Attempt Redis connection if configured
        redis_url = os.environ.get("REDIS_URL")
        if redis_url:
            try:
                import redis
                self._redis = redis.from_url(redis_url, decode_responses=True)
                self._redis.ping()
                logger.info("RateLimitStore: Using Redis at %s", redis_url.split("@")[-1])
            except Exception as e:
                logger.warning("RateLimitStore: Redis unavailable (%s), using in-memory fallback", e)
                self._redis = None
        else:
            logger.info("RateLimitStore: No REDIS_URL configured, using in-memory fallback")

    def _periodic_cleanup(self, window_seconds: int) -> None:
        """Remove all expired entries across all keys (runs every 5 minutes)."""
        now = time.time()
        if now - self._last_cleanup < 300:
            return  # Only run every 5 min

        cutoff = now - window_seconds
        stale_keys = []
        for key, timestamps in self._requests.items():
            self._requests[key] = [t for t in timestamps if t > cutoff]
            if not self._requests[key]:
                stale_keys.append(key)
        for key in stale_keys:
            del self._requests[key]
        self._last_cleanup = now

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if a key has exceeded the rate limit.

        Returns True if the request should be blocked.
        """
        if self._redis:
            return self._is_rate_limited_redis(key, max_requests, window_seconds)
        return self._is_rate_limited_memory(key, max_requests, window_seconds)

    def _is_rate_limited_redis(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Redis sliding window using sorted sets."""
        try:
            now = time.time()
            pipe = self._redis.pipeline()
            pipe.zremrangebyscore(key, 0, now - window_seconds)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            current_count = results[1]
            return current_count >= max_requests
        except Exception as e:
            logger.warning("RateLimitStore: Redis error (%s), falling back to in-memory", e)
            return self._is_rate_limited_memory(key, max_requests, window_seconds)

    def _is_rate_limited_memory(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """In-memory sliding window (per-worker only)."""
        self._periodic_cleanup(window_seconds)

        now = time.time()
        cutoff = now - window_seconds

        # Clean expired entries for this key
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

        if len(self._requests[key]) >= max_requests:
            return True

        # Guard against memory growth
        if len(self._requests) > self.MAX_KEYS:
            return False  # Fail open rather than OOM

        self._requests[key].append(now)
        return False

    def reset_for_testing(self) -> None:
        """Clear all rate limit state. Call from test fixtures between tests."""
        self._requests.clear()
        if self._redis:
            try:
                # Only flush rate: keys, not the entire Redis DB
                for key in self._redis.scan_iter("rate:*"):
                    self._redis.delete(key)
            except Exception:
                pass


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
