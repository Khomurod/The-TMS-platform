"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import Modal, { FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/ui/Modal";
import { Filter, ChevronRight, FileText, Loader2 } from "lucide-react";

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
          <ChevronRight className="h-3 w-3 text-gray-400" />
          {row.load_number}
        </div>
      )
    },
    { 
      header: "Broker Load ID", 
      accessorKey: "broker_load_id",
      cell: (row) => <div className="text-[#10b981] font-semibold">{row.broker_load_id || "—"}</div>
    },
    { 
      header: "Broker", 
      accessorKey: "broker_name",
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer font-medium">{row.broker_name || "—"}</div>
    },
    { 
      header: "Driver", 
      accessorKey: "driver_name", 
      cell: (r) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{r.driver_name || "Unassigned"}</div> 
    },
    { 
      header: "Truck", 
      accessorKey: "truck_number", 
      cell: (r) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{r.truck_number || "—"}</div> 
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
      cell: () => <div className="w-6 h-6 bg-blue-50 text-blue-500 rounded flex items-center justify-center cursor-pointer"><FileText className="h-3 w-3" /></div>
    }
  ];

  const renderSubNav = () => (
    <div className="flex flex-col border-b border-[#e5e7eb] bg-white pt-4">
      <div className="flex items-center gap-6 px-4 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === t 
                ? "border-[#3b82f6] text-[#3b82f6]" 
                : "border-transparent text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-3 px-4 py-2 text-sm">
        <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white font-medium text-[#374151] hover:bg-gray-50">
          <Filter className="h-3 w-3" /> Filter
        </button>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 w-full text-[11px]">
      <span>Showing <span className="text-black font-medium">{loads.length}</span> of <span className="text-black font-medium">{total}</span> loads</span>
      <span>Total rate: <span className="text-black font-medium">${totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
      <span>Base rate: <span className="text-black font-medium">${totalBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
      {total > pageSize && (
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page <= 1}
            className="px-2 py-0.5 border rounded text-xs disabled:opacity-40 hover:bg-gray-50"
          >Prev</button>
          <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / pageSize)}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-2 py-0.5 border rounded text-xs disabled:opacity-40 hover:bg-gray-50"
          >Next</button>
        </div>
      )}
    </div>
  );

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ broker_load_id: "", base_rate: "", total_miles: "", pickup_city: "", pickup_state: "", delivery_city: "", delivery_state: "", notes: "" });

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/loads", {
        broker_load_id: form.broker_load_id || undefined,
        base_rate: form.base_rate ? Number(form.base_rate) : undefined,
        total_miles: form.total_miles ? Number(form.total_miles) : undefined,
        notes: form.notes || undefined,
        stops: [
          { stop_type: "pickup", stop_sequence: 1, city: form.pickup_city || undefined, state: form.pickup_state || undefined },
          { stop_type: "delivery", stop_sequence: 2, city: form.delivery_city || undefined, state: form.delivery_state || undefined },
        ],
      });
      setShowCreate(false);
      setForm({ broker_load_id: "", base_rate: "", total_miles: "", pickup_city: "", pickup_state: "", delivery_city: "", delivery_state: "", notes: "" });
      fetchLoads();
    } catch (err) {
      console.error("Failed to create load:", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading && loads.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative gap-2">
        <button onClick={() => setShowCreate(true)} className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center hover:bg-[#2563eb]">
          <span className="mr-1 font-bold">+</span> New load
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={loads}
          columns={columns}
          renderSubNav={renderSubNav}
          renderFooter={renderFooter}
        />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Load" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Broker Load ID">
            <input className={inputClass} placeholder="e.g. 445884" value={form.broker_load_id} onChange={e => setForm(f => ({...f, broker_load_id: e.target.value}))} />
          </FormField>
          <FormField label="Base Rate ($)">
            <input className={inputClass} type="number" placeholder="0.00" value={form.base_rate} onChange={e => setForm(f => ({...f, base_rate: e.target.value}))} />
          </FormField>
          <FormField label="Pickup City">
            <input className={inputClass} placeholder="City" value={form.pickup_city} onChange={e => setForm(f => ({...f, pickup_city: e.target.value}))} />
          </FormField>
          <FormField label="Pickup State">
            <input className={inputClass} placeholder="ST" maxLength={2} value={form.pickup_state} onChange={e => setForm(f => ({...f, pickup_state: e.target.value}))} />
          </FormField>
          <FormField label="Delivery City">
            <input className={inputClass} placeholder="City" value={form.delivery_city} onChange={e => setForm(f => ({...f, delivery_city: e.target.value}))} />
          </FormField>
          <FormField label="Delivery State">
            <input className={inputClass} placeholder="ST" maxLength={2} value={form.delivery_state} onChange={e => setForm(f => ({...f, delivery_state: e.target.value}))} />
          </FormField>
          <FormField label="Total Miles">
            <input className={inputClass} type="number" placeholder="0" value={form.total_miles} onChange={e => setForm(f => ({...f, total_miles: e.target.value}))} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Notes">
              <textarea className={inputClass + " h-20 resize-none"} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button className={btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create Load"}</button>
        </div>
      </Modal>
    </div>
  );
}
