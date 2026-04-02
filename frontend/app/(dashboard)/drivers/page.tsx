"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import Modal, { FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types matching backend DriverResponse schema
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
}

const STATUS_LABEL: Record<string, string> = {
  available: "AVAILABLE",
  on_route: "ON ROUTE",
  off_duty: "OFF DUTY",
  on_leave: "ON LEAVE",
  terminated: "TERMINATED",
};

const TYPE_LABEL: Record<string, string> = {
  company_w2: "Company driver",
  owner_operator_1099: "Owner operator",
  lease_operator: "Lease operator",
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active Drivers");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 20;

  const tabs = [
    "Active Drivers", "All Drivers", "Available", "On Route", "Off Duty", "Terminated"
  ];

  const tabStatusMap: Record<string, string | null> = {
    "Active Drivers": null,
    "All Drivers": null,
    "Available": "available",
    "On Route": "on_route",
    "Off Duty": "off_duty",
    "Terminated": "terminated",
  };

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/drivers?${params}`);
      setDrivers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter(tabStatusMap[tab] ?? null);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusPill status={STATUS_LABEL[row.status] || row.status} />
    },
    { header: "First name", accessorKey: "first_name" },
    { header: "Last name", accessorKey: "last_name" },
    { 
      header: "Driver Type", 
      accessorKey: "employment_type",
      cell: (row) => TYPE_LABEL[row.employment_type] || row.employment_type
    },
    { header: "Phone", accessorKey: "phone", cell: (r) => r.phone || "—" },
    { 
      header: "Email", 
      accessorKey: "email",
      cell: (r) => r.email ? (
        <div className="max-w-[160px] truncate" title={r.email}>{r.email}</div>
      ) : "—"
    },
    { header: "CDL #", accessorKey: "cdl_number", cell: (r) => r.cdl_number || "—" },
    { header: "CDL Class", accessorKey: "cdl_class", cell: (r) => r.cdl_class || "—" },
  ];

  const renderFooter = () => (
    <div className="flex items-center gap-4 w-full text-[11px]">
      <span>Showing <span className="font-medium" style={{ color: "var(--on-surface)" }}>{drivers.length}</span> of <span className="font-medium" style={{ color: "var(--on-surface)" }}>{total}</span> drivers</span>
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
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", employment_type: "company_w2", cdl_number: "", cdl_class: "" });

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

  if (loading && drivers.length === 0) {
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
          Drivers
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="gradient-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-ambient"
        >
          <span className="text-lg leading-none">+</span> Create driver
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
          data={drivers}
          columns={columns}
          renderFooter={renderFooter}
        />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Driver">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <input className={inputClass} placeholder="First name" value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} />
          </FormField>
          <FormField label="Last Name" required>
            <input className={inputClass} placeholder="Last name" value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} />
          </FormField>
          <FormField label="Email">
            <input className={inputClass} type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </FormField>
          <FormField label="Phone">
            <input className={inputClass} placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormField>
          <FormField label="Employment Type" required>
            <select className={selectClass} value={form.employment_type} onChange={e => setForm(f => ({...f, employment_type: e.target.value}))}>
              <option value="company_w2">Company W2</option>
              <option value="owner_operator_1099">Owner Operator (1099)</option>
              <option value="lease_operator">Lease Operator</option>
            </select>
          </FormField>
          <FormField label="CDL Number">
            <input className={inputClass} placeholder="CDL #" value={form.cdl_number} onChange={e => setForm(f => ({...f, cdl_number: e.target.value}))} />
          </FormField>
          <FormField label="CDL Class">
            <select className={selectClass} value={form.cdl_class} onChange={e => setForm(f => ({...f, cdl_class: e.target.value}))}>
              <option value="">Select</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          <button className={btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleCreate} disabled={creating || !form.first_name || !form.last_name}>{creating ? "Creating..." : "Create Driver"}</button>
        </div>
      </Modal>
    </div>
  );
}
