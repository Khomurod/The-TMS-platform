"""Fleet models — Trucks and Trailers."""

import enum

from sqlalchemy import Date, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class OwnershipType(str, enum.Enum):
    """How the equipment is acquired."""

    owned = "owned"
    financed = "financed"
    leased = "leased"
    rented = "rented"


class EquipmentStatus(str, enum.Enum):
    """Current operational status of truck/trailer."""

    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"


class TrailerType(str, enum.Enum):
    """Trailer classification."""

    dry_van = "dry_van"
    reefer = "reefer"
    flatbed = "flatbed"
    step_deck = "step_deck"
    tanker = "tanker"


class Truck(Base, TenantMixin):
    """Truck (power unit) entity.

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "trucks"
    __table_args__ = (
        UniqueConstraint('company_id', 'unit_number', name='uq_trucks_company_unit'),
    )

    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "TRK-402"
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vin: Mapped[str | None] = mapped_column(String(17), nullable=True)
    license_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)

    ownership_type: Mapped[OwnershipType | None] = mapped_column(
        Enum(OwnershipType, name="ownership_type_enum", create_constraint=True),
        nullable=True,
    )

    dot_inspection_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    dot_inspection_expiry: Mapped[str | None] = mapped_column(Date, nullable=True)  # → Compliance Alerts

    status: Mapped[EquipmentStatus] = mapped_column(
        Enum(EquipmentStatus, name="equipment_status_enum", create_constraint=True),
        default=EquipmentStatus.available,
        server_default="available",
    )

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="trucks")
    trips = relationship("Trip", back_populates="truck", lazy="selectin")


class Trailer(Base, TenantMixin):
    """Trailer entity.

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "trailers"
    __table_args__ = (
        UniqueConstraint('company_id', 'unit_number', name='uq_trailers_company_unit'),
    )

    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vin: Mapped[str | None] = mapped_column(String(17), nullable=True)
    license_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)

    trailer_type: Mapped[TrailerType | None] = mapped_column(
        Enum(TrailerType, name="trailer_type_enum", create_constraint=True),
        nullable=True,
    )
    ownership_type: Mapped[OwnershipType | None] = mapped_column(
        Enum(OwnershipType, name="ownership_type_enum", create_constraint=True),
        nullable=True,
    )

    dot_inspection_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    dot_inspection_expiry: Mapped[str | None] = mapped_column(Date, nullable=True)

    status: Mapped[EquipmentStatus] = mapped_column(
        Enum(EquipmentStatus, name="equipment_status_enum", create_constraint=True),
        default=EquipmentStatus.available,
        server_default="available",
    )

    # ── Relationships ────────────────────────────────────────────
    company = relationship("Company", back_populates="trailers")
    trips = relationship("Trip", back_populates="trailer", lazy="selectin")
