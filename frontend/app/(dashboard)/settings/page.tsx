"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Company Profile");
  const tabs = ["Company Profile", "Users & Permissions", "Integrations", "Billing"];

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-md">
      <div className="flex bg-white items-center gap-6 px-4 pt-2 pb-2 border-b border-[#e5e7eb] mb-6 -mt-2">
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

      <div className="max-w-3xl mx-auto w-full mt-8 p-6 border border-[#e5e7eb] rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{activeTab}</h2>
        <div className="space-y-4 text-sm text-gray-600">
           <p>Settings module shell interface successfully staged.</p>
           <p>This layout component serves as a placeholder for backend entity configuration integrations.</p>
        </div>
      </div>
    </div>
  );
}
