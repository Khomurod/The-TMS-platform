/**
 * Shared constants — status labels, colors, and enums.
 */

// ── Load Statuses ───────────────────────────────────────────────
export const LOAD_STATUSES = {
  planned: { label: "Planned", color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
  dispatched: { label: "Dispatched", color: "var(--info)", bg: "var(--info-container)" },
  at_pickup: { label: "At Pickup", color: "var(--info)", bg: "var(--info-container)" },
  in_transit: { label: "In Transit", color: "var(--primary)", bg: "var(--primary-fixed)" },
  delivered: { label: "Delivered", color: "var(--success)", bg: "var(--success-container)" },
  delayed: { label: "Delayed", color: "var(--error)", bg: "var(--error-container)" },
  billed: { label: "Billed", color: "var(--warning)", bg: "var(--warning-container)" },
  paid: { label: "Paid", color: "var(--success)", bg: "var(--success-container)" },
  cancelled: { label: "Cancelled", color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
} as const;

// ── Driver Statuses ─────────────────────────────────────────────
export const DRIVER_STATUSES = {
  available: { label: "Available", color: "var(--success)", bg: "var(--success-container)" },
  on_route: { label: "On Route", color: "var(--primary)", bg: "var(--primary-fixed)" },
  off_duty: { label: "Off Duty", color: "var(--on-surface-variant)", bg: "var(--surface-container-high)" },
  on_leave: { label: "On Leave", color: "var(--warning)", bg: "var(--warning-container)" },
  terminated: { label: "Terminated", color: "var(--error)", bg: "var(--error-container)" },
} as const;

// ── Equipment Statuses ──────────────────────────────────────────
export const EQUIPMENT_STATUSES = {
  available: { label: "Available", color: "var(--success)", bg: "var(--success-container)" },
  in_use: { label: "In Use", color: "var(--primary)", bg: "var(--primary-fixed)" },
  maintenance: { label: "In Shop", color: "var(--warning)", bg: "var(--warning-container)" },
} as const;

// ── User Roles ──────────────────────────────────────────────────
export const USER_ROLES = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  dispatcher: "Dispatcher",
  accountant: "Accountant",
} as const;

// ── Navigation Items ────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Loads", href: "/loads", icon: "Truck" },
  { label: "Fleet", href: "/fleet", icon: "Container" },
  { label: "Drivers", href: "/drivers", icon: "Users" },
  { label: "Accounting", href: "/accounting", icon: "Receipt" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;
