"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { LOAD_STATUSES } from "@/lib/constants";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge, { statusToIntent } from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import { Truck, Users, MapPin, Loader2, Plus, FileText, MoreVertical } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Loads Board — Enterprise Dispatch Operations
   Dense table layout with integrated toolbar actions.
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
  pickup_state?: string;
  pickup_date?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_date?: string;
  broker_name?: string;
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
  mc_number?: string;
  trip_count?: number;
  total_miles?: number;
}

/* ── Tab Configuration ─────────────────────────────────────── */

type TabConfig = {
  key: string;
  label: string;
  endpoint: string | null;
  statusFilter: string | null;
};

const TAB_CONFIG: TabConfig[] = [
  { key: "all",        label: "All Loads",     endpoint: null,              statusFilter: null },
  { key: "upcoming",   label: "Upcoming Loads", endpoint: "/loads/upcoming", statusFilter: null },
  { key: "dispatched", label: "Dispatched",     endpoint: null,              statusFilter: "dispatched" },
  { key: "in_transit", label: "In-Transit",     endpoint: null,              statusFilter: "in_transit" },
  { key: "delivered",  label: "Delivered",       endpoint: null,              statusFilter: "delivered" },
  { key: "unpaid",     label: "Unpaid",          endpoint: null,              statusFilter: "invoiced" },
  { key: "trips",      label: "Trips",           endpoint: "/loads/live",     statusFilter: null },
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

  /* ── Tabs ─────────────────────────────────────────────────── */

  const tabs: TabDef[] = TAB_CONFIG.map((t) => ({
    key: t.key,
    label: t.label,
    isActive: t.key === activeTabKey,
  }));

  /* ── Columns ────────────────────────────────────────────── */

  const columns: ColumnDef<LoadItem>[] = [
    {
      header: "Shipment ID",
      accessorKey: "shipment_id",
      cell: (row) => (
        <span style={{ color: "var(--primary)", fontWeight: 500 }}>
          {row.shipment_id || "—"}
        </span>
      ),
      defaultHidden: true,
      hideable: true,
    },
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
      header: "Customer",
      accessorKey: "broker_name",
      cell: (row) => (
        <span style={{ fontWeight: 500 }}>
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
          <Users className="h-3 w-3 shrink-0" />
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
          style={{ color: r.truck_number ? "var(--on-surface)" : "var(--on-surface-variant)" }}
        >
          <Truck className="h-3 w-3 shrink-0" />
          {r.truck_number || "—"}
        </div>
      ),
    },
    {
      header: "Trailer",
      accessorKey: "trailer_number",
      cell: (r) => r.trailer_number || "—",
      defaultHidden: true,
      hideable: true,
    },
    {
      header: "MC #",
      accessorKey: "mc_number",
      cell: (r) => r.mc_number || "—",
      defaultHidden: true,
      hideable: true,
    },
    {
      header: "Pickup",
      accessorKey: "pickup_city",
      cell: (r) => (
        <div className="flex items-center gap-1" style={{ fontSize: "12px" }}>
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--success)" }} />
          <span>{r.pickup_city || "—"}{r.pickup_state ? `, ${r.pickup_state}` : ""}</span>
        </div>
      ),
    },
    {
      header: "Delivery",
      accessorKey: "delivery_city",
      cell: (r) => (
        <div className="flex items-center gap-1" style={{ fontSize: "12px" }}>
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--error)" }} />
          <span>{r.delivery_city || "—"}{r.delivery_state ? `, ${r.delivery_state}` : ""}</span>
        </div>
      ),
    },
    {
      header: "DEL Date",
      accessorKey: "delivery_date",
      cell: (r) =>
        r.delivery_date
          ? new Date(r.delivery_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "—",
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "110px",
      cell: (row) => {
        const intent = statusToIntent(row.status);
        const label = LOAD_STATUSES[row.status]?.label || row.status;
        return <StatusBadge intent={intent}>{label}</StatusBadge>;
      },
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
      header: "Docs",
      accessorKey: "trip_count",
      align: "center",
      width: "50px",
      cell: () => (
        <FileText className="h-3.5 w-3.5 mx-auto" style={{ color: "var(--on-surface-variant)" }} />
      ),
      hideable: true,
    },
  ];

  /* ── Sticky Footer Aggregates ──────────────────────────── */

  const totalRate = loads.reduce((s, l) => s + (l.total_rate || 0), 0);
  const totalMiles = loads.reduce((s, l) => s + (l.total_miles || 0), 0);
  const rpm = totalMiles > 0 ? totalRate / totalMiles : 0;

  const stickyFooter: StickyFooterItem[] = [
    { label: "Showing", value: `${loads.length} of ${total}` },
    { label: "Total Pay", value: `$${totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, format: "currency" },
    { label: "Miles", value: totalMiles.toLocaleString(), format: "miles" },
    { label: "RPM", value: rpm > 0 ? `$${rpm.toFixed(2)}` : "—", format: "currency" },
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
    <div className="h-full flex flex-col" style={{ padding: "16px" }}>
      {/* ── Main DataTable ── */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
        }}
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
          primaryAction={
            <Link
              href="/loads/new"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Load
            </Link>
          }
          bulkActions={[
            {
              label: "Cancel Selected",
              variant: "danger",
              onClick: async (ids) => {
                if (!confirm(`Cancel ${ids.length} selected load(s)?`)) return;
                for (const id of ids) {
                  try {
                    await api.patch(`/loads/${id}/status`, { status: "cancelled" });
                  } catch { /* skip if transition not allowed */ }
                }
                fetchLoads();
              },
            },
          ]}
          rowActions={[
            { label: "View Detail", onClick: (row) => window.location.href = `/loads/${row.id}` },
            {
              label: "Cancel Load",
              onClick: async (row) => {
                if (!confirm(`Cancel load ${row.load_number}?`)) return;
                try {
                  await api.patch(`/loads/${row.id}/status`, { status: "cancelled" });
                  fetchLoads();
                } catch { /* status transition may fail if not allowed */ }
              },
              destructive: true,
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
