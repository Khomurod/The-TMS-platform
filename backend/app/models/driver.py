"""Driver model — driver management with compliance, pay configuration, and tax info."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy_utils import StringEncryptedType as EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

from app.models.base import Base, TenantMixin, DriverStatus


def _get_encryption_key() -> str:
    """Deferred key loader — avoids circular import at module load time."""
    from app.config import settings
    return settings.effective_encryption_key


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


class TaxClassification(str, enum.Enum):
    """Tax filing classification for the driver."""

    w2_employee = "w2_employee"
    contractor_1099 = "contractor_1099"


class Driver(Base, TenantMixin):
    """Driver entity — CDL holder who hauls freight.

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "drivers"
    __table_args__ = (
        UniqueConstraint('company_id', 'email', name='uq_drivers_company_email'),
    )

    # ── Personal Info ────────────────────────────────────────────
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    home_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Employment ───────────────────────────────────────────────
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, name="employment_type_enum", create_constraint=True),
        nullable=False,
    )
    hire_date: Mapped[date | None] = mapped_column(Date, nullable=True)

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
    pay_rate_value: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 4), nullable=True  # e.g., 0.65 CPM or 0.80 (80%)
    )

    # ── Payment Tariff (blueprint §1.2) ──────────────────────────
    payment_tariff_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True  # e.g., '88% Gross', '70 CPM', 'Custom'
    )
    payment_tariff_value: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 4), nullable=True  # Numeric value behind the tariff label
    )

    use_company_defaults: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    # ── Tax Configuration ────────────────────────────────────────
    tax_classification: Mapped[TaxClassification | None] = mapped_column(
        Enum(TaxClassification, name="tax_classification_enum", create_constraint=True),
        nullable=True,
    )

    # ── Bank Info ──────────────────────────────────────────────────
    # Audit fix #11: Bank data is AES-encrypted at rest using sqlalchemy-utils.
    # The encryption key is sourced from settings.effective_encryption_key.
    # Only the last 4 digits should be returned in API responses.
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_routing_number: Mapped[str | None] = mapped_column(
        EncryptedType(String(255), _get_encryption_key, AesEngine, "pkcs5"),
        nullable=True,
    )
    bank_account_number: Mapped[str | None] = mapped_column(
        EncryptedType(String(255), _get_encryption_key, AesEngine, "pkcs5"),
        nullable=True,
    )

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus, name="driver_status_enum", create_constraint=True),
        default=DriverStatus.available,
        server_default="available",
    )

    # ── Additional Info ──────────────────────────────────────────
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="drivers")
    trips = relationship("Trip", back_populates="driver", lazy="select")
    settlements = relationship("DriverSettlement", back_populates="driver", lazy="select")
