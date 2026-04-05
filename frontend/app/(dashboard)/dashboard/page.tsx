"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  ArrowUpRight, DollarSign, CheckCircle2,
  Truck, Users, Package, ArrowRight, Loader2,
  Plus, TrendingUp,
} from "lucide-react";
import api from "@/lib/api";

interface KpiData {
  gross_revenue: number; active_loads: number;
  active_drivers: number; on_trip_drivers: number;
  fleet_effectiveness: number; offer_loads: number; avg_rpm: number;
}
interface FleetStatus {
  loaded: number; available: number; in_shop: number;
  total: number; utilization_rate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fmt = (n: number | undefined) =>
    n === undefined || n === null ? "—" : n.toLocaleString("en-US");
  const fmtCurrency = (n: number | undefined) =>
    n === undefined || n === null
      ? "—"
      : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const driverCoverage = kpis
    ? kpis.active_drivers > 0 ? Math.round((kpis.on_trip_drivers / kpis.active_drivers) * 1000) / 10 : 0
    : 0;
  const gaugeData = [
    { name: "Covered",   value: driverCoverage || 0.1 },
    { name: "Uncovered", value: Math.max(100 - driverCoverage, 0.1) },
  ];
  const resolvedGaugeColors = React.useMemo(() => {
    if (typeof window === "undefined") return ["#16a34a", "#f59e0b"];
    const s = getComputedStyle(document.documentElement);
    return [
      s.getPropertyValue("--success").trim() || "#16a34a",
      s.getPropertyValue("--warning").trim() || "#f59e0b",
    ];
  }, [loading]);

