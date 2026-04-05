"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FormField } from "@/components/ui/Input";
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  Shield,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Create Driver Page — Full-page form with 70/30 split
   Matches CreateLoadPage visual pattern
   ═══════════════════════════════════════════════════════════════ */

export default function CreateDriverPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form State ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employmentType, setEmploymentType] = useState("company_w2");
  const [cdlNumber, setCdlNumber] = useState("");
  const [cdlClass, setCdlClass] = useState("");
  const [cdlExpiryDate, setCdlExpiryDate] = useState("");
  const [medicalCardExpiry, setMedicalCardExpiry] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [paymentTariffType, setPaymentTariffType] = useState("");
  const [paymentTariffValue, setPaymentTariffValue] = useState("");
  const [notes, setNotes] = useState("");

  // ── Submit ──
  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post("/drivers", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        employment_type: employmentType,
        cdl_number: cdlNumber.trim() || undefined,
        cdl_class: cdlClass || undefined,
        cdl_expiry_date: cdlExpiryDate || undefined,
        medical_card_expiry_date: medicalCardExpiry || undefined,
        hire_date: hireDate || undefined,
        payment_tariff_type: paymentTariffType || undefined,
        payment_tariff_value: paymentTariffValue ? Number(paymentTariffValue) : undefined,
        notes: notes.trim() || undefined,
      });
      router.push("/drivers");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create driver. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--surface)" }}>
      {/* ═══ Sticky Header ═══ */}
      <div
        className="shrink-0 flex items-center justify-between px-6"
        style={{
          height: "var(--topbar-height)",
          borderBottom: "1px solid var(--outline-variant)",
          backgroundColor: "var(--surface-lowest)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/drivers"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="title-md" style={{ color: "var(--on-surface)" }}>Create New Driver</h1>
            <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Add a driver to your HR roster</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/drivers" className="btn btn-secondary btn-sm">Cancel</Link>
          <button
            onClick={handleCreate}
            disabled={creating || !firstName.trim() || !lastName.trim()}
            className="btn btn-primary btn-sm"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            {creating ? "Creating..." : "Create Driver"}
          </button>
        </div>
      </div>

      {/* ═══ Error Banner ═══ */}
      {error && (
        <div
          className="flex items-center gap-2 px-6 py-3 text-sm shrink-0"
          style={{ backgroundColor: "var(--error-container)", color: "var(--error)" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ═══ 70/30 Body ═══ */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* ── LEFT 70% — Form ── */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="card-section">
              <h2 className="card-section-header">
                <Users className="icon" style={{ color: "var(--primary)" }} />
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="First Name" required>
                  <input className="input-base" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </FormField>
                <FormField label="Last Name" required>
                  <input className="input-base" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                </FormField>
                <FormField label="Email">
                  <input className="input-base" type="email" placeholder="driver@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </FormField>
                <FormField label="Phone">
                  <input className="input-base" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </FormField>
                <FormField label="Employment Type" required>
                  <select className="select-base" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                    <option value="company_w2">Company Driver (W2)</option>
                    <option value="owner_operator_1099">Owner Operator (1099)</option>
                    <option value="lease_operator">Lease Operator</option>
                  </select>
                </FormField>
                <FormField label="Hire Date">
                  <input className="input-base" type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} />
                </FormField>
              </div>
            </div>

            {/* CDL & Compliance */}
            <div className="card-section card-section--green">
              <h2 className="card-section-header">
                <Shield className="icon" style={{ color: "var(--success)" }} />
                CDL &amp; Compliance
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="CDL Number">
                  <input className="input-base" placeholder="CDL-XXXXXXXXX" value={cdlNumber} onChange={e => setCdlNumber(e.target.value)} />
                </FormField>
                <FormField label="CDL Class">
                  <select className="select-base" value={cdlClass} onChange={e => setCdlClass(e.target.value)}>
                    <option value="">Select class</option>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                  </select>
                </FormField>
                <FormField label="CDL Expiration">
                  <input className="input-base" type="date" value={cdlExpiryDate} onChange={e => setCdlExpiryDate(e.target.value)} />
                </FormField>
                <FormField label="Medical Card Expiry">
                  <input className="input-base" type="date" value={medicalCardExpiry} onChange={e => setMedicalCardExpiry(e.target.value)} />
                </FormField>
              </div>
            </div>

            {/* Payment */}
            <div className="card-section card-section--amber">
              <h2 className="card-section-header">
                <DollarSign className="icon" style={{ color: "var(--warning)" }} />
                Payment Configuration
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Tariff Type">
                  <select className="select-base" value={paymentTariffType} onChange={e => setPaymentTariffType(e.target.value)}>
                    <option value="">Select tariff</option>
                    <option value="percentage">Percentage of Gross</option>
                    <option value="cpm">Cents Per Mile</option>
                    <option value="fixed">Fixed Per Load</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="salary">Weekly Salary</option>
                  </select>
                </FormField>
                <FormField label="Tariff Value">
                  <input className="input-base" type="number" placeholder="0.00" value={paymentTariffValue} onChange={e => setPaymentTariffValue(e.target.value)} />
                </FormField>
              </div>
            </div>
          </div>

          {/* ── RIGHT 30% — Side Info ── */}
          <aside className="space-y-5" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            {/* Quick Tips */}
            <div className="card-tinted space-y-4">
              <h3 className="card-section-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                Quick Tips
              </h3>
              <div className="space-y-3.5 text-[13px]" style={{ color: "var(--on-surface-variant)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="pt-0.5">Driver phone is used for dispatch notifications</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)" }}>
                    <Shield className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
                  </div>
                  <p className="pt-0.5">CDL and medical card dates feed into compliance tracking</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)" }}>
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--warning)" }} />
                  </div>
                  <p className="pt-0.5">Hire date is used to compute driver tenure automatically</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card-section">
              <h3 className="card-section-header" style={{ marginBottom: 12 }}>
                Notes
              </h3>
              <textarea
                className="input-base"
                rows={5}
                placeholder="Internal notes about this driver..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: "vertical", minHeight: 140, height: "auto" }}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
