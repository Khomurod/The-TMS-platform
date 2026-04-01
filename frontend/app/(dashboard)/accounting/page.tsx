"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types matching backend SettlementResponse schema
   ═══════════════════════════════════════════════════════════════ */

interface SettlementItem {
  id: string;
  settlement_number: string;
  driver_name?: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  paid_at?: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "DRAFT",
  ready: "READY",
  paid: "PAID",
};

export default function AccountingPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Settlements");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 20;

  const tabs = ["Settlements", "Invoices"];

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/accounting/settlements?${params}`);
      setSettlements(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (activeTab === "Settlements") {
      fetchSettlements();
    }
  }, [fetchSettlements, activeTab]);

  const fmtCurrency = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const columns: ColumnDef<any>[] = [
    { 
      header: "Settlement #", 
      accessorKey: "settlement_number",
      cell: (row) => <div className="text-[#3b82f6] font-semibold hover:underline cursor-pointer">{row.settlement_number}</div>
    },
    { header: "Driver", accessorKey: "driver_name", cell: (r) => r.driver_name || "—" },
    { 
      header: "Period", 
      accessorKey: "period_start",
      cell: (r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`
    },
    { header: "Gross Pay", accessorKey: "gross_pay", cell: (r) => fmtCurrency(r.gross_pay) },
    { 
      header: "Deductions", 
      accessorKey: "total_deductions", 
      cell: (r) => <span className="text-red-500">-{fmtCurrency(r.total_deductions)}</span>
    },
    { 
      header: "Net Pay", 
      accessorKey: "net_pay", 
      cell: (r) => <span className="text-[#10b981] font-semibold">{fmtCurrency(r.net_pay)}</span>
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row) => <StatusPill status={STATUS_LABEL[row.status] || row.status} />
    },
    { 
      header: "Paid At", 
      accessorKey: "paid_at",
      cell: (r) => r.paid_at ? fmtDate(r.paid_at) : "—"
    },
  ];

  const renderSubNav = () => (
    <div className="flex bg-white items-center gap-6 px-4 pt-4 pb-2 border-b border-[#e5e7eb]">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
            activeTab === t 
              ? "border-[#3b82f6] text-[#3b82f6]" 
              : "border-transparent text-[#6b7280] hover:text-[#374151]"
          }`}
        >
          {t}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2 pb-2">
        <select
          value={statusFilter || ""}
          onChange={(e) => { setStatusFilter(e.target.value || null); setPage(1); }}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="paid">Paid</option>
        </select>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="flex items-center gap-4 w-full text-[11px]">
      <span>Showing <span className="text-black font-medium">{settlements.length}</span> of <span className="text-black font-medium">{total}</span> settlements</span>
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

  if (activeTab === "Invoices") {
    return (
      <div className="h-full flex flex-col p-4">
        {renderSubNav()}
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border border-[#e5e7eb] mt-4">
          Invoices module — coming soon
        </div>
      </div>
    );
  }

  if (loading && settlements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative">
        <button className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#2563eb]">
          Export Data
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={settlements}
          columns={columns}
          renderSubNav={renderSubNav}
          renderFooter={renderFooter}
        />
      </div>
    </div>
  );
}
