"""Dashboard API — Executive dashboard KPIs, compliance alerts, fleet status, recent events.

Endpoints:
  GET /dashboard/kpis             — All KPI metrics
  GET /dashboard/compliance-alerts — Expiring docs within 30 days
  GET /dashboard/fleet-status     — Truck distribution
  GET /dashboard/recent-events    — Latest load status changes
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_company_id
from app.models.base import LoadStatus, DriverStatus
from app.models.load import Load, Trip
from app.models.driver import Driver
from app.models.fleet import Truck, EquipmentStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── KPIs ─────────────────────────────────────────────────────────

@router.get("/kpis")
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
):
    """Executive KPI metrics — optimized to 2 queries using conditional aggregation."""
    from sqlalchemy import case, literal

    completed_statuses = [LoadStatus.delivered, LoadStatus.invoiced, LoadStatus.paid]
    active_statuses = [LoadStatus.assigned, LoadStatus.dispatched, LoadStatus.in_transit]
    upcoming_statuses = [LoadStatus.offer, LoadStatus.booked]

    # Single query for all load KPIs
    load_kpi_query = (
        select(
            func.coalesce(func.sum(
                case((Load.status.in_(completed_statuses), Load.total_rate), else_=literal(0))
            ), 0).label("gross_revenue"),
            func.coalesce(func.sum(
                case((Load.status.in_(completed_statuses), Load.total_miles), else_=literal(0))
            ), 0).label("total_miles"),
            func.count().filter(Load.status.in_(active_statuses)).label("active_loads"),
            func.count().filter(Load.status.in_(upcoming_statuses)).label("upcoming_loads"),
        )
        .where(Load.company_id == company_id)
        .where(Load.is_active == True)
    )
    load_result = (await db.execute(load_kpi_query)).one()
    gross_revenue = float(load_result.gross_revenue or 0)
    total_miles = float(load_result.total_miles or 0)
    avg_rpm = round(gross_revenue / total_miles, 2) if total_miles > 0 else 0

    # Single query for driver KPIs
    driver_kpi_query = (
        select(
            func.count().label("active_drivers"),
            func.count().filter(Driver.status == DriverStatus.on_trip).label("on_trip_drivers"),
        )
        .where(Driver.company_id == company_id)
        .where(Driver.is_active == True)
    )
    driver_result = (await db.execute(driver_kpi_query)).one()
    active_drivers = driver_result.active_drivers or 0
    on_trip_drivers = driver_result.on_trip_drivers or 0
    fleet_effectiveness = round((on_trip_drivers / active_drivers) * 100, 1) if active_drivers > 0 else 0

    return {
        "gross_revenue": gross_revenue,
        "avg_rpm": avg_rpm,
        "active_loads": load_result.active_loads or 0,
        "upcoming_loads": load_result.upcoming_loads or 0,
        "fleet_effectiveness": fleet_effectiveness,
        "active_drivers": active_drivers,
        "on_trip_drivers": on_trip_drivers,
    }


# ── Compliance Alerts ────────────────────────────────────────────

@router.get("/compliance-alerts")
async def get_compliance_alerts(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
):
    """Expiring documents within 30 days."""
    threshold = datetime.now(timezone.utc).date() + timedelta(days=30)

    # Driver CDL expiry
    cdl_query = (
        select(Driver)
        .where(Driver.company_id == company_id)
        .where(Driver.is_active == True)
        .where(Driver.cdl_expiry_date != None)
        .where(Driver.cdl_expiry_date <= threshold)
    )
    cdl_results = (await db.execute(cdl_query)).scalars().all()

    # Driver medical card expiry
    medical_query = (
        select(Driver)
        .where(Driver.company_id == company_id)
        .where(Driver.is_active == True)
        .where(Driver.medical_card_expiry_date != None)
        .where(Driver.medical_card_expiry_date <= threshold)
    )
    medical_results = (await db.execute(medical_query)).scalars().all()

    # Truck DOT inspection expiry
    dot_query = (
        select(Truck)
        .where(Truck.company_id == company_id)
        .where(Truck.is_active == True)
        .where(Truck.dot_inspection_expiry != None)
        .where(Truck.dot_inspection_expiry <= threshold)
    )
    dot_results = (await db.execute(dot_query)).scalars().all()

    alerts = []
    today = datetime.now(timezone.utc).date()

    for d in cdl_results:
        is_expired = d.cdl_expiry_date <= today
        alerts.append({
            "type": "cdl_expiry",
            "severity": "critical" if is_expired else "warning",
            "entity_type": "driver",
            "entity_id": str(d.id),
            "entity_name": f"{d.first_name} {d.last_name}",
            "description": f"CDL {'expired' if is_expired else 'expires'} on {d.cdl_expiry_date}",
            "expiry_date": str(d.cdl_expiry_date),
        })

    for d in medical_results:
        is_expired = d.medical_card_expiry_date <= today
        alerts.append({
            "type": "medical_card_expiry",
            "severity": "critical" if is_expired else "warning",
            "entity_type": "driver",
            "entity_id": str(d.id),
            "entity_name": f"{d.first_name} {d.last_name}",
            "description": f"Medical card {'expired' if is_expired else 'expires'} on {d.medical_card_expiry_date}",
            "expiry_date": str(d.medical_card_expiry_date),
        })

    for t in dot_results:
        is_expired = t.dot_inspection_expiry <= today
        alerts.append({
            "type": "dot_inspection_expiry",
            "severity": "critical" if is_expired else "warning",
            "entity_type": "truck",
            "entity_id": str(t.id),
            "entity_name": t.unit_number,
            "description": f"DOT inspection {'expired' if is_expired else 'expires'} on {t.dot_inspection_expiry}",
            "expiry_date": str(t.dot_inspection_expiry),
        })

    # Sort: critical first, then by expiry date
    alerts.sort(key=lambda a: (0 if a["severity"] == "critical" else 1, a["expiry_date"]))

    return {"alerts": alerts, "critical_count": sum(1 for a in alerts if a["severity"] == "critical")}


# ── Fleet Status ─────────────────────────────────────────────────

@router.get("/fleet-status")
async def get_fleet_status(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
):
    """Truck distribution by status."""
    statuses = [EquipmentStatus.available, EquipmentStatus.in_use, EquipmentStatus.maintenance]
    result = {}

    for status in statuses:
        count_query = (
            select(func.count())
            .select_from(Truck)
            .where(Truck.company_id == company_id)
            .where(Truck.is_active == True)
            .where(Truck.status == status)
        )
        count = (await db.execute(count_query)).scalar() or 0
        result[status.value] = count

    total = sum(result.values())
    utilization = round((result.get("in_use", 0) / total) * 100, 1) if total > 0 else 0

    return {
        "loaded": result.get("in_use", 0),
        "available": result.get("available", 0),
        "in_shop": result.get("maintenance", 0),
        "total": total,
        "utilization_rate": utilization,
    }


# ── Recent Events ────────────────────────────────────────────────

@router.get("/recent-events")
async def get_recent_events(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
):
    """Latest load status changes (most recently updated loads)."""
    from sqlalchemy.orm import selectinload

    query = (
        select(Load)
        .where(Load.company_id == company_id)
        .where(Load.is_active == True)
        .options(
            selectinload(Load.trips).selectinload(Trip.driver),
            selectinload(Load.stops),
        )
        .order_by(func.coalesce(Load.updated_at, Load.created_at).desc())
        .limit(10)
    )
    result = await db.execute(query)
    loads = result.scalars().unique().all()

    events = []
    for load in loads:
        # Driver info from primary trip
        driver_name = None
        if load.trips:
            primary_trip = next(
                (t for t in load.trips if t.sequence_number == 1), load.trips[0]
            ) if load.trips else None
            if primary_trip and primary_trip.driver:
                driver_name = f"{primary_trip.driver.first_name} {primary_trip.driver.last_name}"

        stops = sorted(load.stops, key=lambda s: s.stop_sequence) if load.stops else []
        origin = stops[0].city if stops else None
        dest = stops[-1].city if stops else None

        # Determine event color
        event_color = "blue"
        status_val = load.status.value if hasattr(load.status, 'value') else load.status
        if status_val in ("delivered", "invoiced", "paid"):
            event_color = "green"
        elif status_val == "cancelled":
            event_color = "red"

        events.append({
            "load_id": str(load.id),
            "load_number": load.load_number,
            "status": status_val,
            "description": f"{origin or '—'} → {dest or '—'}",
            "driver_name": driver_name,
            "timestamp": load.updated_at.isoformat() if load.updated_at else None,
            "color": event_color,
        })

    return {"events": events}
