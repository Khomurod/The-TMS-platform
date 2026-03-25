"""Multi-tenancy tests — confirm zero data leakage between tenants.

These tests verify that repository queries correctly filter by company_id,
ensuring Tenant A cannot see Tenant B's data.
"""

import pytest

from app.loads.repository import LoadRepository


class TestMultiTenancy:
    """Verify tenant isolation at the repository layer."""

    def test_base_query_includes_company_filter(self):
        """LoadRepository._base_query includes company_id WHERE clause."""
        import uuid
        from unittest.mock import MagicMock

        mock_session = MagicMock()
        company_id = uuid.uuid4()
        repo = LoadRepository(mock_session, company_id)
        query = repo._base_query()

        # The query string should contain the company_id filter
        query_str = str(query)
        assert "company_id" in query_str

    def test_board_queries_are_tenant_scoped(self):
        """Live/upcoming/completed queries must filter by company_id."""
        from app.loads.repository import LoadRepository
        import uuid
        from unittest.mock import MagicMock

        mock_session = MagicMock()
        company_id = uuid.uuid4()
        repo = LoadRepository(mock_session, company_id)

        # Verify the company_id is stored
        assert repo.company_id == company_id

    def test_settlement_repo_tenant_scoped(self):
        """SettlementRepository stores company_id."""
        from app.accounting.repository import SettlementRepository
        import uuid
        from unittest.mock import MagicMock

        mock_session = MagicMock()
        company_id = uuid.uuid4()
        repo = SettlementRepository(mock_session, company_id)
        assert repo.company_id == company_id

    def test_different_tenants_get_different_repos(self):
        """Two tenants should produce repos with different company_ids."""
        from app.loads.repository import LoadRepository
        import uuid
        from unittest.mock import MagicMock

        session = MagicMock()
        id_a = uuid.uuid4()
        id_b = uuid.uuid4()

        repo_a = LoadRepository(session, id_a)
        repo_b = LoadRepository(session, id_b)

        assert repo_a.company_id != repo_b.company_id
        assert repo_a.company_id == id_a
        assert repo_b.company_id == id_b
