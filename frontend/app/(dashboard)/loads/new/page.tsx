"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FormField } from "@/components/ui/Input";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Stop type for the dynamic routing timeline
   ═══════════════════════════════════════════════════════════════ */

interface Stop {
  stop_type: "pickup" | "delivery";
  stop_sequence: number;
  city: string;
  state: string;
}

const emptyStop = (type: "pickup" | "delivery", seq: number): Stop => ({
  stop_type: type,
  stop_sequence: seq,
  city: "",
  state: "",
});

/* ═══════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════ */

export default function CreateLoadPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form State ──
  const [brokerLoadId, setBrokerLoadId] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [totalMiles, setTotalMiles] = useState("");
  const [notes, setNotes] = useState("");
  const [stops, setStops] = useState<Stop[]>([
    emptyStop("pickup", 1),
    emptyStop("delivery", 2),
  ]);

  // ── Stop Helpers ──
  const updateStop = (idx: number, field: keyof Stop, value: string) => {
    setStops((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      emptyStop("delivery", prev.length + 1),
    ]);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stop_sequence: i + 1 }))
    );
  };

  // ── Submit ──
  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await api.post("/loads", {
        broker_load_id: brokerLoadId || undefined,
        base_rate: baseRate ? Number(baseRate) : undefined,
        total_miles: totalMiles ? Number(totalMiles) : undefined,
        notes: notes || undefined,
        stops: stops.map((s) => ({
          stop_type: s.stop_type,
          stop_sequence: s.stop_sequence,
          city: s.city || undefined,
          state: s.state || undefined,
        })),
      });
      router.push("/loads");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create load. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCreating(false);
    }
  };

  // ── Computed ──
  const ratePerMile =
    baseRate && totalMiles && Number(totalMiles) > 0
      ? (Number(baseRate) / Number(totalMiles)).toFixed(2)
      : "—";

  const hasValidStop = stops.some((s) => s.city.trim());

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
            href="/loads"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="title-md" style={{ color: "var(--on-surface)" }}>Create New Load</h1>
            <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Add a new load to dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/loads" className="btn btn-secondary btn-sm">Cancel</Link>
          <button
            onClick={handleCreate}
            disabled={creating || !hasValidStop}
            className="btn btn-primary btn-sm"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {creating ? "Creating..." : "Create Load"}
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

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* ════════════ LEFT COLUMN — 70% ════════════ */}
          <div className="flex flex-col gap-6">
            {/* ── Broker Info Card ── */}
            <div className="card-section">
              <h2 className="card-section-header">
                <FileText className="icon" style={{ color: "var(--primary)" }} />
                Broker Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <FormField label="Broker Load ID">
                  <input
                    className="input-base"
                    placeholder="e.g. 445884"
                    value={brokerLoadId}
                    onChange={(e) => setBrokerLoadId(e.target.value)}
                  />
                </FormField>
                <FormField label="Broker Name">
                  <input
                    className="input-base"
                    placeholder="Broker company"
                    disabled
                    title="Coming in a future update"
                  />
                </FormField>
                <FormField label="Broker MC#">
                  <input
                    className="input-base"
                    placeholder="MC Number"
                    disabled
                    title="Coming in a future update"
                  />
                </FormField>
                </div>
              </div>

            {/* ── Routing Timeline Card ── */}
            <div className="card-section card-section--green">
              <div className="flex items-center justify-between" style={{ paddingBottom: 14, marginBottom: 20, borderBottom: "1px solid var(--outline-variant)" }}>
                <h2 className="flex items-center gap-2.5" style={{ fontSize: 15, fontWeight: 600, color: "var(--on-surface)" }}>
                  <MapPin className="icon" style={{ color: "var(--success)" }} />
                  Routing Timeline
                </h2>
                <button
                  onClick={addStop}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors text-[var(--primary)] border border-[var(--primary)] bg-[var(--primary-fixed)] hover:brightness-95 active:scale-[0.98]"
                >
                  <Plus className="h-3 w-3" />
                  Add Stop
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center pt-2 shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          stop.stop_type === "pickup"
                            ? "border-[var(--success)] bg-[var(--success-container)]"
                            : "border-[var(--error)] bg-[var(--error-container)]"
                        }`}
                      />
                      {idx < stops.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-[40px] mt-1 bg-[var(--outline-variant)]" />
                      )}
                    </div>

                    {/* Stop fields */}
                    <div className="flex-1 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--surface-low)] border border-[var(--outline-variant)]">
                      <FormField label="Stop Type">
                        <select
                          className="select-base"
                          value={stop.stop_type}
                          onChange={(e) =>
                            updateStop(
                              idx,
                              "stop_type",
                              e.target.value as "pickup" | "delivery"
                            )
                          }
                        >
                          <option value="pickup">Pickup</option>
                          <option value="delivery">Delivery</option>
                        </select>
                      </FormField>
                      <FormField label="City">
                        <input
                          className="input-base"
                          placeholder="City"
                          value={stop.city}
                          onChange={(e) =>
                            updateStop(idx, "city", e.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="State">
                        <input
                          className="input-base"
                          placeholder="ST"
                          maxLength={2}
                          value={stop.state}
                          onChange={(e) =>
                            updateStop(idx, "state", e.target.value)
                          }
                        />
                      </FormField>
                    </div>

                    {/* Remove button (if more than 2 stops) */}
                    {stops.length > 2 && (
                      <button
                        onClick={() => removeStop(idx)}
                        className="mt-3 p-2 rounded-md transition-colors text-[var(--error)] hover:bg-[var(--error-container)] active:scale-[0.98]"
                        title="Remove stop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN — 30% ════════════ */}
          <aside className="flex flex-col gap-5" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            {/* ── Financials Card ── */}
            <div className="card-section card-section--amber">
              <h2 className="card-section-header">
                <DollarSign className="icon" style={{ color: "var(--warning)" }} />
                Financials
              </h2>
              <div className="flex flex-col gap-5">
                <FormField label="Base Rate ($)" required>
                  <input
                    className="input-base"
                    type="number"
                    placeholder="0.00"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                  />
                </FormField>
                <FormField label="Total Miles">
                  <input
                    className="input-base"
                    type="number"
                    placeholder="0"
                    value={totalMiles}
                    onChange={(e) => setTotalMiles(e.target.value)}
                  />
                </FormField>

                {/* Rate-per-mile summary */}
                <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)", border: "1px solid #d8e2f4" }}>
                  <span className="text-xs font-semibold tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                    Rate / Mile
                  </span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: "var(--primary)" }}>
                    {ratePerMile === "—" ? "—" : `$${ratePerMile}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Notes Card ── */}
            <div className="card-section">
              <h2 className="card-section-header" style={{ marginBottom: 12 }}>
                Notes
              </h2>
              <textarea
                className="input-base min-h-[140px] resize-y"
                placeholder="Add any special instructions, detention alerts, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
