"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, Mail, Shield, Hash, Clock, Globe } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Settings Page — Company Profile & Account Management
   De-boxed: typography-driven sections, flat key/value grid,
   no card-section wrappers trapping each section.
   ═══════════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="headline-sm" style={{ color: "var(--on-surface)" }}>Settings</h1>
          <p className="body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Manage your company profile and account preferences
          </p>
        </div>

        {/* ── Company Banner ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            color: "var(--on-primary)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              {user?.company_name?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <h2 className="headline-md">{user?.company_name || "Company"}</h2>
              <p className="body-sm" style={{ opacity: 0.85, marginTop: 2 }}>
                {user?.role === "company_admin" ? "Company Administrator" : user?.role || "Member"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Section: Company Details ── */}
        <SectionHeader icon={Building2} label="Company Details" accentColor="var(--primary)" />
        <div className="mb-10">
          <InfoGrid>
            <InfoRow label="Company Name"    value={user?.company_name ?? undefined} />
            <InfoRow label="Admin Email"     value={user?.email} />
            <InfoRow label="Your Role"       value={user?.role} />
            <InfoRow label="Account Status"  value="Active" isGood />
            <InfoRow label="Region"          value="United States" />
          </InfoGrid>
        </div>

        {/* ── Section: Your Profile ── */}
        <SectionHeader icon={Shield} label="Your Profile" accentColor="var(--success)" />
        <div className="mb-10">
          <InfoGrid>
            <InfoRow label="Full Name"   value={user ? `${user.first_name} ${user.last_name}` : undefined} />
            <InfoRow label="Email"       value={user?.email} />
            <InfoRow label="Role"        value={user?.role} />
            <InfoRow label="Member Since" value="2024" />
          </InfoGrid>
        </div>

        {/* ── Section: Preferences ── */}
        <SectionHeader icon={Clock} label="Preferences" accentColor="var(--on-surface-variant)" />
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-lowest)",
          }}
        >
          {[
            { label: "Timezone",      value: "America/Chicago (CST)", hint: "Used for scheduling and reports" },
            { label: "Distance Unit", value: "Miles",                  hint: "Used across loads and mileage reports" },
            { label: "Currency",      value: "USD ($)",                hint: "Default currency for invoices and settlements" },
          ].map((pref, i, arr) => (
            <div
              key={pref.label}
              className="grid gap-2 px-5 py-4"
              style={{
                gridTemplateColumns: "180px 1fr",
                borderBottom: i < arr.length - 1 ? "1px solid var(--outline-variant)" : "none",
              }}
            >
              <div>
                <div className="label-md" style={{ color: "var(--on-surface-variant)" }}>{pref.label}</div>
                <div className="body-sm mt-0.5" style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>{pref.hint}</div>
              </div>
              <div className="flex items-center">
                <span className="body-md font-semibold" style={{ color: "var(--on-surface)" }}>{pref.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom spacer */}
        <div className="h-10" />
      </div>
    </div>
  );
}

/* ── Section Header Component ── */
function SectionHeader({
  icon: Icon,
  label,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
      <h2 className="title-lg" style={{ color: "var(--on-surface)" }}>{label}</h2>
      <hr
        className="flex-1 ml-2"
        style={{ borderColor: "var(--outline-variant)" }}
      />
    </div>
  );
}

/* ── Info Grid Container ── */
function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--outline-variant)",
        backgroundColor: "var(--surface-lowest)",
      }}
    >
      {children}
    </div>
  );
}

/* ── Info Row: clean 2-column key/value grid ── */
function InfoRow({
  label,
  value,
  isGood,
}: {
  label: string;
  value?: string;
  isGood?: boolean;
}) {
  return (
    <div
      className="grid items-center px-5 py-3.5"
      style={{
        gridTemplateColumns: "180px 1fr",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <span className="label-md" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </span>
      <span
        className="body-md font-semibold"
        style={{
          color: isGood ? "var(--success)" : value ? "var(--on-surface)" : "var(--on-surface-variant)",
        }}
      >
        {value || "Not set"}
      </span>
    </div>
  );
}
