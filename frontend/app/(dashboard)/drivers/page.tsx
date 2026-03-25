"use client";

/**
 * Drivers Management Page
 */

import { useState, useEffect, useCallback } from "react";
import { Users, Search, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  employment_type?: string;
  pay_rate_type?: string;
  pay_rate_value?: number;
  cdl_number?: string;
  cdl_expiry_date?: string;
  medical_card_expiry_date?: string;
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  available: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  on_route: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  off_duty: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" },
  on_leave: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  terminated: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/drivers", { params });
      setDrivers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Drivers fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filtered = drivers.filter((d) =>
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.cdl_number?.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-low)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--outline-variant)",
    padding: "var(--spacing-6)",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-6)" }}>
        <div>
          <p className="label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}>Dashboard &gt; Drivers</p>
          <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>Driver Management</h1>
        </div>
        <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>{total} drivers</span>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: "var(--spacing-5)" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant)" }} />
          <input
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "var(--spacing-3) var(--spacing-3) var(--spacing-3) 36px",
              borderRadius: "var(--radius-lg)", border: "1px solid var(--outline-variant)",
              backgroundColor: "var(--surface-lowest)", color: "var(--on-surface)",
              fontSize: "0.875rem", outline: "none",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "var(--spacing-3) var(--spacing-4)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-lowest)",
            color: "var(--on-surface)", fontSize: "0.85rem",
          }}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="on_route">On Route</option>
          <option value="off_duty">Off Duty</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--spacing-8)" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--spacing-8)" }}>No drivers found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                {["Name", "Status", "Email", "Phone", "CDL #", "CDL Expiry", "Medical Expiry", "Pay Type"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "var(--spacing-3)", color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const badge = STATUS_BADGE[d.status] || STATUS_BADGE.available;
                const cdlExpiring = d.cdl_expiry_date && new Date(d.cdl_expiry_date) <= new Date(Date.now() + 30 * 86400000);
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)", fontWeight: 600 }}>{d.first_name} {d.last_name}</td>
                    <td style={{ padding: "var(--spacing-3)" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", backgroundColor: badge.bg, color: badge.color, fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize" }}>
                        {d.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface-variant)" }}>{d.email}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{d.phone || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{d.cdl_number || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: cdlExpiring ? "#ef4444" : "var(--on-surface)" }}>
                      {cdlExpiring && <AlertTriangle size={12} style={{ display: "inline", marginRight: 4 }} />}
                      {d.cdl_expiry_date || "—"}
                    </td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface-variant)" }}>{d.medical_card_expiry_date || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>{d.pay_rate_type || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
