"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  DollarSign, CheckCircle2,
  Truck, Users, Package, Loader2,
  Plus, TrendingUp, AlertCircle, Wrench,
  Calendar, FileText, Calculator, BarChart3,
} from "lucide-react";
import api from "@/lib/api";

/* ── Types ── */
interface KpiData {
  gross_revenue: number; active_loads: number;
  active_drivers: number; on_trip_drivers: number;
  fleet_effectiveness: number; offer_loads: number; avg_rpm: number;
}
interface FleetStatus {
  loaded: number; available: number; in_shop: number;
  total: number; utilization_rate: number;
}

/* ── Dashboard ── */
export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("get-things-done");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [kpiRes, fleetRes] = await Promise.allSettled([
          api.get("/dashboard/kpis"),
          api.get("/dashboard/fleet-status"),
        ]);
        if (kpiRes.status === "fulfilled") setKpis(kpiRes.value.data);
        if (fleetRes.status === "fulfilled") setFleet(fleetRes.value.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ── Formatters ── */
  const fmt = (n: number | undefined | null) =>
    n == null ? "0" : n.toLocaleString("en-US");
  const fmtCurrency = (n: number | undefined | null) =>
    n == null ? "$0.00" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  const fmtRpm = (n: number | undefined | null) =>
    n == null ? "0.00" : n.toFixed(2);

  /* ── Computed ── */
  const availableDrivers = kpis ? kpis.active_drivers - kpis.on_trip_drivers : 0;
  const driverTotal = kpis?.active_drivers ?? 0;
  const driverCoverage = driverTotal > 0
    ? Math.round((kpis!.on_trip_drivers / driverTotal) * 1000) / 10
    : 0;

  const fleetTotal     = fleet?.total     ?? 0;
  const fleetAvailable = fleet?.available ?? 0;
  const fleetLoaded    = fleet?.loaded    ?? 0;
  const fleetInShop    = fleet?.in_shop   ?? 0;

  /* Donut data */
  const donutData = useMemo(() => [
    { name: "Covered", value: kpis?.on_trip_drivers || 0 },
    { name: "Available", value: Math.max(availableDrivers, 0) },
  ], [kpis, availableDrivers]);
  const donutColors = ["#16a34a", "#f59e0b"];

  /* Tasks */
  const tasks: { text: string; href: string }[] = [];
  if (kpis) {
    if ((kpis.active_loads ?? 0) > 0)
      tasks.push({ text: `Prepare invoices for ${kpis.active_loads} delivered loads`, href: "/accounting" });
    if ((kpis.active_loads ?? 0) > 0)
      tasks.push({ text: `Mark ${kpis.active_loads} in-transit loads delivered`, href: "/loads" });
    if ((kpis.offer_loads ?? 0) > 0)
      tasks.push({ text: `Dispatch ${kpis.offer_loads} booked loads to drivers`, href: "/loads" });
    if (availableDrivers > 0)
      tasks.push({ text: `Dispatch loads to ${availableDrivers} available drivers`, href: "/drivers" });
  }

  /* Driver dispatch statuses */
  const driverStatuses = useMemo(() => {
    if (!kpis || driverTotal === 0) return [];
    return [
      { status: "DISPATCHED",  qty: kpis.on_trip_drivers, color: "#5B5BD6" },
      { status: "IN TRANSIT",  qty: 0, color: "#f59e0b" },
      { status: "AVAILABLE",   qty: availableDrivers, color: "#16a34a" },
    ].map(s => ({ ...s, pct: driverTotal > 0 ? ((s.qty / driverTotal) * 100).toFixed(2) : "0.00" }));
  }, [kpis, driverTotal, availableDrivers]);

  /* Truck statuses */
  const truckStatuses = useMemo(() => {
    if (!fleet || fleetTotal === 0) return [];
    return [
      { status: "AVAILABLE",  qty: fleetAvailable, color: "#16a34a" },
      { status: "IN TRANSIT", qty: fleetLoaded,    color: "#5B5BD6" },
    ].filter(s => s.qty > 0)
     .map(s => ({ ...s, pct: fleetTotal > 0 ? ((s.qty / fleetTotal) * 100).toFixed(1) : "0.0" }));
  }, [fleet, fleetTotal, fleetAvailable, fleetLoaded]);

  const grossRevenuePct = kpis?.gross_revenue
    ? Math.min((kpis.gross_revenue / 300_000) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="flex items-center gap-3" style={{ color: "var(--on-surface-variant)" }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="body-md font-medium">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  /* ── KPI definitions ── */
  const kpiCards = [
    {
      label: "TOTAL REVENUE",
      value: fmtCurrency(kpis?.gross_revenue),
      sub: `$${fmtRpm(kpis?.avg_rpm)}/mi`,
      icon: DollarSign,
      accent: "#16a34a",
      accentBg: "rgba(22,163,74,0.1)",
    },
    {
      label: "ACTIVE LOADS",
      value: fmt(kpis?.active_loads),
      sub: `${fmt(kpis?.offer_loads)} offers pending`,
      icon: Package,
      accent: "#5B5BD6",
      accentBg: "rgba(91,91,214,0.1)",
    },
    {
      label: "ACTIVE DRIVERS",
      value: fmt(kpis?.active_drivers),
      sub: `${fmt(kpis?.on_trip_drivers)} on trip`,
      icon: Users,
      accent: "#7c3aed",
      accentBg: "rgba(124,58,237,0.1)",
    },
    {
      label: "FLEET SIZE",
      value: fmt(fleetTotal),
      sub: `${fleet?.utilization_rate ?? 0}% utilized`,
      icon: Truck,
      accent: "#0891b2",
      accentBg: "rgba(8,145,178,0.1)",
    },
  ];

  /* ── Tab definitions ── */
  const tabs = [
    { id: "get-things-done",  label: "Get things done" },
    { id: "overview",         label: "Overview" },
    { id: "profit-reports",   label: "Profit reports" },
    { id: "financial-reports", label: "Financial reports" },
    { id: "ifta-reports",     label: "IFTA reports" },
    { id: "report-calc",      label: "Report calculator" },
    { id: "custom-report",    label: "Custom report" },
  ];

  return (
    <div className="page-container" style={{ overflow: "auto" }}>

      {/* ══ KPI Cards ══ */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ "--kpi-accent": kpi.accent } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="kpi-card__label">{kpi.label}</div>
                <div className="kpi-card__value tabular-nums">{kpi.value}</div>
                <div className="kpi-card__sub">{kpi.sub}</div>
              </div>
              <div
                className="kpi-card__icon shrink-0"
                style={{ background: kpi.accentBg, color: kpi.accent }}
              >
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ Tab Bar ══ */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item${activeTab === tab.id ? " tab-item--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ Get Things Done ══ */}
      {activeTab === "get-things-done" && (
        <>
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-5" style={{ marginBottom: 20 }}>

            {/* ── Quick Setup ── */}
            <div className="card-section">
              <div className="card-section-header">
                <AlertCircle className="icon" style={{ color: "var(--primary)" }} />
                Quick Setup
                <span
                  style={{
                    marginLeft: "auto", width: 22, height: 22, borderRadius: "50%",
                    background: "var(--primary)", color: "#fff", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                  }}
                >✓</span>
              </div>
              <p className="body-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 16 }}>
                Unassigned Trucks, Trailers, Drivers
              </p>
              <div className="grid grid-cols-3 gap-4 text-center" style={{ padding: "8px 0" }}>
                {[
                  { label: "Trucks",   val: fmt(fleetAvailable),  color: "#5B5BD6",  href: "/fleet" },
                  { label: "Trailers", val: "0",                  color: "#0891b2",  href: "/fleet" },
                  { label: "Drivers",  val: fmt(availableDrivers), color: "#7c3aed", href: "/drivers" },
                ].map(item => (
                  <div key={item.label} className="cursor-pointer group" onClick={() => router.push(item.href)}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.label}
                    </div>
                    <div
                      className="tabular-nums group-hover:scale-110 transition-transform"
                      style={{ fontSize: 36, fontWeight: 800, color: item.color, lineHeight: 1 }}
                    >
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Covered Drivers (Donut) ── */}
            <div className="card-section card-section--green">
              <div className="card-section-header">
                <Users className="icon" style={{ color: "var(--success)" }} />
                Covered Drivers
              </div>
              <div className="flex items-center justify-center" style={{ padding: "8px 0" }}>
                <div style={{ width: 190, height: 190, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={driverTotal > 0 ? donutData : [{ name: "Empty", value: 1 }]}
                        cx="50%" cy="50%"
                        innerRadius={58} outerRadius={82}
                        paddingAngle={driverTotal > 0 ? 3 : 0}
                        dataKey="value" stroke="none"
                        startAngle={90} endAngle={-270}
                      >
                        {driverTotal > 0
                          ? donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)
                          : <Cell fill="var(--surface-container)" />}
                      </Pie>
                      {driverTotal > 0 && <Tooltip />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--on-surface-variant)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                      COVERED
                    </div>
                    <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--on-surface)" }}>
                      {driverCoverage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tasks ── */}
            <div className="card-section" style={{ borderLeftColor: "var(--warning)" }}>
              <div className="card-section-header">
                <CheckCircle2 className="icon" style={{ color: "var(--warning)" }} />
                Tasks
              </div>
              {tasks.length === 0 ? (
                <EmptyTaskState onAction={() => router.push("/loads/new")} />
              ) : (
                <div className="flex flex-col">
                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                      style={{
                        padding: "11px 0",
                        borderBottom: i < tasks.length - 1 ? "1px solid var(--outline-variant)" : "none",
                      }}
                    >
                      <span className="body-md" style={{ color: "var(--on-surface)", flex: 1, lineHeight: 1.4 }}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => router.push(task.href)}
                        className="btn btn-xs btn-secondary"
                        style={{ flexShrink: 0, marginLeft: 12, minWidth: 40 }}
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-5">

            {/* ── Driver Dispatch Statuses ── */}
            <div className="card-section" style={{ borderLeftColor: "#7c3aed" }}>
              <div className="card-section-header" style={{ marginBottom: 10, paddingBottom: 10 }}>
                <Users className="icon" style={{ color: "#7c3aed" }} />
                Driver Dispatch Statuses
                <div className="flex gap-2" style={{ marginLeft: "auto" }}>
                  <span className="body-sm font-semibold" style={{ color: "var(--primary)" }}>Driver</span>
                  <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>Dispatch</span>
                </div>
              </div>
              {driverStatuses.length > 0 ? (
                <StatusTable rows={driverStatuses} />
              ) : (
                <EmptyTableState
                  icon={<Users className="w-7 h-7" />}
                  text="No drivers yet"
                  btnLabel="Add First Driver"
                  onAction={() => router.push("/drivers/new")}
                />
              )}
            </div>

            {/* ── Truck Statuses ── */}
            <div className="card-section" style={{ borderLeftColor: "#0891b2" }}>
              <div className="card-section-header" style={{ marginBottom: 10, paddingBottom: 10 }}>
                <Truck className="icon" style={{ color: "#0891b2" }} />
                Truck Statuses
                <div className="flex gap-2" style={{ marginLeft: "auto" }}>
                  <span className="body-sm font-semibold" style={{ color: "var(--primary)" }}>Truck</span>
                  <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>Fleet</span>
                </div>
              </div>
              {truckStatuses.length > 0 ? (
                <>
                  <StatusTable rows={truckStatuses} />
                  <div className="flex justify-between items-center" style={{ borderTop: "1px solid var(--outline-variant)", padding: "8px 0 0", marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--on-surface-variant)", textTransform: "uppercase" }}>GRAND TOTAL</span>
                    <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>{fleetTotal}</span>
                    <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>100%</span>
                  </div>
                </>
              ) : (
                <EmptyTableState
                  icon={<Truck className="w-7 h-7" />}
                  text="No fleet data yet"
                  btnLabel="Register First Truck"
                  onAction={() => router.push("/fleet/new")}
                />
              )}
            </div>

            {/* ── Profit & Loss ── */}
            <div className="card-section card-section--green">
              <div className="card-section-header" style={{ marginBottom: 10, paddingBottom: 10 }}>
                <TrendingUp className="icon" style={{ color: "var(--success)" }} />
                Profit & Loss
              </div>

              {/* Date range selector (display only) */}
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <select className="select-base" style={{ height: 30, fontSize: 11, padding: "0 28px 0 8px", width: "auto" }} defaultValue="delivery">
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              {/* Revenue bars */}
              <div className="flex flex-col gap-4">
                <ProfitRow
                  label="Total Gross Revenue"
                  value={fmtCurrency(kpis?.gross_revenue)}
                  pct={grossRevenuePct}
                  color="#16a34a"
                />
                <ProfitRow
                  label="Driver Salary Expenses"
                  value="$0.00"
                  pct={0}
                  color="#5B5BD6"
                />
                <div className="flex justify-between">
                  <span className="body-md" style={{ color: "var(--on-surface-variant)" }}>Fuel Costs</span>
                  <span className="body-md font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="body-md" style={{ color: "var(--on-surface-variant)" }}>Toll Costs</span>
                  <span className="body-md font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>$0.00</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ Overview Tab ══ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          {/* Fleet Status */}
          <div className="card-section">
            <div className="card-section-header">
              <Truck className="icon" style={{ color: "var(--primary)" }} />
              Fleet Status
            </div>
            {fleetTotal > 0 ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Available", val: fmt(fleetAvailable), color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
                  { label: "In Use",    val: fmt(fleetLoaded),    color: "#5B5BD6", bg: "rgba(91,91,214,0.08)" },
                  { label: "In Shop",   val: fmt(fleetInShop),    color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                ].map(item => (
                  <div key={item.label} className="rounded-xl py-4 px-2" style={{ backgroundColor: item.bg }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                    <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyTableState icon={<Truck className="w-8 h-8" />} text="No fleet registered" btnLabel="Register First Truck" onAction={() => router.push("/fleet/new")} />
            )}
          </div>

          {/* Fleet Effectiveness Gauge */}
          <div className="card-section card-section--amber">
            <div className="card-section-header">
              <BarChart3 className="icon" style={{ color: "var(--warning)" }} />
              Fleet Effectiveness
            </div>
            <div className="flex items-center justify-center">
              <div style={{ width: 200, height: 130, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Covered", value: driverCoverage || 0.1 },
                        { name: "Uncovered", value: Math.max(100 - driverCoverage, 0.1) },
                      ]}
                      cx="50%" cy="90%" startAngle={180} endAngle={0}
                      innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none"
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Effectiveness</div>
                  <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 800, color: "var(--on-surface)" }}>{kpis?.fleet_effectiveness ?? 0}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="card-section card-section--green">
            <div className="card-section-header">
              <TrendingUp className="icon" style={{ color: "var(--success)" }} />
              Revenue Overview
            </div>
            <div className="flex flex-col gap-5">
              <ProfitRow label="Gross Revenue" value={fmtCurrency(kpis?.gross_revenue)} pct={grossRevenuePct} color="#16a34a" />
              <ProfitRow label="Avg Rate Per Mile" value={`$${fmtRpm(kpis?.avg_rpm)}`} pct={Math.min((kpis?.avg_rpm ?? 0) * 30, 100)} color="#5B5BD6" />
              <ProfitRow label="Fleet Utilization" value={`${fleet?.utilization_rate ?? 0}%`} pct={fleet?.utilization_rate ?? 0} color="#0891b2" />
            </div>
          </div>
        </div>
      )}

      {/* ══ Other Tabs (Coming Soon placeholders) ══ */}
      {!["get-things-done", "overview"].includes(activeTab) && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="empty-state-icon">
            {activeTab === "profit-reports" && <TrendingUp className="w-8 h-8" />}
            {activeTab === "financial-reports" && <FileText className="w-8 h-8" />}
            {activeTab === "ifta-reports" && <Truck className="w-8 h-8" />}
            {activeTab === "report-calc" && <Calculator className="w-8 h-8" />}
            {activeTab === "custom-report" && <BarChart3 className="w-8 h-8" />}
          </div>
          <h3 className="headline-sm" style={{ color: "var(--on-surface)" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="body-md text-center" style={{ color: "var(--on-surface-variant)", maxWidth: 400 }}>
            This report module is under development. Check back soon for detailed analytics and reports.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════ Sub-Components ══════════ */

function StatusTable({ rows }: { rows: { status: string; qty: number; pct: string; color: string }[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 700, color: "var(--on-surface-variant)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>STATUS</th>
          <th style={{ textAlign: "center", padding: "6px 0", fontWeight: 700, color: "var(--on-surface-variant)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>QTY</th>
          <th style={{ textAlign: "right", padding: "6px 0", fontWeight: 700, color: "var(--on-surface-variant)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(s => (
          <tr key={s.status} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <td style={{ padding: "9px 0" }}>
              <span className="body-md font-semibold" style={{ color: "var(--on-surface)" }}>{s.status}</span>
            </td>
            <td style={{ textAlign: "center", padding: "9px 0" }}>
              <span
                className="chip-status"
                style={{
                  background: `${s.color}1a`,
                  color: s.color,
                  fontWeight: 700, fontSize: 11, padding: "3px 10px",
                }}
              >
                {s.qty}
              </span>
            </td>
            <td style={{ textAlign: "right", padding: "9px 0" }}>
              <span className="tabular-nums body-sm font-medium" style={{ color: "var(--on-surface)" }}>{s.pct}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProfitRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between" style={{ marginBottom: 6 }}>
        <span className="body-md" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
        <span className="body-md font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{value}</span>
      </div>
      <div className="progress-bar-track" style={{ height: 10, borderRadius: "var(--radius-full)" }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color, borderRadius: "var(--radius-full)" }} />
      </div>
    </div>
  );
}

function EmptyTaskState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Package className="w-8 h-8" style={{ color: "var(--primary)", opacity: 0.35 }} />
      <span className="title-sm text-center" style={{ color: "var(--on-surface)" }}>Ready to dispatch?</span>
      <span className="body-sm text-center" style={{ color: "var(--on-surface-variant)" }}>Create your first load to get started</span>
      <button onClick={onAction} className="btn btn-sm btn-primary mt-1">
        <Plus className="h-3 w-3" /> Create Your First Load
      </button>
    </div>
  );
}

function EmptyTableState({ icon, text, btnLabel, onAction }: {
  icon: React.ReactNode; text: string; btnLabel: string; onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2">
      <div style={{ color: "var(--on-surface-variant)", opacity: 0.3 }}>{icon}</div>
      <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>{text}</span>
      <button onClick={onAction} className="btn btn-xs btn-primary">
        <Plus className="h-3 w-3" /> {btnLabel}
      </button>
    </div>
  );
}
