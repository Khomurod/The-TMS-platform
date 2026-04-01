"""Company model — the root of multi-tenancy."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Company(Base):
    """Trucking company — the tenant entity.

    Every other business table references this via company_id FK.
    This table itself does NOT use TenantMixin (it IS the tenant).
    """

    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mc_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dot_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    # ── Relationships (lazy="noload" — use explicit selectinload where needed) ──
    users = relationship("User", back_populates="company", lazy="noload")
    brokers = relationship("Broker", back_populates="company", lazy="noload")
    drivers = relationship("Driver", back_populates="company", lazy="noload")
    trucks = relationship("Truck", back_populates="company", lazy="noload")
    trailers = relationship("Trailer", back_populates="company", lazy="noload")
    loads = relationship("Load", back_populates="company", lazy="noload")
