"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import { Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Accounting Page — Phase 4 Enhanced DataTable Integration
   ═══════════════════════════════════════════════════════════════ */

interface SettlementItem {
  id: string;
  settlement_number: string;
  driver_name?: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  paid_at?: string;
}

/* Map settlement status → StatusBadge financial intents */
const SETTLEMENT_STATUS_MAP: Record<string, { intent: "unposted" | "posted" | "paid"; label: string }> = {
  draft: { intent: "unposted", label: "Draft" },
  unposted: { intent: "unposted", label: "Unposted" },
  ready: { intent: "posted", label: "Ready" },
  posted: { intent: "posted", label: "Posted" },
  paid: { intent: "paid", label: "Paid" },
};

/* ── Tab Configuration ─────────────────────────────────────── */

type TabConfig = { key: string; label: string; statusFilter: string | null };

const TAB_CONFIG: TabConfig[] = [
  { key: "settlements", label: "Settlements",     statusFilter: null },
  { key: "unposted",    label: "Unposted",        statusFilter: "unposted" },
  { key: "posted",      label: "Posted",          statusFilter: "posted" },
  { key: "paid",        label: "Paid",            statusFilter: "paid" },
  { key: "invoices",    label: "Invoices",        statusFilter: null },
];

export default function AccountingPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState("settlements");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTabKey) ?? TAB_CONFIG[0];

  /* ── Fetch ──────────────────────────────────────────────── */

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (activeTabConfig.statusFilter) params.set("status", activeTabConfig.statusFilter);
      const res = await api.get(`/accounting/settlements?${params}`);
      setSettlements(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTabKey]);

  useEffect(() => {
    if (activeTabKey !== "invoices") fetchSettlements();
  }, [fetchSettlements, activeTabKey]);

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    setPage(1);
  };

  /* ── Formatting Helpers ────────────────────────────────── */

  const fmtCurrency = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  /* ── Tabs ─────────────────────────────────────────────────── */

  const tabs: TabDef[] = TAB_CONFIG.map((t) => ({
    key: t.key,
    label: t.label,
    isActive: t.key === activeTabKey,
  }));

  /* ── Columns ────────────────────────────────────────────── */

  const columns: ColumnDef<SettlementItem>[] = [
    {
      header: "Settlement #",
      accessorKey: "settlement_number",
      cell: (row) => (
        <EntityLink
          href={`/accounting/${row.id}`}
          label={row.settlement_number}
          copyable
        />
      ),
    },
    {
      header: "Driver",
      accessorKey: "driver_name",
      cell: (r) => r.driver_name || "—",
    },
    {
      header: "Period",
      accessorKey: "period_start",
      cell: (r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`,
    },
    {
      header: "Gross Pay",
      accessorKey: "gross_pay",
      align: "right",
      cell: (r) => (
        <span className="tabular-nums">{fmtCurrency(r.gross_pay)}</span>
      ),
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
        <span className="tabular-nums font-semibold" style={{ color: "var(--success)" }}>
          {fmtCurrency(r.net_pay)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "110px",
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

  /* ── Sticky Footer ─────────────────────────────────────── */

  const totalGross = settlements.reduce((s, r) => s + r.gross_pay, 0);
  const totalDeductions = settlements.reduce((s, r) => s + r.total_deductions, 0);
  const totalNet = settlements.reduce((s, r) => s + r.net_pay, 0);

  const stickyFooter: StickyFooterItem[] = [
    { label: "Showing", value: `${settlements.length} of ${total}` },
    { label: "Gross Pay", value: fmtCurrency(totalGross), format: "currency" },
    { label: "Deductions", value: `-${fmtCurrency(totalDeductions)}`, format: "currency" },
    { label: "Net Pay", value: fmtCurrency(totalNet), format: "currency" },
  ];

  /* ── Invoices Tab (placeholder) ─────────────────────────── */

  if (activeTabKey === "invoices") {
    return (
      <div className="h-full flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="headline-sm" style={{ color: "var(--on-surface)" }}>
            Accounting
          </h1>
          <button className="gradient-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-ambient">
            Export Data
          </button>
        </div>
        <div
          className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-ambient"
          style={{ border: "1px solid var(--outline-variant)" }}
        >
          <DataTable
            data={[]}
            columns={[]}
            tabs={tabs}
            onTabChange={handleTabChange}
            emptyState={{
              icon: MODULE_EMPTY_STATES.settlements.icon,
              title: "Invoices module",
              description: "Invoice batching and billing management coming soon.",
            }}
          />
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */

  if (loading && settlements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="headline-sm" style={{ color: "var(--on-surface)" }}>
          Accounting
        </h1>
        <button className="gradient-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-ambient">
          Export Data
        </button>
      </div>

      {/* ── Enhanced DataTable ── */}
      <div
        className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-ambient"
        style={{ border: "1px solid var(--outline-variant)" }}
      >
        <DataTable
          data={settlements}
          columns={columns}
          tabs={tabs}
          onTabChange={handleTabChange}
          selectable
          columnToggle
          stickyFooter={stickyFooter}
          emptyState={MODULE_EMPTY_STATES.settlements}
          getRowId={(row) => row.id}
          totalCount={total}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>
    </div>
  );
}
