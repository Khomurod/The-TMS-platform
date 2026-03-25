"""SQLAlchemy declarative base and TenantMixin.

Stub — full column definitions will be added in Phase 1 (Database Foundation).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


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
