"""Documents service — business logic + GCS integration for Document Vault."""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.documents.repository import DocumentRepository
from app.documents.schemas import DocumentList, DocumentListItem, DocumentResponse
from app.models.document import Document, DocumentType, EntityType

logger = logging.getLogger(__name__)

# ── File Validation Constants ────────────────────────────────────

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/tiff",
}
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "tiff"}

# ── GCS Client Factory ───────────────────────────────────────────


def _get_gcs_client():
    """Return an initialized GCS storage Client.

    Tries GCS_CREDENTIALS_JSON (JSON string) first, then falls back to
    GOOGLE_APPLICATION_CREDENTIALS (file path).  Raises HTTPException if
    neither is configured so that meaningful errors surface to callers.
    """
    try:
        from google.cloud import storage
        from google.oauth2 import service_account
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="google-cloud-storage is not installed.",
        ) from exc

    if settings.gcs_credentials_json:
        try:
            info = json.loads(settings.gcs_credentials_json)
            credentials = service_account.Credentials.from_service_account_info(info)
            return storage.Client(credentials=credentials)
        except Exception as exc:
            logger.error("Failed to initialize GCS client from GCS_CREDENTIALS_JSON: %s", exc)
            raise HTTPException(
                status_code=503,
                detail="GCS credentials are invalid. Check GCS_CREDENTIALS_JSON.",
            ) from exc

    if settings.google_application_credentials:
        try:
            credentials = service_account.Credentials.from_service_account_file(
                settings.google_application_credentials
            )
            return storage.Client(credentials=credentials)
        except Exception as exc:
            logger.error(
                "Failed to initialize GCS client from GOOGLE_APPLICATION_CREDENTIALS: %s", exc
            )
            raise HTTPException(
                status_code=503,
                detail="GCS credentials file is invalid. Check GOOGLE_APPLICATION_CREDENTIALS.",
            ) from exc

    # Neither credential source is configured — try Application Default Credentials
    # (works inside GCP environments with a service account attached)
    try:
        return storage.Client()
    except Exception as exc:
        logger.warning("GCS is not configured — no credentials available: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "GCS is not configured. Set GCS_CREDENTIALS_JSON or "
                "GOOGLE_APPLICATION_CREDENTIALS."
            ),
        ) from exc


# ── Service ──────────────────────────────────────────────────────


