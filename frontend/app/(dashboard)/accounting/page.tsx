"use client";

import React, { useState } from "react";
import DataTable from "@/components/ui/DataTable";

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("Settlements");

  const tabs = ["Settlements", "Invoices", "Transactions", "Reports"];

  const renderSubNav = () => (
    <div className="flex bg-white items-center gap-6 px-4 pt-4 pb-2 border-b border-[#e5e7eb]">
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
  );

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-md">
      <div className="flex justify-end mb-2 -mt-10 mr-2 z-10 relative">
        <button className="bg-[#3b82f6] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#2563eb]">
           Export Data
        </button>
      </div>

      <div className="flex-1 rounded-lg border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[80vh]">
        <DataTable 
          data={[]}
          columns={[{ header: "Accounting Data", accessorKey: "data" }]}
          renderSubNav={renderSubNav}
        />
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50">
           Accounting View Shell
        </div>
      </div>
    </div>
  );
}
