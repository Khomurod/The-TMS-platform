"""Accounting service — Trip-level settlement math, batch management, PDF export, invoicing.

Step 2 tasks covered:
  - calculate_settlement — operates at Trip granularity (Percentage vs CPM vs Fixed)
  - Settlement batch post/unpost/pay workflow
  - PDF settlement generation (reportlab)
  - Invoice batch creation
"""

import io
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.accounting.repository import SettlementRepository
from app.accounting.schemas import (
    SettlementResponse,
    SettlementListItem,
    SettlementListResponse,
    SettlementLineItemResponse,
    SettlementGenerateRequest,
    InvoiceResponse,
    InvoiceListResponse,
)
from app.core.exceptions import NotFoundError
from app.models.base import SettlementBatchStatus, LoadStatus
from app.models.load import Load, Trip
from app.models.driver import Driver, PayRateType
from app.models.accounting import DriverSettlement, SettlementBatch


# ── Standalone Settlement Calculation ────────────────────────────

async def calculate_settlement_for_trips(
    driver: Driver, trips: list[Trip], db
) -> dict:
    """Core settlement calculation — operates at Trip granularity.

    Handles:
      - Percentage: % of Load total_rate
      - CPM: cents per loaded mile
      - Fixed per load: flat rate per trip
      - Hourly/Salary: approximated

    Returns dict with earning, deductions, bonus, net_pay, driver_gross, trip_count.
    """
    from app.models.accounting import CompanyDefaultDeduction

    total_earning = Decimal("0.00")
    driver_gross = Decimal("0.00")
    trip_details = []

    for trip in trips:
        load = trip.load
        if not load:
            continue

        pay_type = driver.pay_rate_type.value if hasattr(driver.pay_rate_type, 'value') else driver.pay_rate_type
        rate = Decimal(str(driver.pay_rate_value)) if driver.pay_rate_value else Decimal("0")

        if pay_type == PayRateType.percentage.value:
            # Owner Operator: % of Load total_rate
            base = Decimal(str(load.total_rate)) if load.total_rate else Decimal("0")
            trip_earning = (base * rate / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        elif pay_type == PayRateType.cpm.value:
            # Company Driver: Cents Per Mile
            miles = Decimal(str(trip.loaded_miles)) if trip.loaded_miles else Decimal("0")
            trip_earning = (miles * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        elif pay_type == PayRateType.fixed_per_load.value:
            trip_earning = rate.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        elif pay_type == PayRateType.hourly.value:
            trip_earning = (rate * Decimal("8")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        elif pay_type == PayRateType.salary.value:
            trip_earning = (rate / Decimal("52")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            trip_earning = Decimal("0.00")

        total_earning += trip_earning
        driver_gross += Decimal(str(load.total_rate or 0))

        trip_details.append({
            "trip": trip,
            "earning": trip_earning,
            "load": load,
        })

    # Get deductions
    deductions_query = (
        select(CompanyDefaultDeduction)
        .where(CompanyDefaultDeduction.company_id == driver.company_id)
    )
    deductions = list((await db.execute(deductions_query)).scalars().all())

    total_deductions = Decimal("0.00")
    for ded in deductions:
        ded_amount = Decimal(str(ded.amount))
        if ded.frequency.value == "per_load":
            ded_amount = ded_amount * len(trips)
        total_deductions += ded_amount

    net_pay = total_earning - total_deductions

    return {
        "earning": total_earning,
        "deductions": total_deductions,
        "bonus": Decimal("0.00"),
        "net_pay": net_pay,
        "driver_gross": driver_gross,
        "trip_count": len(trips),
        "trip_details": trip_details,
        "deduction_items": deductions,
    }


class AccountingService:
    """Accounting business logic — Trip-level pay calc, settlements, PDF, invoicing."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.repo = SettlementRepository(db, company_id)
        self.company_id = company_id

    # ═══════════════════════════════════════════════════════════════
    #   Settlement Generation — Trip-Level Math
    # ═══════════════════════════════════════════════════════════════

    async def generate_settlement(self, data: SettlementGenerateRequest) -> SettlementResponse:
        """Generate a draft settlement for a driver, calculating at Trip granularity."""
        driver_id = UUID(data.driver_id)
        driver = await self.repo.get_driver(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")

        if not driver.pay_rate_type or not driver.pay_rate_value:
            raise HTTPException(
                status_code=400,
                detail="Driver has no pay rate configured. Set pay_rate_type and pay_rate_value first.",
            )

        # Get delivered trips for this driver in the period
        trips = await self.repo.get_driver_trips(driver_id, data.period_start, data.period_end)
        if not trips:
            raise HTTPException(
                status_code=400,
                detail=f"No delivered trips found for this driver between {data.period_start} and {data.period_end}.",
            )

        # Core calculation
        calc = await calculate_settlement_for_trips(driver, trips, self.db)

        # Calculate total accessorials from trip details
        total_accessorials = Decimal("0")
        for detail in calc["trip_details"]:
            load = detail["load"]
            if load.accessorials:
                total_accessorials += sum(
                    Decimal(str(a.amount)) for a in load.accessorials
                )

        # Net pay = earnings + accessorials - deductions + bonus
        net_pay = calc["earning"] + total_accessorials - calc["deductions"] + calc["bonus"]

        # Create settlement record
        settlement_number = await self.repo.get_next_settlement_number()
        settlement = await self.repo.create(
            driver_id=driver_id,
            settlement_number=settlement_number,
            period_start=data.period_start,
            period_end=data.period_end,
            gross_pay=calc["earning"],
            total_accessorials=total_accessorials,
            total_deductions=calc["deductions"],
            total_bonus=calc["bonus"],
            net_pay=net_pay,
            status=SettlementBatchStatus.unposted,
        )

        import logging
        logger = logging.getLogger("safehaul.accounting")

        # Create line items for each trip
        for detail in calc["trip_details"]:
            trip = detail["trip"]
            load = detail["load"]
            stops = sorted(load.stops, key=lambda s: s.stop_sequence) if load.stops else []
            origin = stops[0].city if stops else "—"
            dest = stops[-1].city if stops else "—"

            await self.repo.add_line_item(
                settlement_id=settlement.id,
                load_id=load.id,
                trip_id=trip.id,
                type="load_pay",
                description=f"{load.load_number} ({origin} → {dest}) — {trip.loaded_miles or 0} mi",
                amount=detail["earning"],
            )

            # Add load accessorials
            if load.accessorials:
                for acc in load.accessorials:
                    acc_amount = Decimal(str(acc.amount))
                    await self.repo.add_line_item(
                        settlement_id=settlement.id,
                        load_id=load.id,
                        trip_id=trip.id,
                        type="accessorial",
                        description=f"{acc.type.replace('_', ' ').title()} — {load.load_number}",
                        amount=acc_amount,
                    )

        # Create deduction line items
        for ded in calc["deduction_items"]:
            ded_amount = Decimal(str(ded.amount))
            if ded.frequency.value == "per_load":
                ded_amount = ded_amount * calc["trip_count"]
            await self.repo.add_line_item(
                settlement_id=settlement.id,
                type="deduction",
                description=ded.name,
                amount=-ded_amount,
            )

        settlement = await self.repo.commit_and_refresh(settlement)

        logger.info(
            "Settlement %s generated: driver=%s, gross=%s, accessorials=%s, deductions=%s, net=%s",
            settlement_number, driver_id, calc["earning"], total_accessorials,
            calc["deductions"], net_pay,
        )

        return self._to_response(settlement)

    # ═══════════════════════════════════════════════════════════════
    #   Settlement Management (Post / Undo / Pay)
    # ═══════════════════════════════════════════════════════════════

    async def list_settlements(
        self, page: int = 1, page_size: int = 20,
        status: Optional[str] = None, driver_id: Optional[str] = None,
    ) -> SettlementListResponse:
        d_id = UUID(driver_id) if driver_id else None
        items, total = await self.repo.list(page, page_size, status, d_id)
        return SettlementListResponse(
            items=[self._to_list_item(s) for s in items],
            total=total, page=page, page_size=page_size,
        )

    async def get_settlement(self, settlement_id: UUID) -> SettlementResponse:
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        return self._to_response(settlement)

    async def post_settlement(self, settlement_id: UUID) -> SettlementResponse:
        """Post (freeze) a settlement — line items become read-only."""
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        if settlement.status != SettlementBatchStatus.unposted:
            raise HTTPException(status_code=400, detail="Only unposted settlements can be posted.")
        settlement.status = SettlementBatchStatus.posted
        await self.db.commit()
        await self.db.refresh(settlement)
        return self._to_response(settlement)

    async def unpost_settlement(self, settlement_id: UUID) -> SettlementResponse:
        """Undo post — revert to unposted so line items are editable again."""
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        if settlement.status != SettlementBatchStatus.posted:
            raise HTTPException(status_code=400, detail="Only posted settlements can be unposted.")
        settlement.status = SettlementBatchStatus.unposted
        await self.db.commit()
        await self.db.refresh(settlement)
        return self._to_response(settlement)

    async def pay_settlement(self, settlement_id: UUID) -> SettlementResponse:
        """Mark posted settlement as paid — terminal state."""
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        if settlement.status != SettlementBatchStatus.posted:
            raise HTTPException(status_code=400, detail="Only posted settlements can be marked as paid.")
        settlement.status = SettlementBatchStatus.paid
        settlement.paid_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(settlement)
        return self._to_response(settlement)

    # ═══════════════════════════════════════════════════════════════
    #   PDF Settlement Generation
    # ═══════════════════════════════════════════════════════════════

    async def generate_pdf(self, settlement_id: UUID) -> StreamingResponse:
        """Generate clean PDF paystub for a settlement."""
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")

        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="reportlab is not installed. Run: pip install reportlab",
            )

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        elements = []

        # Header
        elements.append(Paragraph("DRIVER SETTLEMENT REPORT", styles["Title"]))
        elements.append(Spacer(1, 8))

        driver_name = f"{settlement.driver.first_name} {settlement.driver.last_name}" if settlement.driver else "—"
        elements.append(Paragraph(
            f"<b>Settlement #:</b> {settlement.settlement_number} &nbsp;&nbsp; "
            f"<b>Period:</b> {settlement.period_start} — {settlement.period_end}",
            styles["Normal"],
        ))
        elements.append(Paragraph(f"<b>Driver:</b> {driver_name}", styles["Normal"]))
        elements.append(Spacer(1, 16))

        # Build line items table
        load_items = [li for li in settlement.line_items if li.type == "load_pay"]
        acc_items = [li for li in settlement.line_items if li.type == "accessorial"]
        ded_items = [li for li in settlement.line_items if li.type == "deduction"]

        table_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#333")),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8e8e8")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ])

        if load_items:
            elements.append(Paragraph("<b>Gross Earnings</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in load_items:
                table_data.append([li.description or "—", f"${li.amount:,.2f}"])
            table_data.append(["TOTAL GROSS", f"${settlement.gross_pay:,.2f}"])
            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(table_style)
            elements.append(t)
            elements.append(Spacer(1, 12))

        if acc_items:
            elements.append(Paragraph("<b>Accessorials & Extras</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in acc_items:
                table_data.append([li.description or "—", f"${li.amount:,.2f}"])
            table_data.append(["TOTAL EXTRAS", f"${settlement.total_accessorials:,.2f}"])
            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(table_style)
            elements.append(t)
            elements.append(Spacer(1, 12))

        if ded_items:
            elements.append(Paragraph("<b>Deductions</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in ded_items:
                table_data.append([li.description or "—", f"${abs(li.amount):,.2f}"])
            table_data.append(["TOTAL DEDUCTIONS", f"${settlement.total_deductions:,.2f}"])
            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(table_style)
            elements.append(t)
            elements.append(Spacer(1, 16))

        elements.append(Paragraph(
            f"<b>FINAL SETTLEMENT TOTAL: ${settlement.net_pay:,.2f}</b>",
            styles["Heading2"],
        ))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("Confidential — Safehaul TMS", styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="settlement_{settlement.settlement_number}.pdf"',
            },
        )

    # ═══════════════════════════════════════════════════════════════
    #   Broker Invoicing
    # ═══════════════════════════════════════════════════════════════

    async def generate_invoice(self, load_id: UUID) -> InvoiceResponse:
        """Generate an invoice record for a delivered/invoiced load."""
        load = (await self.db.execute(
            select(Load)
            .where(Load.id == load_id)
            .where(Load.company_id == self.company_id)
            .options(
                selectinload(Load.accessorials),
                selectinload(Load.broker),
            )
        )).scalar_one_or_none()

        if not load:
            raise NotFoundError("Load not found")

        acc_total = sum(Decimal(str(a.amount)) for a in load.accessorials) if load.accessorials else Decimal("0")
        base = Decimal(str(load.base_rate)) if load.base_rate else Decimal("0")
        total = base + acc_total

        return InvoiceResponse(
            id=str(load.id),
            load_id=str(load.id),
            load_number=load.load_number,
            broker_name=load.broker.name if load.broker else None,
            base_rate=base,
            accessorials_total=acc_total,
            total_amount=total,
            status=load.status.value if hasattr(load.status, 'value') else load.status,
            created_at=load.created_at,
        )

    # ── Pay Calculation Helper (sync, no DB required) ─────────────

    def _calculate_load_gross(
        self,
        pay_rate_type: str,
        pay_rate_value: "Decimal",
        load_total_miles: "Optional[Decimal]",
        load_base_rate: "Optional[Decimal]",
    ) -> "Decimal":
        """Calculate driver gross pay for a single load.

        Mirrors the logic in calculate_settlement_for_trips() but operates on
        raw scalar inputs so it can be called synchronously in unit tests
        without a database session.

        Pay types:
          - percentage : pay_rate_value % of load_base_rate
          - cpm        : pay_rate_value × load_total_miles
          - fixed_per_load / fixed : pay_rate_value (flat)
          - hourly     : pay_rate_value × 8 hours (standard approximation)
          - salary     : pay_rate_value / 52 weeks
          - any other  : $0.00
        """
        from decimal import Decimal as _D, ROUND_HALF_UP as _RHU

        rate   = _D(str(pay_rate_value))   if pay_rate_value   is not None else _D("0")
        miles  = _D(str(load_total_miles)) if load_total_miles is not None else _D("0")
        base   = _D(str(load_base_rate))   if load_base_rate   is not None else _D("0")
        quant  = _D("0.01")

        pt = pay_rate_type.lower()
        if pt == "percentage":
            return (base * rate / _D("100")).quantize(quant, rounding=_RHU)
        elif pt == "cpm":
            return (miles * rate).quantize(quant, rounding=_RHU)
        elif pt in ("fixed_per_load", "fixed"):
            return rate.quantize(quant, rounding=_RHU)
        elif pt == "hourly":
            return (rate * _D("8")).quantize(quant, rounding=_RHU)
        elif pt == "salary":
            return (rate / _D("52")).quantize(quant, rounding=_RHU)
        else:
            return _D("0")

    # ── Helpers ──────────────────────────────────────────────────

    def _to_response(self, s) -> SettlementResponse:
        driver_name = f"{s.driver.first_name} {s.driver.last_name}" if s.driver else None
        return SettlementResponse(
            id=str(s.id),
            driver_id=str(s.driver_id),
            settlement_number=s.settlement_number,
            period_start=s.period_start,
            period_end=s.period_end,
            gross_pay=s.gross_pay,
            total_accessorials=s.total_accessorials,
            total_deductions=s.total_deductions,
            net_pay=s.net_pay,
            status=s.status.value if hasattr(s.status, 'value') else s.status,
            paid_at=s.paid_at,
            created_at=s.created_at,
            updated_at=s.updated_at,
            line_items=[SettlementLineItemResponse.model_validate(li) for li in (s.line_items or [])],
            driver_name=driver_name,
        )

    def _to_list_item(self, s) -> SettlementListItem:
        driver_name = f"{s.driver.first_name} {s.driver.last_name}" if s.driver else None
        load_count = len([li for li in (s.line_items or []) if li.type == "load_pay"])
        return SettlementListItem(
            id=str(s.id),
            driver_id=str(s.driver_id),
            settlement_number=s.settlement_number,
            period_start=s.period_start,
            period_end=s.period_end,
            gross_pay=s.gross_pay,
            net_pay=s.net_pay,
            status=s.status.value if hasattr(s.status, 'value') else s.status,
            driver_name=driver_name,
            load_count=load_count,
        )
