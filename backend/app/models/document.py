"""Document model — file management with GCS integration."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class EntityType(str, enum.Enum):
    """What entity a document belongs to (polymorphic)."""

    load = "load"
    driver = "driver"
    truck = "truck"
    trailer = "trailer"
    company = "company"


class DocumentType(str, enum.Enum):
    """Classification of the uploaded document."""

    pod = "pod"
    rate_confirmation = "rate_confirmation"
    bol = "bol"
    invoice = "invoice"
    cdl = "cdl"
    medical_card = "medical_card"
    insurance = "insurance"
    vehicle_inspection = "vehicle_inspection"
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
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # GCS signed URL (cached)
    gcs_object_path: Mapped[str | None] = mapped_column(Text, nullable=True)  # Internal GCS path
    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)  # bytes
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Ownership / Audit ────────────────────────────────────────
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True  # user_id of uploader
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # For CDL, medical, DOT

    # ── Soft Delete ──────────────────────────────────────────────
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
