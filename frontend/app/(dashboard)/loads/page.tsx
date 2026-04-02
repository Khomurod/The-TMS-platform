"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { LOAD_STATUSES } from "@/lib/constants";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge, { statusToIntent } from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import { Truck, Users, MapPin, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Loads Board — Phase 4 Enhanced DataTable Integration
   ═══════════════════════════════════════════════════════════════ */

interface LoadItem {
  id: string;
  load_number: string;
  shipment_id?: string;
  broker_load_id?: string;
  status: string;
  base_rate?: number;
  total_rate?: number;
  created_at?: string;
  pickup_city?: string;
  pickup_date?: string;
  delivery_city?: string;
  delivery_date?: string;
  broker_name?: string;
  driver_name?: string;
  truck_number?: string;
  trip_count?: number;
}

/* ── Tab Configuration ─────────────────────────────────────── */

type TabConfig = {
  key: string;
  label: string;
  endpoint: string | null;
  statusFilter: string | null;
};

const TAB_CONFIG: TabConfig[] = [
  { key: "all",       label: "All Loads",  endpoint: null,              statusFilter: null },
  { key: "upcoming",  label: "Upcoming",   endpoint: "/loads/upcoming",  statusFilter: null },
  { key: "live",      label: "Live",       endpoint: "/loads/live",      statusFilter: null },
  { key: "completed", label: "Completed",  endpoint: "/loads/completed", statusFilter: null },
  { key: "offer",     label: "Offer",      endpoint: null,              statusFilter: "offer" },
  { key: "booked",    label: "Booked",     endpoint: null,              statusFilter: "booked" },
  { key: "invoiced",  label: "Invoiced",   endpoint: null,              statusFilter: "invoiced" },
  { key: "paid",      label: "Paid",       endpoint: null,              statusFilter: "paid" },
];

export default function LoadsPage() {
  const [loads, setLoads] = useState<LoadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTabKey) ?? TAB_CONFIG[0];

  /* ── Fetch ──────────────────────────────────────────────── */

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      let url: string;
      if (activeTabConfig.endpoint) {
        url = `${activeTabConfig.endpoint}?${params}`;
      } else {
        if (activeTabConfig.statusFilter) params.set("status", activeTabConfig.statusFilter);
        url = `/loads?${params}`;
      }

      const res = await api.get(url);
      setLoads(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch loads:", err);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTabKey]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    setPage(1);
  };

  /* ── Tabs (Phase 4) ─────────────────────────────────────── */

  const tabs: TabDef[] = TAB_CONFIG.map((t) => ({
    key: t.key,
    label: t.label,
    isActive: t.key === activeTabKey,
  }));

  /* ── Columns ────────────────────────────────────────────── */

  const columns: ColumnDef<LoadItem>[] = [
    {
      header: "Load #",
      accessorKey: "load_number",
      cell: (row) => (
        <EntityLink
          href={`/loads/${row.id}`}
          label={row.load_number}
          copyable
        />
      ),
    },
    {
      header: "Broker Load ID",
      accessorKey: "broker_load_id",
      cell: (row) => (
        <span style={{ color: "var(--success)" }} className="font-semibold">
          {row.broker_load_id || "—"}
        </span>
      ),
    },
    {
      header: "Broker",
      accessorKey: "broker_name",
      cell: (row) => (
        <span style={{ color: "var(--primary)" }} className="font-medium">
          {row.broker_name || "—"}
        </span>
      ),
    },
    {
      header: "Driver",
      accessorKey: "driver_name",
      cell: (r) => (
        <div
          className="flex items-center gap-1.5"
          style={{ color: r.driver_name ? "var(--primary)" : "var(--on-surface-variant)" }}
        >
          <Users className="h-3 w-3" />
          {r.driver_name || "Unassigned"}
        </div>
      ),
    },
    {
      header: "Truck",
      accessorKey: "truck_number",
      cell: (r) => (
        <div
          className="flex items-center gap-1.5"
          style={{ color: r.truck_number ? "var(--primary)" : "var(--on-surface-variant)" }}
        >
          <Truck className="h-3 w-3" />
          {r.truck_number || "—"}
        </div>
      ),
    },
    {
      header: "Route",
      accessorKey: "pickup_city",
      cell: (r) => (
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--success)" }} />
          <span>{r.pickup_city || "—"}</span>
          <span style={{ color: "var(--on-surface-variant)" }}>→</span>
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--error)" }} />
          <span>{r.delivery_city || "—"}</span>
        </div>
      ),
    },
    {
      header: "Pickup Date",
      accessorKey: "pickup_date",
      cell: (r) =>
        r.pickup_date
          ? new Date(r.pickup_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    {
      header: "Rate",
      accessorKey: "total_rate",
      align: "right",
      cell: (r) =>
        r.total_rate
          ? `$${Number(r.total_rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "—",
    },
    {
      header: "Trips",
      accessorKey: "trip_count",
      align: "center",
      cell: (r) => (
        <span
          className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: (r.trip_count ?? 0) > 0 ? "var(--primary-fixed)" : "var(--surface-container-high)",
            color: (r.trip_count ?? 0) > 0 ? "var(--primary)" : "var(--on-surface-variant)",
          }}
        >
          {r.trip_count || 0}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const intent = statusToIntent(row.status);
        const label = LOAD_STATUSES[row.status]?.label || row.status;
        return <StatusBadge intent={intent}>{label}</StatusBadge>;
      },
    },
  ];

  /* ── Sticky Footer Aggregates ──────────────────────────── */

  const totalRate = loads.reduce((s, l) => s + (l.total_rate || 0), 0);
  const totalBase = loads.reduce((s, l) => s + (l.base_rate || 0), 0);

  const stickyFooter: StickyFooterItem[] = [
    { label: "Showing", value: `${loads.length} of ${total}` },
    { label: "Total rate", value: `$${totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, format: "currency" },
    { label: "Base rate", value: `$${totalBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, format: "currency" },
  ];

  /* ── Render ─────────────────────────────────────────────── */

  if (loading && loads.length === 0) {
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
          Loads
        </h1>
        <Link
          href="/loads/new"
          className="gradient-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-ambient"
        >
          <span className="text-lg leading-none">+</span> New load
        </Link>
      </div>

      {/* ── Enhanced DataTable ── */}
      <div
        className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-ambient"
        style={{ border: "1px solid var(--outline-variant)" }}
      >
        <DataTable
          data={loads}
          columns={columns}
          tabs={tabs}
          onTabChange={handleTabChange}
          selectable
          columnToggle
          exportable
          stickyFooter={stickyFooter}
          emptyState={MODULE_EMPTY_STATES.loads}
          getRowId={(row) => row.id}
          bulkActions={[
            {
              label: "Export Selected",
              onClick: (ids) => console.log("Export:", ids),
            },
            {
              label: "Cancel Selected",
              variant: "danger",
              onClick: (ids) => console.log("Cancel:", ids),
            },
          ]}
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
