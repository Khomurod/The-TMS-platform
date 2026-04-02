"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import Modal, { FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types matching backend TruckResponse schema
   ═══════════════════════════════════════════════════════════════ */

interface TruckItem {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  ownership_type?: string;
  status: string;
  is_active: boolean;
}

interface FleetStatus {
  available: number;
  in_use: number;
  maintenance: number;
  total: number;
}

const STATUS_LABEL: Record<string, string> = {
  available: "AVAILABLE",
  in_use: "IN USE",
  maintenance: "MAINTENANCE",
};

export default function FleetPage() {
  const [trucks, setTrucks] = useState<TruckItem[]>([]);
  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active Trucks");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 20;

  const tabs = ["Active Trucks", "All Trucks", "Available", "In Use", "Maintenance"];

  const tabStatusMap: Record<string, string | null> = {
    "Active Trucks": null,
    "All Trucks": null,
    "Available": "available",
    "In Use": "in_use",
    "Maintenance": "maintenance",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);

      const [trucksRes, fleetRes] = await Promise.allSettled([
        api.get(`/fleet/trucks?${params}`),
        api.get("/dashboard/fleet-status"),
      ]);

      if (trucksRes.status === "fulfilled") {
        setTrucks(trucksRes.value.data.items || []);
        setTotal(trucksRes.value.data.total || 0);
      }
      if (fleetRes.status === "fulfilled") {
        setFleetStatus(fleetRes.value.data);
      }
    } catch (err) {
      console.error("Failed to fetch fleet:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter(tabStatusMap[tab] ?? null);
  };

  const columns: ColumnDef<any>[] = [
    { header: "Make", accessorKey: "make", cell: (r) => r.make || "—" },
    { header: "Model", accessorKey: "model", cell: (r) => r.model || "—" },
    { 
      header: "Unit #", 
      accessorKey: "unit_number",
      cell: (row) => <div style={{ color: "var(--primary)" }} className="hover:underline cursor-pointer font-medium">{row.unit_number}</div>
    },
    { header: "Plate #", accessorKey: "license_plate", cell: (r) => r.license_plate || "—" },
    { 
      header: "VIN", 
      accessorKey: "vin", 
      cell: (r) => r.vin ? (
        <div className="max-w-[140px] truncate" title={r.vin}>{r.vin}</div>
      ) : "—" 
    },
    { header: "Year", accessorKey: "year", cell: (r) => r.year || "—" },
    { header: "Ownership", accessorKey: "ownership_type", cell: (r) => r.ownership_type || "—" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row) => <StatusPill status={STATUS_LABEL[row.status] || row.status} />
    },
  ];

  const renderFooter = () => (
    <div className="flex items-center gap-4 w-full justify-start font-medium text-[11px]">
      {fleetStatus && (
        <div className="flex items-center gap-2">
          <span className="text-white px-2 py-0.5 rounded-sm" style={{ backgroundColor: "var(--success)" }}>AVAILABLE {fleetStatus.available}</span>
          <span className="text-white px-2 py-0.5 rounded-sm" style={{ backgroundColor: "var(--warning)" }}>IN USE {fleetStatus.in_use}</span>
          <span className="text-white px-2 py-0.5 rounded-sm" style={{ backgroundColor: "var(--outline)" }}>MAINTENANCE {fleetStatus.maintenance}</span>
        </div>
      )}
      <span style={{ color: "var(--on-surface-variant)" }} className="ml-2">Total: {total}</span>
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

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ unit_number: "", year: "", make: "", model: "", vin: "", license_plate: "", ownership_type: "company" });

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/fleet/trucks", {
        unit_number: form.unit_number,
        year: form.year ? Number(form.year) : undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        vin: form.vin || undefined,
        license_plate: form.license_plate || undefined,
        ownership_type: form.ownership_type,
      });
      setShowCreate(false);
      setForm({ unit_number: "", year: "", make: "", model: "", vin: "", license_plate: "", ownership_type: "company" });
      fetchData();
    } catch (err) {
      console.error("Failed to create truck:", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading && trucks.length === 0) {
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
          Fleet
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="gradient-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-ambient"
        >
          <span className="text-lg leading-none">+</span> Create Truck
        </button>
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
          data={trucks}
          columns={columns}
          renderFooter={renderFooter}
        />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Truck">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Unit Number" required>
            <input className={inputClass} placeholder="e.g. 318 CMP" value={form.unit_number} onChange={e => setForm(f => ({...f, unit_number: e.target.value}))} />
          </FormField>
          <FormField label="Year">
            <input className={inputClass} type="number" placeholder="2024" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} />
          </FormField>
          <FormField label="Make">
            <input className={inputClass} placeholder="e.g. Freightliner" value={form.make} onChange={e => setForm(f => ({...f, make: e.target.value}))} />
          </FormField>
          <FormField label="Model">
            <input className={inputClass} placeholder="e.g. Cascadia" value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} />
          </FormField>
          <FormField label="VIN">
            <input className={inputClass} placeholder="Vehicle ID Number" value={form.vin} onChange={e => setForm(f => ({...f, vin: e.target.value}))} />
          </FormField>
          <FormField label="License Plate">
            <input className={inputClass} placeholder="Plate #" value={form.license_plate} onChange={e => setForm(f => ({...f, license_plate: e.target.value}))} />
          </FormField>
          <FormField label="Ownership Type">
            <select className={selectClass} value={form.ownership_type} onChange={e => setForm(f => ({...f, ownership_type: e.target.value}))}>
              <option value="company">Company</option>
              <option value="owner_operator">Owner Operator</option>
              <option value="leased">Leased</option>
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          <button className={btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleCreate} disabled={creating || !form.unit_number}>{creating ? "Creating..." : "Create Truck"}</button>
        </div>
      </Modal>
    </div>
  );
}
