"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, Mail, Phone, MapPin, Shield, Hash } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Company Profile");
  const tabs = ["Company Profile", "Users & Permissions", "Integrations", "Billing"];

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#3b82f6]" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-sm text-gray-900 font-semibold">{value || "Not set"}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-md">
      <div className="flex bg-white items-center gap-6 px-4 pt-2 pb-2 border-b border-[#e5e7eb] mb-6 -mt-2">
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

      {activeTab === "Company Profile" && (
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {user?.company_name?.[0] || "S"}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.company_name || "Company"}</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {user?.role === "company_admin" ? "Company Administrator" : user?.role || "Member"}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-[#e5e7eb] rounded-xl p-5 bg-white">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Company Details</h3>
            <InfoRow icon={Building2} label="Company Name" value={user?.company_name} />
            <InfoRow icon={Mail} label="Admin Email" value={user?.email} />
            <InfoRow icon={Shield} label="Your Role" value={user?.role} />
            <InfoRow icon={Hash} label="Account Status" value="Active" />
          </div>

          <div className="border border-[#e5e7eb] rounded-xl p-5 bg-white mt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Your Profile</h3>
            <InfoRow icon={Building2} label="Full Name" value={user ? `${user.first_name} ${user.last_name}` : undefined} />
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Shield} label="Role" value={user?.role} />
          </div>
        </div>
      )}

      {activeTab !== "Company Profile" && (
        <div className="max-w-3xl mx-auto w-full mt-8 p-6 border border-[#e5e7eb] rounded-lg bg-gray-50 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{activeTab}</h2>
          <p className="text-sm text-gray-500">This section is under development.</p>
        </div>
      )}
    </div>
  );
}
