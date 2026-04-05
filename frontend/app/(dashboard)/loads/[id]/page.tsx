"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { LOAD_STATUSES } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import StatusStepper, { LOAD_STAGES } from "@/components/ui/StatusStepper";
import ProfitBox from "@/components/ui/ProfitBox";
import ActivityPanel from "@/components/ui/ActivityPanel";
import StatusBadge, { statusToIntent } from "@/components/ui/StatusBadge";
import EntityLink from "@/components/ui/EntityLink";
import {
  Pencil, Save, MapPin,
  Truck, Users, Calendar, DollarSign, Package,
  FileText, Clock, Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Load Detail Page — 70/30 Split Layout
   Blueprint: Phase 5.1
   ═══════════════════════════════════════════════════════════════ */

interface LoadDetail {
  id: string;
  load_number: string;
  shipment_id?: string;
  broker_load_id?: string;
  status: string;
  base_rate?: number;
  total_rate?: number;
  broker_name?: string;
  mc_number?: string;
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_date?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_date?: string;
  mileage?: number;
  weight?: number;
  transportation_mode?: string;
  commodity_type?: string;
  special_instructions?: string;
  created_at?: string;
  is_locked?: boolean;
  trips?: TripItem[];
  stops?: StopItem[];
}

interface TripItem {
  id: string;
  status: string;
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
  created_at?: string;
}

interface StopItem {
  id: string;
  type: string;
  company_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  appointment_start?: string;
  appointment_end?: string;
  sequence: number;
}

/* ── Status Transition Map ─ which status comes next ── */
const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  offer: { status: "booked", label: "Book Load" },
  booked: { status: "assigned", label: "Assign Load" },
  assigned: { status: "dispatched", label: "Dispatch" },
  dispatched: { status: "in_transit", label: "Mark In-Transit" },
  in_transit: { status: "delivered", label: "Mark Delivered" },
  delivered: { status: "invoiced", label: "Create Invoice" },
  invoiced: { status: "paid", label: "Mark Paid" },
  paid: null,
  cancelled: null,
};

