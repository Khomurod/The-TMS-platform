"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Settings2, ArrowUpRight, DollarSign, CheckCircle2, ChevronDown,
  TrendingUp, Truck, Users, Package, ArrowRight, Loader2,
} from "lucide-react";
import api from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   Dashboard — Fetches REAL data from /api/v1/dashboard/* endpoints.
   Falls back to "—" when data is loading or unavailable.
   ═══════════════════════════════════════════════════════════════ */

const COLORS = {
  blue: "#3b82f6", indigo: "#6366f1", green: "#10b981",
  orange: "#f59e0b", red: "#ef4444", cyan: "#06b6d4",
};

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
  const [activeTab, setActiveTab] = useState("Get things done");
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    "Get things done", "Overview", "Profit reports", "Financial reports",
    "IFTA reports", "Report calculator", "Custom report"
  ];

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

  /* Driver coverage gauge — use real data */
  const driverCoverage = kpis 
    ? (kpis.active_drivers > 0 ? Math.round((kpis.on_trip_drivers / kpis.active_drivers) * 1000) / 10 : 0) 
    : 0;
  const gaugeData = [
    { name: "Covered", value: driverCoverage || 0.1, color: COLORS.green },
    { name: "Uncovered", value: Math.max(100 - driverCoverage, 0.1), color: COLORS.orange },
  ];

  /* Fleet totals from real data */
  const fleetTotal = fleet?.total ?? 0;
  const fleetAvailable = fleet?.available ?? 0;
  const fleetLoaded = fleet?.loaded ?? 0;
  const fleetInShop = fleet?.in_shop ?? 0;

  /* Card wrapper */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={className} style={{
      background: "#ffffff", border: "1px solid #e2e8f0",
      borderRadius: 10, padding: 20, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)",
    }}>{children}</div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "#94a3b8", gap: 10 }}>
        <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard data...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-navigation tabs */}
      <div style={{ display: "flex", gap: 24, paddingBottom: 12, marginBottom: 20, borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
              color: activeTab === t ? "#3b82f6" : "#64748b", paddingBottom: 8,
              borderBottom: activeTab === t ? "2px solid #3b82f6" : "2px solid transparent", whiteSpace: "nowrap",
            }}>{t}</button>
        ))}
      </div>

      {/* KPI Summary Row — REAL DATA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Revenue", value: fmtCurrency(kpis?.gross_revenue), sub: `RPM: $${kpis?.avg_rpm?.toFixed(2) ?? "—"}`, icon: DollarSign, color: COLORS.green },
          { label: "Active Loads", value: fmt(kpis?.active_loads), sub: `${fmt(kpis?.offer_loads)} offers`, icon: Package, color: COLORS.blue },
          { label: "Active Drivers", value: fmt(kpis?.active_drivers), sub: `${fmt(kpis?.on_trip_drivers)} on trip`, icon: Users, color: COLORS.indigo },
          { label: "Fleet Size", value: fmt(fleetTotal), sub: `${fleet?.utilization_rate ?? 0}% utilized`, icon: Truck, color: COLORS.cyan },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>{kpi.sub}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <kpi.icon style={{ width: 20, height: 20, color: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Quick Setup — REAL counts from fleet API */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Settings2 style={{ width: 18, height: 18, color: COLORS.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Quick Setup</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Fleet Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
            {[
              { label: "Available", val: fmt(fleetAvailable), color: COLORS.green },
              { label: "In Use", val: fmt(fleetLoaded), color: COLORS.blue },
              { label: "In Shop", val: fmt(fleetInShop), color: COLORS.orange },
            ].map(item => (
              <div key={item.label} style={{ padding: "12px 0", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: item.color, fontVariantNumeric: "tabular-nums" }}>{item.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Covered Drivers Gauge — REAL data */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Fleet Effectiveness</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 200, height: 130, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy="90%" startAngle={180} endAngle={0}
                    innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                    {gaugeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5 }}>Effectiveness</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{kpis?.fleet_effectiveness ?? 0}%</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>0</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>100</span>
          </div>
        </Card>

        {/* Tasks — based on real KPI data */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: COLORS.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Tasks</span>
          </div>
          {(() => {
            const tasks: { text: string; href: string }[] = [];
            if (kpis) {
              if (kpis.active_loads > 0) tasks.push({ text: `Mark ${kpis.active_loads} active loads as delivered`, href: "/loads" });
              if (kpis.offer_loads > 0) tasks.push({ text: `Dispatch ${kpis.offer_loads} offer loads`, href: "/loads" });
              if (kpis.active_drivers > 0 && kpis.on_trip_drivers < kpis.active_drivers) tasks.push({ text: `Assign loads to ${kpis.active_drivers - kpis.on_trip_drivers} available drivers`, href: "/drivers" });
            }
            if (fleetAvailable > 0) tasks.push({ text: `${fleetAvailable} trucks available for dispatch`, href: "/fleet" });
            if (tasks.length === 0) tasks.push({ text: "No pending tasks \u2014 all caught up!", href: "" });
            return tasks.map((task, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0",
                borderBottom: i < tasks.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>{task.text}</span>
                {task.href && (
                  <button onClick={() => router.push(task.href)} style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6,
                    padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>Go <ArrowRight style={{ width: 11, height: 11 }} /></button>
                )}
              </div>
            ));
          })()}
        </Card>

        {/* Driver Status — REAL data */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Driver Status</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Status</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>Qty</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>%</span>
          </div>
          {kpis && kpis.active_drivers > 0 ? (
            <>
              {[
                { name: "ON TRIP", color: COLORS.blue, qty: kpis.on_trip_drivers, pct: ((kpis.on_trip_drivers / kpis.active_drivers) * 100).toFixed(1) },
                { name: "AVAILABLE", color: COLORS.green, qty: kpis.active_drivers - kpis.on_trip_drivers, pct: (((kpis.active_drivers - kpis.on_trip_drivers) / kpis.active_drivers) * 100).toFixed(1) },
              ].map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "8px 0", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ padding: "2px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#fff", background: s.color }}>{s.qty}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.pct}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No driver data available</div>
          )}
        </Card>

        {/* Truck Status — REAL data */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Truck Status</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Status</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>Qty</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>%</span>
          </div>
          {fleetTotal > 0 ? (
            <>
              {[
                { name: "AVAILABLE", color: COLORS.green, qty: fleetAvailable, pct: ((fleetAvailable / fleetTotal) * 100).toFixed(1) },
                { name: "IN USE", color: COLORS.blue, qty: fleetLoaded, pct: ((fleetLoaded / fleetTotal) * 100).toFixed(1) },
                { name: "IN SHOP", color: COLORS.orange, qty: fleetInShop, pct: ((fleetInShop / fleetTotal) * 100).toFixed(1) },
              ].map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "8px 0", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ padding: "2px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#fff", background: s.color }}>{s.qty}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.pct}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>GRAND TOTAL</span>
                <div style={{ display: "flex", gap: 30 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{fleetTotal}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>100%</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No fleet data available</div>
          )}
        </Card>

        {/* Revenue Breakdown — from real revenue */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <DollarSign style={{ width: 18, height: 18, color: COLORS.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Revenue Overview</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Gross Revenue</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(kpis?.gross_revenue)}</span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: "100%", background: COLORS.green, transition: "width 0.7s ease-out" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Avg Rate Per Mile</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>${kpis?.avg_rpm?.toFixed(2) ?? "—"}</span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${Math.min((kpis?.avg_rpm ?? 0) * 30, 100)}%`, background: COLORS.indigo, transition: "width 0.7s ease-out" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Fleet Utilization</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{fleet?.utilization_rate ?? 0}%</span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${fleet?.utilization_rate ?? 0}%`, background: COLORS.cyan, transition: "width 0.7s ease-out" }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
