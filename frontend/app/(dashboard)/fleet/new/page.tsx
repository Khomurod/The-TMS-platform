"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FormField } from "@/components/ui/Input";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  Settings2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Create Truck Page — Full-page form with 70/30 split
   Matches CreateLoadPage visual pattern
   ═══════════════════════════════════════════════════════════════ */

export default function CreateTruckPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form State ──
  const [unitNumber, setUnitNumber] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [dotInspectionDate, setDotInspectionDate] = useState("");
  const [dotInspectionExpiry, setDotInspectionExpiry] = useState("");

  // ── Submit ──
  const handleCreate = async () => {
    if (!unitNumber.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post("/fleet/trucks", {
        unit_number: unitNumber.trim(),
        year: year ? Number(year) : undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        vin: vin.trim() || undefined,
        license_plate: licensePlate.trim() || undefined,
        ownership_type: ownershipType || undefined,
        dot_inspection_date: dotInspectionDate || undefined,
        dot_inspection_expiry: dotInspectionExpiry || undefined,
      });
      router.push("/fleet");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create truck. Please try again.";
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
            href="/fleet"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="title-md" style={{ color: "var(--on-surface)" }}>Register New Truck</h1>
            <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Add a truck to your fleet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/fleet" className="btn btn-secondary btn-sm">Cancel</Link>
          <button
            onClick={handleCreate}
            disabled={creating || !unitNumber.trim()}
            className="btn btn-primary btn-sm"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
            {creating ? "Creating..." : "Register Truck"}
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
            {/* Unit Information */}
            <div className="card-section">
              <h2 className="card-section-header">
                <Truck className="icon" style={{ color: "var(--primary)" }} />
                Unit Information
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Unit Number" required>
                  <input className="input-base" placeholder="TRK-001" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} />
                </FormField>
                <FormField label="Year">
                  <input className="input-base" type="number" placeholder="2024" value={year} onChange={e => setYear(e.target.value)} />
                </FormField>
                <FormField label="Make">
                  <select className="select-base" value={make} onChange={e => setMake(e.target.value)}>
                    <option value="">Select make</option>
                    <option value="Freightliner">Freightliner</option>
                    <option value="Peterbilt">Peterbilt</option>
                    <option value="Kenworth">Kenworth</option>
                    <option value="Volvo">Volvo</option>
                    <option value="International">International</option>
                    <option value="Mack">Mack</option>
                    <option value="Western Star">Western Star</option>
                  </select>
                </FormField>
                <FormField label="Model">
                  <input className="input-base" placeholder="e.g. Cascadia" value={model} onChange={e => setModel(e.target.value)} />
                </FormField>
                <FormField label="VIN">
                  <input className="input-base" placeholder="17-digit VIN" maxLength={17} value={vin} onChange={e => setVin(e.target.value)} />
                </FormField>
                <FormField label="License Plate">
                  <input className="input-base" placeholder="Plate number" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} />
                </FormField>
                <FormField label="Ownership Type">
                  <select className="select-base" value={ownershipType} onChange={e => setOwnershipType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="company_owned">Company Owned</option>
                    <option value="leased">Leased</option>
                    <option value="owner_operator">Owner Operator</option>
                  </select>
                </FormField>
              </div>
            </div>

            {/* DOT Inspection */}
            <div className="card-section card-section--green">
              <h2 className="card-section-header">
                <Shield className="icon" style={{ color: "var(--success)" }} />
                DOT Inspection
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Last Inspection Date">
                  <input className="input-base" type="date" value={dotInspectionDate} onChange={e => setDotInspectionDate(e.target.value)} />
                </FormField>
                <FormField label="Inspection Expiry">
                  <input className="input-base" type="date" value={dotInspectionExpiry} onChange={e => setDotInspectionExpiry(e.target.value)} />
                </FormField>
              </div>
            </div>

            {/* Specifications (future) */}
            <div className="card-section card-section--amber">
              <h2 className="card-section-header">
                <Settings2 className="icon" style={{ color: "var(--warning)" }} />
                Specifications
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Engine Type">
                  <input className="input-base" placeholder="e.g. Diesel" disabled title="Coming in a future update" />
                </FormField>
                <FormField label="Fuel Type">
                  <select className="select-base" disabled title="Coming in a future update">
                    <option value="">Select fuel type</option>
                  </select>
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
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
                    <Truck className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="pt-0.5">Unit number must be unique across your fleet</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(22, 163, 74, 0.1)" }}>
                    <Shield className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
                  </div>
                  <p className="pt-0.5">DOT inspection dates trigger compliance alerts</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--warning)" }} />
                  </div>
                  <p className="pt-0.5">Trucks are automatically set to &apos;available&apos; status</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
