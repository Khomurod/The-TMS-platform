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
    { name: "Covered", value: 91.8, color: "#10b981" },
    { name: "Uncovered", value: 8.2, color: "#f97316" }
  ];

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-md">
      
      {/* Sub Navigation */}
      <div className="flex bg-white items-center gap-6 px-4 pt-2 pb-2 border-b border-[#e5e7eb] overflow-x-auto whitespace-nowrap scrollbar-hide mb-6 -mt-2">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === t 
                ? "border-[#3525cd] text-[#3525cd]" 
                : "border-transparent text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* ROW 1 */}
        {/* Quick Setup */}
        <div className="border border-[#e5e7eb] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#3525cd] font-semibold mb-6">
            <Settings2 className="h-5 w-5" /> Quick Setup
          </div>
          <p className="text-sm font-semibold text-[#374151] mb-6">Unassigned Trucks, Trailers, Drivers</p>
          <div className="flex justify-around text-center">
             <div>
               <p className="text-xs text-[#6b7280] mb-2 font-medium">Trucks</p>
               <p className="text-2xl text-[#3b82f6] font-medium">5</p>
             </div>
             <div>
               <p className="text-xs text-[#6b7280] mb-2 font-medium">Trailers</p>
               <p className="text-2xl text-[#ef4444] font-medium">163</p>
             </div>
             <div>
               <p className="text-xs text-[#6b7280] mb-2 font-medium">Drivers</p>
               <p className="text-2xl text-[#3525cd] font-medium">6</p>
             </div>
          </div>
        </div>

        {/* Covered Drivers Gauge */}
        <div className="border border-[#e5e7eb] rounded-lg p-5 relative flex flex-col items-center">
          <div className="flex items-center gap-2 text-[#3525cd] font-semibold mb-2 self-start absolute top-5 left-5">
            <ArrowUpRight className="h-5 w-5" /> Covered Drivers
          </div>
          <div className="w-[200px] h-[200px] mt-8 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
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
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center">
               <div className="text-[10px] text-gray-400 font-bold mb-1 tracking-wider uppercase">Covered</div>
               <div className="text-xl font-bold text-gray-800">91.8%</div>
            </div>
            <div className="absolute bottom-[40%] text-xs font-bold text-gray-500 left-5">0</div>
            <div className="absolute bottom-[40%] text-xs font-bold text-gray-500 right-4">100</div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="border border-[#e5e7eb] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#10b981] font-semibold mb-4">
            <CheckCircle2 className="h-5 w-5" /> Tasks
          </div>
          <div className="space-y-3">
             {[
               "Prepare invoices for 447 delivered loads",
               "Mark 40 in-transit loads delivered",
               "Dispatch 60 booked loads to drivers",
               "Dispatch loads to 54 available drivers"
             ].map((task, i) => (
               <div key={i} className="flex items-center justify-between border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                 <span className="text-xs font-medium text-[#4b5563]">{task}</span>
                 <button className="border border-[#e5e7eb] bg-white hover:bg-gray-50 px-4 py-1.5 rounded text-xs font-semibold text-gray-700">Go</button>
               </div>
             ))}
          </div>
        </div>

        {/* ROW 2 */}
        {/* Driver Dispatch Statuses */}
        <div className="border border-[#e5e7eb] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#3525cd] font-semibold">
              <ArrowUpRight className="h-5 w-5" /> Driver Dispatch Statuses
            </div>
            <div className="flex border border-[#e5e7eb] rounded divide-x divide-[#e5e7eb] text-[10px] font-bold">
               <span className="px-2 py-1 text-[#3525cd] bg-blue-50">Driver</span>
               <span className="px-2 py-1 text-gray-500">Dispatch</span>
            </div>
          </div>
          <table className="w-full text-xs font-medium mt-4">
            <thead>
              <tr className="text-[#9ca3af] border-b border-white pb-2 text-left">
                <th className="font-semibold pb-2">STATUS</th>
                <th className="font-semibold pb-2 text-center">QTY</th>
                <th className="font-semibold pb-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
               <tr>
                 <td className="py-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> DISPATCHED</td>
                 <td className="py-2 text-center"><span className="bg-[#3b82f6] text-white px-6 py-1 rounded-full text-[10px]">18</span></td>
                 <td className="py-2 text-right text-gray-500">19.15</td>
               </tr>
               <tr>
                 <td className="py-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f97316]"></div> IN TRANSIT</td>
                 <td className="py-2 text-center"><span className="bg-[#f97316] text-white px-6 py-1 rounded-full text-[10px]">26</span></td>
                 <td className="py-2 text-right text-gray-500">27.66</td>
               </tr>
               <tr>
                 <td className="py-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> AVAILABLE</td>
                 <td className="py-2 text-center"><span className="bg-[#10b981] text-white px-6 py-1 rounded-full text-[10px]">50</span></td>
                 <td className="py-2 text-right text-gray-500">53.19</td>
               </tr>
            </tbody>
          </table>
        </div>

        {/* Truck Statuses */}
        <div className="border border-[#e5e7eb] rounded-lg p-5">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#3525cd] font-semibold">
              <ArrowUpRight className="h-5 w-5" /> Truck Statuses
            </div>
            <div className="flex border border-[#e5e7eb] rounded divide-x divide-[#e5e7eb] text-[10px] font-bold">
               <span className="px-2 py-1 text-[#3525cd] bg-blue-50">Truck</span>
               <span className="px-2 py-1 text-gray-500">Fleet</span>
            </div>
          </div>
          <table className="w-full text-xs font-medium mt-4">
            <thead>
              <tr className="text-[#9ca3af] border-b border-white pb-2 text-left">
                <th className="font-semibold pb-2">STATUS</th>
                <th className="font-semibold pb-2 text-center">QTY</th>
                <th className="font-semibold pb-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
               <tr>
                 <td className="py-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> AVAILABLE</td>
                 <td className="py-2 text-center"><span className="bg-[#10b981] text-white px-6 py-1 rounded-full text-[10px]">62</span></td>
                 <td className="py-2 text-right text-gray-500">70.5</td>
               </tr>
               <tr>
                 <td className="py-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f97316]"></div> IN TRANSIT</td>
                 <td className="py-2 text-center"><span className="bg-[#f97316] text-white px-6 py-1 rounded-full text-[10px]">26</span></td>
                 <td className="py-2 text-right text-gray-500">29.5</td>
               </tr>
            </tbody>
          </table>
          <div className="border-t border-[#e5e7eb] mt-12 pt-3 flex justify-between text-xs font-bold text-gray-400">
             <span>GRAND TOTAL</span>
             <span className="mr-8">88</span>
             <span>100%</span>
          </div>
        </div>

        {/* Profit & Loss */}
        <div className="border border-[#e5e7eb] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#10b981] font-semibold mb-4">
             <DollarSign className="h-5 w-5" /> Profit & Loss
          </div>
          <div className="flex items-center gap-2 mb-6">
             <div className="border border-[#e5e7eb] p-1 text-xs text-gray-600 rounded">03/29/2026 - 04/04/2026</div>
             <div className="border border-[#e5e7eb] p-1 text-xs text-gray-600 rounded px-3">Delivery ▾</div>
          </div>
          
          <div className="space-y-4">
             <div>
               <div className="flex justify-between text-xs font-medium mb-1 text-gray-700"><span>Total Gross Revenue</span> </div>
               <div className="flex items-center gap-2"><div className="w-full bg-[#10b981] h-6 rounded-r"></div><span className="text-xs font-bold text-gray-800">$255,942.00</span></div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-medium mb-1 text-gray-700"><span>Driver Salary Expenses</span> </div>
               <div className="flex items-center gap-2"><div className="w-[50%] bg-[#3525cd] h-6 rounded-r"></div><span className="text-xs font-bold text-gray-800">$150,421.22</span></div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-medium mb-1 text-gray-700"><span>Fuel Costs</span> </div>
               <div className="flex items-center gap-2"><div className="w-[8%] bg-[#3b82f6] h-6 rounded-r"></div><span className="text-xs font-bold text-gray-800">$13,788.68</span></div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-medium mb-1 text-gray-700"><span>Toll Costs</span> </div>
               <div className="flex items-center gap-2"><div className="w-[2%] bg-[#ef4444] h-6 rounded-r"></div><span className="text-xs font-bold text-gray-800">$3,696.45</span></div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
