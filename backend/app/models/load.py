"""Load, Trip, Commodity, and LoadStop models — the core of the TMS.

Architecture:
  Load → Trip(s) → Driver/Truck/Trailer   (Trip is the bridge entity)
  Load → Commodity(s)                      (cargo detail)
  Trip → LoadStop(s)                       (stops are per-trip for multi-leg)
"""

import enum
import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey, Index, Integer, Numeric,
    String, Text, Time, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, LoadStatus, TripStatus


class StopType(str, enum.Enum):
    """Type of load stop."""

    pickup = "pickup"
    delivery = "delivery"


# ══════════════════════════════════════════════════════════════════
#   LOAD — The freight shipment
# ══════════════════════════════════════════════════════════════════


class Load(Base, TenantMixin):
    """Load entity — a freight shipment from pickup(s) to delivery(ies).

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.

    NOTE: Driver/Truck/Trailer assignment is via the Trip entity, NOT direct FKs.
    """

    __tablename__ = "loads"
    __table_args__ = (
        UniqueConstraint('company_id', 'load_number', name='uq_loads_company_number'),
    )

    # ── Load Identification ──────────────────────────────────────
    load_number: Mapped[str] = mapped_column(
        String(50), nullable=False  # Auto-generated, unique per company
    )
    shipment_id: Mapped[str | None] = mapped_column(
        String(20), nullable=True, unique=True  # External-facing ID, e.g. 'SH-000123'
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
    commission_dispatcher_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[LoadStatus] = mapped_column(
        Enum(LoadStatus, name="load_status_enum", create_constraint=True),
        default=LoadStatus.offer,
        server_default="offer",
    )

    # ── Lock flag ────────────────────────────────────────────────
    is_locked: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    # ── Financials (NUMERIC — never float) ───────────────────────
    base_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)  # Linehaul rate
    total_miles: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)  # base_rate + accessorials

    # ── Other ────────────────────────────────────────────────────
    contact_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Broker agent name
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Operational Timestamps ───────────────────────────────────
    # delivered_at: set when load transitions in_transit → delivered.
    # Used by settlement period filtering to ensure drivers are paid in
    # the period they actually completed the delivery, not when the load
    # was created. NULL for historical loads (fallback uses created_at).
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="loads")
    broker = relationship("Broker", back_populates="loads")
    trips = relationship("Trip", back_populates="load", lazy="selectin", cascade="all, delete-orphan")
    stops = relationship("LoadStop", back_populates="load", lazy="selectin", cascade="all, delete-orphan")
    commodities = relationship("Commodity", back_populates="load", lazy="selectin", cascade="all, delete-orphan")
    accessorials = relationship("LoadAccessorial", back_populates="load", lazy="selectin", cascade="all, delete-orphan")


# ══════════════════════════════════════════════════════════════════
#   TRIP — Bridge between Load and Driver/Truck
# ══════════════════════════════════════════════════════════════════


class Trip(Base, TenantMixin):
    """Trip entity — the bridge between Load and Driver/Truck.

    A Load can have N Trips (multi-leg, split loads).
    Settlement math operates at the Trip level.
    """

    __tablename__ = "trips"
    __table_args__ = (
        UniqueConstraint('company_id', 'trip_number', name='uq_trips_company_number'),
    )

    trip_number: Mapped[str] = mapped_column(
        String(20), nullable=False  # 'TR-000001-01'
    )
    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=True
    )
    truck_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trucks.id", ondelete="RESTRICT"), nullable=True
    )
    trailer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trailers.id", ondelete="RESTRICT"), nullable=True
    )
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, name="trip_status_enum", create_constraint=True),
        default=TripStatus.assigned, server_default="assigned"
    )
    sequence_number: Mapped[int] = mapped_column(Integer, default=1)
    driver_gross: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    loaded_miles: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    empty_miles: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    # ── Relationships ────────────────────────────────────────────
    load = relationship("Load", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    truck = relationship("Truck", back_populates="trips")
    trailer = relationship("Trailer", back_populates="trips")
    stops = relationship("LoadStop", back_populates="trip", cascade="all, delete-orphan")

    # ── Computed fields for Pydantic serialization ────────────────
    @property
    def driver_name(self) -> str | None:
        if self.driver:
            return f"{self.driver.first_name} {self.driver.last_name}"
        return None

    @property
    def truck_number(self) -> str | None:
        if self.truck:
            return self.truck.unit_number
        return None

    @property
    def trailer_number(self) -> str | None:
        if self.trailer:
            return self.trailer.unit_number
        return None


# ══════════════════════════════════════════════════════════════════
#   LOAD STOP — pickup/delivery within a trip
# ══════════════════════════════════════════════════════════════════


class LoadStop(Base, TenantMixin):
    """Individual stop within a load — pickup or delivery.

    Every load MUST have at minimum 2 stops: one pickup (sequence=1) and one delivery (sequence=last).
    Uses TenantMixin → company_id on child too for tenant isolation.

    Stops have both load_id (for easy querying) and trip_id (for multi-leg routing).
    """

    __tablename__ = "load_stops"
    __table_args__ = (
        Index('ix_load_stops_load_id', 'load_id'),
        Index('ix_load_stops_trip_id', 'trip_id'),
    )

    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loads.id", ondelete="CASCADE"),
        nullable=False,
    )
    trip_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="SET NULL"),
        nullable=True,  # Nullable until a Trip is created
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
    trip = relationship("Trip", back_populates="stops")


# ══════════════════════════════════════════════════════════════════
#   COMMODITY — goods being shipped
# ══════════════════════════════════════════════════════════════════


class Commodity(Base, TenantMixin):
    """Commodity entity — cargo detail for a load."""

    __tablename__ = "commodities"

    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(255), default="General freight")
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    package_type: Mapped[str] = mapped_column(String(50), default="Skid")  # Skid|Pallet|Box
    pieces: Mapped[str] = mapped_column(String(20), default="PCS")
    total_weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    weight_unit: Mapped[str] = mapped_column(String(5), default="lb")
    width: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    height: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    length: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    load = relationship("Load", back_populates="commodities")
