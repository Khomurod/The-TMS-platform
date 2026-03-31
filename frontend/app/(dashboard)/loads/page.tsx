"use client";

import React, { useState } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { Filter, ChevronRight, FileText } from "lucide-react";

// Mock Data mimicking screenshot rows
const mockLoads = [
  { shipId: "DT-005756", loadId: "1175227 J", customer: "AFN LLC", driver: "CLYDE LEE JR MALLE", truck: "318 CMP", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Ontario, CA, 91761", delivery: "Allentown, PA, 18101", date: "Apr 3, 2026", status: "IN TRANSIT" },
  { shipId: "DT-005755", loadId: "445884 CO", customer: "BBI LOGISTICS LLC", driver: "FIRUZ AZIMOV", truck: "313", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Center, CO, 81125", delivery: "Overlea, MD, 21236", date: "Apr 2, 2026", status: "DISPATCHED" },
  { shipId: "DT-005754", loadId: "361061 CI", customer: "CRANE SOLUTIONS", driver: "MIKE AUGUSTE", truck: "290B COMPANY", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Chantilly, VA, 20152", delivery: "Hebron, KY, 41048", date: "Apr 1, 2026", status: "DISPATCHED" },
  { shipId: "DT-005753", loadId: "3508277 Q", customer: "KNX LOGISTICS", driver: "MUZAFFAR KHAMIDI", truck: "707 muzaf", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Village of Penn Yan", delivery: "Jessup, MD, 20794", date: "Mar 31, 2026", status: "DISPATCHED" },
  { shipId: "DT-005752", loadId: "5281467 CL", customer: "AFN LLC", driver: "TEDLA MOUZ B", truck: "312 CMP", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Woodstock, AL, 3518", delivery: "Upper Macungie To", date: "Apr 1, 2026", status: "IN TRANSIT" },
  { shipId: "DT-005751", loadId: "143364732 CI", customer: "HUB GROUP INC", driver: "MUZAFFAR KHAMIDI", truck: "707 muzaf", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Marysville, OH, 4304", delivery: "Pittston, PA, 18640", date: "Mar 31, 2026", status: "IN TRANSIT" },
  { shipId: "DT-005742", loadId: "2228900 Q", customer: "TOTAL", driver: "STANLEY BRUTUS", truck: "3447", trailer: "-", mc: "WENZE TRANSPORT", pickup: "Port Wentworth, GA", delivery: "McDonough, GA, 30", date: "Mar 30, 2026", status: "DELIVERED" },
];

export default function LoadsPage() {
  const [activeTab, setActiveTab] = useState("All Loads");

  const tabs = [
    { name: "All Loads" },
    { name: "Upcoming Loads", count: 12 },
    { name: "Dispatched", count: 19 },
    { name: "In-Transit", count: 48 },
    { name: "Delivered", count: 46 },
    { name: "Unpaid", count: 1952 },
    { name: "Trips" },
  ];

  const columns: ColumnDef<any>[] = [
    { 
      header: "Shipment ID", 
      accessorKey: "shipId",
      cell: (row) => (
        <div className="flex items-center gap-1 font-medium">
          <ChevronRight className="h-3 w-3 text-gray-400" />
          {row.shipId}
        </div>
      )
    },
    { 
      header: "Load ID", 
      accessorKey: "loadId",
      cell: (row) => <div className="text-[#10b981] font-semibold">{row.loadId}</div>
    },
    { 
      header: "Customer", 
      accessorKey: "customer",
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer font-medium">{row.customer}</div>
    },
    { header: "Driver/Carrier", accessorKey: "driver", cell: (r) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{r.driver}</div> },
    { header: "Truck", accessorKey: "truck", cell: (r) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{r.truck}</div> },
    { header: "Trailer", accessorKey: "trailer" },
    { header: "MC Number", accessorKey: "mc" },
    { header: "Pickup locat...", accessorKey: "pickup" },
    { header: "Delivery loc...", accessorKey: "delivery" },
    { header: "DEL date", accessorKey: "date" },
    { 
      header: "Load status", 
      accessorKey: "status",
      cell: (row) => <StatusPill status={row.status} />
    },
    { 
      header: "Docu...", 
      accessorKey: "doc",
      cell: () => <div className="w-6 h-6 bg-blue-50 text-blue-500 rounded flex items-center justify-center cursor-pointer"><FileText className="h-3 w-3" /></div>
    }
  ];

  const renderSubNav = () => (
    <div className="flex flex-col border-b border-[#e5e7eb] bg-white pt-4">
      <div className="flex items-center gap-6 px-4 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.name}
            onClick={() => setActiveTab(t.name)}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === t.name 
                ? "border-[#3b82f6] text-[#3b82f6]" 
                : "border-transparent text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            {t.name}
            {t.count && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === t.name ? "bg-[#3b82f6] text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Filtering row specifically beneath subnav in Loads */}
      <div className="flex items-center gap-3 px-4 py-2 text-sm">
        <button className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white font-medium text-[#374151] hover:bg-gray-50">
          <Filter className="h-3 w-3" /> Filter
        </button>
        <div className="flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded px-3 py-1.5 w-48">
          <span className="text-gray-400 text-xs">Pickup Time</span>
        </div>
        <div className="flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded px-3 py-1.5 w-48">
          <span className="text-gray-400 text-xs">Delivery Time</span>
        </div>
        <div className="flex items-center gap-2 border border-[#e5e7eb] px-3 py-1.5 rounded bg-white w-32 justify-between">
          <span className="text-gray-400 text-xs">Load status</span>
          <ChevronRight className="h-3 w-3 text-gray-400 rotate-90" />
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 w-full text-[11px]">
      <span>Total pay: <span className="text-black">$10,477,005.01</span></span>
      <span>Total load pay: <span className="text-black">$10,446,745.01</span></span>
      <span>Driver gross: <span className="text-black">$10,403,045.45</span></span>
      <span>Total miles: <span className="text-black">4,292,276.99</span></span>
      <span>Empty miles: <span className="text-black">689,571.38</span></span>
      <span>RPM for loaded miles: <span className="text-black">$2.91</span></span>
      <span>RPM for total miles: <span className="text-black">$2.44</span></span>
      <span>Service fee: <span className="text-black">$43,261.55</span></span>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative gap-2">
        <button className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center hover:bg-[#2563eb]">
          <span className="mr-1 font-bold">+</span> New load
        </button>
        <button className="bg-white border border-[#e5e7eb] text-gray-500 px-2 py-1.5 rounded flex items-center hover:bg-gray-50">
          <div className="w-1 h-1 rounded-full bg-gray-500 mx-[1px]" />
          <div className="w-1 h-1 rounded-full bg-gray-500 mx-[1px]" />
          <div className="w-1 h-1 rounded-full bg-gray-500 mx-[1px]" />
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={mockLoads}
          columns={columns}
          renderSubNav={renderSubNav}
          renderFooter={renderFooter}
        />
      </div>
    </div>
  );
}
