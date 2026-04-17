"""Safehaul TMS — FastAPI Application Entry Point."""

import logging
import uuid

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.middleware import TenantMiddleware
from app.core.security_middleware import (
    RateLimitMiddleware,
    HTTPSRedirectMiddleware,
)

# ── Domain Routers ───────────────────────────────────────────────
from app.auth.router import router as auth_router
# NOTE: User management endpoints are in settings_mod, not users/ (dead module removed)
from app.fleet.router import router as fleet_router
from app.drivers.router import router as drivers_router
from app.loads.router import router as loads_router
from app.accounting.router import router as accounting_router
from app.brokers.router import router as brokers_router
from app.settings_mod.router import router as settings_router
from app.auth.admin_router import router as admin_router
from app.dashboard.router import router as dashboard_router
from app.documents.router import router as documents_router

# ── Disable Swagger/OpenAPI docs in production ───────────────────

app = FastAPI(
    title="Safehaul TMS API",
    description="Next-Gen Transportation Management System — API Server",
    version="0.1.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# ── Middleware Stack ─────────────────────────────────────────────
# NOTE: Starlette processes middleware in LIFO (last-added-runs-first)
# order. CORSMiddleware MUST be added LAST so it wraps everything,
# ensuring CORS headers appear on ALL responses — including 401s
# from TenantMiddleware and 429s from RateLimitMiddleware.

# 3. Tenant runs innermost — extracts company_id from JWT
app.add_middleware(TenantMiddleware)

# 2. Security — rate limiting + HTTPS redirect
app.add_middleware(RateLimitMiddleware)
if settings.is_production:
    app.add_middleware(HTTPSRedirectMiddleware)

# 1. CORS runs outermost — wraps ALL responses with CORS headers
origins = settings.effective_cors_origins
if "https://kinetic-frontend-1065403267999.us-central1.run.app" not in origins:
    origins = origins + ["https://kinetic-frontend-1065403267999.us-central1.run.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register All Domain Routers under /api/v1/ ──────────────────
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_V1_PREFIX)
# users_router removed — was an empty stub, user management lives in settings_router
app.include_router(fleet_router, prefix=API_V1_PREFIX)
app.include_router(drivers_router, prefix=API_V1_PREFIX)
app.include_router(loads_router, prefix=API_V1_PREFIX)
app.include_router(accounting_router, prefix=API_V1_PREFIX)
app.include_router(brokers_router, prefix=API_V1_PREFIX)
app.include_router(settings_router, prefix=API_V1_PREFIX)
app.include_router(admin_router, prefix=API_V1_PREFIX)
app.include_router(dashboard_router, prefix=API_V1_PREFIX)
app.include_router(documents_router, prefix=API_V1_PREFIX)


# ── Health Check ─────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint — verifies database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "Safehaul TMS API", "version": "0.1.0", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "service": "Safehaul TMS API", "database": "disconnected"},
        )


# ── Structured Exception Handler ─────────────────────────────

logger = logging.getLogger("safehaul")
logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler — logs the error with a correlation ID."""
    request_id = str(uuid.uuid4())[:8]
    logger.error(
        "[%s] Unhandled %s on %s %s: %s",
        request_id,
        type(exc).__name__,
        request.method,
        request.url.path,
        str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "request_id": request_id,
        },
    )


# ── Root ─────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    """Root endpoint."""
    return {"message": "Safehaul TMS API", "version": "0.1.0"}
