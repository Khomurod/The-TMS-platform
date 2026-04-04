"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef, TabDef, StickyFooterItem } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { FormField } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loader2, Hash, Plus } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Fleet Page — Enterprise Asset Management
   Uses design system components exclusively.
   ═══════════════════════════════════════════════════════════════ */

interface TruckItem {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  state?: string;
  mc_number?: string;
  ownership_type?: string;
  status: string;
  is_active: boolean;
  driver_name?: string;
  owner_name?: string;
  odometer?: number;
  trailer_number?: string;
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
  { key: "active",      label: "Active Trucks",     statusFilter: null },
  { key: "unassigned",  label: "Unassigned Trucks",  statusFilter: "available" },
  { key: "all",         label: "All Trucks",         statusFilter: null },
  { key: "inactive",    label: "Inactive Trucks",    statusFilter: "maintenance" },
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
    count: t.key === "active" ? fleetStatus?.total
         : t.key === "unassigned" ? fleetStatus?.available
         : t.key === "inactive" ? fleetStatus?.maintenance
         : undefined,
    isActive: t.key === activeTabKey,
  }));

  /* ── Columns ─────────────────────────────────────────────── */

  const columns: ColumnDef<TruckItem>[] = [
    { header: "Make", accessorKey: "make", cell: (r) => r.make || "—" },
    { header: "Model", accessorKey: "model", cell: (r) => r.model || "—" },
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
        <div
          className="font-mono"
          title={r.vin}
          style={{
            maxWidth: "140px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "10px",
          }}
        >
          {r.vin}
        </div>
      ) : "—",
    },
    {
      header: "Year",
      accessorKey: "year",
      align: "center",
      width: "60px",
      cell: (r) => r.year || "—",
    },
    {
      header: "State",
      accessorKey: "state",
      width: "60px",
      cell: (r) => r.state || "—",
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
      header: "Operator",
      accessorKey: "driver_name",
      cell: (r) => r.driver_name ? (
        <span style={{ color: "var(--primary)", fontWeight: 500 }}>{r.driver_name}</span>
      ) : (
        <span style={{ color: "var(--on-surface-variant)" }}>—</span>
      ),
    },
    {
      header: "Owner",
      accessorKey: "owner_name",
      cell: (r) => r.owner_name || "—",
      defaultHidden: true,
      hideable: true,
    },
    {
      header: "Odometer",
      accessorKey: "odometer",
      align: "right",
      cell: (r) => r.odometer ? (
        <span className="tabular-nums">{r.odometer.toLocaleString()}</span>
      ) : "—",
      hideable: true,
    },
    {
      header: "Trailer",
      accessorKey: "trailer_number",
      cell: (r) => r.trailer_number || "—",
      hideable: true,
    },
    {
      header: "Status",
      accessorKey: "status",
      width: "100px",
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
    <div className="page-container">
      {/* ── Main DataTable ── */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
        }}
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

          primaryAction={
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Truck
            </button>
          }
          rowActions={[
            { label: "View Detail", onClick: (row) => window.location.href = `/fleet/${row.id}` },
          ]}
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
            <input className="input-base" placeholder="e.g. 318 CMP" value={form.unit_number} onChange={e => setForm(f => ({...f, unit_number: e.target.value}))} />
          </FormField>
          <FormField label="Year">
            <input className="input-base" type="number" placeholder="2024" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} />
          </FormField>
          <FormField label="Make">
            <input className="input-base" placeholder="e.g. Freightliner" value={form.make} onChange={e => setForm(f => ({...f, make: e.target.value}))} />
          </FormField>
          <FormField label="Model">
            <input className="input-base" placeholder="e.g. Cascadia" value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} />
          </FormField>
          <FormField label="VIN">
            <input className="input-base" placeholder="Vehicle ID Number" value={form.vin} onChange={e => setForm(f => ({...f, vin: e.target.value}))} />
          </FormField>
          <FormField label="License Plate">
            <input className="input-base" placeholder="Plate #" value={form.license_plate} onChange={e => setForm(f => ({...f, license_plate: e.target.value}))} />
          </FormField>
          <FormField label="Ownership Type">
            <select className="select-base" value={form.ownership_type} onChange={e => setForm(f => ({...f, ownership_type: e.target.value}))}>
              <option value="company">Company</option>
              <option value="owner_operator">Owner Operator</option>
              <option value="leased">Leased</option>
            </select>
          </FormField>
        </div>
        <div className="modal-footer" style={{ marginTop: "var(--spacing-6)", padding: "var(--spacing-4) 0 0" }}>
          <Button variant="secondary" size="md" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleCreate} disabled={creating || !form.unit_number} loading={creating}>Create Truck</Button>
        </div>
      </Modal>
    </div>
  );
}
