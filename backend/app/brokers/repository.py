"""Brokers repository — async database queries with tenant isolation."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.broker import Broker


class BrokerRepository:
    """All broker DB operations. Every query MUST filter by company_id."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[Broker], int]:
        """Paginated list with optional name/mc_number search."""
        query = (
            select(Broker)
            .where(Broker.company_id == self.company_id)
            .where(Broker.is_active == True)
        )
        count_query = (
            select(func.count())
            .select_from(Broker)
            .where(Broker.company_id == self.company_id)
            .where(Broker.is_active == True)
        )

        if search:
            like_pattern = f"%{search}%"
            search_filter = or_(
                Broker.name.ilike(like_pattern),
                Broker.mc_number.ilike(like_pattern),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = (await self.db.execute(count_query)).scalar() or 0

        query = (
            query.order_by(Broker.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def search(self, q: str, limit: int = 10) -> list[Broker]:
        """Auto-complete search — returns lightweight results."""
        like_pattern = f"%{q}%"
        query = (
            select(Broker)
            .where(Broker.company_id == self.company_id)
            .where(Broker.is_active == True)
            .where(
                or_(
                    Broker.name.ilike(like_pattern),
                    Broker.mc_number.ilike(like_pattern),
                )
            )
            .order_by(Broker.name)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, broker_id: UUID) -> Optional[Broker]:
        """Get single broker by ID (tenant-scoped)."""
        query = (
            select(Broker)
            .where(Broker.id == broker_id)
            .where(Broker.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Broker:
        """Insert new broker record."""
        broker = Broker(company_id=self.company_id, **kwargs)
        self.db.add(broker)
        await self.db.commit()
        await self.db.refresh(broker)
        return broker

    async def update(self, broker: Broker, **kwargs) -> Broker:
        """Update broker fields."""
        for key, value in kwargs.items():
            if value is not None:
                setattr(broker, key, value)
        await self.db.commit()
        await self.db.refresh(broker)
        return broker

    async def soft_delete(self, broker: Broker) -> None:
        """Soft delete — sets is_active = False."""
        broker.is_active = False
        await self.db.commit()
