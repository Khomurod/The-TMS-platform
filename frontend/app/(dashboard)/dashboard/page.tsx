"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Settings2, ArrowUpRight, DollarSign, CheckCircle2,
  Truck, Users, Package, ArrowRight, Loader2,
} from "lucide-react";
import api from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   Dashboard — Enterprise Operations Overview
   Fetches REAL data from /api/v1/dashboard/* endpoints.
   Uses design system tokens exclusively — no hardcoded colors.
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
  // Recharts needs actual hex — resolve CSS variables at runtime so dark mode works
  const resolvedGaugeColors = React.useMemo(() => {
    if (typeof window === "undefined") return ["#16a34a", "#f59e0b"]; // SSR fallback
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue("--success").trim() || "#16a34a",
      style.getPropertyValue("--warning").trim() || "#f59e0b",
    ];
  }, [loading]); // re-resolve when dashboard data loads (ensures DOM is mounted)

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

  return (
    <div className="page-container" style={{ overflow: "auto" }}>
      {/* KPI Summary Row */}
      <div className="grid grid-cols-4 gap-4 mb-5" style={{ minWidth: 0 }}>
        {[
          { label: "Total Revenue", value: fmtCurrency(kpis?.gross_revenue), sub: `RPM: $${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, icon: DollarSign, colorVar: "--success" },
          { label: "Active Loads", value: fmt(kpis?.active_loads), sub: `${fmt(kpis?.offer_loads)} offers`, icon: Package, colorVar: "--primary" },
          { label: "Active Drivers", value: fmt(kpis?.active_drivers), sub: `${fmt(kpis?.on_trip_drivers)} on trip`, icon: Users, colorVar: "--info" },
          { label: "Fleet Size", value: fmt(fleetTotal), sub: `${fleet?.utilization_rate ?? 0}% utilized`, icon: Truck, colorVar: "--status-assigned" },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
            <div
              className="kpi-icon"
              style={{ backgroundColor: `color-mix(in srgb, var(${kpi.colorVar}) 12%, transparent)` }}
            >
              <kpi.icon style={{ width: 20, height: 20, color: `var(${kpi.colorVar})` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">

        {/* Quick Setup — Fleet Overview */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 style={{ width: 18, height: 18, color: "var(--primary)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Quick Setup</span>
          </div>
          <div className="label-sm mb-3" style={{ color: "var(--on-surface-variant)" }}>Fleet Overview</div>
          <div className="grid grid-cols-3 gap-2" style={{ textAlign: "center" }}>
            {[
              { label: "Available", val: fmt(fleetAvailable), colorVar: "--success" },
              { label: "In Use", val: fmt(fleetLoaded), colorVar: "--primary" },
              { label: "In Shop", val: fmt(fleetInShop), colorVar: "--warning" },
            ].map(item => (
              <div key={item.label} className="card-flat" style={{ padding: "12px 0" }}>
                <div className="label-sm mb-1" style={{ color: "var(--on-surface-variant)" }}>{item.label}</div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: 26, fontWeight: 800, color: `var(${item.colorVar})` }}
                >
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Effectiveness Gauge */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight style={{ width: 18, height: 18, color: "var(--primary)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Fleet Effectiveness</span>
          </div>
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
                <div className="label-sm" style={{ color: "var(--on-surface-variant)", letterSpacing: "0.08em" }}>Effectiveness</div>
                <div className="kpi-value">{kpis?.fleet_effectiveness ?? 0}%</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between px-5 mt-1">
            <span className="label-sm tabular-nums" style={{ color: "var(--on-surface-variant)" }}>0</span>
            <span className="label-sm tabular-nums" style={{ color: "var(--on-surface-variant)" }}>100</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 style={{ width: 18, height: 18, color: "var(--success)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Tasks</span>
          </div>
          {(() => {
            const tasks: { text: string; href: string }[] = [];
            if (kpis) {
              if (kpis.active_loads > 0) tasks.push({ text: `Mark ${kpis.active_loads} active loads as delivered`, href: "/loads" });
              if (kpis.offer_loads > 0) tasks.push({ text: `Dispatch ${kpis.offer_loads} offer loads`, href: "/loads" });
              if (kpis.active_drivers > 0 && kpis.on_trip_drivers < kpis.active_drivers) tasks.push({ text: `Assign loads to ${kpis.active_drivers - kpis.on_trip_drivers} available drivers`, href: "/drivers" });
            }
            if (fleetAvailable > 0) tasks.push({ text: `${fleetAvailable} trucks available for dispatch`, href: "/fleet" });
            if (tasks.length === 0) tasks.push({ text: "No pending tasks — all caught up!", href: "" });
            return tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 0",
                  borderBottom: i < tasks.length - 1 ? "1px solid var(--outline-variant)" : "none",
                }}
              >
                <span className="body-md" style={{ color: "var(--on-surface)", fontWeight: 500 }}>{task.text}</span>
                {task.href && (
                  <button
                    onClick={() => router.push(task.href)}
                    className="btn btn-secondary btn-xs"
                  >
                    Go <ArrowRight style={{ width: 11, height: 11 }} />
                  </button>
                )}
              </div>
            ));
          })()}
        </div>

        {/* Driver Status */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users style={{ width: 18, height: 18, color: "var(--primary)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Driver Status</span>
          </div>
          <div className="status-grid-header">
            <span>Status</span>
            <span style={{ textAlign: "center" }}>Qty</span>
            <span style={{ textAlign: "right" }}>%</span>
          </div>
          {kpis && kpis.active_drivers > 0 ? (
            <>
              {[
                { name: "ON TRIP", colorVar: "--primary", qty: kpis.on_trip_drivers, pct: ((kpis.on_trip_drivers / kpis.active_drivers) * 100).toFixed(1) },
                { name: "AVAILABLE", colorVar: "--success", qty: kpis.active_drivers - kpis.on_trip_drivers, pct: (((kpis.active_drivers - kpis.on_trip_drivers) / kpis.active_drivers) * 100).toFixed(1) },
              ].map((s, i) => (
                <div key={i} className="status-grid-row">
                  <div className="flex items-center gap-2">
                    <span className="status-dot" style={{ background: `var(${s.colorVar})` }} />
                    <span className="body-sm font-semibold" style={{ color: "var(--on-surface)" }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span className="status-qty-badge" style={{ background: `var(${s.colorVar})` }}>{s.qty}</span>
                  </div>
                  <span className="body-sm tabular-nums" style={{ color: "var(--on-surface-variant)", textAlign: "right" }}>{s.pct}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="body-md" style={{ padding: 20, textAlign: "center", color: "var(--on-surface-variant)" }}>No driver data available</div>
          )}
        </div>

        {/* Truck Status */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Truck style={{ width: 18, height: 18, color: "var(--primary)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Truck Status</span>
          </div>
          <div className="status-grid-header">
            <span>Status</span>
            <span style={{ textAlign: "center" }}>Qty</span>
            <span style={{ textAlign: "right" }}>%</span>
          </div>
          {fleetTotal > 0 ? (
            <>
              {[
                { name: "AVAILABLE", colorVar: "--success", qty: fleetAvailable, pct: ((fleetAvailable / fleetTotal) * 100).toFixed(1) },
                { name: "IN USE", colorVar: "--primary", qty: fleetLoaded, pct: ((fleetLoaded / fleetTotal) * 100).toFixed(1) },
                { name: "IN SHOP", colorVar: "--warning", qty: fleetInShop, pct: ((fleetInShop / fleetTotal) * 100).toFixed(1) },
              ].map((s, i) => (
                <div key={i} className="status-grid-row">
                  <div className="flex items-center gap-2">
                    <span className="status-dot" style={{ background: `var(${s.colorVar})` }} />
                    <span className="body-sm font-semibold" style={{ color: "var(--on-surface)" }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span className="status-qty-badge" style={{ background: `var(${s.colorVar})` }}>{s.qty}</span>
                  </div>
                  <span className="body-sm tabular-nums" style={{ color: "var(--on-surface-variant)", textAlign: "right" }}>{s.pct}</span>
                </div>
              ))}
              <div className="flex justify-between" style={{ borderTop: "1px solid var(--outline-variant)", marginTop: 16, paddingTop: 10 }}>
                <span className="label-sm" style={{ color: "var(--on-surface-variant)" }}>GRAND TOTAL</span>
                <div className="flex gap-8">
                  <span className="label-sm tabular-nums" style={{ color: "var(--on-surface-variant)" }}>{fleetTotal}</span>
                  <span className="label-sm tabular-nums" style={{ color: "var(--on-surface-variant)" }}>100%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="body-md" style={{ padding: 20, textAlign: "center", color: "var(--on-surface-variant)" }}>No fleet data available</div>
          )}
        </div>

        {/* Revenue Overview */}
        <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign style={{ width: 18, height: 18, color: "var(--success)" }} />
            <span className="title-md" style={{ color: "var(--on-surface)" }}>Revenue Overview</span>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Gross Revenue", value: fmtCurrency(kpis?.gross_revenue), width: "100%", colorVar: "--success" },
              { label: "Avg Rate Per Mile", value: `$${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, width: `${Math.min((kpis?.avg_rpm ?? 0) * 30, 100)}%`, colorVar: "--info" },
              { label: "Fleet Utilization", value: `${fleet?.utilization_rate ?? 0}%`, width: `${fleet?.utilization_rate ?? 0}%`, colorVar: "--status-assigned" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>{item.label}</span>
                  <span className="body-sm font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{item.value}</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: item.width, backgroundColor: `var(${item.colorVar})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
