"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Settings2, ArrowUpRight, DollarSign, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Get things done");

  const tabs = [
    "Get things done", "Overview", "Profit reports", "Financial reports", 
    "IFTA reports", "Report calculator", "Custom report"
  ];

  const gaugeData = [
    { name: "Covered", value: 91.8, color: "var(--success)" },
    { name: "Uncovered", value: 8.2, color: "var(--warning)" }
  ];

  return (
    <div className="h-full flex flex-col bg-transparent">
      
      {/* Sub Navigation */}
      <div className="flex bg-transparent items-center gap-6 pt-2 pb-2 mb-6 border-b border-[var(--outline-variant)] overflow-x-auto whitespace-nowrap scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`label-sm font-bold pb-2 border-b-2 transition-colors ${
              activeTab === t 
                ? "border-[var(--primary)] text-[var(--primary)]" 
                : "border-transparent text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ROW 1 */}
        {/* Quick Setup */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5">
          <div className="flex items-center gap-2 text-[var(--primary)] title-md font-bold mb-6">
            <Settings2 className="h-5 w-5" /> Quick Setup
          </div>
          <p className="label-sm text-[var(--on-surface)] font-bold mb-5 uppercase tracking-wide">Unassigned Items</p>
          <div className="flex justify-around text-center">
             <div className="flex flex-col items-center">
               <p className="label-md font-bold text-[var(--on-surface-variant)] mb-1">Trucks</p>
               <p className="headline-lg text-[var(--info)] tabular-nums">5</p>
             </div>
             <div className="flex flex-col items-center">
               <p className="label-md font-bold text-[var(--on-surface-variant)] mb-1">Trailers</p>
               <p className="headline-lg text-[var(--error)] tabular-nums">163</p>
             </div>
             <div className="flex flex-col items-center">
               <p className="label-md font-bold text-[var(--on-surface-variant)] mb-1">Drivers</p>
               <p className="headline-lg text-[var(--primary)] tabular-nums">6</p>
             </div>
          </div>
        </div>

        {/* Covered Drivers Gauge */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5 relative flex flex-col items-center justify-center min-h-[260px]">
          <div className="flex items-center gap-2 text-[var(--primary)] title-md font-bold mb-2 self-start absolute top-5 left-5 z-10">
            <ArrowUpRight className="h-5 w-5" /> Covered Drivers
          </div>
          <div className="w-[180px] h-[180px] relative mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
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
            
            {/* Center Absolute Absolute Positioning for precise alignment */}
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none pb-8">
               <div className="label-sm font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-1">Covered</div>
               <div className="headline-md text-[var(--on-surface)] tabular-nums">91.8%</div>
            </div>
            
            <div className="absolute bottom-[20%] text-xs font-bold text-[var(--on-surface-variant)] left-2">0</div>
            <div className="absolute bottom-[20%] text-xs font-bold text-[var(--on-surface-variant)] right-2">100</div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5">
          <div className="flex items-center gap-2 text-[var(--success)] title-md font-bold mb-5">
            <CheckCircle2 className="h-5 w-5" /> Tasks
          </div>
          <div className="space-y-3">
             {[
               "Prepare invoices for 447 delivered loads",
               "Mark 40 in-transit loads delivered",
               "Dispatch 60 booked loads to drivers",
               "Dispatch loads to 54 available drivers"
             ].map((task, i) => (
               <div key={i} className="flex items-center justify-between border-b border-[var(--surface-variant)] pb-3 last:border-0 last:pb-0">
                 <span className="body-sm font-medium text-[var(--on-surface-variant)]">{task}</span>
                 <button className="ghost-border bg-[var(--surface-low)] hover:bg-[var(--surface-container)] transition-colors px-3 py-1 rounded-[var(--radius-sm)] label-sm font-bold text-[var(--on-surface)] shadow-sm">
                    Go
                 </button>
               </div>
             ))}
          </div>
        </div>

        {/* ROW 2 */}
        {/* Driver Dispatch Statuses */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5 md:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-[var(--primary)] title-md font-bold">
              <ArrowUpRight className="h-5 w-5" /> Driver Dispatch Statuses
            </div>
            <div className="flex ghost-border rounded-[var(--radius-sm)] overflow-hidden">
               <span className="px-2 py-1 bg-[var(--primary-fixed)] text-[var(--primary)] label-sm font-bold">Driver</span>
               <span className="px-2 py-1 bg-[var(--surface-lowest)] text-[var(--on-surface-variant)] label-sm font-bold border-l ghost-border">Dispatch</span>
            </div>
          </div>
          
          <div className="flex flex-col mt-4">
             {/* Header */}
             <div className="grid grid-cols-12 gap-2 border-b border-[var(--surface-variant)] pb-2 mb-2">
                <div className="col-span-6 label-sm font-bold text-[var(--on-surface-variant)]">STATUS</div>
                <div className="col-span-3 label-sm font-bold text-[var(--on-surface-variant)] text-center">QTY</div>
                <div className="col-span-3 label-sm font-bold text-[var(--on-surface-variant)] text-right">%</div>
             </div>
             
             {/* Rows */}
             {[
               { name: "DISPATCHED", color: "var(--info)", qty: 18, pct: 19.15 },
               { name: "IN TRANSIT", color: "var(--warning)", qty: 26, pct: 27.66 },
               { name: "AVAILABLE", color: "var(--success)", qty: 50, pct: 53.19 },
             ].map((status, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center py-2.5">
                  <div className="col-span-6 flex items-center gap-2.5 label-sm font-bold text-[var(--on-surface)]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></div> 
                    {status.name}
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold text-[var(--surface-lowest)]" style={{ backgroundColor: status.color }}>
                      {status.qty}
                    </span>
                  </div>
                  <div className="col-span-3 label-sm font-medium text-[var(--on-surface-variant)] text-right tabular-nums">
                    {status.pct}
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Truck Statuses */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5 md:col-span-1 lg:col-span-1">
           <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-[var(--primary)] title-md font-bold">
              <ArrowUpRight className="h-5 w-5" /> Truck Statuses
            </div>
            <div className="flex ghost-border rounded-[var(--radius-sm)] overflow-hidden">
               <span className="px-2 py-1 bg-[var(--primary-fixed)] text-[var(--primary)] label-sm font-bold">Truck</span>
               <span className="px-2 py-1 bg-[var(--surface-lowest)] text-[var(--on-surface-variant)] label-sm font-bold border-l ghost-border">Fleet</span>
            </div>
          </div>
          
          <div className="flex flex-col mt-4">
             {/* Header */}
             <div className="grid grid-cols-12 gap-2 border-b border-[var(--surface-variant)] pb-2 mb-2">
                <div className="col-span-6 label-sm font-bold text-[var(--on-surface-variant)]">STATUS</div>
                <div className="col-span-3 label-sm font-bold text-[var(--on-surface-variant)] text-center">QTY</div>
                <div className="col-span-3 label-sm font-bold text-[var(--on-surface-variant)] text-right">%</div>
             </div>
             
             {/* Rows */}
             {[
               { name: "AVAILABLE", color: "var(--success)", qty: 62, pct: 70.5 },
               { name: "IN TRANSIT", color: "var(--warning)", qty: 26, pct: 29.5 },
             ].map((status, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center py-2.5">
                  <div className="col-span-6 flex items-center gap-2.5 label-sm font-bold text-[var(--on-surface)]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></div> 
                    {status.name}
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold text-[var(--surface-lowest)]" style={{ backgroundColor: status.color }}>
                      {status.qty}
                    </span>
                  </div>
                  <div className="col-span-3 label-sm font-medium text-[var(--on-surface-variant)] text-right tabular-nums">
                    {status.pct}
                  </div>
                </div>
             ))}
          </div>

          <div className="border-t border-[var(--outline-variant)] mt-8 pt-4 flex justify-between label-sm font-bold text-[var(--on-surface-variant)] sticky bottom-0 bg-[var(--surface-lowest)]">
             <span>GRAND TOTAL</span>
             <div className="pr-[4.5rem]">
               <span className="pr-12">88</span>
               <span>100%</span>
             </div>
          </div>
        </div>

        {/* Profit & Loss */}
        <div className="bg-[var(--surface-lowest)] rounded-[var(--radius-xl)] shadow-ambient ghost-border p-5 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-[var(--success)] title-md font-bold mb-5">
             <DollarSign className="h-5 w-5" /> Profit & Loss
          </div>
          <div className="flex items-center gap-3 mb-6">
             <div className="ghost-border bg-[var(--surface-container)] px-2 py-1 label-sm font-medium text-[var(--on-surface-variant)] rounded-[var(--radius-sm)]">
                 03/29/2026 - 04/04/2026
             </div>
             <div className="ghost-border bg-[var(--surface-lowest)] px-3 py-1 label-sm font-bold text-[var(--on-surface)] rounded-[var(--radius-sm)] cursor-pointer hover:bg-[var(--surface-low)] transition-colors flex items-center gap-1">
                 Delivery <ChevronDown className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
             </div>
          </div>
          
          <div className="space-y-5">
             {[
               { label: "Total Gross Revenue", amount: "$255,942.00", pct: 100, color: "var(--success)" },
               { label: "Driver Salary Expenses", amount: "$150,421.22", pct: 58.7, color: "var(--primary)" },
               { label: "Fuel Costs", amount: "$13,788.68", pct: 8.4, color: "var(--info)" },
               { label: "Toll Costs", amount: "$3,696.45", pct: 2.1, color: "var(--error)" }
             ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                     <span className="label-sm font-bold text-[var(--on-surface-variant)]">{item.label}</span>
                     <span className="body-sm font-bold text-[var(--on-surface)] tabular-nums">{item.amount}</span>
                  </div>
                  {/* Modern Sleek Progress Bar */}
                  <div className="w-full h-2 bg-[var(--surface-container)] rounded-full overflow-hidden">
                     <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.max(item.pct, 1)}%`, backgroundColor: item.color }} 
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
