"""Documents schemas — Pydantic request/response models for Document Vault."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.document import DocumentType, EntityType


# ── Request Schemas ──────────────────────────────────────────────

class DocumentUpload(BaseModel):
    """Metadata accompanying a document upload (file sent as multipart form data)."""

    document_type: DocumentType
    entity_type: EntityType
    entity_id: UUID
    original_filename: str
    expiry_date: Optional[str] = None  # ISO date string, e.g. for CDL expiry


# ── Response Schemas ─────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Full document detail, including a time-limited signed download URL."""

    id: str
    company_id: str
    entity_type: str
    entity_id: str
    document_type: str
    file_name: str
    original_filename: str
    signed_url: Optional[str] = None  # generated on-demand, time-limited
    gcs_object_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    expiry_date: Optional[str] = None
    is_deleted: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListItem(BaseModel):
    """Lightweight document entry for paginated listings."""

    id: str
    entity_type: str
    entity_id: str
    document_type: str
    original_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_at: datetime
    expiry_date: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentList(BaseModel):
    """Paginated document list."""

    items: list[DocumentListItem]
    total: int
    page: int
    page_size: int
