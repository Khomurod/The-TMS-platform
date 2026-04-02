"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import Modal, { FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/ui/Modal";
import { Loader2, Hash } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Fleet Page — Phase 4 Enhanced DataTable Integration
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

const STATUS_MAP: Record<string, { intent: "good" | "dispatched" | "upcoming"; label: string }> = {
  available: { intent: "good", label: "Available" },
  in_use: { intent: "dispatched", label: "In Use" },
  maintenance: { intent: "upcoming", label: "Maintenance" },
};

/* ── Tab Configuration ─────────────────────────────────────── */

type TabConfig = { key: string; label: string; statusFilter: string | null };

const TAB_CONFIG: TabConfig[] = [
  { key: "active",      label: "Active Trucks", statusFilter: null },
  { key: "all",         label: "All Trucks",    statusFilter: null },
  { key: "available",   label: "Available",     statusFilter: "available" },
  { key: "in_use",      label: "In Use",        statusFilter: "in_use" },
  { key: "maintenance", label: "Maintenance",   statusFilter: "maintenance" },
];

export default function FleetPage() {
  const [trucks, setTrucks] = useState<TruckItem[]>([]);
  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTabKey) ?? TAB_CONFIG[0];

  /* ── Fetch ──────────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (activeTabConfig.statusFilter) params.set("status", activeTabConfig.statusFilter);

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
  }, [page, pageSize, activeTabKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    setPage(1);
  };

  /* ── Tabs ─────────────────────────────────────────────────── */

  const tabs: TabDef[] = TAB_CONFIG.map((t) => ({
    key: t.key,
    label: t.label,
    count: t.key === "available" ? fleetStatus?.available
         : t.key === "in_use" ? fleetStatus?.in_use
         : t.key === "maintenance" ? fleetStatus?.maintenance
         : undefined,
    isActive: t.key === activeTabKey,
  }));

  /* ── Columns (Phase 4 Enhanced) ─────────────────────────── */

  const columns: ColumnDef<TruckItem>[] = [
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: (row) => (
        <EntityLink
          href={`/fleet/${row.id}`}
          label={row.unit_number}
          copyable
        />
      ),
    },
    { header: "Make", accessorKey: "make", cell: (r) => r.make || "—" },
    { header: "Model", accessorKey: "model", cell: (r) => r.model || "—" },
    {
      header: "Plate #",
      accessorKey: "license_plate",
      cell: (r) => r.license_plate ? (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3 w-3" style={{ color: "var(--on-surface-variant)" }} />
          {r.license_plate}
        </div>
      ) : "—",
    },
    {
      header: "VIN",
      accessorKey: "vin",
      cell: (r) => r.vin ? (
        <div className="max-w-[140px] truncate font-mono text-[10px]" title={r.vin}>{r.vin}</div>
      ) : "—",
    },
    {
      header: "Year",
      accessorKey: "year",
      align: "center",
      width: "80px",
      cell: (r) => r.year || "—",
    },
    {
      header: "Ownership",
      accessorKey: "ownership_type",
      cell: (r) => r.ownership_type || "—",
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "120px",
      cell: (row) => {
        const cfg = STATUS_MAP[row.status] || { intent: "upcoming" as const, label: row.status };
        return <StatusBadge intent={cfg.intent}>{cfg.label}</StatusBadge>;
      },
    },
  ];

  /* ── Sticky Footer ─────────────────────────────────────── */

  const stickyFooter: StickyFooterItem[] = [
    { label: "Total", value: String(fleetStatus?.total || total) },
    { label: "Available", value: String(fleetStatus?.available || 0) },
    { label: "In Use", value: String(fleetStatus?.in_use || 0) },
    { label: "Maintenance", value: String(fleetStatus?.maintenance || 0) },
  ];

  /* ── Create Truck Modal ─────────────────────────────────── */

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    unit_number: "", year: "", make: "", model: "",
    vin: "", license_plate: "", ownership_type: "company",
  });

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

  /* ── Render ─────────────────────────────────────────────── */

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

      {/* ── Enhanced DataTable ── */}
      <div
        className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-ambient"
        style={{ border: "1px solid var(--outline-variant)" }}
      >
        <DataTable
          data={trucks}
          columns={columns}
          tabs={tabs}
          onTabChange={handleTabChange}
          selectable
          columnToggle
          stickyFooter={stickyFooter}
          emptyState={MODULE_EMPTY_STATES.fleet}
          getRowId={(row) => row.id}
          totalCount={total}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      {/* ── Create Truck Modal ── */}
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
