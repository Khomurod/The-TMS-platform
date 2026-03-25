"""Unit tests for driver pay calculation engine (5.1).

Tests all 5 pay rate types with known acceptance criteria:
  - $0.65 CPM × 920 miles = exactly $598.00
  - 80% of $3,200 base = exactly $2,560.00
"""

from decimal import Decimal

import pytest

from app.accounting.service import AccountingService


class TestPayCalculation:
    """Test _calculate_load_gross with all pay types."""

    def setup_method(self):
        # Service instantiation without DB — only need the sync method
        self.svc = AccountingService.__new__(AccountingService)

    def test_cpm_exact(self):
        """$0.65 CPM × 920 miles = exactly $598.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="cpm",
            pay_rate_value=Decimal("0.65"),
            load_total_miles=Decimal("920"),
            load_base_rate=Decimal("0"),
        )
        assert result == Decimal("598.00"), f"Expected $598.00, got ${result}"

    def test_percentage_exact(self):
        """80% of $3,200 base = exactly $2,560.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="percentage",
            pay_rate_value=Decimal("80"),
            load_total_miles=Decimal("0"),
            load_base_rate=Decimal("3200"),
        )
        assert result == Decimal("2560.00"), f"Expected $2560.00, got ${result}"

    def test_fixed_per_load(self):
        """Fixed $1,500 per load."""
        result = self.svc._calculate_load_gross(
            pay_rate_type="fixed_per_load",
            pay_rate_value=Decimal("1500"),
            load_total_miles=Decimal("800"),
            load_base_rate=Decimal("5000"),
        )
        assert result == Decimal("1500.00")

    def test_hourly(self):
        """$25/hr × 8 hours = $200.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="hourly",
            pay_rate_value=Decimal("25"),
            load_total_miles=Decimal("0"),
            load_base_rate=Decimal("0"),
        )
        assert result == Decimal("200.00")

    def test_salary_weekly(self):
        """$52,000 / 52 weeks = exactly $1,000.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="salary",
            pay_rate_value=Decimal("52000"),
            load_total_miles=Decimal("0"),
            load_base_rate=Decimal("0"),
        )
        assert result == Decimal("1000.00")

    def test_cpm_no_miles(self):
        """CPM with zero miles = $0.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="cpm",
            pay_rate_value=Decimal("0.65"),
            load_total_miles=None,
            load_base_rate=Decimal("3200"),
        )
        assert result == Decimal("0.00")

    def test_percentage_no_base(self):
        """Percentage with zero base = $0.00"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="percentage",
            pay_rate_value=Decimal("80"),
            load_total_miles=Decimal("920"),
            load_base_rate=None,
        )
        assert result == Decimal("0.00")

    def test_no_floating_point_drift(self):
        """Verify no float drift: $0.33 CPM × 1000 miles = $330.00 (not $329.99...)"""
        result = self.svc._calculate_load_gross(
            pay_rate_type="cpm",
            pay_rate_value=Decimal("0.33"),
            load_total_miles=Decimal("1000"),
            load_base_rate=Decimal("0"),
        )
        assert result == Decimal("330.00")

    def test_unknown_pay_type_returns_zero(self):
        """Unknown pay type should return $0."""
        result = self.svc._calculate_load_gross(
            pay_rate_type="unknown_type",
            pay_rate_value=Decimal("100"),
            load_total_miles=Decimal("100"),
            load_base_rate=Decimal("100"),
        )
        assert result == Decimal("0")
