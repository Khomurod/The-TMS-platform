"use client";

/**
 * Create New Load Page — Phase 4.6
 *
 * Left column (70%): Broker info, routing timeline with stops
 * Right column (30%): Financials, asset assignment
 * Bottom bar: Discard | Save Draft | Dispatch
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  MapPin,
  DollarSign,
  Truck,
  User,
} from "lucide-react";
import api from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────

interface BrokerOption {
  id: string;
  name: string;
  mc_number: string | null;
}

interface DriverOption {
  id: string;
  first_name: string;
  last_name: string;
  cdl_class: string | null;
}

interface EquipmentOption {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
}

interface StopForm {
  stop_type: "pickup" | "delivery";
  stop_sequence: number;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
}

interface AccessorialForm {
  type: string;
  amount: string;
  description: string;
}

const ACCESSORIAL_TYPES = [
  { value: "fuel_surcharge", label: "Fuel Surcharge" },
  { value: "detention", label: "Detention" },
  { value: "layover", label: "Layover" },
  { value: "lumper", label: "Lumper" },
  { value: "stop_off", label: "Stop Off" },
  { value: "tarp", label: "Tarp" },
  { value: "other", label: "Other" },
];

export default function CreateLoadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Broker search
  const [brokerQuery, setBrokerQuery] = useState("");
  const [brokerOptions, setBrokerOptions] = useState<BrokerOption[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerOption | null>(null);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  // Load info
  const [brokerLoadId, setBrokerLoadId] = useState("");
  const [contactAgent, setContactAgent] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [totalMiles, setTotalMiles] = useState("");
  const [notes, setNotes] = useState("");

  // Stops
  const [stops, setStops] = useState<StopForm[]>([
    { stop_type: "pickup", stop_sequence: 1, facility_name: "", address: "", city: "", state: "", zip_code: "", scheduled_date: "", scheduled_time: "", notes: "" },
    { stop_type: "delivery", stop_sequence: 2, facility_name: "", address: "", city: "", state: "", zip_code: "", scheduled_date: "", scheduled_time: "", notes: "" },
  ]);

  // Accessorials
  const [accessorials, setAccessorials] = useState<AccessorialForm[]>([]);

  // Assignment dropdowns
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [trucks, setTrucks] = useState<EquipmentOption[]>([]);
  const [trailers, setTrailers] = useState<EquipmentOption[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedTrailer, setSelectedTrailer] = useState("");

  // Fetch available assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const [dRes, tRes, trRes] = await Promise.all([
          api.get("/drivers/available"),
          api.get("/fleet/trucks/available"),
          api.get("/fleet/trailers/available"),
        ]);
        setDrivers(dRes.data);
        setTrucks(tRes.data);
        setTrailers(trRes.data);
      } catch (err) {
        console.error("Failed to fetch available assets", err);
      }
    };
    fetchAssets();
  }, []);

  // Broker auto-complete
  useEffect(() => {
    if (brokerQuery.length < 1) {
      setBrokerOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/brokers/search", { params: { q: brokerQuery } });
        setBrokerOptions(res.data);
        setShowBrokerDropdown(true);
      } catch {
        setBrokerOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [brokerQuery]);

  // Calculate total
  const calcTotal = () => {
    const base = parseFloat(baseRate) || 0;
    const accTotal = accessorials.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    return base + accTotal;
  };

  // Stop management
  const addStop = () => {
    const newSeq = stops.length + 1;
    const newStop: StopForm = {
      stop_type: "delivery",
      stop_sequence: newSeq,
      facility_name: "", address: "", city: "", state: "", zip_code: "",
      scheduled_date: "", scheduled_time: "", notes: "",
    };
    // Insert before last delivery
    const updated = [...stops];
    updated.splice(updated.length - 1, 0, newStop);
    // Re-sequence
    updated.forEach((s, i) => (s.stop_sequence = i + 1));
    setStops(updated);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    const updated = stops.filter((_, i) => i !== index);
    updated.forEach((s, i) => (s.stop_sequence = i + 1));
    setStops(updated);
  };

  const updateStop = (index: number, field: keyof StopForm, value: string) => {
    const updated = [...stops];
    (updated[index] as any)[field] = value;
    setStops(updated);
  };

  // Submit
  const handleSubmit = async (dispatch: boolean) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        broker_id: selectedBroker?.id || null,
        broker_load_id: brokerLoadId || null,
        contact_agent: contactAgent || null,
        base_rate: baseRate ? parseFloat(baseRate) : null,
        total_miles: totalMiles ? parseFloat(totalMiles) : null,
        notes: notes || null,
        driver_id: selectedDriver || null,
        truck_id: selectedTruck || null,
        trailer_id: selectedTrailer || null,
        stops: stops.map((s) => ({
          stop_type: s.stop_type,
          stop_sequence: s.stop_sequence,
          facility_name: s.facility_name || null,
          address: s.address || null,
          city: s.city || null,
          state: s.state || null,
          zip_code: s.zip_code || null,
          scheduled_date: s.scheduled_date || null,
          scheduled_time: s.scheduled_time || null,
          notes: s.notes || null,
        })),
        accessorials: accessorials
          .filter((a) => a.amount)
          .map((a) => ({
            type: a.type,
            amount: parseFloat(a.amount),
            description: a.description || null,
          })),
      };

      const res = await api.post("/loads", payload);

      if (dispatch && res.data.id) {
        // Auto-dispatch after creation
        try {
          await api.patch(`/loads/${res.data.id}/status`, { status: "dispatched" });
        } catch (err: any) {
          console.warn("Created but dispatch failed:", err.response?.data?.detail);
        }
      }

      router.push("/loads");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create load");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "var(--spacing-3) var(--spacing-4)",
    backgroundColor: "var(--surface-lowest)",
    border: "1px solid var(--outline-variant)",
    borderRadius: "var(--radius-md)",
    color: "var(--on-surface)",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 4,
    color: "var(--on-surface-variant)",
    fontSize: "0.75rem",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-low)",
    borderRadius: "var(--radius-xl)",
    padding: "var(--spacing-6)",
    border: "1px solid var(--outline-variant)",
    marginBottom: "var(--spacing-5)",
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)", marginBottom: "var(--spacing-8)" }}>
        <button
          onClick={() => router.push("/loads")}
          style={{
            background: "var(--surface-low)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-2)",
            cursor: "pointer",
            color: "var(--on-surface)",
            display: "flex",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="label-sm" style={{ color: "var(--on-surface-variant)", margin: 0, marginBottom: 2 }}>
            Load Board &gt; Create New Load
          </p>
          <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>
            Create New Load
          </h1>
        </div>
      </div>

      {error && (
        <div style={{ padding: "var(--spacing-4)", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", marginBottom: "var(--spacing-6)", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "var(--spacing-6)" }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Broker Information */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
              Broker Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-4)" }}>
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>Broker</label>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant)" }} />
                  <input
                    id="broker-search"
                    style={{ ...inputStyle, paddingLeft: 30 }}
                    placeholder="Search brokers..."
                    value={selectedBroker ? selectedBroker.name : brokerQuery}
                    onChange={(e) => {
                      setBrokerQuery(e.target.value);
                      setSelectedBroker(null);
                    }}
                    onFocus={() => brokerOptions.length > 0 && setShowBrokerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBrokerDropdown(false), 200)}
                  />
                  {showBrokerDropdown && brokerOptions.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                      backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)",
                      borderRadius: "var(--radius-md)", maxHeight: 200, overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}>
                      {brokerOptions.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => { setSelectedBroker(b); setShowBrokerDropdown(false); setBrokerQuery(""); }}
                          style={{
                            padding: "var(--spacing-3) var(--spacing-4)", cursor: "pointer",
                            color: "var(--on-surface)", fontSize: "0.85rem",
                            borderBottom: "1px solid var(--outline-variant)",
                          }}
                        >
                          {b.name} {b.mc_number && <span style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>MC-{b.mc_number}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Load ID (Rate Con)</label>
                <input id="broker-load-id" style={inputStyle} placeholder="e.g. 5508922" value={brokerLoadId} onChange={(e) => setBrokerLoadId(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Contact Agent</label>
                <input id="contact-agent" style={inputStyle} placeholder="Name or Extension" value={contactAgent} onChange={(e) => setContactAgent(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Routing Timeline */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
              Routing Timeline
            </h3>
            {stops.map((stop, index) => (
              <div key={index} style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: "var(--spacing-5)" }}>
                {/* Timeline track */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "var(--radius-full)",
                    backgroundColor: stop.stop_type === "pickup" ? "rgba(59, 130, 246, 0.15)" : "rgba(34, 197, 94, 0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: stop.stop_type === "pickup" ? "#3b82f6" : "#22c55e",
                    flexShrink: 0,
                  }}>
                    <MapPin size={14} />
                  </div>
                  {index < stops.length - 1 && (
                    <div style={{ width: 2, flex: 1, backgroundColor: "var(--outline-variant)", marginTop: 4 }} />
                  )}
                </div>

                {/* Stop card */}
                <div style={{
                  flex: 1, backgroundColor: "var(--surface-lowest)", borderRadius: "var(--radius-lg)",
                  padding: "var(--spacing-4)", border: "1px solid var(--outline-variant)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: stop.stop_type === "pickup" ? "#3b82f6" : "#22c55e", textTransform: "uppercase" }}>
                      {stop.stop_type === "pickup" ? "Pickup" : "Delivery"} — Stop {stop.stop_sequence}
                    </span>
                    {stops.length > 2 && (
                      <button onClick={() => removeStop(index)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 2 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-3)" }}>
                    <div>
                      <label style={labelStyle}>Facility Name</label>
                      <input style={inputStyle} value={stop.facility_name} onChange={(e) => updateStop(index, "facility_name", e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Address</label>
                      <input style={inputStyle} value={stop.address} onChange={(e) => updateStop(index, "address", e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--spacing-2)" }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input style={inputStyle} value={stop.city} onChange={(e) => updateStop(index, "city", e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>State</label>
                        <input style={inputStyle} value={stop.state} onChange={(e) => updateStop(index, "state", e.target.value)} maxLength={2} />
                      </div>
                      <div>
                        <label style={labelStyle}>Zip</label>
                        <input style={inputStyle} value={stop.zip_code} onChange={(e) => updateStop(index, "zip_code", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-2)" }}>
                      <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" style={inputStyle} value={stop.scheduled_date} onChange={(e) => updateStop(index, "scheduled_date", e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Time</label>
                        <input type="time" style={inputStyle} value={stop.scheduled_time} onChange={(e) => updateStop(index, "scheduled_time", e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "var(--spacing-3)" }}>
                    <label style={labelStyle}>Notes (PO#, Seal, etc.)</label>
                    <input style={inputStyle} value={stop.notes} onChange={(e) => updateStop(index, "notes", e.target.value)} placeholder="PO#, Seal#, etc." />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addStop}
              style={{
                display: "flex", alignItems: "center", gap: "var(--spacing-2)",
                padding: "var(--spacing-3) var(--spacing-5)",
                background: "transparent", border: "1px dashed var(--outline-variant)",
                borderRadius: "var(--radius-md)", color: "var(--primary)",
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                width: "100%", justifyContent: "center",
              }}
            >
              <Plus size={14} />
              Add Intermediate Stop
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Financials */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)", display: "flex", alignItems: "center", gap: 8 }}>
              <DollarSign size={18} style={{ color: "var(--primary)" }} />
              Financials
            </h3>
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={labelStyle}>Base Rate ($)</label>
              <input id="base-rate" type="number" step="0.01" style={inputStyle} placeholder="0.00" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
            </div>
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={labelStyle}>Total Miles</label>
              <input id="total-miles" type="number" style={inputStyle} placeholder="0" value={totalMiles} onChange={(e) => setTotalMiles(e.target.value)} />
            </div>

            {/* Accessorials */}
            {accessorials.map((acc, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "var(--spacing-2)", marginBottom: "var(--spacing-3)" }}>
                <select
                  style={inputStyle}
                  value={acc.type}
                  onChange={(e) => {
                    const updated = [...accessorials];
                    updated[i].type = e.target.value;
                    setAccessorials(updated);
                  }}
                >
                  {ACCESSORIAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  placeholder="$"
                  value={acc.amount}
                  onChange={(e) => {
                    const updated = [...accessorials];
                    updated[i].amount = e.target.value;
                    setAccessorials(updated);
                  }}
                />
                <button
                  onClick={() => setAccessorials(accessorials.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setAccessorials([...accessorials, { type: "fuel_surcharge", amount: "", description: "" }])}
              style={{
                display: "flex", alignItems: "center", gap: "var(--spacing-2)",
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "transparent", border: "1px dashed var(--outline-variant)",
                borderRadius: "var(--radius-md)", color: "var(--primary)",
                cursor: "pointer", fontSize: "0.8rem", width: "100%", justifyContent: "center",
                marginBottom: "var(--spacing-4)",
              }}
            >
              <Plus size={12} />
              Add Accessorial
            </button>

            {/* Total */}
            <div style={{
              padding: "var(--spacing-4)", backgroundColor: "var(--surface-lowest)",
              borderRadius: "var(--radius-md)", borderTop: "1px solid var(--outline-variant)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.85rem" }}>Total Load Value</span>
              <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.1rem" }}>
                ${calcTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Asset Assignment */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
              Asset Assignment
            </h3>
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={labelStyle}><User size={12} style={{ display: "inline", marginRight: 4 }} />Assign Driver</label>
              <select id="driver-select" style={inputStyle} value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                <option value="">— Select Driver —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.first_name} {d.last_name} {d.cdl_class && `(CDL-${d.cdl_class})`}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={labelStyle}><Truck size={12} style={{ display: "inline", marginRight: 4 }} />Assign Truck</label>
              <select id="truck-select" style={inputStyle} value={selectedTruck} onChange={(e) => setSelectedTruck(e.target.value)}>
                <option value="">— Select Truck —</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{t.unit_number} {t.make && `(${t.make})`}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assign Trailer</label>
              <select id="trailer-select" style={inputStyle} value={selectedTrailer} onChange={(e) => setSelectedTrailer(e.target.value)}>
                <option value="">— Select Trailer —</option>
                {trailers.map((t) => (
                  <option key={t.id} value={t.id}>{t.unit_number} {t.make && `(${t.make})`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div style={cardStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              placeholder="General notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "var(--sidebar-width)", right: 0,
        backgroundColor: "var(--surface-low)", borderTop: "1px solid var(--outline-variant)",
        padding: "var(--spacing-4) var(--spacing-10)",
        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "var(--spacing-4)",
        zIndex: 30,
      }}>
        <button
          onClick={() => router.push("/loads")}
          style={{
            background: "transparent", border: "none", color: "var(--on-surface-variant)",
            cursor: "pointer", fontSize: "0.875rem", padding: "var(--spacing-3) var(--spacing-5)",
          }}
        >
          Discard Load
        </button>
        <button
          id="save-draft-btn"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          style={{
            padding: "var(--spacing-3) var(--spacing-6)",
            backgroundColor: "var(--surface-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-lg)",
            color: "var(--on-surface)",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Save Draft
        </button>
        <button
          id="dispatch-btn"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          style={{
            padding: "var(--spacing-3) var(--spacing-6)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            border: "none",
            borderRadius: "var(--radius-lg)",
            color: "var(--on-primary)",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {submitting ? "Creating..." : "Dispatch Load"}
        </button>
      </div>
    </div>
  );
}
