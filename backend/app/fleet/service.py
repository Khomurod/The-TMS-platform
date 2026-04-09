"""Fleet service — business logic for Trucks & Trailers CRUD."""

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.fleet.repository import TruckRepository, TrailerRepository
from app.fleet.schemas import (
    TruckCreate, TruckUpdate, TruckResponse, TruckListResponse, TruckAvailableResponse,
    TrailerCreate, TrailerUpdate, TrailerResponse, TrailerListResponse, TrailerAvailableResponse,
)
from app.core.exceptions import NotFoundError


class TruckService:
    """Truck business logic."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.repo = TruckRepository(db, company_id)

    async def list_trucks(
        self, page: int = 1, page_size: int = 20, status: Optional[str] = None
    ) -> TruckListResponse:
        items, total = await self.repo.list(page, page_size, status)
        return TruckListResponse(
            items=[TruckResponse.model_validate(t) for t in items],
            total=total, page=page, page_size=page_size,
        )

    async def get_truck(self, truck_id: UUID) -> TruckResponse:
        truck = await self.repo.get_by_id(truck_id)
        if not truck:
            raise NotFoundError("Truck not found")
        return TruckResponse.model_validate(truck)

    async def create_truck(self, data: TruckCreate) -> TruckResponse:
        truck = await self.repo.create(**data.model_dump())
        return TruckResponse.model_validate(truck)

    async def update_truck(self, truck_id: UUID, data: TruckUpdate) -> TruckResponse:
        """Update truck. Status changes are guarded:
        - Cannot manually set 'in_use' (only dispatch should set this).
        - Cannot set 'available' if currently 'in_use' (only load completion releases).
        """
        truck = await self.repo.get_by_id(truck_id)
        if not truck:
            raise NotFoundError("Truck not found")

        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data:
            from app.models.fleet import EquipmentStatus
            new_status = update_data["status"]
            current_status = truck.status.value if hasattr(truck.status, 'value') else truck.status
            if new_status == "in_use":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot manually set status to 'in_use'. Use dispatch workflow.",
                )
            if current_status == "in_use" and new_status == "available":
                raise HTTPException(
                    status_code=409,
                    detail="Cannot set truck to 'available' while in use by an active load.",
                )

        updated = await self.repo.update(truck, **update_data)
        return TruckResponse.model_validate(updated)

    async def delete_truck(self, truck_id: UUID) -> None:
        truck = await self.repo.get_by_id(truck_id)
        if not truck:
            raise NotFoundError("Truck not found")
        await self.repo.soft_delete(truck)

    async def get_available(self) -> list[TruckAvailableResponse]:
        trucks = await self.repo.get_available()
        return [TruckAvailableResponse.model_validate(t) for t in trucks]


class TrailerService:
    """Trailer business logic."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.repo = TrailerRepository(db, company_id)

    async def list_trailers(
        self, page: int = 1, page_size: int = 20, status: Optional[str] = None
    ) -> TrailerListResponse:
        items, total = await self.repo.list(page, page_size, status)
        return TrailerListResponse(
            items=[TrailerResponse.model_validate(t) for t in items],
            total=total, page=page, page_size=page_size,
        )

    async def get_trailer(self, trailer_id: UUID) -> TrailerResponse:
        trailer = await self.repo.get_by_id(trailer_id)
        if not trailer:
            raise NotFoundError("Trailer not found")
        return TrailerResponse.model_validate(trailer)

    async def create_trailer(self, data: TrailerCreate) -> TrailerResponse:
        trailer = await self.repo.create(**data.model_dump())
        return TrailerResponse.model_validate(trailer)

    async def update_trailer(self, trailer_id: UUID, data: TrailerUpdate) -> TrailerResponse:
        """Update trailer. Status changes are guarded (same rules as trucks)."""
        trailer = await self.repo.get_by_id(trailer_id)
        if not trailer:
            raise NotFoundError("Trailer not found")

        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data:
            from app.models.fleet import EquipmentStatus
            new_status = update_data["status"]
            current_status = trailer.status.value if hasattr(trailer.status, 'value') else trailer.status
            if new_status == "in_use":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot manually set status to 'in_use'. Use dispatch workflow.",
                )
            if current_status == "in_use" and new_status == "available":
                raise HTTPException(
                    status_code=409,
                    detail="Cannot set trailer to 'available' while in use by an active load.",
                )

        updated = await self.repo.update(trailer, **update_data)
        return TrailerResponse.model_validate(updated)

    async def delete_trailer(self, trailer_id: UUID) -> None:
        trailer = await self.repo.get_by_id(trailer_id)
        if not trailer:
            raise NotFoundError("Trailer not found")
        await self.repo.soft_delete(trailer)

    async def get_available(self) -> list[TrailerAvailableResponse]:
        trailers = await self.repo.get_available()
        return [TrailerAvailableResponse.model_validate(t) for t in trailers]
