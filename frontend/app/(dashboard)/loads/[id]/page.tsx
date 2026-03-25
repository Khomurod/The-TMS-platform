"use client";

/**
 * Load Detail Page — Phase 4.7
 *
 * Shows full load info: status + transition buttons, route timeline,
 * driver/equipment cards, financials, and stop details.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Truck,
  User,
  DollarSign,
  Clock,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────

interface Stop {
  id: string;
  stop_type: string;
  stop_sequence: number;
  facility_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  notes: string | null;
}

interface Accessorial {
  id: string;
  type: string;
  amount: number;
  description: string | null;
}

interface LoadDetail {
  id: string;
  load_number: string;
  broker_load_id: string | null;
  broker_id: string | null;
  driver_id: string | null;
  truck_id: string | null;
  trailer_id: string | null;
  status: string;
  base_rate: number | null;
  total_miles: number | null;
  total_rate: number | null;
  contact_agent: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stops: Stop[];
  accessorials: Accessorial[];
}

// ── State Machine Transitions ───────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ["dispatched", "cancelled"],
  dispatched: ["at_pickup", "cancelled"],
  at_pickup: ["in_transit"],
  in_transit: ["delivered", "delayed"],
  delayed: ["in_transit", "delivered"],
  delivered: ["billed"],
  billed: ["paid"],
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  planned: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" },
  dispatched: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  at_pickup: { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
  in_transit: { bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" },
  delivered: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  delayed: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  billed: { bg: "rgba(20, 184, 166, 0.15)", color: "#14b8a6" },
  paid: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" },
  cancelled: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

const TRANSITION_LABELS: Record<string, string> = {
  dispatched: "Dispatch",
  at_pickup: "Arrive at Pickup",
  in_transit: "Start Transit",
  delivered: "Mark Delivered",
  delayed: "Mark Delayed",
  billed: "Mark Billed",
  paid: "Mark Paid",
  cancelled: "Cancel Load",
};

export default function LoadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const loadId = params?.id as string;

  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoad = useCallback(async () => {
    try {
      const res = await api.get(`/loads/${loadId}`);
      setLoad(res.data);
    } catch (err) {
      console.error("Failed to fetch load", err);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    if (loadId) fetchLoad();
  }, [loadId, fetchLoad]);

  const handleTransition = async (newStatus: string) => {
    setTransitioning(true);
    setError(null);
    try {
      const res = await api.patch(`/loads/${loadId}/status`, { status: newStatus });
      setLoad(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Transition failed");
    } finally {
      setTransitioning(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "—";
    return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-low)",
    borderRadius: "var(--radius-xl)",
    padding: "var(--spacing-6)",
    border: "1px solid var(--outline-variant)",
    marginBottom: "var(--spacing-5)",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400, color: "var(--on-surface-variant)" }}>
        Loading...
      </div>
    );
  }

  if (!load) {
    return (
      <div style={{ textAlign: "center", padding: "var(--spacing-12)", color: "var(--on-surface-variant)" }}>
        Load not found
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[load.status] || STATUS_STYLES.planned;
  const allowedTransitions = VALID_TRANSITIONS[load.status] || [];
  const sortedStops = [...load.stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
  const accTotal = load.accessorials.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--spacing-8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
          <button
            onClick={() => router.push("/loads")}
            style={{
              background: "var(--surface-low)", border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)", padding: "var(--spacing-2)",
              cursor: "pointer", color: "var(--on-surface)", display: "flex",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="label-sm" style={{ color: "var(--on-surface-variant)", margin: 0, marginBottom: 2 }}>
              Load Board &gt; Load Detail
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
              <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>
                {load.load_number}
              </h1>
              <span style={{
                padding: "3px 12px", borderRadius: "var(--radius-full)",
                backgroundColor: statusStyle.bg, color: statusStyle.color,
                fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize",
              }}>
                {load.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Transition Buttons */}
        <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleTransition(status)}
              disabled={transitioning}
              style={{
                padding: "var(--spacing-3) var(--spacing-5)",
                borderRadius: "var(--radius-lg)",
                border: status === "cancelled" ? "1px solid rgba(239, 68, 68, 0.4)" : "none",
                background: status === "cancelled"
                  ? "transparent"
                  : "linear-gradient(135deg, var(--primary), var(--primary-container))",
                color: status === "cancelled" ? "#ef4444" : "var(--on-primary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: transitioning ? "not-allowed" : "pointer",
                opacity: transitioning ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ChevronRight size={14} />
              {TRANSITION_LABELS[status] || status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "var(--spacing-4)", backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)",
          color: "#ef4444", marginBottom: "var(--spacing-6)", fontSize: "0.875rem",
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "var(--spacing-6)" }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Route Timeline */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>
              Route Timeline
            </h3>
            {sortedStops.map((stop, index) => (
              <div key={stop.id} style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: index < sortedStops.length - 1 ? "var(--spacing-4)" : 0 }}>
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
                  {index < sortedStops.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: "var(--outline-variant)", marginTop: 4 }} />
                  )}
                </div>

                <div style={{ flex: 1, paddingBottom: "var(--spacing-3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600,
                      color: stop.stop_type === "pickup" ? "#3b82f6" : "#22c55e",
                      textTransform: "uppercase",
                    }}>
                      {stop.stop_type} — Stop {stop.stop_sequence}
                    </span>
                    <span style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem" }}>
                      {formatDate(stop.scheduled_date)} {stop.scheduled_time || ""}
                    </span>
                  </div>
                  <p style={{ color: "var(--on-surface)", fontWeight: 600, margin: "2px 0", fontSize: "0.9rem" }}>
                    {stop.facility_name || "—"}
                  </p>
                  <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", margin: 0 }}>
                    {[stop.address, stop.city, stop.state, stop.zip_code].filter(Boolean).join(", ") || "—"}
                  </p>
                  {stop.notes && (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem", margin: "4px 0 0", fontStyle: "italic" }}>
                      {stop.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* General Notes */}
          {load.notes && (
            <div style={cardStyle}>
              <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-3)" }}>Notes</h3>
              <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", margin: 0 }}>{load.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Financials */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)", display: "flex", alignItems: "center", gap: 8 }}>
              <DollarSign size={18} style={{ color: "var(--primary)" }} />
              Financials
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-3)" }}>
              <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Base Rate</span>
              <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>{formatCurrency(load.base_rate)}</span>
            </div>
            {load.accessorials.map((acc) => (
              <div key={acc.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-2)" }}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", textTransform: "capitalize" }}>
                  {acc.type.replace("_", " ")}
                </span>
                <span style={{ color: "var(--on-surface)", fontSize: "0.85rem" }}>
                  {formatCurrency(acc.amount)}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: "1px solid var(--outline-variant)", paddingTop: "var(--spacing-3)", marginTop: "var(--spacing-3)",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>Total</span>
              <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.1rem" }}>
                {formatCurrency(load.total_rate)}
              </span>
            </div>
            {load.total_miles && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--spacing-3)" }}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Total Miles</span>
                <span style={{ color: "var(--on-surface)" }}>{Number(load.total_miles).toLocaleString()} mi</span>
              </div>
            )}
          </div>

          {/* Assignment Info */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>Assignment</h3>
            <InfoRow icon={<User size={16} />} label="Driver" value={load.driver_id || "Unassigned"} />
            <InfoRow icon={<Truck size={16} />} label="Truck" value={load.truck_id || "Unassigned"} />
            <InfoRow icon={<Truck size={16} />} label="Trailer" value={load.trailer_id || "Unassigned"} />
          </div>

          {/* Broker Info */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>Broker</h3>
            <InfoRow icon={<Clock size={16} />} label="Broker Load ID" value={load.broker_load_id || "—"} />
            <InfoRow icon={<User size={16} />} label="Contact Agent" value={load.contact_agent || "—"} />
          </div>

          {/* Metadata */}
          <div style={cardStyle}>
            <h3 className="title-md" style={{ color: "var(--on-surface)", margin: 0, marginBottom: "var(--spacing-5)" }}>Info</h3>
            <InfoRow icon={<Clock size={16} />} label="Created" value={formatDate(load.created_at)} />
            <InfoRow icon={<Clock size={16} />} label="Updated" value={formatDate(load.updated_at)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)", marginBottom: "var(--spacing-3)" }}>
      <div style={{ color: "var(--on-surface-variant)", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <span style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>{label}</span>
        <p style={{ color: "var(--on-surface)", fontSize: "0.875rem", margin: 0, fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}
