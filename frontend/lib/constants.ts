/**
 * Shared constants — status labels, colors, and enums.
 * Updated for the 8-stage Load lifecycle and Trip-based architecture.
 */

// ── Load Statuses — 8-Stage Pipeline ─────────────────────────────
export const LOAD_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  offer:      { label: "Offer",       color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
  booked:     { label: "Booked",      color: "var(--info)",              bg: "var(--info-container)" },
  assigned:   { label: "Assigned",    color: "var(--info)",              bg: "var(--info-container)" },
  dispatched: { label: "Dispatched",  color: "var(--primary)",           bg: "var(--primary-fixed)" },
  in_transit: { label: "In Transit",  color: "var(--primary)",           bg: "var(--primary-fixed)" },
  delivered:  { label: "Delivered",   color: "var(--success)",           bg: "var(--success-container)" },
  invoiced:   { label: "Invoiced",    color: "var(--warning)",           bg: "var(--warning-container)" },
  paid:       { label: "Paid",        color: "var(--success)",           bg: "var(--success-container)" },
  cancelled:  { label: "Cancelled",   color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
} as const;

// ── Trip Statuses (subset of Load lifecycle) ────────────────────
export const TRIP_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  assigned:   { label: "Assigned",    color: "var(--info)",    bg: "var(--info-container)" },
  dispatched: { label: "Dispatched",  color: "var(--primary)", bg: "var(--primary-fixed)" },
  in_transit: { label: "In Transit",  color: "var(--primary)", bg: "var(--primary-fixed)" },
  delivered:  { label: "Delivered",   color: "var(--success)", bg: "var(--success-container)" },
  cancelled:  { label: "Cancelled",   color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
} as const;

// ── Driver Statuses ─────────────────────────────────────────────
export const DRIVER_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  available:  { label: "Available",   color: "var(--success)",           bg: "var(--success-container)" },
  on_trip:    { label: "On Trip",     color: "var(--primary)",           bg: "var(--primary-fixed)" },
  inactive:   { label: "Inactive",    color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
  on_leave:   { label: "On Leave",    color: "var(--warning)",           bg: "var(--warning-container)" },
  terminated: { label: "Terminated",  color: "var(--error)",             bg: "var(--error-container)" },
} as const;

// ── Equipment Statuses ──────────────────────────────────────────
export const EQUIPMENT_STATUSES = {
  available:   { label: "Available",   color: "var(--success)", bg: "var(--success-container)" },
  in_use:      { label: "In Use",      color: "var(--primary)", bg: "var(--primary-fixed)" },
  maintenance: { label: "In Shop",     color: "var(--warning)", bg: "var(--warning-container)" },
} as const;

// ── Settlement Statuses ─────────────────────────────────────────
export const SETTLEMENT_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  unposted: { label: "Unposted", color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
  posted:   { label: "Posted",   color: "var(--info)",               bg: "var(--info-container)" },
  paid:     { label: "Paid",     color: "var(--success)",            bg: "var(--success-container)" },
} as const;

// ── User Roles ──────────────────────────────────────────────────
export const USER_ROLES = {
  super_admin:   "Super Admin",
  company_admin: "Company Admin",
  dispatcher:    "Dispatcher",
  accountant:    "Accountant",
} as const;

// ── Navigation Items ────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Loads",     href: "/loads",     icon: "Truck" },
  { label: "Fleet",     href: "/fleet",     icon: "Container" },
  { label: "Drivers",   href: "/drivers",   icon: "Users" },
  { label: "Accounting", href: "/accounting", icon: "Receipt" },
  { label: "Settings",  href: "/settings",  icon: "Settings" },
] as const;
