"use client";

/**
 * Accounting & Settlements Page — Phase 5.5
 *
 * Left Panel (30%): "Ready to Pay" settlement list
 * Right Panel (70%): Selected settlement detail + PDF download
 */

import { useState, useEffect, useCallback } from "react";
import { DollarSign, FileText, CheckCircle, Clock } from "lucide-react";
import api from "@/lib/api";

interface SettlementListItem {
  id: string;
  driver_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  net_pay: number;
  status: string;
  driver_name: string | null;
  load_count: number;
}

interface LineItem {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  load_id: string | null;
}

interface SettlementDetail {
  id: string;
  driver_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  total_accessorials: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  line_items: LineItem[];
  driver_name: string | null;
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8", label: "Draft" },
  ready: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Ready to Pay" },
  paid: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", label: "Paid" },
};

export default function AccountingPage() {
  const [settlements, setSettlements] = useState<SettlementListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SettlementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<string>("");

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 50 };
      if (filter) params.status = filter;
      const res = await api.get("/accounting/settlements", { params });
      setSettlements(res.data.items);
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/accounting/settlements/${id}`);
      setDetail(res.data);
    } catch (err) {
      console.error("Failed to fetch settlement detail", err);
    }
  }, []);

  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);

  const handleApprove = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      await api.patch(`/accounting/settlements/${detail.id}/approve`);
      await fetchDetail(detail.id);
      await fetchSettlements();
    } finally { setActionLoading(false); }
  };

  const handlePay = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      await api.patch(`/accounting/settlements/${detail.id}/pay`);
      await fetchDetail(detail.id);
      await fetchSettlements();
    } finally { setActionLoading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!detail) return;
    try {
      const res = await api.get(`/accounting/settlements/${detail.id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `settlement_${detail.settlement_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download failed", err);
    }
  };

  const fmt = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-low)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--outline-variant)",
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-6)" }}>
        <p className="label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}>Dashboard &gt; Accounting</p>
        <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>Accounting & Settlements</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 7fr", gap: "var(--spacing-6)", minHeight: "calc(100vh - 200px)" }}>
        {/* LEFT PANEL — Settlement List */}
        <div style={{ ...cardStyle, padding: "var(--spacing-5)", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0 }}>Settlements</h3>
            <select
              style={{
                padding: "4px 8px", fontSize: "0.75rem", borderRadius: "var(--radius-md)",
                border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-lowest)",
                color: "var(--on-surface)",
              }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "var(--spacing-8)" }}>Loading...</p>
          ) : settlements.length === 0 ? (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "var(--spacing-8)" }}>No settlements found</p>
          ) : (
            settlements.map((s) => {
              const badge = STATUS_BADGE[s.status] || STATUS_BADGE.draft;
              const isSelected = selectedId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    padding: "var(--spacing-4)",
                    borderRadius: "var(--radius-lg)",
                    border: isSelected ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
                    backgroundColor: isSelected ? "var(--surface-lowest)" : "transparent",
                    cursor: "pointer",
                    marginBottom: "var(--spacing-3)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "var(--on-surface)", fontSize: "0.9rem" }}>
                      {s.driver_name || "Unknown Driver"}
                    </span>
                    <span style={{
                      padding: "1px 8px", borderRadius: "var(--radius-full)",
                      backgroundColor: badge.bg, color: badge.color,
                      fontSize: "0.65rem", fontWeight: 600,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>
                    {s.settlement_number} • {s.load_count} loads
                  </div>
                  <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "1rem", marginTop: 4 }}>
                    {fmt(s.net_pay)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL — Settlement Detail */}
        <div style={{ ...cardStyle, padding: "var(--spacing-6)" }}>
          {!detail ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--on-surface-variant)" }}>
              Select a settlement to view details
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--spacing-6)" }}>
                <div>
                  <h2 className="headline-sm" style={{ color: "var(--on-surface)", margin: 0 }}>
                    Settlement {detail.settlement_number}
                  </h2>
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                    Period: {detail.period_start} — {detail.period_end}
                  </p>
                  <p style={{ color: "var(--on-surface)", fontSize: "0.9rem", margin: "2px 0 0", fontWeight: 600 }}>
                    Driver: {detail.driver_name || "—"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
                  {detail.status === "draft" && (
                    <button onClick={handleApprove} disabled={actionLoading} style={{
                      padding: "var(--spacing-3) var(--spacing-5)", borderRadius: "var(--radius-lg)",
                      background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
                      color: "var(--on-primary)", border: "none", fontWeight: 600, fontSize: "0.85rem",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}>
                      <CheckCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                      Approve
                    </button>
                  )}
                  {detail.status === "ready" && (
                    <button onClick={handlePay} disabled={actionLoading} style={{
                      padding: "var(--spacing-3) var(--spacing-5)", borderRadius: "var(--radius-lg)",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}>
                      <DollarSign size={14} style={{ display: "inline", marginRight: 4 }} />
                      Mark as Paid
                    </button>
                  )}
                  <button onClick={handleDownloadPDF} style={{
                    padding: "var(--spacing-3) var(--spacing-5)", borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--surface-lowest)", border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer",
                  }}>
                    <FileText size={14} style={{ display: "inline", marginRight: 4 }} />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Line Items Tables */}
              {renderLineItems("Gross Earnings", detail.line_items.filter((li) => li.type === "load_pay"), fmt)}
              {renderLineItems("Accessorials & Extras", detail.line_items.filter((li) => li.type === "accessorial"), fmt)}
              {renderLineItems("Deductions", detail.line_items.filter((li) => li.type === "deduction"), fmt)}

              {/* Net Pay */}
              <div style={{
                marginTop: "var(--spacing-6)", padding: "var(--spacing-6)",
                backgroundColor: "var(--surface-lowest)", borderRadius: "var(--radius-xl)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                border: "1px solid var(--outline-variant)",
              }}>
                <div>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Gross: {fmt(detail.gross_pay)}</span>
                  <span style={{ margin: "0 8px", color: "var(--on-surface-variant)" }}>+</span>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Extras: {fmt(detail.total_accessorials)}</span>
                  <span style={{ margin: "0 8px", color: "var(--on-surface-variant)" }}>−</span>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Deductions: {fmt(detail.total_deductions)}</span>
                </div>
                <div>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", marginRight: 8 }}>FINAL SETTLEMENT TOTAL</span>
                  <span style={{ color: "#22c55e", fontWeight: 800, fontSize: "1.5rem" }}>{fmt(detail.net_pay)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function renderLineItems(title: string, items: { description: string | null; amount: number }[], fmt: (v: number) => string) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "var(--spacing-5)" }}>
      <h4 className="title-sm" style={{ color: "var(--on-surface)", marginBottom: "var(--spacing-3)" }}>{title}</h4>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <th style={{ textAlign: "left", padding: "var(--spacing-2) var(--spacing-3)", color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase" }}>Description</th>
            <th style={{ textAlign: "right", padding: "var(--spacing-2) var(--spacing-3)", color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((li, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <td style={{ padding: "var(--spacing-2) var(--spacing-3)", color: "var(--on-surface)" }}>{li.description || "—"}</td>
              <td style={{ padding: "var(--spacing-2) var(--spacing-3)", textAlign: "right", color: li.amount < 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                {li.amount < 0 ? `-${fmt(Math.abs(li.amount))}` : fmt(li.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
