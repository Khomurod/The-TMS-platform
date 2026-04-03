"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, Mail, Shield, Hash, AlertCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Settings Page — Company Profile & Account Management
   Uses design system tokens exclusively.
   ═══════════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Company Profile");
  const tabs = ["Company Profile", "Users & Permissions", "Integrations", "Billing"];

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) => (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "12px 0",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary-fixed)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
      </div>
      <div className="flex-1">
        <div className="label-sm" style={{ color: "var(--on-surface-variant)" }}>{label}</div>
        <div className="body-md font-semibold" style={{ color: "var(--on-surface)" }}>{value || "Not set"}</div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* ── Tab Navigation ── */}
      <div className="tab-bar mb-6" style={{ paddingLeft: "var(--spacing-4)" }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`tab-item ${activeTab === t ? "tab-item--active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Company Profile" && (
        <div className="max-w-2xl mx-auto w-full">
          {/* Company Banner */}
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
              color: "var(--on-primary)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                {user?.company_name?.[0] || "S"}
              </div>
              <div>
                <h2 className="headline-md">{user?.company_name || "Company"}</h2>
                <p className="body-sm" style={{ opacity: 0.85, marginTop: 2 }}>
                  {user?.role === "company_admin" ? "Company Administrator" : user?.role || "Member"}
                </p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="card-elevated" style={{ padding: "var(--spacing-5)", marginBottom: "var(--spacing-4)" }}>
            <h3 className="label-lg mb-3" style={{ color: "var(--on-surface)" }}>Company Details</h3>
            <InfoRow icon={Building2} label="Company Name" value={user?.company_name ?? undefined} />
            <InfoRow icon={Mail} label="Admin Email" value={user?.email} />
            <InfoRow icon={Shield} label="Your Role" value={user?.role} />
            <InfoRow icon={Hash} label="Account Status" value="Active" />
          </div>

          {/* Your Profile */}
          <div className="card-elevated" style={{ padding: "var(--spacing-5)" }}>
            <h3 className="label-lg mb-3" style={{ color: "var(--on-surface)" }}>Your Profile</h3>
            <InfoRow icon={Building2} label="Full Name" value={user ? `${user.first_name} ${user.last_name}` : undefined} />
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Shield} label="Role" value={user?.role} />
          </div>
        </div>
      )}

      {activeTab !== "Company Profile" && (
        <div className="max-w-3xl mx-auto w-full mt-8">
          <div
            className="card-elevated flex flex-col items-center"
            style={{ padding: "var(--spacing-10)", textAlign: "center" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--warning-container)" }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: "var(--warning)" }} />
            </div>
            <h2 className="headline-sm mb-2" style={{ color: "var(--on-surface)" }}>{activeTab}</h2>
            <p className="body-md" style={{ color: "var(--on-surface-variant)" }}>This section is under development.</p>
          </div>
        </div>
      )}
    </div>
  );
}
