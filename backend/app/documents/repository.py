"""Documents repository — async database queries for document metadata."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentType, EntityType


class DocumentRepository:
    """Document DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        """Base query filtered to current tenant and not soft-deleted."""
        return (
            select(Document)
            .where(Document.company_id == self.company_id)
            .where(Document.is_deleted == False)  # noqa: E712
        )

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[UUID] = None,
        document_type: Optional[DocumentType] = None,
    ) -> tuple[list[Document], int]:
        """Paginated list with optional filters."""
        query = self._base_query()
        count_query = (
            select(func.count())
            .select_from(Document)
            .where(Document.company_id == self.company_id)
            .where(Document.is_deleted == False)  # noqa: E712
        )

        if entity_type is not None:
            query = query.where(Document.entity_type == entity_type)
            count_query = count_query.where(Document.entity_type == entity_type)

        if entity_id is not None:
            query = query.where(Document.entity_id == entity_id)
            count_query = count_query.where(Document.entity_id == entity_id)

        if document_type is not None:
            query = query.where(Document.document_type == document_type)
            count_query = count_query.where(Document.document_type == document_type)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = (
            query.order_by(Document.uploaded_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_id(self, document_id: UUID) -> Optional[Document]:
        """Fetch a single document by ID (tenant-scoped, not deleted)."""
        query = self._base_query().where(Document.id == document_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Document:
        """Persist a new document metadata record."""
        doc = Document(company_id=self.company_id, **kwargs)
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def soft_delete(self, document: Document) -> None:
        """Mark document as deleted (does not remove from GCS)."""
        document.is_deleted = True
        await self.db.commit()