  const fleetTotal     = fleet?.total     ?? 0;
  const fleetAvailable = fleet?.available ?? 0;
  const fleetLoaded    = fleet?.loaded    ?? 0;
  const fleetInShop    = fleet?.in_shop   ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="flex items-center gap-3" style={{ color: "var(--on-surface-variant)" }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="body-md font-medium">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  /* KPI card definitions — use CSS modifier classes */
  const kpiCards = [
    { label: "Total Revenue",  value: fmtCurrency(kpis?.gross_revenue), sub: `RPM: $${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, icon: DollarSign, mod: "kpi-card--green"  },
    { label: "Active Loads",   value: fmt(kpis?.active_loads),          sub: `${fmt(kpis?.offer_loads)} offers`,          icon: Package,    mod: "kpi-card--blue"   },
    { label: "Active Drivers", value: fmt(kpis?.active_drivers),        sub: `${fmt(kpis?.on_trip_drivers)} on trip`,     icon: Users,      mod: "kpi-card--purple" },
    { label: "Fleet Size",     value: fmt(fleetTotal),                  sub: `${fleet?.utilization_rate ?? 0}% utilized`, icon: Truck,      mod: "kpi-card--cyan"   },
  ];

  return (
    <div className="page-container" style={{ overflow: "auto" }}>
      {/* ══ KPI Row ══ */}
      <div className="kpi-grid mb-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className={`kpi-card ${kpi.mod}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="kpi-card__label">{kpi.label}</div>
                <div className="kpi-card__value tabular-nums">{kpi.value}</div>
                <div className="kpi-card__sub">{kpi.sub}</div>
              </div>
              <div className="kpi-card__icon shrink-0">
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ Main Grid ══ */}
      <div className="grid grid-cols-3 gap-5">

        {/* Fleet Status */}
        <div className="card-section">
          <h2 className="card-section-header">
            <Truck className="icon" style={{ color: "var(--primary)" }} />
            Fleet Status
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Available", val: fmt(fleetAvailable), color: "var(--success)",    bg: "color-mix(in srgb, var(--success) 8%, transparent)" },
              { label: "In Use",    val: fmt(fleetLoaded),    color: "var(--primary)",    bg: "color-mix(in srgb, var(--primary) 8%, transparent)" },
              { label: "In Shop",   val: fmt(fleetInShop),    color: "var(--warning)",    bg: "color-mix(in srgb, var(--warning) 8%, transparent)" },
            ].map(item => (
              <div key={item.label} className="rounded-xl py-4 px-2" style={{ backgroundColor: item.bg }}>
                <div className="kpi-card__label">{item.label}</div>
                <div className="tabular-nums font-extrabold" style={{ fontSize: 26, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Effectiveness Gauge */}
        <div className="card-section card-section--amber">
          <h2 className="card-section-header">
            <ArrowUpRight className="icon" style={{ color: "var(--warning)" }} />
            Fleet Effectiveness
          </h2>
          <div className="flex items-center justify-center">
            <div style={{ width: 200, height: 130, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy="90%" startAngle={180} endAngle={0}
                    innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                    {gaugeData.map((_, i) => <Cell key={i} fill={resolvedGaugeColors[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
                <div className="kpi-card__label">Effectiveness</div>
                <div className="kpi-card__value tabular-nums">{kpis?.fleet_effectiveness ?? 0}%</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between px-5 mt-1">
            <span className="kpi-card__sub tabular-nums">0</span>
            <span className="kpi-card__sub tabular-nums">100</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="card-section card-section--green">
          <h2 className="card-section-header">
            <CheckCircle2 className="icon" style={{ color: "var(--success)" }} />
            Tasks
          </h2>
          {(() => {
            const tasks: { text: string; href: string; color: string }[] = [];
            if (kpis) {
              if (kpis.active_loads > 0) tasks.push({ text: `Mark ${kpis.active_loads} active loads as delivered`, href: "/loads", color: "var(--primary)" });
              if (kpis.offer_loads > 0) tasks.push({ text: `Dispatch ${kpis.offer_loads} offer loads`, href: "/loads", color: "var(--warning)" });
              if (kpis.active_drivers > 0 && kpis.on_trip_drivers < kpis.active_drivers) tasks.push({ text: `Assign loads to ${kpis.active_drivers - kpis.on_trip_drivers} available drivers`, href: "/drivers", color: "var(--success)" });
            }
            if (fleetAvailable > 0) tasks.push({ text: `${fleetAvailable} trucks available for dispatch`, href: "/fleet", color: "var(--info)" });
            if (tasks.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--on-surface-variant)]">
                  <CheckCircle2 className="w-8 h-8" style={{ color: "var(--success)", opacity: 0.5 }} />
                  <span className="title-sm text-[var(--on-surface)]">All caught up!</span>
                  <span className="body-sm">No pending tasks right now</span>
                </div>
              );
            }
            return tasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between group"
                style={{ padding: "12px 0", borderBottom: i < tasks.length - 1 ? "1px solid var(--outline-variant)" : "none" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                  <span className="body-md font-medium text-[var(--on-surface)]">{task.text}</span>
                </div>
                <button onClick={() => router.push(task.href)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all opacity-60 hover:opacity-100 text-[var(--primary)]">
                  Go <ArrowRight style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ));
          })()}
        </div>

        {/* Driver Status */}
        <div className="card-section" style={{ borderLeftColor: "var(--accent-purple)" }}>
          <h2 className="card-section-header">
            <Users className="icon" style={{ color: "var(--accent-purple)" }} />
            Driver Status
          </h2>
          {kpis && kpis.active_drivers > 0 ? (
            <div className="space-y-3">
              {[
                { name: "On Trip",    color: "var(--primary)", qty: kpis.on_trip_drivers, pct: (kpis.on_trip_drivers / kpis.active_drivers) * 100 },
                { name: "Available",  color: "var(--success)", qty: kpis.active_drivers - kpis.on_trip_drivers, pct: ((kpis.active_drivers - kpis.on_trip_drivers) / kpis.active_drivers) * 100 },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="body-md font-semibold text-[var(--on-surface)]">{s.name}</span>
                    </div>
                    <span className="body-md font-bold tabular-nums text-[var(--on-surface)]">{s.qty}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Users className="w-8 h-8" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
              <span className="body-md font-medium text-[var(--on-surface-variant)]">No drivers yet</span>
              <button onClick={() => router.push("/drivers/new")} className="btn btn-sm" style={{ background: "var(--accent-purple)", color: "#fff", border: "none" }}>
                <Plus className="h-3 w-3" /> Add first driver
              </button>
            </div>
          )}
        </div>

        {/* Truck Status */}
        <div className="card-section" style={{ borderLeftColor: "var(--accent-cyan)" }}>
          <h2 className="card-section-header">
            <Truck className="icon" style={{ color: "var(--accent-cyan)" }} />
            Truck Status
          </h2>
          {fleetTotal > 0 ? (
            <div className="space-y-3">
              {[
                { name: "Available", color: "var(--success)", qty: fleetAvailable, pct: (fleetAvailable / fleetTotal) * 100 },
                { name: "In Use",    color: "var(--primary)", qty: fleetLoaded,    pct: (fleetLoaded    / fleetTotal) * 100 },
                { name: "In Shop",   color: "var(--warning)", qty: fleetInShop,    pct: (fleetInShop   / fleetTotal) * 100 },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="body-md font-semibold text-[var(--on-surface)]">{s.name}</span>
                    </div>
                    <span className="body-md font-bold tabular-nums text-[var(--on-surface)]">{s.qty}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${Math.max(s.pct, 2)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                <span className="label-sm text-[var(--on-surface-variant)]">Total Fleet</span>
                <span className="label-sm font-bold tabular-nums text-[var(--on-surface)]">{fleetTotal} units</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Truck className="w-8 h-8" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
              <span className="body-md font-medium text-[var(--on-surface-variant)]">No fleet data yet</span>
              <button onClick={() => router.push("/fleet/new")} className="btn btn-sm" style={{ background: "var(--accent-cyan)", color: "#fff", border: "none" }}>
                <Plus className="h-3 w-3" /> Register truck
              </button>
            </div>
          )}
        </div>

        {/* Revenue Overview */}
        <div className="card-section card-section--green">
          <h2 className="card-section-header">
            <TrendingUp className="icon" style={{ color: "var(--success)" }} />
            Revenue Overview
          </h2>
          <div className="flex flex-col gap-5">
            {[
              { label: "Gross Revenue",    value: fmtCurrency(kpis?.gross_revenue), width: "100%", color: "var(--success)" },
              { label: "Avg Rate Per Mile", value: `$${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, width: `${Math.min((kpis?.avg_rpm ?? 0) * 30, 100)}%`, color: "var(--primary)" },
              { label: "Fleet Utilization", value: `${fleet?.utilization_rate ?? 0}%`, width: `${fleet?.utilization_rate ?? 0}%`, color: "var(--accent-cyan)" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span className="body-md text-[var(--on-surface-variant)]">{item.label}</span>
                  <span className="body-md font-bold tabular-nums text-[var(--on-surface)]">{item.value}</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: item.width || "2%", background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
