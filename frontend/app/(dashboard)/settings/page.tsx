"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Building2, Shield, Clock,
  CreditCard, Users, Plug, FileText, Settings,
  Tags, Layers, Zap, BarChart3, FolderKanban,
  DollarSign, Lock, Hash, Pencil,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Settings Page — Matches reference: Left sidebar nav + content
   ═══════════════════════════════════════════════════════════════ */

const SETTINGS_NAV = {
  apps: [
    { id: "mc-numbers",    label: "MC numbers",          icon: Hash },
    { id: "users",         label: "Users management",    icon: Users },
    { id: "billing",       label: "Subscription Billing", icon: CreditCard },
    { id: "integrations",  label: "Integrations",        icon: Plug },
  ],
  customizations: [
    { id: "tariffs",           label: "Tariffs & Payments",      icon: DollarSign },
    { id: "expenses",          label: "Expenses",                icon: FileText },
    { id: "order-payment",     label: "Order payment types",     icon: CreditCard },
    { id: "default-configs",   label: "Default configurations",  icon: Settings },
    { id: "templates",         label: "Templates",               icon: FileText },
    { id: "documents",         label: "Documents",               icon: FileText },
    { id: "work-safety",       label: "Work order & Safety",     icon: Shield },
    { id: "reports-custom",    label: "Reports Customization",   icon: BarChart3 },
    { id: "tag-mgmt",          label: "Tag management",          icon: Tags },
    { id: "dynamic-statuses",  label: "Dynamic statuses",        icon: Layers },
    { id: "automations",       label: "Automations",             icon: Zap },
    { id: "report-constructor", label: "Report constructor",     icon: BarChart3 },
    { id: "task-mgmt",         label: "Task Management Projects", icon: FolderKanban },
  ],
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("company-profile");

  return (
    <div className="h-full flex" style={{ backgroundColor: "var(--surface)" }}>

      {/* ══ Left Sidebar Nav ══ */}
      <div
        className="flex flex-col h-full overflow-y-auto flex-shrink-0"
        style={{
          width: 230,
          borderRight: "1px solid var(--outline-variant)",
          background: "var(--surface-lowest)",
          paddingTop: 12,
        }}
      >
        {/* Company Profile — primary item */}
        <button
          onClick={() => setActiveSection("company-profile")}
          className={`settings-nav-item${activeSection === "company-profile" ? " settings-nav-item--active" : ""}`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Company Profile</span>
        </button>

        {/* Apps */}
        <div className="settings-nav-section-label">Apps</div>
        {SETTINGS_NAV.apps.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`settings-nav-item${activeSection === item.id ? " settings-nav-item--active" : ""}`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* TMS Customizations */}
        <div className="settings-nav-section-label">TMS Customizations</div>
        {SETTINGS_NAV.customizations.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`settings-nav-item${activeSection === item.id ? " settings-nav-item--active" : ""}`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Bottom spacer */}
        <div className="flex-1" />
        <div className="dt-pagination" style={{ borderTop: "1px solid var(--outline-variant)", padding: "8px 16px" }}>
          <span className="body-sm" style={{ color: "var(--on-surface-variant)" }}>Rows per page:</span>
          <select className="dt-page-select" style={{ fontSize: 12 }}>
            <option>25</option><option>50</option><option>100</option>
          </select>
        </div>
      </div>

      {/* ══ Right Content ══ */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "company-profile" && <CompanyProfileContent user={user} />}
        {activeSection === "mc-numbers" && <MCNumbersContent user={user} />}
        {activeSection !== "company-profile" && activeSection !== "mc-numbers" && (
          <PlaceholderContent label={
            [...SETTINGS_NAV.apps, ...SETTINGS_NAV.customizations].find(i => i.id === activeSection)?.label || activeSection
          } />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Company Profile
   ══════════════════════════════════════════════════════════════ */
function CompanyProfileContent({ user }: { user: any }) {
  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="headline-sm" style={{ color: "var(--on-surface)" }}>Settings</h1>
      </div>

      {/* Company Banner */}
      <div className="rounded-2xl p-5 mb-8" style={{
        background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
        color: "var(--on-primary)",
      }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            {user?.company_name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="headline-md">{user?.company_name || "Safehaul Platform"}</h2>
            <p className="body-sm" style={{ opacity: 0.85, marginTop: 2 }}>
              {user?.role === "company_admin" ? "Company Administrator" : user?.role || "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <SectionLabel icon={Building2} label="Company Details" color="var(--primary)" />
      <InfoTable rows={[
        { label: "Company Name", value: user?.company_name },
        { label: "Admin Email",  value: user?.email },
        { label: "Your Role",    value: user?.role },
        { label: "Account Status", value: "Active", isGood: true },
        { label: "Region",       value: "United States" },
      ]} />

      {/* Your Profile */}
      <SectionLabel icon={Shield} label="Your Profile" color="var(--success)" />
      <InfoTable rows={[
        { label: "Full Name", value: user ? `${user.first_name} ${user.last_name}` : undefined },
        { label: "Email",     value: user?.email },
        { label: "Role",      value: user?.role },
        { label: "Member Since", value: "2024" },
      ]} />

      {/* Preferences */}
      <SectionLabel icon={Clock} label="Preferences" color="var(--on-surface-variant)" />
      <div className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-lowest)" }}>
        {[
          { label: "Timezone",    value: "America/Chicago (CST)", hint: "Used for scheduling and reports" },
          { label: "Distance Unit", value: "Miles", hint: "Used across loads and mileage reports" },
          { label: "Currency",    value: "USD ($)", hint: "Default currency for invoices and settlements" },
          { label: "Default currency for invoices and sett.", value: "USD ($)", hint: "" },
        ].map((pref, i, arr) => (
          <div
            key={pref.label}
            className="grid gap-2 px-5 py-3.5"
            style={{
              gridTemplateColumns: "200px 1fr",
              borderBottom: i < arr.length - 1 ? "1px solid var(--outline-variant)" : "none",
            }}
          >
            <div>
              <div className="label-md" style={{ color: "var(--on-surface-variant)" }}>{pref.label}</div>
              {pref.hint && <div className="body-sm mt-0.5" style={{ color: "var(--on-surface-variant)", fontSize: 11 }}>{pref.hint}</div>}
            </div>
            <div className="flex items-center">
              <span className="body-md font-semibold" style={{ color: "var(--on-surface)" }}>{pref.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MC Numbers — Table matching reference
   ══════════════════════════════════════════════════════════════ */
function MCNumbersContent({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="px-8 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div />
        <button className="topbar-create-btn">Create</button>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-5">
        <button className={`tab-item${activeTab === "general" ? " tab-item--active" : ""}`} onClick={() => setActiveTab("general")}>
          General info
        </button>
        <button className={`tab-item${activeTab === "offices" ? " tab-item--active" : ""}`} onClick={() => setActiveTab("offices")}>
          Offices
        </button>
      </div>

      {/* Data Table */}
      <div className="dt-wrapper" style={{ border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="dt-table">
            <thead>
              <tr>
                {["", "ID", "Company na...", "Type", "Company ph...", "Demo", "Default", "States", "Status", "Number", ""].map((h, i) => (
                  <th key={i} className="dt-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="dt-row">
                <td className="dt-td" style={{ width: 40, textAlign: "center" }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                </td>
                <td className="dt-td tabular-nums">1</td>
                <td className="dt-td font-semibold">{user?.company_name?.toUpperCase() || "SAFEHAUL TRANSPORT"}</td>
                <td className="dt-td">carrier</td>
                <td className="dt-td tabular-nums">—</td>
                <td className="dt-td">—</td>
                <td className="dt-td">Yes</td>
                <td className="dt-td">—</td>
                <td className="dt-td">
                  <span className="chip-status" style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>Active</span>
                </td>
                <td className="dt-td tabular-nums">—</td>
                <td className="dt-td" style={{ width: 40, textAlign: "center" }}>
                  <button className="dt-row-action-btn" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="dt-pagination">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select className="dt-page-select">
              <option>25</option><option>50</option><option>100</option>
            </select>
          </div>
          <span className="tabular-nums">1-1 of 1</span>
          <div className="flex gap-1">
            <button className="dt-page-btn" disabled>‹</button>
            <button className="dt-page-btn" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Placeholder for other sections
   ══════════════════════════════════════════════════════════════ */
function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-12">
      <div className="empty-state-icon">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="headline-sm" style={{ color: "var(--on-surface)" }}>{label}</h2>
      <p className="body-md text-center" style={{ color: "var(--on-surface-variant)", maxWidth: 400 }}>
        This section is under development. Check back soon.
      </p>
    </div>
  );
}

/* ── Shared sub-components ── */

function SectionLabel({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3 mt-6">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <h2 className="title-lg" style={{ color: "var(--on-surface)" }}>{label}</h2>
      <hr className="flex-1 ml-2" style={{ borderColor: "var(--outline-variant)" }} />
    </div>
  );
}

function InfoTable({ rows }: { rows: { label: string; value?: string; isGood?: boolean }[] }) {
  return (
    <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-lowest)" }}>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="grid items-center px-5 py-3"
          style={{ gridTemplateColumns: "180px 1fr", borderBottom: i < rows.length - 1 ? "1px solid var(--outline-variant)" : "none" }}
        >
          <span className="label-md" style={{ color: "var(--on-surface-variant)" }}>{row.label}</span>
          <span className="body-md font-semibold" style={{ color: row.isGood ? "var(--success)" : row.value ? "var(--on-surface)" : "var(--on-surface-variant)" }}>
            {row.value || "Not set"}
          </span>
        </div>
      ))}
    </div>
  );
}
