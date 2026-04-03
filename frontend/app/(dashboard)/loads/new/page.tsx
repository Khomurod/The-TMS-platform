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

  // ── Form State ──
  const [brokerLoadId, setBrokerLoadId] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerContact, setBrokerContact] = useState("");
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
    } catch (err) {
      console.error("Failed to create load:", err);
    } finally {
      setCreating(false);
    }
  };

  // ── Computed ──
  const ratePerMile =
    baseRate && totalMiles && Number(totalMiles) > 0
      ? (Number(baseRate) / Number(totalMiles)).toFixed(2)
      : "—";

  return (
    <div className="h-full flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4 px-6 py-4 shrink-0 border-b border-[var(--outline-variant)]">
        <Link
          href="/loads"
          className="flex items-center gap-2 text-sm font-medium text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Loads
        </Link>
        <div className="w-px h-5 bg-[var(--outline-variant)]" />
        <h1 className="headline-sm text-[var(--on-surface)]">
          Create New Load
        </h1>
      </div>

      {/* ── Main Content: 70/30 Split ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-[1400px] mx-auto">
          {/* ════════════ LEFT COLUMN — 70% ════════════ */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* ── Broker Info Card ── */}
            <div className="card p-6">
              <h2 className="title-md flex items-center gap-2 mb-5 text-[var(--on-surface)]">
                <FileText className="h-4 w-4 text-[var(--primary)]" />
                Broker Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    placeholder="e.g. CH Robinson"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                  />
                </FormField>
                <FormField label="Broker Contact">
                  <input
                    className="input-base"
                    placeholder="Phone or email"
                    value={brokerContact}
                    onChange={(e) => setBrokerContact(e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            {/* ── Routing Timeline Card ── */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="title-md flex items-center gap-2 text-[var(--on-surface)]">
                  <MapPin className="h-4 w-4 text-[var(--primary)]" />
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
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* ── Financials Card ── */}
            <div className="card p-6">
              <h2 className="title-md flex items-center gap-2 mb-5 text-[var(--on-surface)]">
                <DollarSign className="h-4 w-4 text-[var(--primary)]" />
                Financials
              </h2>
              <div className="flex flex-col gap-4">
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
                <div className="rounded-lg p-4 flex items-center justify-between bg-[var(--surface-low)] border border-[var(--outline-variant)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">
                    Rate / Mile
                  </span>
                  <span className="text-lg font-bold tabular-nums text-[var(--primary)]">
                    {ratePerMile === "—" ? "—" : `$${ratePerMile}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Notes Card ── */}
            <div className="card p-6">
              <h2 className="title-md mb-5 text-[var(--on-surface)]">
                Notes
              </h2>
              <textarea
                className="input-base min-h-[120px] resize-y"
                placeholder="Add any special instructions, detention alerts, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Footer Action Bar ── */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-[var(--outline-variant)] bg-[var(--surface-lowest)]">
        <Link
          href="/loads"
          className="px-5 py-2 rounded-lg text-sm font-medium transition-colors bg-[var(--surface-lowest)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)] hover:bg-[var(--surface-container)] hover:border-[var(--outline)] no-underline"
        >
          Cancel
        </Link>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          {creating ? "Creating..." : "Create Load"}
        </button>
      </div>
    </div>
  );
}
