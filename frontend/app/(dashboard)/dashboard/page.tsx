"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Settings2, ArrowUpRight, DollarSign, CheckCircle2, ChevronDown } from "lucide-react";

/* ── Recharts needs actual hex values, not CSS var() ──────────── */
const COLORS = {
  success: "#16a34a",
  warning: "#f59e0b",
  primary: "#3525cd",
  info: "#2563eb",
  error: "#dc2626",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Get things done");

  const tabs = [
    "Get things done", "Overview", "Profit reports", "Financial reports", 
    "IFTA reports", "Report calculator", "Custom report"
  ];

  const gaugeData = [
    { name: "Covered", value: 91.8, color: COLORS.success },
    { name: "Uncovered", value: 8.2, color: COLORS.warning }
  ];

  /* ── Reusable Card wrapper ─────────────────────────────────── */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div 
      className={`rounded-xl p-5 ${className}`}
      style={{ 
        backgroundColor: "var(--surface-lowest)", 
        border: "1px solid var(--outline-variant)",
        boxShadow: "0 1px 3px 0 var(--shadow-ambient), 0 1px 2px -1px var(--shadow-ambient)",
      }}
    >
      {children}
    </div>
  );

  /* ── Status Row component ──────────────────────────────────── */
  const StatusRow = ({ name, color, qty, pct }: { name: string; color: string; qty: number; pct: number }) => (
    <div className="grid grid-cols-12 gap-2 items-center py-2.5">
      <div className="col-span-6 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[12px] font-bold" style={{ color: "var(--on-surface)" }}>{name}</span>
      </div>
      <div className="col-span-3 flex justify-center">
        <span 
          className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {qty}
        </span>
      </div>
      <div className="col-span-3 text-right">
        <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
          {pct}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      
      {/* ── Sub Navigation Tabs ──────────────────────────────── */}
      <div 
        className="flex items-center gap-6 pb-3 mb-6 overflow-x-auto whitespace-nowrap border-b"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="text-[12px] font-bold pb-2 border-b-2 transition-colors"
            style={{ 
              borderColor: activeTab === t ? "var(--primary)" : "transparent",
              color: activeTab === t ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* ─── Quick Setup ────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Settings2 className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>Quick Setup</span>
          </div>
          <p 
            className="text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Unassigned Items
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Trucks", value: "5", color: COLORS.info },
              { label: "Trailers", value: "163", color: COLORS.error },
              { label: "Drivers", value: "6", color: COLORS.primary },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center">
                <p className="text-[12px] font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  {item.label}
                </p>
                <p 
                  className="text-3xl font-extrabold tabular-nums"
                  style={{ color: item.color, fontFamily: "var(--font-display)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ─── Covered Drivers Gauge ──────────────────────── */}
        <Card className="relative flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>Covered Drivers</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-[200px] h-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--on-surface-variant)" }}>
                  Covered
                </span>
                <span 
                  className="text-2xl font-extrabold tabular-nums"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-display)" }}
                >
                  91.8%
                </span>
              </div>
            </div>
          </div>
          {/* Scale labels */}
          <div className="flex justify-between px-4 mt-1">
            <span className="text-[11px] font-bold" style={{ color: "var(--on-surface-variant)" }}>0</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--on-surface-variant)" }}>100</span>
          </div>
        </Card>

        {/* ─── Tasks List ─────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5" style={{ color: "var(--success)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--success)" }}>Tasks</span>
          </div>
          <div className="space-y-0">
            {[
              "Prepare invoices for 447 delivered loads",
              "Mark 40 in-transit loads delivered",
              "Dispatch 60 booked loads to drivers",
              "Dispatch loads to 54 available drivers"
            ].map((task, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--surface-variant)" }}
              >
                <span className="text-[12.5px] font-medium pr-4" style={{ color: "var(--on-surface-variant)" }}>
                  {task}
                </span>
                <button 
                  className="shrink-0 px-4 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                  style={{ 
                    backgroundColor: "var(--surface-low)", 
                    border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)",
                  }}
                >
                  Go
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* ─── Driver Dispatch Statuses ───────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <span className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>Driver Dispatch Statuses</span>
            </div>
            <div className="flex overflow-hidden rounded-md" style={{ border: "1px solid var(--outline-variant)" }}>
              <span 
                className="px-2.5 py-1 text-[10px] font-bold"
                style={{ backgroundColor: "var(--primary-fixed)", color: "var(--primary)" }}
              >
                Driver
              </span>
              <span 
                className="px-2.5 py-1 text-[10px] font-bold border-l"
                style={{ color: "var(--on-surface-variant)", borderColor: "var(--outline-variant)" }}
              >
                Dispatch
              </span>
            </div>
          </div>
          
          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-2 pb-2 mb-1 border-b"
            style={{ borderColor: "var(--surface-variant)" }}
          >
            <div className="col-span-6 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
              Status
            </div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: "var(--on-surface-variant)" }}>
              Qty
            </div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: "var(--on-surface-variant)" }}>
              %
            </div>
          </div>
          
          <StatusRow name="DISPATCHED" color={COLORS.info} qty={18} pct={19.15} />
          <StatusRow name="IN TRANSIT" color={COLORS.warning} qty={26} pct={27.66} />
          <StatusRow name="AVAILABLE" color={COLORS.success} qty={50} pct={53.19} />
        </Card>

        {/* ─── Truck Statuses ─────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <span className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>Truck Statuses</span>
            </div>
            <div className="flex overflow-hidden rounded-md" style={{ border: "1px solid var(--outline-variant)" }}>
              <span 
                className="px-2.5 py-1 text-[10px] font-bold"
                style={{ backgroundColor: "var(--primary-fixed)", color: "var(--primary)" }}
              >
                Truck
              </span>
              <span 
                className="px-2.5 py-1 text-[10px] font-bold border-l"
                style={{ color: "var(--on-surface-variant)", borderColor: "var(--outline-variant)" }}
              >
                Fleet
              </span>
            </div>
          </div>
          
          {/* Table Header */}
          <div 
            className="grid grid-cols-12 gap-2 pb-2 mb-1 border-b"
            style={{ borderColor: "var(--surface-variant)" }}
          >
            <div className="col-span-6 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
              Status
            </div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: "var(--on-surface-variant)" }}>
              Qty
            </div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: "var(--on-surface-variant)" }}>
              %
            </div>
          </div>
          
          <StatusRow name="AVAILABLE" color={COLORS.success} qty={62} pct={70.5} />
          <StatusRow name="IN TRANSIT" color={COLORS.warning} qty={26} pct={29.5} />

          {/* Grand Total Footer */}
          <div 
            className="mt-6 pt-3 flex justify-between border-t text-[11px] font-bold"
            style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
          >
            <span>GRAND TOTAL</span>
            <div className="flex gap-10">
              <span className="tabular-nums">88</span>
              <span className="tabular-nums">100%</span>
            </div>
          </div>
        </Card>

        {/* ─── Profit & Loss ──────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5" style={{ color: "var(--success)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--success)" }}>Profit & Loss</span>
          </div>
          
          {/* Date & Filter Controls */}
          <div className="flex items-center gap-2 mb-5">
            <span 
              className="px-2 py-1 rounded text-[11px] font-medium"
              style={{ backgroundColor: "var(--surface-container)", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)" }}
            >
              03/29/2026 - 04/04/2026
            </span>
            <button 
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
              style={{ color: "var(--on-surface)", border: "1px solid var(--outline-variant)" }}
            >
              Delivery <ChevronDown className="h-3 w-3 opacity-40" />
            </button>
          </div>
          
          {/* Progress Bar Items */}
          <div className="space-y-4">
            {[
              { label: "Total Gross Revenue", amount: "$255,942.00", pct: 100, color: COLORS.success },
              { label: "Driver Salary Expenses", amount: "$150,421.22", pct: 58.7, color: COLORS.primary },
              { label: "Fuel Costs", amount: "$13,788.68", pct: 8.4, color: COLORS.info },
              { label: "Toll Costs", amount: "$3,696.45", pct: 2.1, color: COLORS.error }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                    {item.label}
                  </span>
                  <span 
                    className="text-[13px] font-bold tabular-nums"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {item.amount}
                  </span>
                </div>
                <div 
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--surface-container)" }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${Math.max(item.pct, 2)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
