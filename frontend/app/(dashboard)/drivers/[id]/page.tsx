"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ComplianceDot from "@/components/ui/ComplianceDot";
import ActivityPanel from "@/components/ui/ActivityPanel";
import {
  Pencil, Save, Users, Truck, Phone, Mail, Calendar,
  Shield, FileText, DollarSign,
  BarChart3, Star, Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Driver Profile Page — Full-page form with 10-tab navigation
   Blueprint: Phase 5.4
   ═══════════════════════════════════════════════════════════════ */

interface DriverDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  employment_type: string;
  cdl_number?: string;
  cdl_class?: string;
  status: string;
  is_active: boolean;
  hire_date?: string;
  birth_date?: string;
  ssn?: string;
  gender?: string;
  marital_status?: string;
  driver_license_id?: string;
  driver_type?: string;
  assigned_truck?: string;
  assigned_trailer?: string;
  mc_number?: string;
  payment_tariff_type?: string;
  payment_tariff_value?: number;
  tax_classification?: string;
  notes?: string;
  rating?: number;
  compliance_urgency?: "good" | "upcoming" | "critical" | "expired";
  created_at?: string;
}

/* ── Tab Config ── */
const DRIVER_TABS = [
  { key: "main",        label: "Main",           icon: <Users className="h-3.5 w-3.5" /> },
  { key: "documents",   label: "Documents",      icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "accounting",  label: "Accounting",     icon: <DollarSign className="h-3.5 w-3.5" /> },
  { key: "statistics",  label: "Statistics",     icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

const STATUS_MAP: Record<string, { intent: "good" | "dispatched" | "upcoming" | "critical"; label: string }> = {
  available: { intent: "good", label: "Available" },
  on_trip: { intent: "dispatched", label: "On Trip" },
  inactive: { intent: "upcoming", label: "Inactive" },
  on_leave: { intent: "upcoming", label: "On Leave" },
  terminated: { intent: "critical", label: "Terminated" },
};

const TYPE_LABEL: Record<string, string> = {
  company_w2: "Company Driver (W2)",
  owner_operator_1099: "Owner Operator (1099)",
  lease_operator: "Lease Operator",
};

const TARIFF_LABEL: Record<string, string> = {
  percentage: "Percentage of Gross",
  cpm: "Cents Per Mile",
  fixed: "Fixed Per Load",
  hourly: "Hourly Rate",
  salary: "Weekly Salary",
};

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id as string;

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("main");

  /* ── Fetch ─────────────────────────────────────────────── */

  const fetchDriver = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/drivers/${driverId}`);
      setDriver(res.data);
    } catch (err) {
      console.error("Failed to fetch driver:", err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => { fetchDriver(); }, [fetchDriver]);

  /* ── Helpers ────────────────────────────────────────────── */

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const calculateTenure = (d?: string) => {
    if (!d) return "—";
    const start = new Date(d);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return years > 0 ? `${years}y ${rem}m` : `${rem}m`;
  };

  /* ── Loading State ─────────────────────────────────────── */

  if (loading || !driver) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
        <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Loading driver profile...</span>
      </div>
    );
  }

  const statusCfg = STATUS_MAP[driver.status] || { intent: "upcoming" as const, label: driver.status };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--surface)" }}>
      {/* ═══ Header ═══ */}
      <PageHeader
        breadcrumbs={[
          { label: "HR Management", href: "/drivers" },
          { label: `${driver.first_name} ${driver.last_name}` },
        ]}
        statusBadge={{ intent: driver.status, label: statusCfg.label }}
        editAction={
          isEditing
            ? { label: "Save changes", icon: <Save className="h-3.5 w-3.5" />, onClick: () => setIsEditing(false) }
            : { label: "Edit driver", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => setIsEditing(true) }
        }
      />

      {/* ═══ Tab Navigation ═══ */}
      <div
        className="flex items-center gap-1 px-6 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0"
        style={{
          borderBottom: "1px solid var(--outline-variant)",
          backgroundColor: "var(--surface-lowest)",
        }}
      >
        {DRIVER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 text-xs font-semibold pb-2.5 pt-3 px-3 border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.key ? "var(--primary)" : "transparent",
              color: activeTab === tab.key ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* ── Main Tab — 3-Column Layout (Phase 5.4) ── */}
        {activeTab === "main" && (
          <div className="grid grid-cols-3 gap-6">

            {/* Column 1 — Personal Information */}
            <div className="space-y-4">
              {/* Photo + Rating */}
              <div className="card p-5 flex flex-col items-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: "var(--primary-fixed)",
                    color: "var(--primary)",
                  }}
                >
                  {driver.first_name[0]}{driver.last_name[0]}
                </div>
                <div className="text-center">
                  <div className="title-md" style={{ color: "var(--on-surface)" }}>
                    {driver.first_name} {driver.last_name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    {TYPE_LABEL[driver.employment_type] || driver.employment_type}
                  </div>
                </div>
                {/* Star Rating */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      style={{
                        color: i <= (driver.rating || 0) ? "var(--warning)" : "var(--outline-variant)",
                        fill: i <= (driver.rating || 0) ? "var(--warning)" : "none",
                      }}
                    />
                  ))}
                </div>
                <ComplianceDot urgency={driver.compliance_urgency || "good"} showLabel size="md" />
              </div>

              {/* Personal Details */}
              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Personal Information</h3>
                <ProfileField label="First Name" value={driver.first_name} />
                <ProfileField label="Last Name" value={driver.last_name} />
                <ProfileField label="Birth Date" value={fmtDate(driver.birth_date)} />
                <ProfileField label="Gender" value={driver.gender || "—"} />
                <ProfileField label="Phone" value={driver.phone || "—"} icon={<Phone className="h-3 w-3" />} />
                <ProfileField label="Email" value={driver.email || "—"} icon={<Mail className="h-3 w-3" />} />
                <ProfileField label="SSN" value={driver.ssn ? "•••-••-" + driver.ssn.slice(-4) : "—"} />
                <ProfileField label="Hire Date" value={fmtDate(driver.hire_date)} icon={<Calendar className="h-3 w-3" />} />
                <ProfileField label="Tenure" value={calculateTenure(driver.hire_date)} />
              </div>

              {/* Compliance */}
              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Compliance</h3>
                <ProfileField label="CDL Number" value={driver.cdl_number || "—"} />
                <ProfileField label="CDL Class" value={driver.cdl_class || "—"} />
                <ProfileField label="Driver License" value={driver.driver_license_id || "—"} />
                <ProfileField label="Driver Type" value={driver.driver_type || TYPE_LABEL[driver.employment_type] || "—"} />
              </div>
            </div>

            {/* Column 2 — Assignments */}
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Assignments</h3>
                <ProfileField label="Assigned Truck" value={driver.assigned_truck || "None"} icon={<Truck className="h-3 w-3" />} highlight={!!driver.assigned_truck} />
                <ProfileField label="Assigned Trailer" value={driver.assigned_trailer || "None"} />
                <ProfileField label="MC Number" value={driver.mc_number || "—"} />
                <ProfileField label="Status" value={statusCfg.label} />
              </div>

              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Employment</h3>
                <ProfileField label="Employment Status" value={driver.is_active ? "Active" : "Inactive"} />
                <ProfileField label="Employment Type" value={TYPE_LABEL[driver.employment_type] || driver.employment_type} />
                <ProfileField label="Driver Status" value={statusCfg.label} />
              </div>
            </div>

            {/* Column 3 — Payment & Notes */}
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Payment</h3>
                <ProfileField
                  label="Tariff Type"
                  value={driver.payment_tariff_type ? TARIFF_LABEL[driver.payment_tariff_type] || driver.payment_tariff_type : "Not configured"}
                />
                <ProfileField
                  label="Tariff Value"
                  value={driver.payment_tariff_value !== undefined ? String(driver.payment_tariff_value) : "—"}
                />
                <ProfileField
                  label="Tax Classification"
                  value={driver.tax_classification || "—"}
                />
              </div>

              {/* Notes */}
              <div className="card p-5 space-y-3">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Notes</h3>
                <p className="body-sm" style={{ color: driver.notes ? "var(--on-surface)" : "var(--on-surface-variant)" }}>
                  {driver.notes || "No notes added."}
                </p>
              </div>

              {/* Activity */}
              <ActivityPanel entityType="driver" entityId={driverId} />
            </div>
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === "documents" && (
          <div className="card p-5 space-y-4">
            <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Documents</h3>
            <div className="py-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>Driver compliance documents</p>
              <p className="text-xs mb-3" style={{ color: "var(--on-surface-variant)" }}>
                Upload CDL, Medical Card, MVR, Drug Test and more
              </p>
              <button className="btn btn-secondary btn-sm" disabled title="Document uploads will be available in a future update">
                Bulk Upload
              </button>
            </div>
          </div>
        )}

        {/* ── Accounting Tab ── */}
        {activeTab === "accounting" && (
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Payment Tariff</h3>
              <ProfileField
                label="Tariff Type"
                value={driver.payment_tariff_type ? TARIFF_LABEL[driver.payment_tariff_type] || driver.payment_tariff_type : "Not configured"}
              />
              <ProfileField label="Tariff Value" value={driver.payment_tariff_value !== undefined ? String(driver.payment_tariff_value) : "—"} />
            </div>
            <div className="card p-5 space-y-3">
              <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Weekly Other Pay</h3>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>No recurring payments configured</p>
            </div>
            <div className="card p-5 space-y-3">
              <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Weekly Deductions</h3>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>No recurring deductions configured</p>
            </div>
          </div>
        )}

        {/* ── Statistics Tab ── */}
        {activeTab === "statistics" && (
          <div className="card p-5 space-y-4">
            <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>Driver Statistics</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Loads", value: "—" },
                { label: "Total Miles", value: "—" },
                { label: "Revenue Generated", value: "—" },
                { label: "On-Time Rate", value: "—" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-lg text-center" style={{ backgroundColor: "var(--surface-low)" }}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>{stat.value}</div>
                  <div className="text-[11px] font-medium mt-1" style={{ color: "var(--on-surface-variant)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

/* ── Helper Component ── */
function ProfileField({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--surface-container)" }}>
      <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--on-surface-variant)" }}>
        {icon}
        {label}
      </span>
      <span
        className="text-xs font-medium text-right max-w-[180px] truncate"
        style={{ color: highlight ? "var(--primary)" : "var(--on-surface)" }}
      >
        {value}
      </span>
    </div>
  );
}
