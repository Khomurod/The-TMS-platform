"""Accounting models — accessorials, deductions, settlements, and line items."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


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


class SettlementStatus(str, enum.Enum):
    """Settlement lifecycle status."""

    draft = "draft"
    ready = "ready"
    paid = "paid"


class SettlementLineType(str, enum.Enum):
    """Type of line item in a settlement."""

    load_pay = "load_pay"
    accessorial = "accessorial"
    deduction = "deduction"


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

    settlement_number: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "TMS-49202"
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    # ── Financials (NUMERIC — never float) ───────────────────────
    gross_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_accessorials: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    net_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    status: Mapped[SettlementStatus] = mapped_column(
        Enum(SettlementStatus, name="settlement_status_enum", create_constraint=True),
        default=SettlementStatus.draft,
        server_default="draft",
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ────────────────────────────────────────────
    driver = relationship("Driver", back_populates="settlements")
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

    type: Mapped[SettlementLineType] = mapped_column(
        Enum(SettlementLineType, name="settlement_line_type_enum", create_constraint=True),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # Positive = earnings, negative = deductions

    # ── Relationships ────────────────────────────────────────────
    settlement = relationship("DriverSettlement", back_populates="line_items")
