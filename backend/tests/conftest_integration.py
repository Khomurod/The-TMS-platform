"""Shared pytest fixtures for integration tests.

These fixtures provide:
- An in-memory SQLite database (fresh per test)
- An AsyncClient wired to the FastAPI app with DB override
- Helper functions for registering and logging in test users

NOTE: Uses SQLite for speed. The production ORM (asyncpg/PostgreSQL) is tested
in staging/CI against a real Postgres instance. SQLite covers structural and
auth correctness; dialect-specific behaviour is covered by e2e tests.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)

from app.main import app
from app.core.database import get_db
from app.models.base import Base


# ── Database Fixture ─────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Fresh in-memory SQLite session per test.

    Each test gets a completely isolated database — no state leaks
    between tests. Schema is created from SQLAlchemy models directly.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        future=True,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ── HTTP Client Fixture ──────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """AsyncClient with the DB dependency overridden to the test session.

    All HTTP calls go through the real FastAPI app — auth middleware,
    dependencies, services, and repositories all run as in production.
    Only the DB connection is replaced with the in-memory test session.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# ── Auth Helper Functions ────────────────────────────────────────

async def register_and_login(
    client: AsyncClient,
    *,
    email: str | None = None,
    password: str = "TestPass1234!",
    role: str = "company_admin",
    company_name: str | None = None,
) -> tuple[str, str]:
    """Register a new user+company and return (access_token, company_id).

    Generates unique email/company per call to avoid conflicts.
    """
    uid = str(uuid.uuid4())[:8]
    email = email or f"user_{uid}@test.com"
    company_name = company_name or f"Company {uid}"

    r = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
        "company_name": company_name,
    })
    assert r.status_code in (200, 201), f"Register failed: {r.text}"

    r = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    assert r.status_code == 200, f"Login failed: {r.text}"

    data = r.json()
    return data["access_token"], data.get("company_id", "")


async def auth_headers(token: str) -> dict:
    """Return Authorization header dict for a given token."""
    return {"Authorization": f"Bearer {token}"}
