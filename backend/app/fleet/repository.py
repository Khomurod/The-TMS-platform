"""Fleet repository — async database queries for Trucks & Trailers."""

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fleet import Truck, Trailer, EquipmentStatus


class TruckRepository:
    """Truck DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> tuple[list[Truck], int]:
        query = (
            select(Truck)
            .where(Truck.company_id == self.company_id)
            .where(Truck.is_active == True)
        )
        count_query = (
            select(func.count())
            .select_from(Truck)
            .where(Truck.company_id == self.company_id)
            .where(Truck.is_active == True)
        )

        if status:
            query = query.where(Truck.status == status)
            count_query = count_query.where(Truck.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = (
            query.order_by(Truck.unit_number)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_id(self, truck_id: UUID) -> Optional[Truck]:
        query = (
            select(Truck)
            .where(Truck.id == truck_id)
            .where(Truck.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_available(self) -> list[Truck]:
        """Available trucks with valid DOT inspection."""
        today = date.today()
        query = (
            select(Truck)
            .where(Truck.company_id == self.company_id)
            .where(Truck.is_active == True)
            .where(Truck.status == EquipmentStatus.available)
            .where(
                (Truck.dot_inspection_expiry.is_(None))
                | (Truck.dot_inspection_expiry > today)
            )
            .order_by(Truck.unit_number)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Truck:
        truck = Truck(company_id=self.company_id, **kwargs)
        self.db.add(truck)
        await self.db.commit()
        await self.db.refresh(truck)
        return truck

    async def update(self, truck: Truck, **kwargs) -> Truck:
        for key, value in kwargs.items():
            if value is not None:
                setattr(truck, key, value)
        await self.db.commit()
        await self.db.refresh(truck)
        return truck

    async def soft_delete(self, truck: Truck) -> None:
        truck.is_active = False
        await self.db.commit()


class TrailerRepository:
    """Trailer DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> tuple[list[Trailer], int]:
        query = (
            select(Trailer)
            .where(Trailer.company_id == self.company_id)
            .where(Trailer.is_active == True)
        )
        count_query = (
            select(func.count())
            .select_from(Trailer)
            .where(Trailer.company_id == self.company_id)
            .where(Trailer.is_active == True)
        )

        if status:
            query = query.where(Trailer.status == status)
            count_query = count_query.where(Trailer.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = (
            query.order_by(Trailer.unit_number)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_id(self, trailer_id: UUID) -> Optional[Trailer]:
        query = (
            select(Trailer)
            .where(Trailer.id == trailer_id)
            .where(Trailer.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_available(self) -> list[Trailer]:
        """Available trailers with valid DOT inspection."""
        today = date.today()
        query = (
            select(Trailer)
            .where(Trailer.company_id == self.company_id)
            .where(Trailer.is_active == True)
            .where(Trailer.status == EquipmentStatus.available)
            .where(
                (Trailer.dot_inspection_expiry.is_(None))
                | (Trailer.dot_inspection_expiry > today)
            )
            .order_by(Trailer.unit_number)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Trailer:
        trailer = Trailer(company_id=self.company_id, **kwargs)
        self.db.add(trailer)
        await self.db.commit()
        await self.db.refresh(trailer)
        return trailer

    async def update(self, trailer: Trailer, **kwargs) -> Trailer:
        for key, value in kwargs.items():
            if value is not None:
                setattr(trailer, key, value)
        await self.db.commit()
        await self.db.refresh(trailer)
        return trailer

    async def soft_delete(self, trailer: Trailer) -> None:
        trailer.is_active = False
        await self.db.commit()
