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

/* ═══════════════════════════════════════════════════════════════
   Dashboard — Enterprise Operations Overview
   Premium design with gradient accents, colored card borders,
   and improved empty states.
   ═══════════════════════════════════════════════════════════════ */

interface KpiData {
  gross_revenue: number;
  active_loads: number;
  active_drivers: number;
  on_trip_drivers: number;
  fleet_effectiveness: number;
  offer_loads: number;
  avg_rpm: number;
}

interface FleetStatus {
  loaded: number;
  available: number;
  in_shop: number;
  total: number;
  utilization_rate: number;
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

  const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return "—";
    return n.toLocaleString("en-US");
  };
  const fmtCurrency = (n: number | undefined) => {
    if (n === undefined || n === null) return "—";
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* Driver coverage gauge */
  const driverCoverage = kpis
    ? (kpis.active_drivers > 0 ? Math.round((kpis.on_trip_drivers / kpis.active_drivers) * 1000) / 10 : 0)
    : 0;
  const gaugeData = [
    { name: "Covered", value: driverCoverage || 0.1, color: "var(--success)" },
    { name: "Uncovered", value: Math.max(100 - driverCoverage, 0.1), color: "var(--warning)" },
  ];
  const resolvedGaugeColors = React.useMemo(() => {
    if (typeof window === "undefined") return ["#16a34a", "#f59e0b"];
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue("--success").trim() || "#16a34a",
      style.getPropertyValue("--warning").trim() || "#f59e0b",
    ];
  }, [loading]);

  /* Fleet totals */
  const fleetTotal = fleet?.total ?? 0;
  const fleetAvailable = fleet?.available ?? 0;
  const fleetLoaded = fleet?.loaded ?? 0;
  const fleetInShop = fleet?.in_shop ?? 0;

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

  /* KPI card configs */
  const kpiCards = [
    { label: "Total Revenue", value: fmtCurrency(kpis?.gross_revenue), sub: `RPM: $${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, icon: DollarSign, gradient: "linear-gradient(180deg, #16a34a, #15803d)", iconBg: "rgba(22, 163, 74, 0.1)" },
    { label: "Active Loads", value: fmt(kpis?.active_loads), sub: `${fmt(kpis?.offer_loads)} offers`, icon: Package, gradient: "linear-gradient(180deg, #2563eb, #1d4ed8)", iconBg: "rgba(37, 99, 235, 0.1)" },
    { label: "Active Drivers", value: fmt(kpis?.active_drivers), sub: `${fmt(kpis?.on_trip_drivers)} on trip`, icon: Users, gradient: "linear-gradient(180deg, #7c3aed, #6d28d9)", iconBg: "rgba(124, 58, 237, 0.1)" },
    { label: "Fleet Size", value: fmt(fleetTotal), sub: `${fleet?.utilization_rate ?? 0}% utilized`, icon: Truck, gradient: "linear-gradient(180deg, #0891b2, #0e7490)", iconBg: "rgba(8, 145, 178, 0.1)" },
  ];

  return (
    <div className="page-container" style={{ overflow: "auto" }}>
      {/* ══════════════ KPI Row ══════════════ */}
      <div className="grid grid-cols-4 gap-5 mb-6" style={{ minWidth: 0 }}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden" style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--card-radius)",
            boxShadow: "var(--shadow-md)",
            padding: "20px 24px",
          }}>
            {/* Colored left accent strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: kpi.gradient, borderRadius: "12px 0 0 12px" }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium tracking-wide mb-1" style={{ color: "var(--on-surface-variant)" }}>{kpi.label}</div>
                <div className="text-2xl font-extrabold tabular-nums mb-0.5" style={{ color: "var(--on-surface)" }}>{kpi.value}</div>
                <div className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>{kpi.sub}</div>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.iconBg }}>
                <kpi.icon style={{ width: 22, height: 22, color: kpi.gradient.includes("#16a34a") ? "#16a34a" : kpi.gradient.includes("#2563eb") ? "#2563eb" : kpi.gradient.includes("#7c3aed") ? "#7c3aed" : "#0891b2" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ Main Grid ══════════════ */}
      <div className="grid grid-cols-3 gap-5">

        {/* ── Fleet Status ── */}
        <div className="card-section" style={{ borderLeftColor: "var(--primary)" }}>
          <h2 className="card-section-header">
            <Truck className="icon" style={{ color: "var(--primary)" }} />
            Fleet Status
          </h2>
          <div className="grid grid-cols-3 gap-3" style={{ textAlign: "center" }}>
            {[
              { label: "Available", val: fmt(fleetAvailable), color: "#16a34a", bg: "rgba(22, 163, 74, 0.08)" },
              { label: "In Use", val: fmt(fleetLoaded), color: "#2563eb", bg: "rgba(37, 99, 235, 0.08)" },
              { label: "In Shop", val: fmt(fleetInShop), color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
            ].map(item => (
              <div key={item.label} className="rounded-xl py-4 px-2" style={{ backgroundColor: item.bg }}>
                <div className="text-[11px] font-medium mb-1.5" style={{ color: "var(--on-surface-variant)" }}>{item.label}</div>
                <div className="tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fleet Effectiveness Gauge ── */}
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
                <div className="text-[11px] font-medium tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Effectiveness</div>
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--on-surface)" }}>{kpis?.fleet_effectiveness ?? 0}%</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between px-5 mt-1">
            <span className="text-[11px] tabular-nums font-medium" style={{ color: "var(--on-surface-variant)" }}>0</span>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: "var(--on-surface-variant)" }}>100</span>
          </div>
        </div>

        {/* ── Tasks ── */}
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
                <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: "var(--on-surface-variant)" }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: "var(--success)", opacity: 0.5 }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>All caught up!</span>
                  <span className="text-xs">No pending tasks right now</span>
                </div>
              );
            }
            return tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center justify-between group"
                style={{
                  padding: "12px 0",
                  borderBottom: i < tasks.length - 1 ? "1px solid var(--outline-variant)" : "none",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                  <span className="text-[13px]" style={{ color: "var(--on-surface)", fontWeight: 500 }}>{task.text}</span>
                </div>
                {task.href && (
                  <button
                    onClick={() => router.push(task.href)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all opacity-60 hover:opacity-100"
                    style={{ color: "var(--primary)" }}
                  >
                    Go <ArrowRight style={{ width: 11, height: 11 }} />
                  </button>
                )}
              </div>
            ));
          })()}
        </div>

        {/* ── Driver Status ── */}
        <div className="card-section" style={{ borderLeftColor: "#7c3aed" }}>
          <h2 className="card-section-header">
            <Users className="icon" style={{ color: "#7c3aed" }} />
            Driver Status
          </h2>
          {kpis && kpis.active_drivers > 0 ? (
            <div className="space-y-3">
              {[
                { name: "On Trip", color: "#2563eb", qty: kpis.on_trip_drivers, pct: ((kpis.on_trip_drivers / kpis.active_drivers) * 100) },
                { name: "Available", color: "#16a34a", qty: kpis.active_drivers - kpis.on_trip_drivers, pct: (((kpis.active_drivers - kpis.on_trip_drivers) / kpis.active_drivers) * 100) },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[13px] font-semibold" style={{ color: "var(--on-surface)" }}>{s.name}</span>
                    </div>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{s.qty}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Users className="w-8 h-8" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
              <span className="text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>No drivers yet</span>
              <button onClick={() => router.push("/drivers/new")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: "#7c3aed" }}>
                <Plus className="h-3 w-3" /> Add first driver
              </button>
            </div>
          )}
        </div>

        {/* ── Truck Status ── */}
        <div className="card-section" style={{ borderLeftColor: "#0891b2" }}>
          <h2 className="card-section-header">
            <Truck className="icon" style={{ color: "#0891b2" }} />
            Truck Status
          </h2>
          {fleetTotal > 0 ? (
            <div className="space-y-3">
              {[
                { name: "Available", color: "#16a34a", qty: fleetAvailable, pct: ((fleetAvailable / fleetTotal) * 100) },
                { name: "In Use", color: "#2563eb", qty: fleetLoaded, pct: ((fleetLoaded / fleetTotal) * 100) },
                { name: "In Shop", color: "#f59e0b", qty: fleetInShop, pct: ((fleetInShop / fleetTotal) * 100) },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[13px] font-semibold" style={{ color: "var(--on-surface)" }}>{s.name}</span>
                    </div>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{s.qty}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(s.pct, 2)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                <span className="text-[11px] font-semibold" style={{ color: "var(--on-surface-variant)" }}>Total Fleet</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{fleetTotal} units</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Truck className="w-8 h-8" style={{ color: "var(--on-surface-variant)", opacity: 0.3 }} />
              <span className="text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>No fleet data yet</span>
              <button onClick={() => router.push("/fleet/new")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: "#0891b2" }}>
                <Plus className="h-3 w-3" /> Register truck
              </button>
            </div>
          )}
        </div>

        {/* ── Revenue Overview ── */}
        <div className="card-section" style={{ borderLeftColor: "#16a34a" }}>
          <h2 className="card-section-header">
            <TrendingUp className="icon" style={{ color: "#16a34a" }} />
            Revenue Overview
          </h2>
          <div className="flex flex-col gap-5">
            {[
              { label: "Gross Revenue", value: fmtCurrency(kpis?.gross_revenue), width: "100%", color: "#16a34a" },
              { label: "Avg Rate Per Mile", value: `$${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, width: `${Math.min((kpis?.avg_rpm ?? 0) * 30, 100)}%`, color: "#2563eb" },
              { label: "Fleet Utilization", value: `${fleet?.utilization_rate ?? 0}%`, width: `${fleet?.utilization_rate ?? 0}%`, color: "#0891b2" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span className="text-[13px] font-medium" style={{ color: "var(--on-surface-variant)" }}>{item.label}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{item.value}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: item.width || "2%", backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
