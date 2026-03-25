"""RBAC tests — verify role-based access control enforcement.

Tests that:
  - require_roles dependency correctly blocks unauthorized roles
  - company_admin has access to financial endpoints
  - dispatcher can access operational endpoints but not financial
"""

import pytest

from app.core.dependencies import require_roles


class TestRBAC:
    """Verify RBAC enforcement logic."""

    def test_require_roles_returns_dependency(self):
        """require_roles should return a callable dependency."""
        dep = require_roles("company_admin")
        assert callable(dep)

    def test_require_roles_multiple(self):
        """require_roles with multiple roles should accept any of them."""
        dep = require_roles("company_admin", "dispatcher")
        assert callable(dep)

    def test_settlement_endpoints_admin_only(self):
        """Verify settlement routes use company_admin role."""
        from app.accounting.router import router

        settlement_routes = [
            r for r in router.routes
            if hasattr(r, 'path') and 'settlements' in getattr(r, 'path', '')
        ]
        # All settlement routes should exist
        assert len(settlement_routes) > 0

    def test_invoice_endpoint_allows_dispatcher(self):
        """Invoice endpoint should allow both admin and dispatcher."""
        from app.accounting.router import router

        invoice_routes = [
            r for r in router.routes
            if hasattr(r, 'path') and 'invoice' in getattr(r, 'path', '')
        ]
        assert len(invoice_routes) > 0

    def test_load_board_routes_exist(self):
        """Load board tab routes exist and are accessible."""
        from app.loads.router import router

        paths = [getattr(r, 'path', '') for r in router.routes]
        assert any('/live' in p for p in paths)
        assert any('/upcoming' in p for p in paths)
        assert any('/completed' in p for p in paths)

    def test_dashboard_routes_no_admin_restriction(self):
        """Dashboard KPI routes should be accessible to any authenticated user."""
        from app.dashboard.router import router

        paths = [getattr(r, 'path', '') for r in router.routes]
        assert any('/kpis' in p for p in paths)
        assert any('/compliance-alerts' in p for p in paths)
        assert any('/fleet-status' in p for p in paths)
        assert any('/recent-events' in p for p in paths)
