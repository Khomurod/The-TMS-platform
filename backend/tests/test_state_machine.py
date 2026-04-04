"""Unit tests for the Load State Machine.

Tests all valid and invalid transitions against LOAD_TRANSITIONS map
which uses the 8-stage LoadStatus enum pipeline.
"""

import pytest

from app.loads.service import LOAD_TRANSITIONS
from app.models.base import LoadStatus


class TestStateMachine:
    """Verify the LOAD_TRANSITIONS state machine map."""

    # ── Valid forward transitions ────────────────────────────────

    def test_offer_can_book(self):
        assert LoadStatus.booked in LOAD_TRANSITIONS[LoadStatus.offer]

    def test_offer_can_cancel(self):
        assert LoadStatus.cancelled in LOAD_TRANSITIONS[LoadStatus.offer]

    def test_booked_can_assign(self):
        assert LoadStatus.assigned in LOAD_TRANSITIONS[LoadStatus.booked]

    def test_booked_can_cancel(self):
        assert LoadStatus.cancelled in LOAD_TRANSITIONS[LoadStatus.booked]

    def test_assigned_can_dispatch(self):
        assert LoadStatus.dispatched in LOAD_TRANSITIONS[LoadStatus.assigned]

    def test_assigned_can_revert_to_booked(self):
        assert LoadStatus.booked in LOAD_TRANSITIONS[LoadStatus.assigned]

    def test_assigned_can_cancel(self):
        assert LoadStatus.cancelled in LOAD_TRANSITIONS[LoadStatus.assigned]

    def test_dispatched_can_start_transit(self):
        assert LoadStatus.in_transit in LOAD_TRANSITIONS[LoadStatus.dispatched]

    def test_dispatched_can_revert_to_assigned(self):
        assert LoadStatus.assigned in LOAD_TRANSITIONS[LoadStatus.dispatched]

    def test_in_transit_can_deliver(self):
        assert LoadStatus.delivered in LOAD_TRANSITIONS[LoadStatus.in_transit]

    def test_delivered_can_invoice(self):
        assert LoadStatus.invoiced in LOAD_TRANSITIONS[LoadStatus.delivered]

    def test_invoiced_can_mark_paid(self):
        assert LoadStatus.paid in LOAD_TRANSITIONS[LoadStatus.invoiced]

    # ── Terminal states ──────────────────────────────────────────

    def test_paid_is_terminal(self):
        assert LOAD_TRANSITIONS[LoadStatus.paid] == []

    def test_cancelled_is_terminal(self):
        assert LOAD_TRANSITIONS[LoadStatus.cancelled] == []

    # ── Invalid transitions ──────────────────────────────────────

    def test_in_transit_cannot_cancel(self):
        assert LoadStatus.cancelled not in LOAD_TRANSITIONS[LoadStatus.in_transit]

    def test_delivered_cannot_cancel(self):
        assert LoadStatus.cancelled not in LOAD_TRANSITIONS[LoadStatus.delivered]

    def test_invoiced_cannot_cancel(self):
        assert LoadStatus.cancelled not in LOAD_TRANSITIONS[LoadStatus.invoiced]

    # ── Structural invariants ────────────────────────────────────

    def test_all_statuses_covered(self):
        """Verify the expected statuses are in the map."""
        expected = {
            LoadStatus.offer,
            LoadStatus.booked,
            LoadStatus.assigned,
            LoadStatus.dispatched,
            LoadStatus.in_transit,
            LoadStatus.delivered,
            LoadStatus.invoiced,
            LoadStatus.paid,
            LoadStatus.cancelled,
        }
        assert set(LOAD_TRANSITIONS.keys()) == expected

    def test_no_self_transitions(self):
        """No status should transition to itself."""
        for status, targets in LOAD_TRANSITIONS.items():
            assert status not in targets, f"{status.value} should not transition to itself"

    def test_no_backwards_to_offer(self):
        """Verify no status can go backwards to offer."""
        for status, targets in LOAD_TRANSITIONS.items():
            if status != LoadStatus.offer:
                assert LoadStatus.offer not in targets, (
                    f"{status.value} should not transition to offer"
                )
