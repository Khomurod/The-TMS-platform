"""Documents router — Document Vault API endpoints.

Endpoints:
  POST   /documents/upload       — Upload a document (multipart form)
  GET    /documents/             — List documents (filters: entity_type, entity_id, document_type)
  GET    /documents/{id}         — Get document metadata + signed download URL
  DELETE /documents/{id}         — Soft-delete document + remove from GCS
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_company_id, get_current_user_id
from app.documents.schemas import DocumentList, DocumentResponse
from app.documents.service import DocumentService
from app.models.document import DocumentType, EntityType

router = APIRouter(prefix="/documents", tags=["Documents"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
    user_id: str = Depends(get_current_user_id),
) -> DocumentService:
    return DocumentService(db, company_id, UUID(user_id))


# ══════════════════════════════════════════════════════════════════
#   Upload
# ══════════════════════════════════════════════════════════════════

@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    entity_type: EntityType = Form(...),
    entity_id: UUID = Form(...),
    svc: DocumentService = Depends(_get_service),
):
    """Upload a document to GCS and persist metadata.

    Accepts multipart/form-data with the file plus form fields:
    document_type, entity_type, entity_id.
    """
    return await svc.upload_document(file, document_type, entity_type, entity_id)


# ══════════════════════════════════════════════════════════════════
#   List (before /{document_id} to avoid path conflicts)
# ══════════════════════════════════════════════════════════════════

@router.get("/", response_model=DocumentList)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_type: Optional[EntityType] = Query(None),
    entity_id: Optional[UUID] = Query(None),
    document_type: Optional[DocumentType] = Query(None),
    svc: DocumentService = Depends(_get_service),
):
    """List documents for the current tenant with optional filters."""
    return await svc.list_documents(page, page_size, entity_type, entity_id, document_type)


# ══════════════════════════════════════════════════════════════════
#   Get by ID
# ══════════════════════════════════════════════════════════════════

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    svc: DocumentService = Depends(_get_service),
):
    """Get document metadata and a fresh signed download URL (valid 1 hour)."""
    return await svc.get_document(document_id)


# ══════════════════════════════════════════════════════════════════
#   Delete
# ══════════════════════════════════════════════════════════════════

@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: UUID,
    svc: DocumentService = Depends(_get_service),
):
    """Soft-delete document metadata and remove the file from GCS."""
    await svc.delete_document(document_id)
