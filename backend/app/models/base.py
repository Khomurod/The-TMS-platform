"""SQLAlchemy declarative base, TenantMixin, and shared enums.

All domain-level enums live here to avoid circular imports.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


# ══════════════════════════════════════════════════════════════════
#   SHARED ENUMS
# ══════════════════════════════════════════════════════════════════


class EntityType(str, enum.Enum):
    load = "load"
    driver = "driver"
    truck = "truck"
    trailer = "trailer"
    company = "company"

class LoadStatus(str, enum.Enum):
    """8-stage load lifecycle. Transitions enforced in service layer."""

    offer = "offer"             # Stage 1: Draft load, all fields editable
    booked = "booked"           # Stage 2: Rate confirmation locked
    assigned = "assigned"       # Stage 3: Trip entity created, driver/truck linked
    dispatched = "dispatched"   # Stage 4: Driver notified, driver → ON_TRIP
    in_transit = "in_transit"   # Stage 5: En route, ETA tracking active
    delivered = "delivered"     # Stage 6: POD uploaded, load data lockable
    invoiced = "invoiced"       # Stage 7: Invoice batch created
    paid = "paid"               # Stage 8: Terminal state
    cancelled = "cancelled"     # Soft-delete escape hatch


class TripStatus(str, enum.Enum):
    """Trip lifecycle — mirrors Load lifecycle stages."""

    assigned = "assigned"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"  # Set when parent load is cancelled mid-trip


class SettlementBatchStatus(str, enum.Enum):
    """Settlement batch lifecycle — matches batch posting workflow."""

    unposted = "unposted"   # Line items editable
    posted = "posted"        # Line items frozen, reversible via "Undo"
    paid = "paid"            # Terminal state, full lock


class InvoiceBatchStatus(str, enum.Enum):
    """Invoice batch lifecycle — supports partial posting for large batches."""

    unposted = "unposted"
    partial_posted = "partial_posted"
    posted = "posted"
    paid = "paid"


class DriverStatus(str, enum.Enum):
    """Current operational status of the driver."""

    available = "available"     # Can be assigned to loads
    on_trip = "on_trip"         # Auto-set when Load → DISPATCHED
    inactive = "inactive"       # Manual toggle, hidden from assignable pool
    on_leave = "on_leave"       # Vacation board
    terminated = "terminated"   # Soft-terminated


# ══════════════════════════════════════════════════════════════════
#   BASE & MIXIN
# ══════════════════════════════════════════════════════════════════


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class TenantMixin:
    """Mixin that injects company_id + common audit columns into every business table.

    Every model inheriting this mixin automatically gets:
    - company_id (UUID FK → companies.id, NOT NULL, indexed)
    - id (UUID PK, default uuid4)
    - created_at (TIMESTAMPTZ, server default now())
    - updated_at (TIMESTAMPTZ, on update now())
    - is_active (BOOLEAN, default True — soft delete flag)
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    @declared_attr
    def company_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            ForeignKey("companies.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
