/**
 * Formatters — Currency, dates, miles, and pay rate display utilities.
 */

// ── Currency ────────────────────────────────────────────────
export function formatCurrency(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

// ── Compact Currency (e.g., $3.4K) ─────────────────────────
export function formatCurrencyCompact(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

// ── Miles ───────────────────────────────────────────────────
export function formatMiles(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `${num.toLocaleString("en-US", { maximumFractionDigits: 0 })} mi`;
}

// ── Date ────────────────────────────────────────────────────
export function formatDate(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  let d: Date;
  if (typeof value === "string") {
    // If exact YYYY-MM-DD, parse explicitly to avoid UTC shift
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(value);
    }
  } else {
    d = value;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  let d: Date;
  if (typeof value === "string") {
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(value);
    }
  } else {
    d = value;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Relative Time ───────────────────────────────────────────
export function formatRelativeTime(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateShort(d);
}

// ── Pay Rate Display ────────────────────────────────────────
export function formatPayRate(
  type: string | null | undefined,
  value: number | string | null | undefined
): string {
  if (!type || value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";

  switch (type) {
    case "cpm":
      return `$${num.toFixed(2)}/mi`;
    case "percentage":
      return `${num}%`;
    case "fixed_per_load":
      return `${formatCurrency(num)}/ld`;
    case "hourly":
      return `${formatCurrency(num)}/hr`;
    case "salary":
      return `${formatCurrency(num)}/yr`;
    default:
      return formatCurrency(num);
  }
}

// ── Name ────────────────────────────────────────────────────
export function formatDriverName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  if (!firstName && !lastName) return "—";
  return `${firstName || ""} ${lastName || ""}`.trim();
}

export function formatDriverNameShort(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  if (!firstName && !lastName) return "—";
  const first = firstName?.charAt(0) || "";
  return `${first}. ${lastName || ""}`.trim();
}
