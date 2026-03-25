"""Driver model — driver management with compliance and pay configuration."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class EmploymentType(str, enum.Enum):
    """Driver employment classification."""

    company_w2 = "company_w2"
    owner_operator_1099 = "owner_operator_1099"
    lease_operator = "lease_operator"


class PayRateType(str, enum.Enum):
    """How the driver is paid."""

    cpm = "cpm"                          # cents per mile
    percentage = "percentage"            # % of load revenue
    fixed_per_load = "fixed_per_load"    # flat rate per load
    hourly = "hourly"
    salary = "salary"


class DriverStatus(str, enum.Enum):
    """Current operational status of the driver."""

    available = "available"
    on_route = "on_route"
    off_duty = "off_duty"
    on_leave = "on_leave"
    terminated = "terminated"


class Driver(Base, TenantMixin):
    """Driver entity — CDL holder who hauls freight.

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "drivers"

    # ── Personal Info ────────────────────────────────────────────
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Employment ───────────────────────────────────────────────
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, name="employment_type_enum", create_constraint=True),
        nullable=False,
    )

    # ── CDL & Compliance ─────────────────────────────────────────
    cdl_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cdl_class: Mapped[str | None] = mapped_column(String(10), nullable=True)  # A, B, etc.
    cdl_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)   # → Compliance Alerts
    medical_card_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # → Compliance Alerts
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Pay Configuration ────────────────────────────────────────
    pay_rate_type: Mapped[PayRateType | None] = mapped_column(
        Enum(PayRateType, name="pay_rate_type_enum", create_constraint=True),
        nullable=True,
    )
    pay_rate_value: Mapped[float | None] = mapped_column(
        Numeric(10, 4), nullable=True  # e.g., 0.65 CPM or 80%
    )
    use_company_defaults: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    # ── Bank Info (encrypted at rest in production) ──────────────
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_routing_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus, name="driver_status_enum", create_constraint=True),
        default=DriverStatus.available,
        server_default="available",
    )

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="drivers")
    loads = relationship("Load", back_populates="driver", lazy="selectin")
    settlements = relationship("DriverSettlement", back_populates="driver", lazy="selectin")
