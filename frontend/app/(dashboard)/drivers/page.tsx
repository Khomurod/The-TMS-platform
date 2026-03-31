"use client";

import React, { useState } from "react";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { Edit2 } from "lucide-react";

// Mock Data representing the exact rows from the "Active Drivers" screenshot
const mockDrivers = [
  { id: "1", assign: "Not ready", empStatus: "ACTIVE", first: "Khasan", last: "Azimov", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+13322007674", email: "azimovkhasan05@gm", status: "AVAILABLE", truck: "-", trailer: "-", team: "No" },
  { id: "2", assign: "Ready to go", empStatus: "ACTIVE", first: "Pascal", last: "Fleurimond", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+17722409360", email: "pfleurimond@live.d", status: "AVAILABLE", truck: "96266 CMP", trailer: "-", team: "No" },
  { id: "3", assign: "Not ready", empStatus: "ACTIVE", first: "William Joseph", last: "Massey", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+15732829304", email: "-", status: "AVAILABLE", truck: "-", trailer: "-", team: "No" },
  { id: "4", assign: "Ready to go", empStatus: "ACTIVE", first: "Torris Dawod", last: "Robinson", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+12566892557", email: "torrisrobinson77@g", status: "AVAILABLE", truck: "320 CMP", trailer: "-", team: "No" },
  { id: "5", assign: "Ready to go", empStatus: "ACTIVE", first: "CLYDE LEE JR", last: "MALLETT", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+18187913231", email: "clyvaughnandlila@g", status: "IN TRANSIT", truck: "318 CMP", trailer: "-", team: "No" },
  { id: "6", assign: "Ready to go", empStatus: "ACTIVE", first: "JOSEPH", last: "JEAN WALMY", type: "Owner operator", mc: "WENZE TRANSPORT", phone: "+12394401411", email: "j.mybentz91@gmail.", status: "IN TRANSIT", truck: "1991", trailer: "-", team: "No" },
  { id: "7", assign: "Ready to go", empStatus: "ACTIVE", first: "Jamaal Omari", last: "Gist", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+12542587216", email: "jamaalgist39@gmai", status: "IN TRANSIT", truck: "96254 CMP", trailer: "-", team: "No" },
  { id: "8", assign: "Ready to go", empStatus: "ACTIVE", first: "John Wolf", last: "ELISEE", type: "Company driver", mc: "WENZE TRANSPORT", phone: "(786) 642-9033", email: "johnwolf.elisee90@", status: "AVAILABLE", truck: "1 Rudolph", trailer: "-", team: "Yes" },
  { id: "9", assign: "Ready to go", empStatus: "ACTIVE", first: "REY DAVID", last: "OD HIONG", type: "Company driver", mc: "WENZE TRANSPORT", phone: "+14654132132", email: "davidtransportusa@", status: "DISPATCHED", truck: "983", trailer: "-", team: "No" },
];

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState("Active Drivers");

  const tabs = [
    "Active Drivers", "Unassigned drivers", "Active Dispatchers", 
    "Active Employees", "Archived dispatchers", "Archived Employees", 
    "All Drivers", "Terminated Drivers", "Vacation board"
  ];

  const columns: ColumnDef<any>[] = [
    {
      header: "Assign status",
      accessorKey: "assign",
      cell: (row) => <StatusPill status={row.assign} />
    },
    {
      header: "Employee st...",
      accessorKey: "empStatus",
      cell: (row) => <StatusPill status={row.empStatus} />
    },
    { header: "First name", accessorKey: "first" },
    { header: "Last name", accessorKey: "last" },
    { header: "Driver Type", accessorKey: "type" },
    { header: "MC number", accessorKey: "mc" },
    { header: "Contact nu...", accessorKey: "phone" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Driver status",
      accessorKey: "status",
      cell: (row) => <StatusPill status={row.status} />
    },
    { 
      header: "Truck", 
      accessorKey: "truck",
      cell: (row) => <div className="text-[#3b82f6] hover:underline cursor-pointer">{row.truck}</div>
    },
    { header: "Trailer", accessorKey: "trailer" },
    { header: "Team", accessorKey: "team" }
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
      <div className="ml-auto pb-2 flex items-center">
         {/* Stubbed to match the 'Create driver' button alignment */}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4">
      {/* Tab bar header actions */}
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative">
        <button className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 hover:bg-[#2563eb]">
          <span className="text-lg leading-none">+</span> Create driver
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={mockDrivers}
          columns={columns}
          renderSubNav={renderSubNav}
        />
      </div>
    </div>
  );
}
