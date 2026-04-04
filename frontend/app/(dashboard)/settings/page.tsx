"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, Mail, Shield, Hash, Clock, Globe } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Settings Page — Company Profile & Account Management
   Premium enterprise layout with full-height utilization.
   ═══════════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="headline-sm" style={{ color: "var(--on-surface)" }}>Settings</h1>
          <p className="body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Manage your company profile and account
          </p>
        </div>

        {/* Company Banner */}
        <div
          className="rounded-2xl p-6 mb-6"
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

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Details */}
          <div className="card-section" style={{ borderLeftColor: "var(--primary)" }}>
            <h3 className="card-section-header">
              <Building2 className="icon" style={{ color: "var(--primary)" }} />
              Company Details
            </h3>
            <InfoRow icon={Building2} label="Company Name" value={user?.company_name ?? undefined} />
            <InfoRow icon={Mail} label="Admin Email" value={user?.email} />
            <InfoRow icon={Shield} label="Your Role" value={user?.role} />
            <InfoRow icon={Hash} label="Account Status" value="Active" />
            <InfoRow icon={Globe} label="Region" value="United States" />
          </div>

          {/* Your Profile */}
          <div className="card-section card-section--green">
            <h3 className="card-section-header">
              <Shield className="icon" style={{ color: "var(--success)" }} />
              Your Profile
            </h3>
            <InfoRow icon={Building2} label="Full Name" value={user ? `${user.first_name} ${user.last_name}` : undefined} />
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Shield} label="Role" value={user?.role} />
            <InfoRow icon={Clock} label="Member Since" value="2024" />
          </div>
        </div>

        {/* Preferences Card */}
        <div className="card-tinted mt-6">
          <h3 className="card-section-header" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
            <Clock className="icon" style={{ color: "var(--primary)" }} />
            Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <PreferenceItem
              label="Timezone"
              value="America/Chicago (CST)"
              hint="Used for scheduling and reports"
            />
            <PreferenceItem
              label="Distance Unit"
              value="Miles"
              hint="Used across loads and mileage reports"
            />
            <PreferenceItem
              label="Currency"
              value="USD ($)"
              hint="Default currency for invoices and settlements"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "14px 0",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary-fixed)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
      </div>
      <div className="flex-1">
        <div className="body-sm" style={{ color: "var(--on-surface-variant)" }}>{label}</div>
        <div className="body-md font-semibold" style={{ color: "var(--on-surface)" }}>{value || "Not set"}</div>
      </div>
    </div>
  );
}

function PreferenceItem({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
    >
      <div className="body-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>{label}</div>
      <div className="title-md mt-1" style={{ color: "var(--on-surface)" }}>{value}</div>
      <div className="body-sm mt-2" style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>{hint}</div>
    </div>
  );
}
