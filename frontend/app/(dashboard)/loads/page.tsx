"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { ChevronRight, FileText, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types matching backend LoadListItem schema
   ═══════════════════════════════════════════════════════════════ */

interface LoadItem {
  id: string;
  load_number: string;
  broker_load_id?: string;
  status: string;
  base_rate?: number;
  total_rate?: number;
  driver_id?: string;
  truck_id?: string;
  created_at?: string;
  pickup_city?: string;
  pickup_date?: string;
  delivery_city?: string;
  delivery_date?: string;
  broker_name?: string;
  driver_name?: string;
  truck_number?: string;
}

const STATUS_MAP: Record<string, string> = {
  planned: "PLANNED",
  dispatched: "DISPATCHED",
  at_pickup: "AT PICKUP",
  in_transit: "IN TRANSIT",
  delivered: "DELIVERED",
  delayed: "DELAYED",
  billed: "BILLED",
  paid: "PAID",
  cancelled: "CANCELLED",
};

export default function LoadsPage() {
  const [loads, setLoads] = useState<LoadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All Loads");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 20;

  // Tab → status mapping
  const tabStatusMap: Record<string, string | null> = {
    "All Loads": null,
    "Planned": "planned",
    "Dispatched": "dispatched",
    "In-Transit": "in_transit",
    "Delivered": "delivered",
    "Billed": "billed",
    "Paid": "paid",
  };

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/loads?${params}`);
      setLoads(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch loads:", err);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter(tabStatusMap[tab] ?? null);
  };

  // Computed stats from fetched data
  const totalRate = loads.reduce((s, l) => s + (l.total_rate || 0), 0);
  const totalBase = loads.reduce((s, l) => s + (l.base_rate || 0), 0);

  const tabs = Object.keys(tabStatusMap);

  const columns: ColumnDef<any>[] = [
    { 
      header: "Load #", 
      accessorKey: "load_number",
      cell: (row) => (
        <div className="flex items-center gap-1 font-medium">
          <ChevronRight className="h-3 w-3" style={{ color: "var(--on-surface-variant)" }} />
          {row.load_number}
        </div>
      )
    },
    { 
      header: "Broker Load ID", 
      accessorKey: "broker_load_id",
      cell: (row) => <div style={{ color: "var(--success)" }} className="font-semibold">{row.broker_load_id || "—"}</div>
    },
    { 
      header: "Broker", 
      accessorKey: "broker_name",
      cell: (row) => <div style={{ color: "var(--primary)" }} className="hover:underline cursor-pointer font-medium">{row.broker_name || "—"}</div>
    },
    { 
      header: "Driver", 
      accessorKey: "driver_name", 
      cell: (r) => <div style={{ color: "var(--primary)" }} className="hover:underline cursor-pointer">{r.driver_name || "Unassigned"}</div> 
    },
    { 
      header: "Truck", 
      accessorKey: "truck_number", 
      cell: (r) => <div style={{ color: "var(--primary)" }} className="hover:underline cursor-pointer">{r.truck_number || "—"}</div> 
    },
    { header: "Pickup", accessorKey: "pickup_city", cell: (r) => r.pickup_city || "—" },
    { header: "Delivery", accessorKey: "delivery_city", cell: (r) => r.delivery_city || "—" },
    { 
      header: "Pickup Date", 
      accessorKey: "pickup_date", 
      cell: (r) => r.pickup_date ? new Date(r.pickup_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" 
    },
    { 
      header: "Rate", 
      accessorKey: "total_rate",
      cell: (r) => r.total_rate ? `$${Number(r.total_rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row) => <StatusPill status={STATUS_MAP[row.status] || row.status} />
    },
    { 
      header: "Docs", 
      accessorKey: "doc",
      cell: () => (
        <div
          className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: "var(--primary-fixed)", color: "var(--primary)" }}
        >
          <FileText className="h-3 w-3" />
        </div>
      )
    }
  ];

  const renderFooter = () => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 w-full text-[11px]">
      <span>Showing <span className="font-medium" style={{ color: "var(--on-surface)" }}>{loads.length}</span> of <span className="font-medium" style={{ color: "var(--on-surface)" }}>{total}</span> loads</span>
      <span>Total rate: <span className="font-medium" style={{ color: "var(--on-surface)" }}>${totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
      <span>Base rate: <span className="font-medium" style={{ color: "var(--on-surface)" }}>${totalBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
      {total > pageSize && (
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page <= 1}
            className="px-2 py-0.5 rounded text-xs disabled:opacity-40 transition-colors"
            style={{ border: "1px solid var(--outline-variant)" }}
          >Prev</button>
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Page {page} of {Math.ceil(total / pageSize)}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-2 py-0.5 rounded text-xs disabled:opacity-40 transition-colors"
            style={{ border: "1px solid var(--outline-variant)" }}
          >Next</button>
        </div>
      )}
    </div>
  );

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

      {/* ── Tab Navigation ── */}
      <div
        className="flex items-center gap-6 px-1 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className="text-sm font-semibold pb-2 border-b-2 transition-colors"
            style={{
              borderColor: activeTab === t ? "var(--primary)" : "transparent",
              color: activeTab === t ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── DataTable Wrapper ── */}
      <div
        className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-ambient"
        style={{ border: "1px solid var(--outline-variant)" }}
      >
        <DataTable 
          data={loads}
          columns={columns}
          renderFooter={renderFooter}
        />
      </div>
    </div>
  );
}
