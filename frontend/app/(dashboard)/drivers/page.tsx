"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef, TabDef } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import ComplianceDot from "@/components/ui/ComplianceDot";
import { MODULE_EMPTY_STATES } from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { FormField } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loader2, Phone, Mail, Plus } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Drivers Page — Enterprise HR Management
   Uses design system components exclusively.
   ═══════════════════════════════════════════════════════════════ */

interface DriverItem {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  employment_type: string;
  cdl_number?: string;
  cdl_class?: string;
  status: string;
  is_active: boolean;
  created_at?: string;
  hire_date?: string;
  compliance_urgency?: "good" | "upcoming" | "critical" | "expired";
}

const STATUS_MAP: Record<string, { intent: "good" | "dispatched" | "upcoming" | "critical"; label: string }> = {
  available: { intent: "good", label: "Available" },
  on_trip: { intent: "dispatched", label: "On Trip" },
  inactive: { intent: "upcoming", label: "Inactive" },
  on_leave: { intent: "upcoming", label: "On Leave" },
  terminated: { intent: "critical", label: "Terminated" },
};

const TYPE_LABEL: Record<string, string> = {
  company_w2: "Company driver",
  owner_operator_1099: "Owner operator",
  lease_operator: "Lease operator",
};

/* ── Tab Configuration ─────────────────────────────────────── */

type TabConfig = { key: string; label: string; statusFilter: string | null };

const TAB_CONFIG: TabConfig[] = [
  { key: "active",     label: "Active Drivers", statusFilter: null },
  { key: "all",        label: "All Drivers",    statusFilter: null },
  { key: "available",  label: "Available",      statusFilter: "available" },
  { key: "on_trip",    label: "On Trip",        statusFilter: "on_trip" },
  { key: "inactive",   label: "Inactive",       statusFilter: "inactive" },
  { key: "terminated", label: "Terminated",     statusFilter: "terminated" },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTabKey) ?? TAB_CONFIG[0];

  /* ── Fetch ──────────────────────────────────────────────── */

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (activeTabConfig.statusFilter) params.set("status", activeTabConfig.statusFilter);
      const res = await api.get(`/drivers?${params}`);
      setDrivers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTabKey]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

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

  /* ── Columns ───────────────────────────────────────────────── */

  const columns: ColumnDef<DriverItem>[] = [
    {
      header: "Status",
      accessorKey: "status",
      width: "110px",
      cell: (row) => {
        const cfg = STATUS_MAP[row.status] || { intent: "upcoming" as const, label: row.status };
        return <StatusBadge intent={cfg.intent}>{cfg.label}</StatusBadge>;
      },
    },
    {
      header: "Driver Name",
      accessorKey: "first_name",
      cell: (row) => (
        <EntityLink
          href={`/drivers/${row.id}`}
          label={`${row.first_name} ${row.last_name}`}
          copyable
        />
      ),
    },
    {
      header: "Driver Type",
      accessorKey: "employment_type",
      cell: (row) => TYPE_LABEL[row.employment_type] || row.employment_type,
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: (r) => r.phone ? (
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" style={{ color: "var(--on-surface-variant)" }} />
          {r.phone}
        </div>
      ) : "—",
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (r) => r.email ? (
        <div className="flex items-center gap-1.5 max-w-[180px] truncate" title={r.email}>
          <Mail className="h-3 w-3 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          {r.email}
        </div>
      ) : "—",
    },
    {
      header: "CDL #",
      accessorKey: "cdl_number",
      cell: (r) => r.cdl_number || "—",
    },
    {
      header: "CDL Class",
      accessorKey: "cdl_class",
      width: "90px",
      align: "center",
      cell: (r) => r.cdl_class ? (
        <span
          className="font-bold text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: "var(--surface-container-high)" }}
        >
          {r.cdl_class}
        </span>
      ) : "—",
    },
    {
      header: "Compliance",
      accessorKey: "compliance_urgency",
      width: "100px",
      align: "center",
      cell: (r) => (
        <ComplianceDot
          urgency={r.compliance_urgency || "good"}
          showLabel
        />
      ),
    },
  ];

  /* ── Create Driver Modal ────────────────────────────────── */

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    employment_type: "company_w2", cdl_number: "", cdl_class: "",
  });

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/drivers", {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        employment_type: form.employment_type,
        cdl_number: form.cdl_number || undefined,
        cdl_class: form.cdl_class || undefined,
      });
      setShowCreate(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", employment_type: "company_w2", cdl_number: "", cdl_class: "" });
      fetchDrivers();
    } catch (err) {
      console.error("Failed to create driver:", err);
    } finally {
      setCreating(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */

  if (loading && drivers.length === 0) {
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
          data={drivers}
          columns={columns}
          tabs={tabs}
          onTabChange={handleTabChange}
          selectable
          columnToggle
          emptyState={MODULE_EMPTY_STATES.drivers}
          getRowId={(row) => row.id}
          primaryAction={
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Driver
            </button>
          }
          totalCount={total}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      {/* ── Create Driver Modal ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Driver">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <input className="input-base" placeholder="First name" value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} />
          </FormField>
          <FormField label="Last Name" required>
            <input className="input-base" placeholder="Last name" value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} />
          </FormField>
          <FormField label="Email">
            <input className="input-base" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </FormField>
          <FormField label="Phone">
            <input className="input-base" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormField>
          <FormField label="Employment Type" required>
            <select className="select-base" value={form.employment_type} onChange={e => setForm(f => ({...f, employment_type: e.target.value}))}>
              <option value="company_w2">Company W2</option>
              <option value="owner_operator_1099">Owner Operator (1099)</option>
              <option value="lease_operator">Lease Operator</option>
            </select>
          </FormField>
          <FormField label="CDL Number">
            <input className="input-base" placeholder="CDL #" value={form.cdl_number} onChange={e => setForm(f => ({...f, cdl_number: e.target.value}))} />
          </FormField>
          <FormField label="CDL Class">
            <select className="select-base" value={form.cdl_class} onChange={e => setForm(f => ({...f, cdl_class: e.target.value}))}>
              <option value="">Select</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
            </select>
          </FormField>
        </div>
        <div className="modal-footer" style={{ marginTop: "var(--spacing-6)", padding: "var(--spacing-4) 0 0" }}>
          <Button variant="secondary" size="md" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleCreate} disabled={creating || !form.first_name || !form.last_name} loading={creating}>Create Driver</Button>
        </div>
      </Modal>
    </div>
  );
}
