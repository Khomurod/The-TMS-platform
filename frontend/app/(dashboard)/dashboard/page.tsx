"use client";

/**
 * Executive Dashboard Page — Phase 5.7
 *
 * 4 KPI cards, compliance alerts, fleet status, recent events
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Truck,
  Activity,
  AlertTriangle,
  ChevronRight,
  Plus,
  Zap,
} from "lucide-react";
import api from "@/lib/api";

interface KPIs {
  gross_revenue: number;
  avg_rpm: number;
  active_loads: number;
  planned_loads: number;
  fleet_effectiveness: number;
  active_drivers: number;
  on_route_drivers: number;
}

interface Alert {
  type: string;
  severity: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  description: string;
  expiry_date: string;
}

interface FleetStatus {
  loaded: number;
  available: number;
  in_shop: number;
  total: number;
  utilization_rate: number;
}

interface Event {
  load_id: string;
  load_number: string;
  status: string;
  description: string;
  driver_name: string | null;
  timestamp: string | null;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [alerts, setAlerts] = useState<{ alerts: Alert[]; critical_count: number }>({ alerts: [], critical_count: 0 });
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kRes, aRes, fRes, eRes] = await Promise.all([
          api.get("/dashboard/kpis"),
          api.get("/dashboard/compliance-alerts"),
          api.get("/dashboard/fleet-status"),
          api.get("/dashboard/recent-events"),
        ]);
        setKpis(kRes.data);
        setAlerts(aRes.data);
        setFleet(fRes.data);
        setEvents(eRes.data.events);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };
    fetchAll();
  }, []);

  const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtDec = (v: number) => `$${v.toFixed(2)}`;

  const EVENT_COLORS: Record<string, string> = {
    green: "#22c55e",
    blue: "#3b82f6",
    red: "#ef4444",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-8)" }}>
        <div>
          <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>Executive Overview</h1>
          <p className="body-sm" style={{ color: "var(--on-surface-variant)", margin: "4px 0 0" }}>
            Real-time performance metrics
          </p>
        </div>
        <button
          onClick={() => router.push("/loads/new")}
          style={{
            display: "flex", alignItems: "center", gap: "var(--spacing-2)",
            padding: "var(--spacing-3) var(--spacing-6)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            color: "var(--on-primary)", border: "none", borderRadius: "var(--radius-lg)",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
          }}
        >
          <Plus size={16} />
          Dispatch Load
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--spacing-5)", marginBottom: "var(--spacing-8)" }}>
        <KPICard
          icon={<DollarSign size={22} />}
          label="Gross Revenue"
          value={kpis ? fmt(kpis.gross_revenue) : "—"}
          accentColor="var(--primary)"
        />
        <KPICard
          icon={<TrendingUp size={22} />}
          label="Average RPM"
          value={kpis ? fmtDec(kpis.avg_rpm) : "—"}
          accentColor="#f59e0b"
        />
        <KPICard
          icon={<Truck size={22} />}
          label="Active Loads"
          value={kpis?.active_loads?.toString() || "0"}
          sub={kpis ? `${kpis.planned_loads} scheduled for pickup` : ""}
          accentColor="#0ea5e9"
        />
        <KPICard
          icon={<Activity size={22} />}
          label="Fleet Effectiveness"
          value={kpis ? `${kpis.fleet_effectiveness}%` : "—"}
          sub={kpis ? `${kpis.on_route_drivers}/${kpis.active_drivers} drivers active` : ""}
          accentColor="#22c55e"
        />
      </div>

      {/* Two Column: Compliance Alerts + Fleet Status */}
      <div style={{ display: "grid", gridTemplateColumns: "6fr 4fr", gap: "var(--spacing-6)", marginBottom: "var(--spacing-8)" }}>
        {/* Compliance Alerts */}
        <div style={{
          backgroundColor: "var(--surface-low)", borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-6)", border: "1px solid var(--outline-variant)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-5)" }}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={18} style={{ color: "#ef4444" }} />
              Compliance Alert Center
            </h3>
            {alerts.critical_count > 0 && (
              <span style={{
                padding: "2px 10px", borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444",
                fontSize: "0.75rem", fontWeight: 700,
              }}>
                {alerts.critical_count} CRITICAL
              </span>
            )}
          </div>

          {alerts.alerts.length === 0 ? (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "var(--spacing-6)" }}>
              No compliance alerts — all clear ✓
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
              {alerts.alerts.slice(0, 6).map((alert, i) => (
                <div key={i} style={{
                  padding: "var(--spacing-4)", backgroundColor: "var(--surface-lowest)",
                  borderRadius: "var(--radius-lg)",
                  borderLeft: `3px solid ${alert.severity === "critical" ? "#ef4444" : "#f59e0b"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--on-surface)", fontSize: "0.9rem" }}>
                        {alert.entity_name}
                      </span>
                      <span style={{ marginLeft: 8, color: "var(--on-surface-variant)", fontSize: "0.8rem" }}>
                        ({alert.entity_type})
                      </span>
                    </div>
                    <span style={{
                      padding: "1px 6px", borderRadius: "var(--radius-full)",
                      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                      backgroundColor: alert.severity === "critical" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: alert.severity === "critical" ? "#ef4444" : "#f59e0b",
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem", margin: "4px 0 0" }}>
                    {alert.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Status */}
        <div style={{
          backgroundColor: "var(--surface-low)", borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-6)", border: "1px solid var(--outline-variant)",
        }}>
          <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
            Live Fleet Status
          </h3>

          {fleet && (
            <>
              <FleetBar label="Loaded" count={fleet.loaded} total={fleet.total} color="#3b82f6" />
              <FleetBar label="Available" count={fleet.available} total={fleet.total} color="#22c55e" />
              <FleetBar label="In Shop" count={fleet.in_shop} total={fleet.total} color="#f59e0b" />

              <div style={{
                marginTop: "var(--spacing-5)", paddingTop: "var(--spacing-4)",
                borderTop: "1px solid var(--outline-variant)",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-4)",
              }}>
                <div>
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", margin: 0, marginBottom: 2 }}>Total Fleet</p>
                  <p style={{ color: "var(--on-surface)", fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{fleet.total}</p>
                </div>
                <div>
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", margin: 0, marginBottom: 2 }}>Utilization Rate</p>
                  <p style={{ color: "#22c55e", fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{fleet.utilization_rate}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div style={{
        backgroundColor: "var(--surface-low)", borderRadius: "var(--radius-xl)",
        padding: "var(--spacing-6)", border: "1px solid var(--outline-variant)",
      }}>
        <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
          Recent Logistical Events
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--spacing-4)" }}>
          {events.slice(0, 6).map((event, i) => {
            const color = EVENT_COLORS[event.color] || "#3b82f6";
            return (
              <div
                key={i}
                onClick={() => router.push(`/loads/${event.load_id}`)}
                style={{
                  padding: "var(--spacing-4)", backgroundColor: "var(--surface-lowest)",
                  borderRadius: "var(--radius-lg)", borderLeft: `3px solid ${color}`,
                  cursor: "pointer", transition: "transform 0.1s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    padding: "1px 8px", borderRadius: "var(--radius-full)",
                    backgroundColor: `${color}20`, color, fontSize: "0.7rem",
                    fontWeight: 600, textTransform: "capitalize",
                  }}>
                    {event.status.replace("_", " ")}
                  </span>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>
                    {event.timestamp ? new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </div>
                <p style={{ color: "var(--on-surface)", fontWeight: 600, fontSize: "0.9rem", margin: "4px 0 2px" }}>
                  {event.load_number}
                </p>
                <p style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem", margin: 0 }}>
                  {event.description}
                </p>
                {event.driver_name && (
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", margin: "4px 0 0", fontStyle: "italic" }}>
                    Driver: {event.driver_name}
                  </p>
                )}
              </div>
            );
          })}
          {events.length === 0 && (
            <p style={{ color: "var(--on-surface-variant)", gridColumn: "1 / -1", textAlign: "center", padding: "var(--spacing-6)" }}>
              No recent events
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub Components ──────────────────────────────────────────────

function KPICard({ icon, label, value, sub, accentColor }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accentColor: string;
}) {
  return (
    <div style={{
      backgroundColor: "var(--surface-low)", borderRadius: "var(--radius-xl)",
      padding: "var(--spacing-6)", border: "1px solid var(--outline-variant)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)", marginBottom: "var(--spacing-3)" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "var(--radius-lg)",
          backgroundColor: `${accentColor}15`, display: "flex", alignItems: "center",
          justifyContent: "center", color: accentColor,
        }}>
          {icon}
        </div>
        <span style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem", fontWeight: 500 }}>{label}</span>
      </div>
      <p className="headline-sm" style={{ color: "var(--on-surface)", margin: 0, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function FleetBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: "var(--spacing-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "var(--on-surface)", fontSize: "0.85rem", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--on-surface)", fontSize: "0.85rem", fontWeight: 600 }}>{count}</span>
      </div>
      <div style={{ height: 8, backgroundColor: "var(--surface-lowest)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}
