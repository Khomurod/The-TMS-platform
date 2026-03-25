"use client";

/**
 * Fleet Management Page — Trucks & Trailers
 */

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Search, Filter } from "lucide-react";
import api from "@/lib/api";

interface Equipment {
  id: string;
  unit_number: string;
  status: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  dot_inspection_expiry?: string;
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  available: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  in_use: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  in_shop: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  retired: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" },
};

export default function FleetPage() {
  const [tab, setTab] = useState<"trucks" | "trailers">("trucks");
  const [items, setItems] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fleet/${tab}`, { params: { page: 1, page_size: 50 } });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Fleet fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = items.filter((i) =>
    i.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.make?.toLowerCase().includes(search.toLowerCase()) ||
    i.model?.toLowerCase().includes(search.toLowerCase())
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
          <p className="label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}>Dashboard &gt; Fleet</p>
          <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>Fleet Management</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--spacing-3)", marginBottom: "var(--spacing-6)" }}>
        {(["trucks", "trailers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "var(--spacing-3) var(--spacing-6)",
              borderRadius: "var(--radius-lg)",
              border: tab === t ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
              backgroundColor: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "var(--on-primary)" : "var(--on-surface)",
              cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {t} ({tab === t ? total : "—"})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "var(--spacing-5)", position: "relative", maxWidth: 400 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant)" }} />
        <input
          placeholder={`Search ${tab}...`}
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

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--spacing-8)" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--spacing-8)" }}>No {tab} found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                {["Unit #", "Status", "Make", "Model", "Year", "VIN", "License Plate", "DOT Expiry"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "var(--spacing-3)", color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const badge = STATUS_BADGE[item.status] || STATUS_BADGE.available;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)", fontWeight: 600 }}>{item.unit_number}</td>
                    <td style={{ padding: "var(--spacing-3)" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", backgroundColor: badge.bg, color: badge.color, fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize" }}>
                        {item.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{item.make || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{item.model || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{item.year || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>{item.vin || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)" }}>{item.license_plate || "—"}</td>
                    <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface-variant)" }}>{item.dot_inspection_expiry || "—"}</td>
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