/* ── Tab Config ── */
const TABS = [
  { key: "load-info", label: "Load Info", icon: <Package className="h-3.5 w-3.5" /> },
  { key: "trips", label: "Trips", icon: <Truck className="h-3.5 w-3.5" /> },
  { key: "documents", label: "Documents", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "financials", label: "Financials", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { key: "status-updates", label: "Status Updates", icon: <Clock className="h-3.5 w-3.5" /> },
];

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loadId = params?.id as string;

  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("load-info");
  const [advancingStatus, setAdvancingStatus] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────── */

  const fetchLoad = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/loads/${loadId}`);
      setLoad(res.data);
    } catch (err) {
      console.error("Failed to fetch load:", err);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => { fetchLoad(); }, [fetchLoad]);

  /* ── Status Advance ────────────────────────────────────── */

  const advanceStatus = async () => {
    if (!load) return;
    const next = NEXT_STATUS[load.status];
    if (!next) return;
    setAdvancingStatus(true);
    try {
      await api.patch(`/loads/${loadId}/status`, { status: next.status });
      await fetchLoad();
    } catch (err) {
      console.error("Failed to advance status:", err);
    } finally {
      setAdvancingStatus(false);
    }
  };

  /* ── Helpers ────────────────────────────────────────────── */

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const fmtCurrency = (v?: number) =>
    v !== undefined && v !== null
      ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : "—";

  /* ── Loading State ─────────────────────────────────────── */

  if (loading || !load) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
        <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Loading load details...</span>
      </div>
    );
  }

  const nextAction = NEXT_STATUS[load.status];
  const statusLabel = LOAD_STATUSES[load.status]?.label || load.status;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--surface)" }}>
      {/* ═══ Sticky Header ═══ */}
      <PageHeader
        breadcrumbs={[
          { label: "Load Management", href: "/loads" },
          { label: load.load_number },
        ]}
        statusBadge={{ intent: load.status, label: statusLabel }}
        primaryAction={
          nextAction
            ? { label: nextAction.label, onClick: advanceStatus, loading: advancingStatus }
            : undefined
        }
        secondaryActions={[]}
        editAction={
          isEditing
            ? { label: "Save load", icon: <Save className="h-3.5 w-3.5" />, onClick: () => setIsEditing(false) }
            : { label: "Edit load", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => setIsEditing(true) }
        }
        kebabActions={[
          {
            label: "Cancel load",
            onClick: async () => {
              if (!confirm(`Cancel load ${load.load_number}?`)) return;
              try {
                await api.patch(`/loads/${loadId}/status`, { status: "cancelled" });
                fetchLoad();
              } catch { /* transition may be disallowed */ }
            },
            destructive: true,
          },
        ]}
      />

      {/* ═══ Status Stepper ═══ */}
      <StatusStepper stages={LOAD_STAGES} currentStage={load.status} />

      {/* ═══ 70/30 Split ═══ */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="grid gap-6 px-6 py-5"
          style={{ gridTemplateColumns: "1fr 380px" }}
        >
          {/* ── LEFT 70% — Tabbed Content ── */}
          <main className="min-w-0 space-y-5">

            {/* Tab Navigation */}
            <div
              className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide"
              style={{ borderBottom: "1px solid var(--outline-variant)" }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 text-xs font-semibold pb-2.5 pt-1 px-3 border-b-2 transition-colors"
                  style={{
                    borderColor: activeTab === tab.key ? "var(--primary)" : "transparent",
                    color: activeTab === tab.key ? "var(--primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.key === "trips" && load.trips && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: activeTab === tab.key ? "var(--primary-fixed)" : "var(--surface-container-high)",
                        color: activeTab === tab.key ? "var(--primary)" : "var(--on-surface-variant)",
                      }}
                    >
                      {load.trips.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Load Info Tab ── */}
            {activeTab === "load-info" && (
              <div className="space-y-4">
                {/* Load Info Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                    Load Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <FieldRow label="Load #">
                      <EntityLink label={load.load_number} copyable />
                    </FieldRow>
                    <FieldRow label="Broker Load ID">
                      <span className="body-sm font-medium" style={{ color: "var(--success)" }}>
                        {load.broker_load_id || "—"}
                      </span>
                    </FieldRow>
                    <FieldRow label="MC Number">
                      <span className="body-sm">{load.mc_number || "—"}</span>
                    </FieldRow>
                    <FieldRow label="Broker">
                      <span className="body-sm font-medium" style={{ color: "var(--primary)" }}>
                        {load.broker_name || "—"}
                      </span>
                    </FieldRow>
                    <FieldRow label="Transportation Mode">
                      <span className="body-sm">{load.transportation_mode || "FTL"}</span>
                    </FieldRow>
                    <FieldRow label="Commodity">
                      <span className="body-sm">{load.commodity_type || "General"}</span>
                    </FieldRow>
                  </div>
                </div>

                {/* Payment Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                    Payment
                  </h3>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                    <FieldRow label="Base Rate">
                      <span className="body-sm tabular-nums font-semibold">{fmtCurrency(load.base_rate)}</span>
                    </FieldRow>
                    <FieldRow label="Total Rate">
                      <span className="body-sm tabular-nums font-bold" style={{ color: "var(--success)" }}>
                        {fmtCurrency(load.total_rate)}
                      </span>
                    </FieldRow>
                    <FieldRow label="Mileage">
                      <span className="body-sm tabular-nums">{load.mileage ? `${load.mileage.toLocaleString()} mi` : "—"}</span>
                    </FieldRow>
                  </div>
                </div>

                {/* Stops Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                    Stops
                  </h3>
                  {load.stops && load.stops.length > 0 ? (
                    <div className="space-y-2">
                      {load.stops.map((stop, i) => (
                        <div
                          key={stop.id}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: "var(--surface-low)" }}
                        >
                          <div className="flex flex-col items-center mt-0.5">
                            <MapPin
                              className="h-4 w-4"
                              style={{ color: stop.type === "pickup" ? "var(--success)" : "var(--error)" }}
                            />
                            {i < (load.stops?.length || 0) - 1 && (
                              <div className="w-0.5 h-6 mt-1" style={{ backgroundColor: "var(--outline-variant)" }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase" style={{
                                color: stop.type === "pickup" ? "var(--success)" : "var(--error)",
                              }}>
                                {stop.type}
                              </span>
                              <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                                {stop.company_name || "—"}
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                              {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "Location TBD"}
                            </div>
                            {stop.appointment_start && (
                              <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
                                <Calendar className="h-3 w-3" />
                                {fmtDate(stop.appointment_start)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <MapPin className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        No stops configured
                      </p>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                {load.special_instructions && (
                  <div className="card p-5 space-y-2">
                    <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                      Special Instructions
                    </h3>
                    <p className="body-sm" style={{ color: "var(--on-surface-variant)" }}>
                      {load.special_instructions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Trips Tab ── */}
            {activeTab === "trips" && (
              <div className="card p-5 space-y-4">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                  Trip Assignments
                </h3>
                {load.trips && load.trips.length > 0 ? (
                  <div className="space-y-3">
                    {load.trips.map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center gap-4 p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--surface-low)",
                          border: "1px solid var(--outline-variant)",
                        }}
                      >
                        <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="font-medium mb-0.5" style={{ color: "var(--on-surface-variant)" }}>Driver</div>
                            <div className="flex items-center gap-1" style={{ color: "var(--primary)" }}>
                              <Users className="h-3 w-3" />
                              {trip.driver_name || "Unassigned"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-0.5" style={{ color: "var(--on-surface-variant)" }}>Truck</div>
                            <div className="flex items-center gap-1" style={{ color: "var(--on-surface)" }}>
                              <Truck className="h-3 w-3" />
                              {trip.truck_number || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-0.5" style={{ color: "var(--on-surface-variant)" }}>Status</div>
                            <StatusBadge intent={statusToIntent(trip.status)} size="sm">
                              {trip.status}
                            </StatusBadge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Truck className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>No trips yet</p>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Dispatch this load to create a trip assignment
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Documents Tab ── */}
            {activeTab === "documents" && (
              <div className="card p-5 space-y-4">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                  Documents
                </h3>
                <div className="py-8 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>No documents</p>
                  <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    BOL, POD, and rate confirmations will appear here
                  </p>
                </div>
              </div>
            )}

            {/* ── Financials Tab ── */}
            {activeTab === "financials" && (
              <div className="card p-5 space-y-4">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                  Financial Details
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <FieldRow label="Base Rate">
                    <span className="body-sm tabular-nums font-semibold">{fmtCurrency(load.base_rate)}</span>
                  </FieldRow>
                  <FieldRow label="Total Rate">
                    <span className="body-sm tabular-nums font-bold" style={{ color: "var(--success)" }}>
                      {fmtCurrency(load.total_rate)}
                    </span>
                  </FieldRow>
                  <FieldRow label="RPM">
                    <span className="body-sm tabular-nums">
                      {load.mileage && load.total_rate
                        ? `$${(load.total_rate / load.mileage).toFixed(2)}`
                        : "—"}
                    </span>
                  </FieldRow>
                  <FieldRow label="Mileage">
                    <span className="body-sm tabular-nums">{load.mileage?.toLocaleString() || "—"} mi</span>
                  </FieldRow>
                </div>
              </div>
            )}

            {/* ── Status Updates Tab ── */}
            {activeTab === "status-updates" && (
              <div className="card p-5 space-y-4">
                <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                  Status History
                </h3>
                <ActivityPanel entityType="load" entityId={loadId} />
              </div>
            )}
          </main>

          {/* ── RIGHT 30% — Sticky Sidebar ── */}
          <aside className="space-y-4" style={{ position: "sticky", top: 20, alignSelf: "start" }}>
            {/* Quick Info Card */}
            <div className="card p-4 space-y-3">
              <h3 className="title-sm" style={{ color: "var(--on-surface)" }}>
                Assignment
              </h3>
              <div className="space-y-2">
                <MiniRow label="Driver" icon={<Users className="h-3 w-3" />} value={load.driver_name || "Unassigned"} highlight={!!load.driver_name} />
                <MiniRow label="Truck" icon={<Truck className="h-3 w-3" />} value={load.truck_number || "—"} />
                <MiniRow label="Pickup" icon={<MapPin className="h-3 w-3" style={{ color: "var(--success)" }} />} value={[load.pickup_city, load.pickup_state].filter(Boolean).join(", ") || "TBD"} />
                <MiniRow label="Delivery" icon={<MapPin className="h-3 w-3" style={{ color: "var(--error)" }} />} value={[load.delivery_city, load.delivery_state].filter(Boolean).join(", ") || "TBD"} />
                <MiniRow label="Pickup Date" icon={<Calendar className="h-3 w-3" />} value={fmtDate(load.pickup_date)} />
                <MiniRow label="Delivery Date" icon={<Calendar className="h-3 w-3" />} value={fmtDate(load.delivery_date)} />
              </div>
            </div>

            {/* Profit Box */}
            <ProfitBox
              totalMileRevenue={load.total_rate || 0}
              accessorials={0}
              driverEarnings={0}
              bills={0}
            />

            {/* Activity Panel */}
            <ActivityPanel entityType="load" entityId={loadId} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-wide mb-1" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function MiniRow({ label, icon, value, highlight }: { label: string; icon?: React.ReactNode; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="flex items-center gap-1.5" style={{ color: "var(--on-surface-variant)" }}>
        {icon}
        {label}
      </span>
      <span
        className="font-medium"
        style={{ color: highlight ? "var(--primary)" : "var(--on-surface)" }}
      >
        {value}
      </span>
    </div>
  );
}
