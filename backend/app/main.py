"""Kinetic TMS — FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.middleware import TenantMiddleware
from app.core.security_middleware import (
    RateLimitMiddleware,
    HTTPSRedirectMiddleware,
)

# ── Domain Routers ───────────────────────────────────────────────
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.fleet.router import router as fleet_router
from app.drivers.router import router as drivers_router
from app.loads.router import router as loads_router
from app.accounting.router import router as accounting_router
from app.brokers.router import router as brokers_router
from app.settings_mod.router import router as settings_router
from app.auth.admin_router import router as admin_router
from app.dashboard.router import router as dashboard_router

app = FastAPI(
    title="Kinetic TMS API",
    description="Next-Gen Transportation Management System — API Server",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# ── Security Middleware (pure ASGI) ──────────────────────────────
app.add_middleware(RateLimitMiddleware)
if settings.environment == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# ── Tenant Isolation Middleware ──────────────────────────────────
app.add_middleware(TenantMiddleware)

# ── Register All Domain Routers under /api/v1/ ──────────────────
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(users_router, prefix=API_V1_PREFIX)
app.include_router(fleet_router, prefix=API_V1_PREFIX)
app.include_router(drivers_router, prefix=API_V1_PREFIX)
app.include_router(loads_router, prefix=API_V1_PREFIX)
app.include_router(accounting_router, prefix=API_V1_PREFIX)
app.include_router(brokers_router, prefix=API_V1_PREFIX)
app.include_router(settings_router, prefix=API_V1_PREFIX)
app.include_router(admin_router, prefix=API_V1_PREFIX)
app.include_router(dashboard_router, prefix=API_V1_PREFIX)


# ── Health Check ─────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Kinetic TMS API", "version": "0.1.0"}


# ── Root Redirect ────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    """Root endpoint — redirects to docs."""
    return {"message": "Kinetic TMS API", "docs": "/docs"}