class DocumentService:
    """Document Vault business logic — upload, download (signed URL), delete, list."""

    def __init__(self, db: AsyncSession, company_id: uuid.UUID, user_id: uuid.UUID):
        self.db = db
        self.repo = DocumentRepository(db, company_id)
        self.company_id = company_id
        self.user_id = user_id

    # ── Helpers ──────────────────────────────────────────────────

    def _validate_file(self, file: UploadFile, content: bytes) -> None:
        """Raise HTTPException if file fails size or type validation."""
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty files are not allowed.",
            )
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
            )
        content_type = file.content_type or ""
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if content_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"File type '{content_type}' is not allowed. "
                    f"Allowed types: pdf, png, jpg, jpeg, tiff."
                ),
            )

    def _gcs_object_path(
        self, entity_type: EntityType, entity_id: uuid.UUID, filename: str
    ) -> str:
        """Build the GCS object path: {company_id}/{entity_type}/{entity_id}/{uuid}_{filename}.

        Sanitizes the filename to prevent path traversal attacks using os.path.basename().
        """
        # Strip any directory components — prevents path traversal (e.g. ../../etc/passwd)
        safe_filename = os.path.basename(filename).replace(" ", "_").strip()
        if not safe_filename:
            safe_filename = "upload.bin"
        unique_prefix = uuid.uuid4().hex
        return (
            f"{self.company_id}/{entity_type.value}/{entity_id}/{unique_prefix}_{safe_filename}"
        )

    def _to_response(self, doc: Document, signed_url: Optional[str] = None) -> DocumentResponse:
        return DocumentResponse(
            id=str(doc.id),
            company_id=str(doc.company_id),
            entity_type=doc.entity_type.value if hasattr(doc.entity_type, "value") else doc.entity_type,
            entity_id=str(doc.entity_id),
            document_type=doc.document_type.value if hasattr(doc.document_type, "value") else doc.document_type,
            file_name=doc.file_name,
            original_filename=doc.original_filename,
            signed_url=signed_url,
            gcs_object_path=doc.gcs_object_path,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            uploaded_by=str(doc.uploaded_by) if doc.uploaded_by else None,
            uploaded_at=doc.uploaded_at,
            expiry_date=doc.expiry_date.isoformat() if doc.expiry_date else None,
            is_deleted=doc.is_deleted,
            created_at=doc.created_at,
        )

    def _to_list_item(self, doc: Document) -> DocumentListItem:
        return DocumentListItem(
            id=str(doc.id),
            entity_type=doc.entity_type.value if hasattr(doc.entity_type, "value") else doc.entity_type,
            entity_id=str(doc.entity_id),
            document_type=doc.document_type.value if hasattr(doc.document_type, "value") else doc.document_type,
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            uploaded_at=doc.uploaded_at,
            expiry_date=doc.expiry_date.isoformat() if doc.expiry_date else None,
        )

    # ── Upload ────────────────────────────────────────────────────

    async def _validate_entity_exists(
        self, entity_type: EntityType, entity_id: uuid.UUID
    ) -> None:
        """Validate that the entity_id exists for the given entity_type within the company."""
        from sqlalchemy import select as sa_select
        from app.models.load import Load
        from app.models.driver import Driver
        from app.models.fleet import Truck, Trailer

        entity_model_map = {
            EntityType.load: Load,
            EntityType.driver: Driver,
            EntityType.truck: Truck,
            EntityType.trailer: Trailer,
        }

        model = entity_model_map.get(entity_type)
        if model:
            result = await self.db.execute(
                sa_select(model.id)
                .where(model.id == entity_id)
                .where(model.company_id == self.company_id)
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=404,
                    detail=f"{entity_type.value} with id '{entity_id}' not found in your company.",
                )

    async def upload_document(
        self,
        file: UploadFile,
        document_type: DocumentType,
        entity_type: EntityType,
        entity_id: uuid.UUID,
    ) -> DocumentResponse:
        """Validate entity, file, upload to GCS, and persist metadata."""
        if not settings.gcs_bucket_name:
            raise HTTPException(
                status_code=503,
                detail="GCS is not configured. Set GCS_BUCKET_NAME.",
            )

        # MED-12: Validate entity exists before uploading
        await self._validate_entity_exists(entity_type, entity_id)

        content = await file.read()
        self._validate_file(file, content)

        original_filename = file.filename or "unknown"
        gcs_path = self._gcs_object_path(entity_type, entity_id, original_filename)

        # Upload to GCS
        client = _get_gcs_client()
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(gcs_path)
        blob.upload_from_string(content, content_type=file.content_type or "application/octet-stream")

        # Persist metadata
        doc = await self.repo.create(
            entity_type=entity_type,
            entity_id=entity_id,
            document_type=document_type,
            file_name=gcs_path.rsplit("/", 1)[-1],
            original_filename=original_filename,
            gcs_object_path=gcs_path,
            file_size=len(content),
            mime_type=file.content_type,
            uploaded_by=self.user_id,
        )

        logger.info(
            "Document uploaded: type=%s, entity=%s/%s, size=%d bytes",
            document_type.value, entity_type.value, entity_id, len(content),
        )

        signed_url = self._generate_signed_url(blob)
        return self._to_response(doc, signed_url=signed_url)

    # ── Get / Signed URL ─────────────────────────────────────────

    async def get_document(self, document_id: uuid.UUID) -> DocumentResponse:
        """Return document metadata with a fresh signed download URL."""
        doc = await self.repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        signed_url = None
        if doc.gcs_object_path and settings.gcs_bucket_name:
            try:
                client = _get_gcs_client()
                bucket = client.bucket(settings.gcs_bucket_name)
                blob = bucket.blob(doc.gcs_object_path)
                signed_url = self._generate_signed_url(blob)
            except HTTPException:
                # GCS not configured — return metadata without URL
                pass

        return self._to_response(doc, signed_url=signed_url)

    def _generate_signed_url(self, blob) -> str:
        """Generate a 1-hour signed URL for a GCS blob."""
        return blob.generate_signed_url(expiration=timedelta(hours=1), method="GET")

    # ── List ──────────────────────────────────────────────────────

    async def list_documents(
        self,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[uuid.UUID] = None,
        document_type: Optional[DocumentType] = None,
    ) -> DocumentList:
        items, total = await self.repo.get_all(page, page_size, entity_type, entity_id, document_type)
        return DocumentList(
            items=[self._to_list_item(doc) for doc in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # ── Delete ────────────────────────────────────────────────────

    async def delete_document(self, document_id: uuid.UUID) -> None:
        """Soft-delete metadata in DB and remove object from GCS."""
        doc = await self.repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        # Remove from GCS if configured
        if doc.gcs_object_path and settings.gcs_bucket_name:
            try:
                client = _get_gcs_client()
                bucket = client.bucket(settings.gcs_bucket_name)
                blob = bucket.blob(doc.gcs_object_path)
                blob.delete()
            except HTTPException:
                # GCS not configured — skip GCS deletion, still soft-delete metadata
                logger.warning(
                    "GCS not configured; skipping GCS deletion for document %s", document_id
                )
            except Exception as exc:
                logger.error("Failed to delete GCS object for document %s: %s", document_id, exc)

        await self.repo.soft_delete(doc)
