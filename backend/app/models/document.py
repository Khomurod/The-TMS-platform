"""Document model — file management with GCS integration."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class EntityType(str, enum.Enum):
    """What entity a document belongs to (polymorphic)."""

    load = "load"
    driver = "driver"
    truck = "truck"
    trailer = "trailer"


class DocumentType(str, enum.Enum):
    """Classification of the uploaded document."""

    rate_confirmation = "rate_confirmation"
    pod_bol = "pod_bol"
    cdl = "cdl"
    medical_card = "medical_card"
    bank_info = "bank_info"
    dot_inspection = "dot_inspection"
    insurance = "insurance"
    other = "other"


class Document(Base, TenantMixin):
    """Document entity — files uploaded to GCS, linked to loads/drivers/fleet polymorphically.

    Uses TenantMixin → automatically gets company_id, id, created_at, updated_at, is_active.
    """

    __tablename__ = "documents"

    # ── Polymorphic Owner ────────────────────────────────────────
    entity_type: Mapped[EntityType] = mapped_column(
        Enum(EntityType, name="entity_type_enum", create_constraint=True),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False  # FK to the owning entity (not enforced at DB level due to polymorphism)
    )

    # ── Document Info ────────────────────────────────────────────
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type_enum", create_constraint=True),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # GCS signed URL
    gcs_object_path: Mapped[str | None] = mapped_column(Text, nullable=True)  # Internal GCS path

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # For CDL, medical, DOT
