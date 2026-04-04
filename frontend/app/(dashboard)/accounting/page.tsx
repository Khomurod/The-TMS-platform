"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import {
  Loader2, Send, FileDown, MoreHorizontal, Plus, RefreshCcw,
  Trash2, ChevronLeft, Columns, Eye, Paperclip,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Accounting Page — Enterprise Salary Operations Workspace
   List → Detail pattern: settlement batch list + inline detail.
   ═══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────────── */

interface SettlementItem {
  id: string;
  settlement_number: string;
  driver_name?: string;
  driver_type?: string;
  company_owner?: string;
  payment_tariff?: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  other_pay?: number;
  earnings?: number;
  fuel_expenses?: number;
  toll_expenses?: number;
  balance?: number;
  status: string;
  paid_at?: string;
  trips?: TripItem[];
  trip_count?: number;
  attachments_count?: number;
  notes_count?: number;
}

interface TripItem {
  id: string;
  trip_number: string;
  load_id?: string;
  load_number?: string;
  truck_unit?: string;
  total_pay: number;
  driver_gross: number;
  status: string;
  delivery_date?: string;
  pickup_date?: string;
  pickup_location?: string;
  delivery_location?: string;
  loaded_miles?: number;
  empty_miles?: number;
}

interface OtherPayItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  date?: string;
}

/* ── Status Map ────────────────────────────────────────────── */

const SETTLEMENT_STATUS_MAP: Record<string, { intent: "unposted" | "posted" | "paid"; label: string }> = {
  draft: { intent: "unposted", label: "Draft" },
  unposted: { intent: "unposted", label: "Unposted" },
  ready: { intent: "posted", label: "Ready" },
  posted: { intent: "posted", label: "Posted" },
  paid: { intent: "paid", label: "Paid" },
};

/* ── Sub-Navigation Tab Configuration ──────────────────────── */

type SubNavTab = {
  key: string;
  label: string;
};

const SUB_NAV_TABS: SubNavTab[] = [
  { key: "salary_batches", label: "Salary batches" },
  { key: "driver_statements", label: "Driver statements" },
  { key: "salary_report", label: "Salary report" },
  { key: "driver_balances", label: "Driver balances" },
  { key: "dispatcher_salary", label: "Dispatcher salary" },
  { key: "one_time_charges", label: "One time charges" },
  { key: "scheduled_payments", label: "Scheduled payments" },
];

/* ── List Tab Configuration ────────────────────────────────── */

type ListTabConfig = { key: string; label: string; statusFilter: string | null };

const LIST_TAB_CONFIG: ListTabConfig[] = [
  { key: "all", label: "All", statusFilter: null },
  { key: "unposted", label: "Unposted", statusFilter: "unposted" },
  { key: "posted", label: "Posted", statusFilter: "posted" },
  { key: "paid", label: "Paid", statusFilter: "paid" },
];

/* ── Helper ────────────────────────────────────────────────── */

