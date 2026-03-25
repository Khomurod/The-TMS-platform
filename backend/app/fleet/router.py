"""Fleet router — trucks & trailers management.

Truck Endpoints:
  GET    /fleet/trucks           — Paginated list with status filter
  GET    /fleet/trucks/available — Available + valid DOT only
  POST   /fleet/trucks           — Create
  GET    /fleet/trucks/{id}      — Detail
  PUT    /fleet/trucks/{id}      — Update
  DELETE /fleet/trucks/{id}      — Soft delete

Trailer Endpoints:
  GET    /fleet/trailers           — Paginated list with status filter
  GET    /fleet/trailers/available — Available + valid DOT only
  POST   /fleet/trailers           — Create
  GET    /fleet/trailers/{id}      — Detail
  PUT    /fleet/trailers/{id}      — Update
  DELETE /fleet/trailers/{id}      — Soft delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.fleet.schemas import (
    TruckCreate, TruckUpdate, TruckResponse, TruckListResponse, TruckAvailableResponse,
    TrailerCreate, TrailerUpdate, TrailerResponse, TrailerListResponse, TrailerAvailableResponse,
)
from app.fleet.service import TruckService, TrailerService
from app.core.database import get_db
from app.core.dependencies import get_current_company_id, require_roles

router = APIRouter(prefix="/fleet", tags=["Fleet"])


# ── Dependency Helpers ───────────────────────────────────────────

def _get_truck_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> TruckService:
    return TruckService(db, company_id)


def _get_trailer_service(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
) -> TrailerService:
    return TrailerService(db, company_id)


# ══════════════════════════════════════════════════════════════════
#   TRUCKS
# ══════════════════════════════════════════════════════════════════

@router.get("/trucks", response_model=TruckListResponse)
async def list_trucks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    svc: TruckService = Depends(_get_truck_service),
):
    return await svc.list_trucks(page, page_size, status)


@router.get("/trucks/available", response_model=list[TruckAvailableResponse])
async def get_available_trucks(
    svc: TruckService = Depends(_get_truck_service),
):
    return await svc.get_available()


@router.post("/trucks", response_model=TruckResponse, status_code=201)
async def create_truck(
    data: TruckCreate,
    svc: TruckService = Depends(_get_truck_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    return await svc.create_truck(data)


@router.get("/trucks/{truck_id}", response_model=TruckResponse)
async def get_truck(
    truck_id: UUID,
    svc: TruckService = Depends(_get_truck_service),
):
    return await svc.get_truck(truck_id)


@router.put("/trucks/{truck_id}", response_model=TruckResponse)
async def update_truck(
    truck_id: UUID,
    data: TruckUpdate,
    svc: TruckService = Depends(_get_truck_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    return await svc.update_truck(truck_id, data)


@router.delete("/trucks/{truck_id}", status_code=204)
async def delete_truck(
    truck_id: UUID,
    svc: TruckService = Depends(_get_truck_service),
    _role=Depends(require_roles("company_admin")),
):
    await svc.delete_truck(truck_id)


# ══════════════════════════════════════════════════════════════════
#   TRAILERS
# ══════════════════════════════════════════════════════════════════

@router.get("/trailers", response_model=TrailerListResponse)
async def list_trailers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    svc: TrailerService = Depends(_get_trailer_service),
):
    return await svc.list_trailers(page, page_size, status)


@router.get("/trailers/available", response_model=list[TrailerAvailableResponse])
async def get_available_trailers(
    svc: TrailerService = Depends(_get_trailer_service),
):
    return await svc.get_available()


@router.post("/trailers", response_model=TrailerResponse, status_code=201)
async def create_trailer(
    data: TrailerCreate,
    svc: TrailerService = Depends(_get_trailer_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    return await svc.create_trailer(data)


@router.get("/trailers/{trailer_id}", response_model=TrailerResponse)
async def get_trailer(
    trailer_id: UUID,
    svc: TrailerService = Depends(_get_trailer_service),
):
    return await svc.get_trailer(trailer_id)


@router.put("/trailers/{trailer_id}", response_model=TrailerResponse)
async def update_trailer(
    trailer_id: UUID,
    data: TrailerUpdate,
    svc: TrailerService = Depends(_get_trailer_service),
    _role=Depends(require_roles("company_admin", "dispatcher")),
):
    return await svc.update_trailer(trailer_id, data)


@router.delete("/trailers/{trailer_id}", status_code=204)
async def delete_trailer(
    trailer_id: UUID,
    svc: TrailerService = Depends(_get_trailer_service),
    _role=Depends(require_roles("company_admin")),
):
    await svc.delete_trailer(trailer_id)
