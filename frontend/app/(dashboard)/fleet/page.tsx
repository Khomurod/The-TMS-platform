"use client";

import React, { useState } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";

const mockFleet = [
  { make: "FRHT", model: "TR", unit: "005 CMP", plate: "C076FJ", vin: "3AKJHHDR6NSN...", year: 2022, state: "GA", mc: "WENZE TRANSPORT", operator: "-", owner: "-", odo: "0", trailer: "-" },
  { make: "FREIG", model: "TRAC", unit: "771 Jurabek", plate: "55769PF", vin: "3AKJHHDR2RSU...", year: 2024, state: "NY", mc: "WENZE TRANSPORT", operator: "JURABEK SHADMAN", owner: "-", odo: "0", trailer: "-" },
  { make: "VOLV", model: "VOLV", unit: "1991", plate: "XD929V", vin: "4VANC9EHSMN2...", year: 2021, state: "FL", mc: "WENZE TRANSPORT", operator: "JOSEPH JEAN WALI...", owner: "-", odo: "0", trailer: "-" },
  { make: "FRHT", model: "TR", unit: "96256 CMP", plate: "P1340675", vin: "3AKJHHDR7TSW...", year: 2024, state: "IL", mc: "WENZE TRANSPORT", operator: "Pascal Fleurimond", owner: "-", odo: "0", trailer: "-" },
  { make: "INTL", model: "MX", unit: "182", plate: "ZP91203", vin: "3HSDZAPR7NNS...", year: 2022, state: "CA", mc: "WENZE TRANSPORT", operator: "-", owner: "-", odo: "0", trailer: "-" },
  { make: "FRHT", model: "FRHT", unit: "318 CMP", plate: "PXE9165", vin: "3AKJHHDR9TSW...", year: 2024, state: "OH", mc: "WENZE TRANSPORT", operator: "CLYDE LEE JR MALLE", owner: "-", odo: "0", trailer: "-" },
];

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState("Active Trucks");

  const tabs = [
    "Active Trucks", "Unassigned trucks", "All Trucks", "Inactive Trucks"
  ];

  const columns: ColumnDef<any>[] = [
    { header: "Make", accessorKey: "make" },
    { header: "Model", accessorKey: "model" },
    { 
      header: "Unit number", 
      accessorKey: "unit",
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{row.unit}</div>
    },
    { header: "Plate number", accessorKey: "plate" },
    { header: "Vin", accessorKey: "vin" },
    { header: "Year", accessorKey: "year" },
    { header: "State", accessorKey: "state" },
    { header: "MC number", accessorKey: "mc" },
    { 
      header: "Operator (dr...", 
      accessorKey: "operator",
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{row.operator}</div>
    },
    { header: "Owner name", accessorKey: "owner" },
    { header: "Odometer", accessorKey: "odo" },
    { header: "Trailer", accessorKey: "trailer" },
  ];

  const renderSubNav = () => (
    <div className="flex bg-white items-center gap-6 px-4 pt-4 pb-2 border-b border-[#e5e7eb] overflow-x-auto whitespace-nowrap scrollbar-hide">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
            activeTab === t 
              ? "border-[#3b82f6] text-[#3b82f6]" 
              : "border-transparent text-[#6b7280] hover:text-[#374151]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  const renderFooter = () => (
    <div className="flex items-center gap-4 w-full justify-start font-medium text-[11px]">
      <div className="flex items-center gap-2">
        <span className="bg-[#10b981] text-white px-2 py-0.5 rounded-sm">AVAILABLE 59</span>
        <span className="bg-[#f97316] text-white px-2 py-0.5 rounded-sm">IN TRANSIT 26</span>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="w-8 h-4 bg-[#e5e7eb] rounded-xl relative cursor-pointer">
           <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
        </div>
        <span className="text-[#6b7280]">By fleet status</span>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative">
        <button className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center hover:bg-[#2563eb]">
          Create Truck
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={mockFleet}
          columns={columns}
          renderSubNav={renderSubNav}
          renderFooter={renderFooter}
        />
      </div>
    </div>
  );
}
