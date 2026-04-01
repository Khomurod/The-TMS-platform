"""Accounting service — driver pay calculation, settlement generation, PDF export, invoicing.

Phase 5 tasks covered:
  5.1 — Driver Pay Calculation (NUMERIC math, never float)
  5.2 — Settlement Management (generate, approve, pay)
  5.3 — PDF Settlement Generation (reportlab)
  5.4 — Broker Invoicing (auto-triggered on billed status)
"""

import io
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.models.accounting import SettlementStatus
from app.models.driver import PayRateType


class AccountingService:
    """Accounting business logic — pay calc, settlements, PDF, invoicing."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.repo = SettlementRepository(db, company_id)
        self.company_id = company_id

    # ═══════════════════════════════════════════════════════════════
    #   5.1 — Driver Pay Calculation Engine
    # ═══════════════════════════════════════════════════════════════

    def _calculate_load_gross(
        self,
        pay_rate_type: str,
        pay_rate_value: Decimal,
        load_total_miles: Decimal,
        load_base_rate: Decimal,
    ) -> Decimal:
        """Calculate gross pay for a single load based on driver's pay type.
        
        All math uses Decimal to prevent floating point drift.
        Acceptance criteria:
          - $0.65 CPM × 920 miles = exactly $598.00
          - 80% of $3,200 base = exactly $2,560.00
        """
        rate = Decimal(str(pay_rate_value)) if pay_rate_value else Decimal("0")
        miles = Decimal(str(load_total_miles)) if load_total_miles else Decimal("0")
        base = Decimal(str(load_base_rate)) if load_base_rate else Decimal("0")

        if pay_rate_type == PayRateType.cpm.value or pay_rate_type == "cpm":
            # Cents per mile: rate * miles
            return (rate * miles).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        elif pay_rate_type == PayRateType.percentage.value or pay_rate_type == "percentage":
            # Percentage of load base rate: base_rate * (rate / 100)
            return (base * rate / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        elif pay_rate_type == PayRateType.fixed_per_load.value or pay_rate_type == "fixed_per_load":
            return rate.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        elif pay_rate_type == PayRateType.hourly.value or pay_rate_type == "hourly":
            # Hourly — approximate 8 hours per load if no hours tracked
            hours = Decimal("8")
            return (rate * hours).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        elif pay_rate_type == PayRateType.salary.value or pay_rate_type == "salary":
            # Salary — divide by 52 weekly pay periods
            return (rate / Decimal("52")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return Decimal("0")

    # ═══════════════════════════════════════════════════════════════
    #   5.2 — Settlement Management
    # ═══════════════════════════════════════════════════════════════

    async def generate_settlement(self, data: SettlementGenerateRequest) -> SettlementResponse:
        """Generate a draft settlement for a driver over a date range."""
        driver_id = UUID(data.driver_id)
        driver = await self.repo.get_driver(driver_id)
        if not driver:
            raise NotFoundError("Driver not found")

        if not driver.pay_rate_type or not driver.pay_rate_value:
            raise HTTPException(
                status_code=400,
                detail="Driver has no pay rate configured. Set pay_rate_type and pay_rate_value first.",
            )

        # Get loads for this driver in the period
        loads = await self.repo.get_driver_loads(driver_id, data.period_start, data.period_end)
        if not loads:
            raise HTTPException(
                status_code=400,
                detail=f"No delivered/billed/paid loads found for this driver between {data.period_start} and {data.period_end}.",
            )

        # Get company default deductions
        deductions = await self.repo.get_company_deductions()

        # Create settlement
        settlement_number = await self.repo.get_next_settlement_number()
        settlement = await self.repo.create(
            driver_id=driver_id,
            settlement_number=settlement_number,
            period_start=data.period_start,
            period_end=data.period_end,
            gross_pay=Decimal("0"),
            total_accessorials=Decimal("0"),
            total_deductions=Decimal("0"),
            net_pay=Decimal("0"),
            status=SettlementStatus.draft,
        )

        total_gross = Decimal("0")
        total_accessorials = Decimal("0")
        total_deductions_amount = Decimal("0")

        # Calculate pay for each load
        for load in loads:
            load_gross = self._calculate_load_gross(
                pay_rate_type=driver.pay_rate_type.value if hasattr(driver.pay_rate_type, 'value') else driver.pay_rate_type,
                pay_rate_value=driver.pay_rate_value,
                load_total_miles=load.total_miles,
                load_base_rate=load.base_rate,
            )
            total_gross += load_gross

            # Determine origin → dest for description
            stops = sorted(load.stops, key=lambda s: s.stop_sequence) if load.stops else []
            origin = stops[0].city if stops else "—"
            dest = stops[-1].city if stops else "—"

            await self.repo.add_line_item(
                settlement_id=settlement.id,
                load_id=load.id,
                type="load_pay",
                description=f"{load.load_number} ({origin} → {dest}) — {load.total_miles or 0} mi",
                amount=load_gross,
            )

            # Add load accessorials
            if load.accessorials:
                for acc in load.accessorials:
                    acc_amount = Decimal(str(acc.amount))
                    total_accessorials += acc_amount
                    await self.repo.add_line_item(
                        settlement_id=settlement.id,
                        load_id=load.id,
                        type="accessorial",
                        description=f"{acc.type.replace('_', ' ').title()} — {load.load_number}",
                        amount=acc_amount,
                    )

        # Apply company default deductions
        for ded in deductions:
            ded_amount = Decimal(str(ded.amount))
            # Apply based on frequency
            if ded.frequency.value == "per_load":
                ded_amount = ded_amount * len(loads)
            # weekly/monthly apply once per settlement
            total_deductions_amount += ded_amount
            await self.repo.add_line_item(
                settlement_id=settlement.id,
                type="deduction",
                description=ded.name,
                amount=-ded_amount,  # Negative for deductions
            )

        net_pay = total_gross + total_accessorials - total_deductions_amount

        # Update settlement totals
        settlement.gross_pay = total_gross
        settlement.total_accessorials = total_accessorials
        settlement.total_deductions = total_deductions_amount
        settlement.net_pay = net_pay

        settlement = await self.repo.commit_and_refresh(settlement)
        return self._to_response(settlement)

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

    async def approve_settlement(self, settlement_id: UUID) -> SettlementResponse:
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        if settlement.status != SettlementStatus.draft:
            raise HTTPException(status_code=400, detail="Only draft settlements can be approved")
        settlement.status = SettlementStatus.ready
        await self.db.commit()
        await self.db.refresh(settlement)
        return self._to_response(settlement)

    async def pay_settlement(self, settlement_id: UUID) -> SettlementResponse:
        settlement = await self.repo.get_by_id(settlement_id)
        if not settlement:
            raise NotFoundError("Settlement not found")
        if settlement.status != SettlementStatus.ready:
            raise HTTPException(status_code=400, detail="Only 'ready' settlements can be marked as paid")
        settlement.status = SettlementStatus.paid
        settlement.paid_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(settlement)
        return self._to_response(settlement)

    # ═══════════════════════════════════════════════════════════════
    #   5.3 — PDF Settlement Generation
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

        # Gross Earnings
        if load_items:
            elements.append(Paragraph("<b>Gross Earnings</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in load_items:
                table_data.append([li.description or "—", f"${li.amount:,.2f}"])
            table_data.append(["TOTAL GROSS", f"${settlement.gross_pay:,.2f}"])

            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#333")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8e8e8")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 12))

        # Accessorials
        if acc_items:
            elements.append(Paragraph("<b>Accessorials & Extras</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in acc_items:
                table_data.append([li.description or "—", f"${li.amount:,.2f}"])
            table_data.append(["TOTAL EXTRAS", f"${settlement.total_accessorials:,.2f}"])
            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#333")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8e8e8")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 12))

        # Deductions
        if ded_items:
            elements.append(Paragraph("<b>Deductions</b>", styles["Heading3"]))
            table_data = [["Description", "Amount"]]
            for li in ded_items:
                table_data.append([li.description or "—", f"${abs(li.amount):,.2f}"])
            table_data.append(["TOTAL DEDUCTIONS", f"${settlement.total_deductions:,.2f}"])
            t = Table(table_data, colWidths=[400, 100])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#333")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8e8e8")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 16))

        # Net Pay Footer
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
    #   5.4 — Broker Invoicing
    # ═══════════════════════════════════════════════════════════════

    async def generate_invoice(self, load_id: UUID) -> InvoiceResponse:
        """Generate an invoice record for a billed load."""
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.load import Load

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
