"""Tests for the two HIGH-severity bug fixes.

1. Trailer invalid type returns 422, not 500
2. Settlement generate path does not call pg_advisory_xact_lock on non-Postgres
3. Duplicate settlement prevention still enforced
"""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.fleet.schemas import TrailerCreate, TrailerUpdate
from app.models.fleet import TrailerType


# ═══════════════════════════════════════════════════════════════════
#   Bug 1: Trailer type validation — schema-level 422 enforcement
# ═══════════════════════════════════════════════════════════════════

class TestTrailerTypeValidation:
    """Ensure invalid trailer_type values are rejected at the schema level (422)."""

    def test_valid_trailer_types_accepted(self):
        """All 7 valid trailer types should pass validation."""
        valid_types = ["dry_van", "reefer", "flatbed", "step_deck", "tanker", "lowboy", "other"]
        for t in valid_types:
            schema = TrailerCreate(unit_number="TRL-001", trailer_type=t)
            assert schema.trailer_type.value == t, f"Type '{t}' should be accepted"

    def test_invalid_trailer_type_rejected(self):
        """Invalid trailer_type should raise ValidationError (triggers 422 in FastAPI)."""
        with pytest.raises(ValidationError) as exc_info:
            TrailerCreate(unit_number="TRL-001", trailer_type="bogus_type")
        errors = exc_info.value.errors()
        assert any("trailer_type" in str(e.get("loc", "")) for e in errors)

    def test_invalid_trailer_type_update_rejected(self):
        """Invalid trailer_type in update schema should also raise ValidationError."""
        with pytest.raises(ValidationError):
            TrailerUpdate(trailer_type="nonexistent")

    def test_none_trailer_type_accepted(self):
        """None/null trailer_type should be accepted (field is optional)."""
        schema = TrailerCreate(unit_number="TRL-001", trailer_type=None)
        assert schema.trailer_type is None

    def test_missing_trailer_type_accepted(self):
        """Omitting trailer_type entirely should work (defaults to None)."""
        schema = TrailerCreate(unit_number="TRL-001")
        assert schema.trailer_type is None

    def test_lowboy_in_enum(self):
        """Lowboy must exist in TrailerType enum (was previously missing)."""
        assert hasattr(TrailerType, "lowboy")
        assert TrailerType.lowboy.value == "lowboy"

    def test_other_in_enum(self):
        """Other must exist in TrailerType enum (was previously missing)."""
        assert hasattr(TrailerType, "other")
        assert TrailerType.other.value == "other"


# ═══════════════════════════════════════════════════════════════════
#   Bug 2: Advisory lock dialect guard in settlement generation
# ═══════════════════════════════════════════════════════════════════

class TestSettlementAdvisoryLockGuard:
    """Ensure advisory lock is dialect-aware and does not crash on non-Postgres."""

    @pytest.mark.asyncio
    async def test_advisory_lock_skipped_on_sqlite(self):
        """_advisory_lock should NOT call pg_advisory_xact_lock on SQLite."""
        from app.accounting.repository import SettlementRepository

        mock_session = AsyncMock()
        # Simulate SQLite dialect
        mock_bind = MagicMock()
        mock_bind.dialect.name = "sqlite"
        mock_session.bind = mock_bind

        repo = SettlementRepository(mock_session, uuid4())
        await repo._advisory_lock(12345)

        # Should NOT have called execute with pg_advisory_xact_lock
        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_advisory_lock_called_on_postgres(self):
        """_advisory_lock SHOULD call pg_advisory_xact_lock on PostgreSQL."""
        from app.accounting.repository import SettlementRepository

        mock_session = AsyncMock()
        mock_bind = MagicMock()
        mock_bind.dialect.name = "postgresql"
        mock_session.bind = mock_bind

        repo = SettlementRepository(mock_session, uuid4())
        await repo._advisory_lock(12345)

        # Should have called execute exactly once with advisory lock
        mock_session.execute.assert_called_once()
        # Extract the TextClause object and check its .text attribute
        text_clause = mock_session.execute.call_args[0][0]
        assert "pg_advisory_xact_lock" in text_clause.text

    @pytest.mark.asyncio
    async def test_advisory_lock_skipped_on_unknown_dialect(self):
        """_advisory_lock should skip gracefully when dialect is unknown."""
        from app.accounting.repository import SettlementRepository

        mock_session = AsyncMock()
        mock_session.bind = None  # No bind → unknown dialect

        repo = SettlementRepository(mock_session, uuid4())
        await repo._advisory_lock(12345)

        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_advisory_lock_exception_in_dialect_check(self):
        """_advisory_lock should not crash if dialect check raises an exception."""
        from app.accounting.repository import SettlementRepository

        mock_session = AsyncMock()
        # Make bind access raise
        type(mock_session).bind = property(lambda self: (_ for _ in ()).throw(RuntimeError("boom")))

        repo = SettlementRepository(mock_session, uuid4())
        # Should not raise — falls back to "unknown" dialect
        await repo._advisory_lock(12345)


class TestDuplicateSettlementPrevention:
    """Ensure the duplicate settlement guard still works regardless of dialect."""

    @pytest.mark.asyncio
    async def test_duplicate_settlement_check_query_exists(self):
        """The generate_settlement method must check for existing settlements
        before creating a new one, providing duplicate protection even without
        advisory locks on non-Postgres."""
        import inspect
        from app.accounting.service import AccountingService

        source = inspect.getsource(AccountingService.generate_settlement)
        # Must contain the duplicate check query
        assert "existing_settlement" in source
        assert "scalar_one_or_none" in source
        # Must raise 409 on duplicate
        assert "409" in source
        assert "Settlement already exists" in source
