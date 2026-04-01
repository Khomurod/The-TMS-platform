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
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer font-medium">{row.unit_number}</div>
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

  const renderSubNav = () => (
    <div className="flex bg-white items-center gap-6 px-4 pt-4 pb-2 border-b border-[#e5e7eb] overflow-x-auto whitespace-nowrap scrollbar-hide">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => handleTabChange(t)}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
            activeTab === t 
              ? "border-[#3b82f6] text-[#3b82f6]" 
              : "border-transparent text-[#6b7280] hover:text-[#374151]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  const renderFooter = () => (
    <div className="flex items-center gap-4 w-full justify-start font-medium text-[11px]">
      {fleetStatus && (
        <div className="flex items-center gap-2">
          <span className="bg-[#10b981] text-white px-2 py-0.5 rounded-sm">AVAILABLE {fleetStatus.available}</span>
          <span className="bg-[#f97316] text-white px-2 py-0.5 rounded-sm">IN USE {fleetStatus.in_use}</span>
          <span className="bg-[#64748b] text-white px-2 py-0.5 rounded-sm">MAINTENANCE {fleetStatus.maintenance}</span>
        </div>
      )}
      <span className="text-gray-500 ml-2">Total: {total}</span>
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
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative">
        <button onClick={() => setShowCreate(true)} className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center hover:bg-[#2563eb]">
          + Create Truck
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={trucks}
          columns={columns}
          renderSubNav={renderSubNav}
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
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button className={btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleCreate} disabled={creating || !form.unit_number}>{creating ? "Creating..." : "Create Truck"}</button>
        </div>
      </Modal>
    </div>
  );
}
