"use client";

/**
 * Load Board Page — Phase 4.5
 *
 * Tabs: Live Loads | Upcoming | Completed
 * KPI Cards: Total Revenue, Active Shipments, On-Time Performance
 * Data Table with pagination
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Truck, DollarSign, Clock, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────

interface LoadListItem {
  id: string;
  load_number: string;
  broker_load_id: string | null;
  status: string;
  base_rate: number | null;
  total_rate: number | null;
  driver_id: string | null;
  truck_id: string | null;
  created_at: string;
  pickup_city: string | null;
  pickup_date: string | null;
  delivery_city: string | null;
  delivery_date: string | null;
  broker_name: string | null;
  driver_name: string | null;
  truck_number: string | null;
}

interface LoadListResponse {
  items: LoadListItem[];
  total: number;
  page: number;
  page_size: number;
}

type TabKey = "live" | "upcoming" | "completed";

// ── Status Pill Colors ──────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  planned: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" },
  dispatched: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  at_pickup: { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
  in_transit: { bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" },
  delivered: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  delayed: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  billed: { bg: "rgba(20, 184, 166, 0.15)", color: "#14b8a6" },
  paid: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" },
  cancelled: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

export default function LoadBoardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("live");
  const [data, setData] = useState<LoadListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/loads/${activeTab}`, {
        params: { page, page_size: pageSize },
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch loads", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  const formatCurrency = (value: number | null) => {
    if (value == null) return "—";
    return `$${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: "live", label: "Live Loads" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-8)",
        }}
      >
        <div>
          <p
            className="label-sm"
            style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}
          >
            Dashboard &gt; Load Board
          </p>
          <h1
            className="headline-md"
            style={{ color: "var(--on-surface)", margin: 0 }}
          >
            Load Board
          </h1>
        </div>
        <button
          id="create-load-btn"
          onClick={() => router.push("/loads/new")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2)",
            padding: "var(--spacing-3) var(--spacing-6)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            color: "var(--on-primary)",
            border: "none",
            borderRadius: "var(--radius-lg)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
        >
          <Plus size={16} />
          Create New Load
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--spacing-5)",
          marginBottom: "var(--spacing-8)",
        }}
      >
        <KPICard
          icon={<DollarSign size={20} />}
          label="Total Revenue (Weekly)"
          value={data ? formatCurrency(data.items.reduce((sum, l) => sum + (l.total_rate || 0), 0)) : "—"}
          accentColor="var(--primary)"
        />
        <KPICard
          icon={<Truck size={20} />}
          label="Active Shipments"
          value={data?.total?.toString() || "0"}
          accentColor="#0ea5e9"
        />
        <KPICard
          icon={<Clock size={20} />}
          label="On-Time Performance"
          value="—"
          accentColor="#22c55e"
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-1)",
          marginBottom: "var(--spacing-6)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "var(--spacing-3) var(--spacing-6)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === tab.key ? "var(--primary)" : "var(--on-surface-variant)",
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
            {activeTab === tab.key && data && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "1px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {data.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div
        style={{
          backgroundColor: "var(--surface-low)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "1px solid var(--outline-variant)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--outline-variant)",
                textAlign: "left",
              }}
            >
              {["Load #", "Broker", "Pickup", "Delivery", "Driver", "Truck", "Rate", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "var(--spacing-4) var(--spacing-5)",
                    color: "var(--on-surface-variant)",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "var(--spacing-12)",
                    textAlign: "center",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((load) => {
                const statusStyle = STATUS_STYLES[load.status] || STATUS_STYLES.planned;
                return (
                  <tr
                    key={load.id}
                    onClick={() => router.push(`/loads/${load.id}`)}
                    style={{
                      borderBottom: "1px solid var(--outline-variant)",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-lowest)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)", fontWeight: 600, color: "var(--on-surface)" }}>
                      {load.load_number}
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)", color: "var(--on-surface)" }}>
                      {load.broker_name || "—"}
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)" }}>
                      <div style={{ color: "var(--on-surface)" }}>{load.pickup_city || "—"}</div>
                      <div style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>
                        {formatDate(load.pickup_date)}
                      </div>
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)" }}>
                      <div style={{ color: "var(--on-surface)" }}>{load.delivery_city || "—"}</div>
                      <div style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>
                        {formatDate(load.delivery_date)}
                      </div>
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)", color: "var(--on-surface)" }}>
                      {load.driver_name || "Unassigned"}
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)", color: "var(--on-surface)" }}>
                      {load.truck_number || "—"}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-4) var(--spacing-5)",
                        color: "#22c55e",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(load.total_rate || load.base_rate)}
                    </td>
                    <td style={{ padding: "var(--spacing-4) var(--spacing-5)" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {load.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "var(--spacing-12)",
                    textAlign: "center",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  No loads found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "var(--spacing-3)",
              padding: "var(--spacing-4)",
              borderTop: "1px solid var(--outline-variant)",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "var(--surface-lowest)",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                color: "var(--on-surface)",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
                fontSize: "0.8rem",
              }}
            >
              Previous
            </button>
            <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "var(--surface-lowest)",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                color: "var(--on-surface)",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.5 : 1,
                fontSize: "0.8rem",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Card Component ──────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-low)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--spacing-6)",
        border: "1px solid var(--outline-variant)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-4)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-lg)",
          backgroundColor: `${accentColor}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="label-sm"
          style={{ color: "var(--on-surface-variant)", margin: 0, marginBottom: 2 }}
        >
          {label}
        </p>
        <p
          className="headline-sm"
          style={{ color: "var(--on-surface)", margin: 0, fontWeight: 700 }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
