"""Unit tests for the Load State Machine (4.2).

Tests all valid and invalid transitions against VALID_TRANSITIONS map.
"""

import pytest

from app.loads.service import VALID_TRANSITIONS


class TestStateMachine:
    """Verify the state machine transition map."""

    def test_planned_can_dispatch(self):
        assert "dispatched" in VALID_TRANSITIONS["planned"]

    def test_planned_can_cancel(self):
        assert "cancelled" in VALID_TRANSITIONS["planned"]

    def test_dispatched_can_arrive_at_pickup(self):
        assert "at_pickup" in VALID_TRANSITIONS["dispatched"]

    def test_dispatched_can_cancel(self):
        assert "cancelled" in VALID_TRANSITIONS["dispatched"]

    def test_at_pickup_can_start_transit(self):
        assert "in_transit" in VALID_TRANSITIONS["at_pickup"]

    def test_at_pickup_cannot_cancel(self):
        assert "cancelled" not in VALID_TRANSITIONS["at_pickup"]

    def test_in_transit_can_deliver(self):
        assert "delivered" in VALID_TRANSITIONS["in_transit"]

    def test_in_transit_can_delay(self):
        assert "delayed" in VALID_TRANSITIONS["in_transit"]

    def test_delayed_can_resume_transit(self):
        assert "in_transit" in VALID_TRANSITIONS["delayed"]

    def test_delayed_can_deliver(self):
        assert "delivered" in VALID_TRANSITIONS["delayed"]

    def test_delivered_can_bill(self):
        assert "billed" in VALID_TRANSITIONS["delivered"]

    def test_delivered_cannot_cancel(self):
        assert "cancelled" not in VALID_TRANSITIONS["delivered"]

    def test_billed_can_pay(self):
        assert "paid" in VALID_TRANSITIONS["billed"]

    def test_paid_is_terminal(self):
        assert "paid" not in VALID_TRANSITIONS  # No transitions from paid

    def test_cancelled_is_terminal(self):
        assert "cancelled" not in VALID_TRANSITIONS  # No transitions from cancelled

    def test_no_backwards_transitions(self):
        """Verify no status can go backwards to planned."""
        for status, targets in VALID_TRANSITIONS.items():
            if status != "planned":
                assert "planned" not in targets, f"{status} should not transition to planned"

    def test_all_statuses_covered(self):
        """Verify the expected statuses are in the map."""
        expected = {"planned", "dispatched", "at_pickup", "in_transit", "delayed", "delivered", "billed"}
        assert set(VALID_TRANSITIONS.keys()) == expected

    def test_no_self_transitions(self):
        """No status should transition to itself."""
        for status, targets in VALID_TRANSITIONS.items():
            assert status not in targets, f"{status} should not transition to itself"
