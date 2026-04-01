"""Load and LoadStop models — the core of the TMS."""

import enum
import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Date, DateTime, Enum, ForeignKey, Index, Integer, Numeric,
    String, Text, Time, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class LoadStatus(str, enum.Enum):
    """Strict load state machine — transitions enforced in service layer (Phase 4)."""

    planned = "planned"
    dispatched = "dispatched"
    at_pickup = "at_pickup"
    in_transit = "in_transit"
    delivered = "delivered"
    delayed = "delayed"
    billed = "billed"
    paid = "paid"
    cancelled = "cancelled"


class StopType(str, enum.Enum):
    """Type of load stop."""

    pickup = "pickup"
    delivery = "delivery"


class Load(Base, TenantMixin):
    """Load entity — a freight shipment from pickup(s) to delivery(ies).

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "loads"
    __table_args__ = (
        UniqueConstraint('company_id', 'load_number', name='uq_loads_company_number'),
    )

    # ── Load Identification ──────────────────────────────────────
    load_number: Mapped[str] = mapped_column(
        String(50), nullable=False  # Auto-generated, unique per company
    )
    broker_load_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True  # Broker's reference number from Rate Con
    )

    # ── Foreign Keys ─────────────────────────────────────────────
    broker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brokers.id", ondelete="RESTRICT"),
        nullable=True,
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=True,  # Unassigned loads have NULL driver
    )
    truck_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trucks.id", ondelete="RESTRICT"),
        nullable=True,
    )
    trailer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trailers.id", ondelete="RESTRICT"),
        nullable=True,
    )

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[LoadStatus] = mapped_column(
        Enum(LoadStatus, name="load_status_enum", create_constraint=True),
        default=LoadStatus.planned,
        server_default="planned",
    )

    # ── Financials (NUMERIC — never float) ───────────────────────
    base_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)  # Linehaul rate
    total_miles: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)  # base_rate + accessorials

    # ── Other ────────────────────────────────────────────────────
    contact_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Broker agent name
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="loads")
    broker = relationship("Broker", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
    truck = relationship("Truck", back_populates="loads")
    trailer = relationship("Trailer", back_populates="loads")
    stops = relationship("LoadStop", back_populates="load", lazy="selectin", cascade="all, delete-orphan")
    accessorials = relationship("LoadAccessorial", back_populates="load", lazy="selectin", cascade="all, delete-orphan")


class LoadStop(Base, TenantMixin):
    """Individual stop within a load — pickup or delivery.

    Every load MUST have at minimum 2 stops: one pickup (sequence=1) and one delivery (sequence=last).
    Uses TenantMixin → company_id on child too for tenant isolation.
    """

    __tablename__ = "load_stops"
    __table_args__ = (
        Index('ix_load_stops_load_id', 'load_id'),
    )

    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loads.id", ondelete="CASCADE"),
        nullable=False,
    )

    stop_type: Mapped[StopType] = mapped_column(
        Enum(StopType, name="stop_type_enum", create_constraint=True),
        nullable=False,
    )
    stop_sequence: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, 3…

    # ── Location ─────────────────────────────────────────────────
    facility_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Schedule ─────────────────────────────────────────────────
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    # ── Actual timestamps ────────────────────────────────────────
    arrival_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    departure_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # PO#, Seal#, etc.

    # ── Relationships ────────────────────────────────────────────
    load = relationship("Load", back_populates="stops")
