"use client";

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   StatusBadge — Dual-Domain Status System
   Replaces StatusPill with domain-aware color mapping.
   Uses CSS custom properties from globals.css.
   ═══════════════════════════════════════════════════════════════ */

type BadgeVariant = "solid" | "outline";
type BadgeDomain = "logistics" | "financial" | "compliance";

type LogisticsIntent = "offer" | "booked" | "assigned" | "dispatched" | "inTransit" | "delivered" | "cancelled";
type FinancialIntent = "unposted" | "posted" | "partialPosted" | "invoiced" | "paid";
type ComplianceIntent = "good" | "upcoming" | "critical" | "expired";

type BadgeIntent = LogisticsIntent | FinancialIntent | ComplianceIntent;

interface StatusBadgeProps {
  intent: BadgeIntent;
  variant?: BadgeVariant;
  domain?: BadgeDomain;
  size?: "sm" | "md";
  children: React.ReactNode;
}

const INTENT_TO_CSS_VAR: Record<string, string> = {
  // Logistics
  offer: "--status-offer",
  booked: "--status-booked",
  assigned: "--status-assigned",
  dispatched: "--status-dispatched",
  inTransit: "--status-in-transit",
  delivered: "--status-delivered",
  cancelled: "--outline",
  // Financial
  unposted: "--status-unposted",
  posted: "--status-posted",
  partialPosted: "--status-partial-posted",
  invoiced: "--status-invoiced",
  paid: "--status-paid",
  // Compliance
  good: "--compliance-good",
  upcoming: "--compliance-upcoming",
  critical: "--compliance-critical",
  expired: "--compliance-expired",
};

// For compliance icons
const COMPLIANCE_ICONS: Record<string, React.ReactNode> = {
  good: <CheckCircle2 className="h-3 w-3" />,
  upcoming: <AlertTriangle className="h-3 w-3" />,
  critical: <AlertTriangle className="h-3 w-3" />,
  expired: <AlertTriangle className="h-3 w-3" />,
};

export default function StatusBadge({
  intent,
  variant = "solid",
  size = "sm",
  children,
}: StatusBadgeProps) {
  const cssVar = INTENT_TO_CSS_VAR[intent] || "--outline";
  const baseColor = `var(${cssVar})`;

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs";

  const icon = COMPLIANCE_ICONS[intent];

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-bold tracking-wide uppercase ${sizeClasses}`}
        style={{
          color: baseColor,
          border: `1.5px solid ${baseColor}`,
          backgroundColor: "transparent",
        }}
      >
        {icon}
        {children}
      </span>
    );
  }

  // Solid variant
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold tracking-wide uppercase ${sizeClasses}`}
      style={{
        backgroundColor: baseColor,
        color: "#ffffff",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Convenience: Map raw backend status string → BadgeIntent
   ═══════════════════════════════════════════════════════════════ */

export function statusToIntent(status: string): BadgeIntent {
  const map: Record<string, BadgeIntent> = {
    offer: "offer",
    booked: "booked",
    assigned: "assigned",
    dispatched: "dispatched",
    in_transit: "inTransit",
    delivered: "delivered",
    invoiced: "invoiced",
    paid: "paid",
    cancelled: "cancelled",
    unposted: "unposted",
    posted: "posted",
    partial_posted: "partialPosted",
    good: "good",
    upcoming: "upcoming",
    critical: "critical",
    expired: "expired",
  };
  return map[status] || "offer";
}
