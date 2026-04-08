"""Integration tests — Token revocation enforcement.

These tests verify the core security invariant: a token that has been
blacklisted (via logout) is rejected on EVERY authenticated route,
not just the one that was patched.

This directly tests the fix for C1 (single-gate auth dependency).
"""

import pytest
from httpx import AsyncClient

from tests.conftest import register_and_login, auth_headers

pytestmark = pytest.mark.asyncio


PROTECTED_ROUTES = [
    ("GET",    "/api/v1/loads/live"),
    ("GET",    "/api/v1/loads/upcoming"),
    ("GET",    "/api/v1/loads/completed"),
    ("GET",    "/api/v1/fleet/trucks"),
    ("GET",    "/api/v1/fleet/trailers"),
    ("GET",    "/api/v1/drivers"),
    ("GET",    "/api/v1/dashboard/kpis"),
    ("GET",    "/api/v1/brokers"),
]


class TestRevocation:
    """Token blacklist is enforced across all protected routes."""

    async def test_valid_token_accesses_load_board(self, client: AsyncClient):
        """Baseline: valid token must be accepted before logout."""
        token, _ = await register_and_login(client)
        r = await client.get("/api/v1/loads/live", headers=await auth_headers(token))
        assert r.status_code == 200, (
            f"Expected 200 with valid token, got {r.status_code}: {r.text}"
        )

    async def test_missing_token_returns_401(self, client: AsyncClient):
        """No Authorization header must return 401 on all routes."""
        r = await client.get("/api/v1/loads/live")
        assert r.status_code == 401

    async def test_malformed_token_returns_401(self, client: AsyncClient):
        """Garbage token must return 401."""
        r = await client.get(
            "/api/v1/loads/live",
            headers={"Authorization": "Bearer this.is.garbage"}
        )
        assert r.status_code == 401

    async def test_revoked_token_rejected_on_every_protected_route(
        self, client: AsyncClient
    ):
        """CRITICAL: after logout, every protected route must return 401.

        This is the integration test for the single-gate auth dependency.
        If any route is using get_current_role or get_current_company_id
        WITHOUT composing through get_verified_token, it will return 200
        here instead of 401, and this test will catch the regression.
        """
        token, _ = await register_and_login(client)
        headers = await auth_headers(token)

        # Confirm token is valid before logout
        r = await client.get("/api/v1/loads/live", headers=headers)
        assert r.status_code == 200, "Token should work before logout"

        # Logout — blacklists the JTI in the DB
        r = await client.post("/api/v1/auth/logout", headers=headers)
        assert r.status_code in (200, 204), f"Logout failed: {r.text}"

        # Every protected route must now return 401
        failed_routes = []
        for method, path in PROTECTED_ROUTES:
            r = await client.request(method, path, headers=headers)
            if r.status_code != 401:
                failed_routes.append(f"{method} {path} → {r.status_code}")

        assert not failed_routes, (
            "SECURITY REGRESSION: revoked token accepted on routes:\n"
            + "\n".join(f"  {r}" for r in failed_routes)
        )

    async def test_refresh_token_rejected_as_access_token(
        self, client: AsyncClient
    ):
        """Refresh token must not be usable as an access token on API routes."""
        r = await client.post("/api/v1/auth/register", json={
            "email": "refresh_test@test.com",
            "password": "TestPass1234!",
            "first_name": "Test",
            "last_name": "User",
            "company_name": "RefreshCo",
        })
        r = await client.post("/api/v1/auth/login", json={
            "email": "refresh_test@test.com",
            "password": "TestPass1234!",
        })
        data = r.json()
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            pytest.skip("Refresh token not returned by login endpoint")

        # Attempt to use refresh token on a resource endpoint
        r = await client.get(
            "/api/v1/loads/live",
            headers={"Authorization": f"Bearer {refresh_token}"}
        )
        assert r.status_code == 401, (
            "Refresh token must NOT be accepted on resource routes"
        )
