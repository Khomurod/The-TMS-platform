"""Brokers service — business logic for broker CRUD operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.brokers.repository import BrokerRepository
from app.brokers.schemas import (
    BrokerCreate,
    BrokerUpdate,
    BrokerResponse,
    BrokerListResponse,
    BrokerSearchResult,
)
from app.core.exceptions import NotFoundError


class BrokerService:
    """Broker business logic — thin layer delegating to repository."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.repo = BrokerRepository(db, company_id)

    async def list_brokers(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> BrokerListResponse:
        """Paginated broker list with optional search."""
        items, total = await self.repo.list(page, page_size, search)
        return BrokerListResponse(
            items=[BrokerResponse.model_validate(b) for b in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def search_brokers(self, q: str) -> list[BrokerSearchResult]:
        """Auto-complete search for load creation."""
        items = await self.repo.search(q)
        return [BrokerSearchResult.model_validate(b) for b in items]

    async def get_broker(self, broker_id: UUID) -> BrokerResponse:
        """Get single broker by ID."""
        broker = await self.repo.get_by_id(broker_id)
        if not broker:
            raise NotFoundError("Broker not found")
        return BrokerResponse.model_validate(broker)

    async def create_broker(self, data: BrokerCreate) -> BrokerResponse:
        """Create a new broker."""
        broker = await self.repo.create(**data.model_dump())
        return BrokerResponse.model_validate(broker)

    async def update_broker(
        self, broker_id: UUID, data: BrokerUpdate
    ) -> BrokerResponse:
        """Update existing broker."""
        broker = await self.repo.get_by_id(broker_id)
        if not broker:
            raise NotFoundError("Broker not found")
        updated = await self.repo.update(
            broker, **data.model_dump(exclude_unset=True)
        )
        return BrokerResponse.model_validate(updated)

    async def delete_broker(self, broker_id: UUID) -> None:
        """Soft delete a broker (sets is_active = False)."""
        broker = await self.repo.get_by_id(broker_id)
        if not broker:
            raise NotFoundError("Broker not found")
        await self.repo.soft_delete(broker)