const fmtCurrency = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function AccountingPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubNav, setActiveSubNav] = useState("salary_batches");
  const [activeListTab, setActiveListTab] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Detail view state
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const activeListTabConfig = LIST_TAB_CONFIG.find((t) => t.key === activeListTab) ?? LIST_TAB_CONFIG[0];

  /* ── Fetch Settlements ─────────────────────────────────── */

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (activeListTabConfig.statusFilter) params.set("status", activeListTabConfig.statusFilter);
      const res = await api.get(`/accounting/settlements?${params}`);
      setSettlements(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeListTab]);

  useEffect(() => {
    if (activeSubNav === "salary_batches" && !showDetail) {
      fetchSettlements();
    }
  }, [fetchSettlements, activeSubNav, showDetail]);

  const handleListTabChange = (key: string) => {
    setActiveListTab(key);
    setPage(1);
  };

  const handleOpenDetail = (settlement: SettlementItem) => {
    setSelectedSettlement(settlement);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedSettlement(null);
  };

  /* ── List Tab Definitions ────────────────────────────────── */

  const listTabs: TabDef[] = LIST_TAB_CONFIG.map((t) => ({
    key: t.key,
    label: t.label,
    isActive: t.key === activeListTab,
  }));

  /* ── List Columns ────────────────────────────────────────── */

  const listColumns: ColumnDef<SettlementItem>[] = [
    {
      header: "Settlement #",
      accessorKey: "settlement_number",
      cell: (row) => (
        <EntityLink
          label={row.settlement_number}
          copyable
          onClick={() => handleOpenDetail(row)}
        />
      ),
    },
    { header: "Driver", accessorKey: "driver_name", cell: (r) => r.driver_name || "—" },
    {
      header: "Period",
      accessorKey: "period_start",
      cell: (r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`,
    },
    {
      header: "Gross Pay",
      accessorKey: "gross_pay",
      align: "right",
      cell: (r) => <span className="tabular-nums">{fmtCurrency(r.gross_pay)}</span>,
    },
    {
      header: "Deductions",
      accessorKey: "total_deductions",
      align: "right",
      cell: (r) => (
        <span className="tabular-nums" style={{ color: "var(--error)" }}>
          -{fmtCurrency(r.total_deductions)}
        </span>
      ),
    },
    {
      header: "Net Pay",
      accessorKey: "net_pay",
      align: "right",
      cell: (r) => (
        <span className="tabular-nums" style={{ fontWeight: 600, color: "var(--success)" }}>
          {fmtCurrency(r.net_pay)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "100px",
      cell: (row) => {
        const cfg = SETTLEMENT_STATUS_MAP[row.status] || { intent: "unposted" as const, label: row.status };
        return <StatusBadge intent={cfg.intent} domain="financial">{cfg.label}</StatusBadge>;
      },
    },
    {
      header: "Paid At",
      accessorKey: "paid_at",
      cell: (r) => r.paid_at ? fmtDate(r.paid_at) : "—",
    },
  ];

  /* ── List Sticky Footer ────────────────────────────────── */

  const totalGross = settlements.reduce((s, r) => s + r.gross_pay, 0);
  const totalDeductions = settlements.reduce((s, r) => s + r.total_deductions, 0);
  const totalNet = settlements.reduce((s, r) => s + r.net_pay, 0);

  const listStickyFooter: StickyFooterItem[] = [
    { label: "Showing", value: `${settlements.length} of ${total}` },
    { label: "Gross Pay", value: fmtCurrency(totalGross), format: "currency" },
    { label: "Deductions", value: `-${fmtCurrency(totalDeductions)}`, format: "currency" },
    { label: "Net Pay", value: fmtCurrency(totalNet), format: "currency" },
  ];

  /* ── Render ─────────────────────────────────────────────── */

  if (loading && settlements.length === 0 && !showDetail) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ padding: "16px" }}>
      {/* ── Sub-Navigation Tabs ── */}
      <div className="tab-bar shrink-0" style={{ marginBottom: "16px" }}>
        {SUB_NAV_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveSubNav(tab.key);
              setShowDetail(false);
              setSelectedSettlement(null);
            }}
            className={`tab-item ${activeSubNav === tab.key ? "tab-item--active" : ""}`}
            style={{ fontSize: "12px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content Area ── */}
      {activeSubNav === "salary_batches" && !showDetail && (
        /* ═══ Settlement List View ═══ */
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <DataTable
            data={settlements}
            columns={listColumns}
            tabs={listTabs}
            onTabChange={handleListTabChange}
            selectable
            columnToggle
            stickyFooter={listStickyFooter}
            emptyState={MODULE_EMPTY_STATES.settlements}
            getRowId={(row) => row.id}
            onRowClick={handleOpenDetail}
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </div>
      )}

      {activeSubNav === "salary_batches" && showDetail && selectedSettlement && (
        /* ═══ Settlement Detail View ═══ */
        <SettlementDetail
          settlement={selectedSettlement}
          onBack={handleBackToList}
        />
      )}

      {activeSubNav !== "salary_batches" && (
        /* ═══ Placeholder for other sub-sections ═══ */
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--surface-lowest)",
          }}
        >
          <div className="text-center">
            <p style={{ color: "var(--on-surface)", fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
              {SUB_NAV_TABS.find(t => t.key === activeSubNav)?.label}
            </p>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "12px" }}>
              This section is under development.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Settlement Detail Component
   Financial operations workspace with summary, trips, other pay.
   ═══════════════════════════════════════════════════════════════ */

function SettlementDetail({
  settlement,
  onBack,
}: {
  settlement: SettlementItem;
  onBack: () => void;
}) {
  // Mock trips data (will come from API in production)
  const trips: TripItem[] = settlement.trips || [];
  const otherPayItems: OtherPayItem[] = [];

  /* ── Trip Columns ────────────────────────────────────────── */

  const tripColumns: ColumnDef<TripItem>[] = [
    {
      header: "Trip",
      accessorKey: "trip_number",
      cell: (r) => (
        <span style={{ color: "var(--primary)", fontWeight: 500 }}>
          {r.trip_number || "—"}
        </span>
      ),
    },
    {
      header: "Load ID",
      accessorKey: "load_number",
      cell: (r) => r.load_number ? (
        <EntityLink href={`/loads/${r.load_id}`} label={r.load_number} />
      ) : "—",
    },
    { header: "Truck", accessorKey: "truck_unit", cell: (r) => r.truck_unit || "—" },
    {
      header: "Total Pay",
      accessorKey: "total_pay",
      align: "right",
      cell: (r) => <span className="tabular-nums">{fmtCurrency(r.total_pay)}</span>,
    },
    {
      header: "Driver Gross",
      accessorKey: "driver_gross",
      align: "right",
      cell: (r) => <span className="tabular-nums">{fmtCurrency(r.driver_gross)}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "100px",
      cell: (r) => {
        const cfg = SETTLEMENT_STATUS_MAP[r.status] || { intent: "unposted" as const, label: r.status };
        return <StatusBadge intent={cfg.intent} domain="financial">{cfg.label}</StatusBadge>;
      },
    },
    {
      header: "DEL Date",
      accessorKey: "delivery_date",
      cell: (r) => r.delivery_date ? fmtDate(r.delivery_date) : "—",
    },
    {
      header: "Pickup",
      accessorKey: "pickup_location",
      cell: (r) => r.pickup_location || "—",
    },
    {
      header: "Delivery",
      accessorKey: "delivery_location",
      cell: (r) => r.delivery_location || "—",
    },
    {
      header: "Loaded Mi",
      accessorKey: "loaded_miles",
      align: "right",
      cell: (r) => r.loaded_miles ? <span className="tabular-nums">{r.loaded_miles.toLocaleString()}</span> : "—",
    },
    {
      header: "Empty Mi",
      accessorKey: "empty_miles",
      align: "right",
      cell: (r) => r.empty_miles ? <span className="tabular-nums">{r.empty_miles.toLocaleString()}</span> : "—",
    },
  ];

  /* ── Metrics ─────────────────────────────────────────────── */

  const earnings = settlement.earnings ?? settlement.gross_pay;
  const otherPay = settlement.other_pay ?? 0;
  const fuelExpenses = settlement.fuel_expenses ?? 0;
  const tollExpenses = settlement.toll_expenses ?? 0;
  const balance = settlement.balance ?? 0;
  const tripCount = settlement.trip_count ?? trips.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn btn-secondary btn-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--on-surface)" }}>
              {settlement.settlement_number}
            </h2>
            <p style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}>
              {fmtDate(settlement.period_start)} – {fmtDate(settlement.period_end)}
              {settlement.driver_name && ` · ${settlement.driver_name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm">
            <Send className="h-3.5 w-3.5" />
            Send to driver
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{
              opacity: settlement.status === "unposted" || settlement.status === "draft" ? 0.5 : 1,
              cursor: settlement.status === "unposted" || settlement.status === "draft" ? "not-allowed" : "pointer",
            }}
            disabled={settlement.status === "unposted" || settlement.status === "draft"}
          >
            Post
          </button>
          <button className="btn btn-secondary btn-sm">
            Deduction tariff
          </button>
          <button className="btn btn-secondary btn-sm">
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </button>
          <button className="btn btn-secondary btn-xs">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Settlement Summary Card ── */}
      <div
        className="shrink-0"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--surface-lowest)",
        }}
      >
        {/* Identity Row */}
        <div
          className="flex items-center gap-6 flex-wrap"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--outline-variant)",
            fontSize: "12px",
          }}
        >
          <div>
            <span style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}>Driver Type: </span>
            <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>{settlement.driver_type || "Company"}</span>
          </div>
          <div>
            <span style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}>Company Owner: </span>
            <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>{settlement.company_owner || "—"}</span>
          </div>
          <div>
            <span style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}>Payment Tariff: </span>
            <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>{settlement.payment_tariff || "Per mile"}</span>
          </div>
          <div className="ml-auto">
            <StatusBadge
              intent={SETTLEMENT_STATUS_MAP[settlement.status]?.intent || "unposted"}
              domain="financial"
            >
              {SETTLEMENT_STATUS_MAP[settlement.status]?.label || settlement.status}
            </StatusBadge>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-stretch overflow-x-auto">
          <div className="metric-block">
            <span className="metric-label">Total Pay</span>
            <span className="metric-value">{fmtCurrency(settlement.gross_pay)}</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Earnings</span>
            <span className="metric-value">{fmtCurrency(earnings)}</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Other Pay</span>
            <span className="metric-value">{fmtCurrency(otherPay)}</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Deductions</span>
            <span className="metric-value" style={{ color: "var(--error)" }}>
              -{fmtCurrency(settlement.total_deductions)}
            </span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Net Pay</span>
            <span className="metric-value" style={{ color: "var(--success)" }}>
              {fmtCurrency(settlement.net_pay)}
            </span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Balances</span>
            <span className="metric-value">{fmtCurrency(balance)}</span>
            <span className="metric-link">Review →</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Fuel & Toll</span>
            <span className="metric-value">{fmtCurrency(fuelExpenses + tollExpenses)}</span>
            <span className="metric-link">Review →</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Trips</span>
            <span className="metric-value">{tripCount}</span>
          </div>
          <div className="metric-block">
            <span className="metric-label">Attachments & Notes</span>
            <div className="flex items-center gap-2 mt-1">
              <Paperclip className="h-3 w-3" style={{ color: "var(--on-surface-variant)" }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--on-surface)" }}>
                {(settlement.attachments_count ?? 0) + (settlement.notes_count ?? 0)}
              </span>
              <span className="metric-link">View</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trips Table ── */}
      <div
        className="flex-1 min-h-[300px] overflow-hidden"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <DataTable
          data={trips}
          columns={tripColumns}
          selectable
          columnToggle
          density="compact"
          getRowId={(r) => r.id}
          emptyState={{
            icon: MODULE_EMPTY_STATES.settlements.icon,
            title: "No trips in this settlement",
            description: "Trips will appear here when loads are delivered and assigned to this settlement period.",
          }}
          toolbarLeft={
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm">
                <Plus className="h-3.5 w-3.5" />
                Add charges
              </button>
              <button className="btn btn-secondary btn-sm">
                <Plus className="h-3.5 w-3.5" />
                Add trips
              </button>
              <button className="btn btn-secondary btn-sm">
                <RefreshCcw className="h-3.5 w-3.5" />
                Recalculate
              </button>
              <button
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          }
          stickyFooter={
            trips.length > 0
              ? [
                  { label: "Total Pay", value: fmtCurrency(trips.reduce((s, t) => s + t.total_pay, 0)), format: "currency" },
                  { label: "Driver Gross", value: fmtCurrency(trips.reduce((s, t) => s + t.driver_gross, 0)), format: "currency" },
                  { label: "Loaded Miles", value: trips.reduce((s, t) => s + (t.loaded_miles || 0), 0).toLocaleString(), format: "miles" },
                  { label: "Empty Miles", value: trips.reduce((s, t) => s + (t.empty_miles || 0), 0).toLocaleString(), format: "miles" },
                ]
              : undefined
          }
        />
      </div>

      {/* ── Other Pay Section ── */}
      <div
        className="shrink-0"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--surface-lowest)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--on-surface)" }}>
            Other Pay
          </span>
          <button className="btn btn-secondary btn-xs">
            <Plus className="h-3 w-3" />
            Add line item
          </button>
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            padding: "24px 16px",
            color: "var(--on-surface-variant)",
            fontSize: "12px",
          }}
        >
          {otherPayItems.length === 0
            ? "No additional pay items for this settlement."
            : `${otherPayItems.length} items`
          }
        </div>
      </div>
    </div>
  );
}
