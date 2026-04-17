"""Broker model - broker directory for load assignments."""

from sqlalchemy import Boolean, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class Broker(Base, TenantMixin):
    """Broker entity - freight brokers that assign loads to the carrier."""

    __tablename__ = "brokers"
    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_brokers_company_name"),
    )

    # Keep the soft-delete contract explicit on Broker even though TenantMixin
    # already defines the same shared field for tenant-scoped models.
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mc_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    company = relationship("Company", back_populates="brokers")
    loads = relationship("Load", back_populates="broker", lazy="select")
