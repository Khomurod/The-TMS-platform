"""Dashboard API — Executive dashboard KPIs, compliance alerts, fleet status, recent events.

Endpoints:
  GET /dashboard/kpis             — All KPI metrics
  GET /dashboard/compliance-alerts — Expiring docs within 30 days
  GET /dashboard/fleet-status     — Truck distribution
  GET /dashboard/recent-events    — Latest load status changes
"""

import logging
import traceback

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

logger = logging.getLogger("safehaul.dashboard")

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
    try:
        threshold = datetime.now(timezone.utc).date() + timedelta(days=30)
        today = datetime.now(timezone.utc).date()

        # Pull only required columns from Driver to avoid decrypting unrelated
        # encrypted fields when assembling dashboard alerts.
        # Driver CDL expiry
        cdl_query = (
            select(Driver.id, Driver.first_name, Driver.last_name, Driver.cdl_expiry_date)
            .where(Driver.company_id == company_id)
            .where(Driver.is_active == True)
            .where(Driver.cdl_expiry_date.isnot(None))
            .where(Driver.cdl_expiry_date <= threshold)
        )
        cdl_results = (await db.execute(cdl_query)).all()

        # Driver medical card expiry
        medical_query = (
            select(Driver.id, Driver.first_name, Driver.last_name, Driver.medical_card_expiry_date)
            .where(Driver.company_id == company_id)
            .where(Driver.is_active == True)
            .where(Driver.medical_card_expiry_date.isnot(None))
            .where(Driver.medical_card_expiry_date <= threshold)
        )
        medical_results = (await db.execute(medical_query)).all()

        # Truck DOT inspection expiry
        dot_query = (
            select(Truck)
            .where(Truck.company_id == company_id)
            .where(Truck.is_active == True)
            .where(Truck.dot_inspection_expiry.isnot(None))
            .where(Truck.dot_inspection_expiry <= threshold)
        )
        dot_results = (await db.execute(dot_query)).scalars().all()

        alerts = []

        for row in cdl_results:
            driver_id, first_name, last_name, cdl_expiry_date = row
            if cdl_expiry_date is None:
                continue
            is_expired = cdl_expiry_date <= today
            alerts.append({
                "type": "cdl_expiry",
                "severity": "critical" if is_expired else "warning",
                "entity_type": "driver",
                "entity_id": str(driver_id),
                "entity_name": f"{first_name} {last_name}",
                "description": f"CDL {'expired' if is_expired else 'expires'} on {cdl_expiry_date}",
                "expiry_date": str(cdl_expiry_date),
            })

        for row in medical_results:
            driver_id, first_name, last_name, medical_expiry_date = row
            if medical_expiry_date is None:
                continue
            is_expired = medical_expiry_date <= today
            alerts.append({
                "type": "medical_card_expiry",
                "severity": "critical" if is_expired else "warning",
                "entity_type": "driver",
                "entity_id": str(driver_id),
                "entity_name": f"{first_name} {last_name}",
                "description": f"Medical card {'expired' if is_expired else 'expires'} on {medical_expiry_date}",
                "expiry_date": str(medical_expiry_date),
            })

        for t in dot_results:
            if t.dot_inspection_expiry is None:
                continue
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
    except Exception:
        logger.error("compliance-alerts crashed:\n%s", traceback.format_exc())
        raise


# ── Fleet Status ─────────────────────────────────────────────────

@router.get("/fleet-status")
async def get_fleet_status(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company_id),
):
    """Truck distribution by status — single optimized query."""
    from sqlalchemy import case, literal

    # Single query: count trucks grouped by status
    status_query = (
        select(
            func.coalesce(func.count().filter(
                Truck.status == EquipmentStatus.available
            ), 0).label("available"),
            func.coalesce(func.count().filter(
                Truck.status == EquipmentStatus.in_use
            ), 0).label("in_use"),
            func.coalesce(func.count().filter(
                Truck.status == EquipmentStatus.maintenance
            ), 0).label("maintenance"),
        )
        .where(Truck.company_id == company_id)
        .where(Truck.is_active == True)
    )
    result = (await db.execute(status_query)).one()

    available = result.available or 0
    in_use = result.in_use or 0
    maintenance = result.maintenance or 0
    total = available + in_use + maintenance
    utilization = round((in_use / total) * 100, 1) if total > 0 else 0

    return {
        "loaded": in_use,
        "available": available,
        "in_shop": maintenance,
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
    try:
        from sqlalchemy.orm import selectinload

        query = (
            select(Load)
            .where(Load.company_id == company_id)
            .where(Load.is_active == True)
            .options(
                selectinload(Load.trips),
                selectinload(Load.stops),
            )
            .order_by(func.coalesce(Load.updated_at, Load.created_at).desc())
            .limit(10)
        )
        result = await db.execute(query)
        loads = result.scalars().unique().all()

        # Build a lightweight driver name map (id -> full name) using only
        # non-encrypted columns to avoid decrypt errors in dashboard lists.
        driver_ids: set[UUID] = set()
        for load in loads:
            trips = getattr(load, 'trips', None) or []
            if not trips:
                continue
            primary_trip = next(
                (t for t in trips if getattr(t, 'sequence_number', 0) == 1),
                trips[0] if trips else None
            )
            if primary_trip and getattr(primary_trip, "driver_id", None):
                driver_ids.add(primary_trip.driver_id)

        driver_name_map: dict[UUID, str] = {}
        if driver_ids:
            driver_rows = (await db.execute(
                select(Driver.id, Driver.first_name, Driver.last_name)
                .where(Driver.company_id == company_id)
                .where(Driver.id.in_(driver_ids))
                .where(Driver.is_active == True)
            )).all()
            for driver_id, first_name, last_name in driver_rows:
                full_name = f"{first_name or ''} {last_name or ''}".strip()
                if full_name:
                    driver_name_map[driver_id] = full_name

        events = []
        for load in loads:
            # Driver info from primary trip
            driver_name = None
            trips = getattr(load, 'trips', None) or []
            if trips:
                primary_trip = next(
                    (t for t in trips if getattr(t, 'sequence_number', 0) == 1),
                    trips[0] if trips else None
                )
                if primary_trip and getattr(primary_trip, "driver_id", None):
                    driver_name = driver_name_map.get(primary_trip.driver_id)

            stops = getattr(load, 'stops', None) or []
            stops = sorted(stops, key=lambda s: getattr(s, 'stop_sequence', 0)) if stops else []
            origin = getattr(stops[0], 'city', None) if stops else None
            dest = getattr(stops[-1], 'city', None) if stops else None

            # Determine event color
            event_color = "blue"
            status_val = load.status.value if hasattr(load.status, 'value') else load.status
            if status_val in ("delivered", "invoiced", "paid"):
                event_color = "green"
            elif status_val == "cancelled":
                event_color = "red"

            updated = getattr(load, 'updated_at', None)
            events.append({
                "load_id": str(load.id),
                "load_number": load.load_number,
                "status": status_val,
                "description": f"{origin or '—'} → {dest or '—'}",
                "driver_name": driver_name,
                "timestamp": updated.isoformat() if updated else None,
                "color": event_color,
            })

        return {"events": events}
    except Exception:
        logger.error("recent-events crashed:\n%s", traceback.format_exc())
        raise
