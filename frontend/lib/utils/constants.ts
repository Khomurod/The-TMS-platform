/**
 * Constants — Status colors, role labels, and enum mappings.
 *
 * All status values map 1:1 to the Python enums defined in:
 *   backend/app/models/base.py (LoadStatus, DriverStatus, TripStatus, SettlementBatchStatus)
 *   backend/app/models/fleet.py (EquipmentStatus)
 */

// ── Load Status ─────────────────────────────────────────────
// Maps to LoadStatus enum: offer|booked|assigned|dispatched|in_transit|delivered|invoiced|paid|cancelled

export const LOAD_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  offer: {
    label: "Offer",
    color: "var(--status-offer)",
    bgColor: "var(--status-offer-bg)",
    icon: "📋",
  },
  booked: {
    label: "Booked",
    color: "var(--status-booked)",
    bgColor: "var(--status-booked-bg)",
    icon: "📘",
  },
  assigned: {
    label: "Assigned",
    color: "var(--status-assigned)",
    bgColor: "var(--status-assigned-bg)",
    icon: "👤",
  },
  dispatched: {
    label: "Dispatched",
    color: "var(--status-dispatched)",
    bgColor: "var(--status-dispatched-bg)",
    icon: "🚀",
  },
  in_transit: {
    label: "In Transit",
    color: "var(--status-in-transit)",
    bgColor: "var(--status-in-transit-bg)",
    icon: "🚛",
  },
  delivered: {
    label: "Delivered",
    color: "var(--status-delivered)",
    bgColor: "var(--status-delivered-bg)",
    icon: "✅",
  },
  invoiced: {
    label: "Invoiced",
    color: "var(--status-invoiced)",
    bgColor: "var(--status-invoiced-bg)",
    icon: "📄",
  },
  paid: {
    label: "Paid",
    color: "var(--status-paid)",
    bgColor: "var(--status-paid-bg)",
    icon: "💰",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--status-cancelled)",
    bgColor: "var(--status-cancelled-bg)",
    icon: "❌",
  },
};

// Ordered pipeline for StatusStepper component
export const LOAD_STATUS_PIPELINE = [
  "offer",
  "booked",
  "assigned",
  "dispatched",
  "in_transit",
  "delivered",
  "invoiced",
  "paid",
] as const;

// Valid transitions — mirrors LOAD_TRANSITIONS dict in backend/app/loads/service.py
export const LOAD_TRANSITIONS: Record<string, string[]> = {
  offer: ["booked", "cancelled"],
  booked: ["assigned", "cancelled"],
  assigned: ["dispatched", "cancelled"],
  dispatched: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
  delivered: ["invoiced"],
  invoiced: ["paid"],
};

// ── Driver Status ───────────────────────────────────────────
// Maps to DriverStatus enum: available|on_trip|off_duty|inactive

export const DRIVER_STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  available: { label: "Available", colorClass: "text-success" },
  on_trip: { label: "On Trip", colorClass: "text-warning" },
  off_duty: { label: "Off Duty", colorClass: "text-muted-foreground" },
  inactive: { label: "Inactive", colorClass: "text-destructive" },
};

// ── Equipment Status ────────────────────────────────────────
// Maps to EquipmentStatus enum: available|in_use|maintenance

export const EQUIPMENT_STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  available: { label: "Available", colorClass: "text-success" },
  in_use: { label: "In Use", colorClass: "text-warning" },
  maintenance: { label: "In Shop", colorClass: "text-destructive" },
};

// ── Settlement Status ───────────────────────────────────────
// Maps to SettlementBatchStatus: unposted|posted|paid

export const SETTLEMENT_STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  unposted: { label: "Draft", colorClass: "text-muted-foreground" },
  posted: { label: "Posted", colorClass: "text-info" },
  paid: { label: "Paid", colorClass: "text-success" },
};

// ── Role Labels ─────────────────────────────────────────────
// Maps to UserRole enum: super_admin|company_admin|dispatcher|accountant

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Admin",
  dispatcher: "Dispatcher",
  accountant: "Accountant",
};

// ── Pay Rate Type Labels ────────────────────────────────────
// Maps to PayRateType enum in backend/app/models/driver.py

export const PAY_RATE_LABELS: Record<string, { label: string; suffix: string }> = {
  cpm: { label: "Cents Per Mile", suffix: "/mi" },
  percentage: { label: "Percentage", suffix: "%" },
  fixed_per_load: { label: "Fixed Per Load", suffix: "/ld" },
  hourly: { label: "Hourly", suffix: "/hr" },
  salary: { label: "Salary", suffix: "/yr" },
};

// ── Accessorial Types ───────────────────────────────────────
export const ACCESSORIAL_TYPES = [
  { value: "fuel_surcharge", label: "Fuel Surcharge" },
  { value: "detention", label: "Detention" },
  { value: "layover", label: "Layover" },
  { value: "lumper", label: "Lumper" },
  { value: "stop_off", label: "Stop Off" },
  { value: "tarp", label: "Tarp" },
  { value: "other", label: "Other" },
] as const;
