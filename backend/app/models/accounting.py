"""Accounting models — accessorials, deductions, settlements, invoices, and line items."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String,
    Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, SettlementBatchStatus, InvoiceBatchStatus


# ── ENUMs ────────────────────────────────────────────────────────

class AccessorialType(str, enum.Enum):
    """Types of additional charges on a load."""

    fuel_surcharge = "fuel_surcharge"
    detention = "detention"
    layover = "layover"
    lumper = "lumper"
    stop_off = "stop_off"
    tarp = "tarp"
    other = "other"


class DeductionFrequency(str, enum.Enum):
    """How often a default deduction is applied."""

    per_load = "per_load"
    weekly = "weekly"
    monthly = "monthly"


class SettlementLineType(str, enum.Enum):
    """Type of line item in a settlement."""

    load_pay = "load_pay"
    accessorial = "accessorial"
    deduction = "deduction"
    bonus = "bonus"


# ── Models ───────────────────────────────────────────────────────

class LoadAccessorial(Base, TenantMixin):
    """Additional charges on a load (fuel surcharge, detention, etc.)."""

    __tablename__ = "load_accessorials"

    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loads.id", ondelete="CASCADE"),
        nullable=False,
    )

    type: Mapped[AccessorialType] = mapped_column(
        Enum(AccessorialType, name="accessorial_type_enum", create_constraint=True),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # ── Relationships ────────────────────────────────────────────
    load = relationship("Load", back_populates="accessorials")


class CompanyDefaultDeduction(Base, TenantMixin):
    """Company-wide default deductions applied to driver settlements."""

    __tablename__ = "company_default_deductions"

    name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Weekly Trailer Rental"
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    frequency: Mapped[DeductionFrequency] = mapped_column(
        Enum(DeductionFrequency, name="deduction_frequency_enum", create_constraint=True),
        nullable=False,
    )


# ══════════════════════════════════════════════════════════════════
#   SETTLEMENT BATCH & LINE ITEMS
# ══════════════════════════════════════════════════════════════════


class SettlementBatch(Base, TenantMixin):
    """A batch of driver settlements — supports post/unpost workflow."""

    __tablename__ = "settlement_batches"
    __table_args__ = (
        UniqueConstraint('company_id', 'batch_number', name='uq_settlement_batches_company_number'),
    )

    batch_number: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'SB-000100'
    status: Mapped[SettlementBatchStatus] = mapped_column(
        Enum(SettlementBatchStatus, name="settlement_batch_status_enum", create_constraint=True),
        default=SettlementBatchStatus.unposted,
        server_default="unposted",
    )
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    settlement_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ────────────────────────────────────────────
    settlements = relationship("DriverSettlement", back_populates="batch", lazy="selectin", cascade="all, delete-orphan")


class DriverSettlement(Base, TenantMixin):
    """A settlement period for a driver — aggregates load pay, accessorials, and deductions."""

    __tablename__ = "driver_settlements"
    __table_args__ = (
        UniqueConstraint('company_id', 'settlement_number', name='uq_settlements_company_number'),
    )

    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("settlement_batches.id", ondelete="SET NULL"),
        nullable=True,
    )

    settlement_number: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "TMS-49202"
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    # ── Financials (NUMERIC — never float) ───────────────────────
    gross_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_accessorials: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_bonus: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    net_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    status: Mapped[SettlementBatchStatus] = mapped_column(
        Enum(SettlementBatchStatus, name="settlement_batch_status_enum", create_constraint=True),
        default=SettlementBatchStatus.unposted,
        server_default="unposted",
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ────────────────────────────────────────────
    driver = relationship("Driver", back_populates="settlements")
    batch = relationship("SettlementBatch", back_populates="settlements")
    line_items = relationship("SettlementLineItem", back_populates="settlement", lazy="selectin", cascade="all, delete-orphan")


class SettlementLineItem(Base, TenantMixin):
    """Individual line item within a driver settlement."""

    __tablename__ = "settlement_line_items"

    settlement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("driver_settlements.id", ondelete="CASCADE"),
        nullable=False,
    )
    load_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loads.id", ondelete="RESTRICT"),
        nullable=True,
    )
    trip_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="RESTRICT"),
        nullable=True,
    )

    type: Mapped[SettlementLineType] = mapped_column(
        Enum(SettlementLineType, name="settlement_line_type_enum", create_constraint=True),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # Positive = earnings, negative = deductions

    # ── Relationships ────────────────────────────────────────────
    settlement = relationship("DriverSettlement", back_populates="line_items")


# ══════════════════════════════════════════════════════════════════
#   INVOICE BATCH & INVOICES
# ══════════════════════════════════════════════════════════════════


class InvoiceBatch(Base, TenantMixin):
    """Invoice batch — groups invoices for bulk posting to customers."""

    __tablename__ = "invoice_batches"
    __table_args__ = (
        UniqueConstraint('company_id', 'batch_id', name='uq_invoice_batches_company_batch'),
    )

    batch_id: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., 'IB-000095'
    status: Mapped[InvoiceBatchStatus] = mapped_column(
        Enum(InvoiceBatchStatus, name="invoice_batch_status_enum", create_constraint=True),
        default=InvoiceBatchStatus.unposted,
        server_default="unposted",
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    invoice_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ────────────────────────────────────────────
    invoices = relationship("Invoice", back_populates="batch", lazy="selectin", cascade="all, delete-orphan")


class Invoice(Base, TenantMixin):
    """Individual invoice — bills a customer/broker for a delivered load."""

    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint('company_id', 'invoice_number', name='uq_invoices_company_number'),
    )

    invoice_number: Mapped[str] = mapped_column(String(20), nullable=False)
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoice_batches.id", ondelete="CASCADE"), nullable=False
    )
    load_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("loads.id", ondelete="RESTRICT"), nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brokers.id", ondelete="RESTRICT"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    billing_type: Mapped[str] = mapped_column(String(50), default="standard")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    batch = relationship("InvoiceBatch", back_populates="invoices")
