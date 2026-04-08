"""Pytest conftest — async test fixtures for Safehaul TMS backend.

All tests use in-memory SQLite (aiosqlite) for full isolation and speed.
Real Postgres is NOT used in tests — asyncpg binds connections to the
current asyncio event loop, which breaks when pytest-asyncio creates a
new loop per test ("Future attached to a different loop").
"""

import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.models.base import Base
from app.core.database import get_db
from app.core.security_middleware import rate_limit_store
from app.main import app


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset in-process rate limit store before every test."""
    rate_limit_store.reset_for_testing()
    yield


# ── Per-test isolated DB ─────────────────────────────────────────
# Fresh in-memory SQLite per test — zero state shared between tests.

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Fresh in-memory SQLite session per test — completely isolated."""
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


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient with the test DB session injected."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Tenant ID constants ──────────────────────────────────────────
COMPANY_A_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
COMPANY_B_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


@pytest_asyncio.fixture
async def company_a_id() -> uuid.UUID:
    return COMPANY_A_ID


@pytest_asyncio.fixture
async def company_b_id() -> uuid.UUID:
    return COMPANY_B_ID


# ── Auth Helpers ─────────────────────────────────────────────────

async def register_and_login(
    client: AsyncClient,
    *,
    email: str | None = None,
    password: str = "TestPass1234!",
    company_name: str | None = None,
) -> tuple[str, str]:
    """Register a new company admin user and return (access_token, company_id)."""
    uid = str(uuid.uuid4())[:8]
    email = email or f"user_{uid}@test.com"
    company_name = company_name or f"TestCo_{uid}"

    r = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
        "company_name": company_name,
    })
    assert r.status_code in (200, 201), f"Register failed: {r.text}"

    r = await client.post("/api/v1/auth/login", json={
        "email": email, "password": password
    })
    assert r.status_code == 200, f"Login failed: {r.text}"

    data = r.json()
    return data["access_token"], data.get("company_id", "")


async def auth_headers(token: str) -> dict:
    """Return Authorization header dict for a given token."""
    return {"Authorization": f"Bearer {token}"}
