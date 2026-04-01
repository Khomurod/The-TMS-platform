"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Settings2, ArrowUpRight, DollarSign, CheckCircle2, ChevronDown,
  TrendingUp, Truck, Users, Package, ArrowRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Dashboard — Datatruck-style dense KPI + data cards.
   White cards on light gray background with clean borders.
   ═══════════════════════════════════════════════════════════════ */

const COLORS = {
  blue:    "#3b82f6",
  indigo:  "#6366f1",
  green:   "#10b981",
  orange:  "#f59e0b",
  red:     "#ef4444",
  cyan:    "#06b6d4",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Get things done");
  const tabs = [
    "Get things done", "Overview", "Profit reports", "Financial reports",
    "IFTA reports", "Report calculator", "Custom report"
  ];

  const gaugeData = [
    { name: "Covered", value: 91.8, color: COLORS.green },
    { name: "Uncovered", value: 8.2, color: COLORS.orange },
  ];

  /* ── Card wrapper ──────────────────────────────────────────── */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={className} style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: 20,
      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)",
    }}>
      {children}
    </div>
  );

  return (
    <div>
      {/* ── Sub-navigation tabs ──────────────────────────────── */}
      <div style={{
        display: "flex", gap: 24, paddingBottom: 12, marginBottom: 20,
        borderBottom: "1px solid #e2e8f0", overflowX: "auto",
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
              color: activeTab === t ? "#3b82f6" : "#64748b",
              paddingBottom: 8,
              borderBottom: activeTab === t ? "2px solid #3b82f6" : "2px solid transparent",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── KPI Summary Row ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Revenue", value: "$255,942", change: "+12.5%", icon: DollarSign, color: COLORS.green },
          { label: "Active Loads", value: "447", change: "+8.2%", icon: Package, color: COLORS.blue },
          { label: "Active Drivers", value: "94", change: "+3.1%", icon: Users, color: COLORS.indigo },
          { label: "Fleet Size", value: "88", change: "0%", icon: Truck, color: COLORS.cyan },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: kpi.color, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                <TrendingUp style={{ width: 12, height: 12 }} />
                {kpi.change}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${kpi.color}15`, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <kpi.icon style={{ width: 20, height: 20, color: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        
        {/* Quick Setup */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Settings2 style={{ width: 18, height: 18, color: COLORS.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Quick Setup</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Unassigned Items
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
            {[
              { label: "Trucks", val: "5", color: COLORS.blue },
              { label: "Trailers", val: "163", color: COLORS.red },
              { label: "Drivers", val: "6", color: COLORS.indigo },
            ].map(item => (
              <div key={item.label} style={{ padding: "12px 0", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: item.color, fontVariantNumeric: "tabular-nums" }}>{item.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Covered Drivers Gauge */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Covered Drivers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 200, height: 130, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy="90%" startAngle={180} endAngle={0}
                    innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none"
                  >
                    {gaugeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5 }}>Covered</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>91.8%</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>0</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>100</span>
          </div>
        </Card>

        {/* Tasks */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: COLORS.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Tasks</span>
          </div>
          {[
            "Prepare invoices for 447 delivered loads",
            "Mark 40 in-transit loads delivered",
            "Dispatch 60 booked loads to drivers",
            "Dispatch loads to 54 available drivers",
          ].map((task, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: i < 3 ? "1px solid #f1f5f9" : "none",
            }}>
              <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>{task}</span>
              <button style={{
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 6, padding: "4px 14px",
                fontSize: 11, fontWeight: 700, color: "#334155",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              }}>
                Go <ArrowRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          ))}
        </Card>

        {/* Driver Dispatch Statuses */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Driver Dispatch Statuses</span>
            </div>
            <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
              <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#3b82f6" }}>Driver</span>
              <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", borderLeft: "1px solid #e2e8f0" }}>Dispatch</span>
            </div>
          </div>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Qty</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>%</span>
          </div>
          {[
            { name: "DISPATCHED", color: COLORS.blue, qty: 18, pct: "19.15" },
            { name: "IN TRANSIT", color: COLORS.orange, qty: 26, pct: "27.66" },
            { name: "AVAILABLE", color: COLORS.green, qty: 50, pct: "53.19" },
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
        </Card>

        {/* Truck Statuses */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowUpRight style={{ width: 18, height: 18, color: COLORS.blue }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Truck Statuses</span>
            </div>
            <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
              <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#3b82f6" }}>Truck</span>
              <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", borderLeft: "1px solid #e2e8f0" }}>Fleet</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Qty</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>%</span>
          </div>
          {[
            { name: "AVAILABLE", color: COLORS.green, qty: 62, pct: "70.5" },
            { name: "IN TRANSIT", color: COLORS.orange, qty: 26, pct: "29.5" },
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
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>88</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>100%</span>
            </div>
          </div>
        </Card>

        {/* Profit & Loss */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <DollarSign style={{ width: 18, height: 18, color: COLORS.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Profit & Loss</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
              border: "1px solid #e2e8f0", color: "#64748b", background: "#f8fafc",
            }}>
              03/29/2026 - 04/04/2026
            </span>
            <button style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: "1px solid #e2e8f0", color: "#334155", background: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              Delivery <ChevronDown style={{ width: 12, height: 12, color: "#94a3b8" }} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Total Gross Revenue", amount: "$255,942.00", pct: 100, color: COLORS.green },
              { label: "Driver Salary Expenses", amount: "$150,421.22", pct: 58.7, color: COLORS.indigo },
              { label: "Fuel Costs", amount: "$13,788.68", pct: 8.4, color: COLORS.blue },
              { label: "Toll Costs", amount: "$3,696.45", pct: 2.1, color: COLORS.red },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{item.amount}</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: `${Math.max(item.pct, 2)}%`,
                    background: item.color,
                    transition: "width 0.7s ease-out",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
