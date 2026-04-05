"use client";

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "solid" | "outline";
type LogisticsIntent = "offer" | "booked" | "assigned" | "dispatched" | "inTransit" | "delivered" | "cancelled";
type FinancialIntent = "unposted" | "posted" | "partialPosted" | "invoiced" | "paid";
type ComplianceIntent = "good" | "upcoming" | "critical" | "expired";
type BadgeIntent = LogisticsIntent | FinancialIntent | ComplianceIntent;

interface StatusBadgeProps {
  intent: BadgeIntent;
  variant?: BadgeVariant;
  domain?: "logistics" | "financial" | "compliance";
  size?: "sm" | "md";
  children: React.ReactNode;
}

const COMPLIANCE_ICONS: Record<string, React.ReactNode> = {
  good:     <CheckCircle2 className="h-3 w-3" />,
  upcoming: <AlertTriangle className="h-3 w-3" />,
  critical: <AlertTriangle className="h-3 w-3" />,
  expired:  <AlertTriangle className="h-3 w-3" />,
};

export default function StatusBadge({ intent, size = "sm", children }: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "" : "px-3 py-1 text-xs";
  const icon = COMPLIANCE_ICONS[intent];

  return (
    <span className={cn("status-badge", `status-badge--${intent}`, sizeClass)}>
      {icon}
      {children}
    </span>
  );
}

export function statusToIntent(status: string): BadgeIntent {
  const map: Record<string, BadgeIntent> = {
    offer: "offer", booked: "booked", assigned: "assigned",
    dispatched: "dispatched", in_transit: "inTransit",
    delivered: "delivered", invoiced: "invoiced", paid: "paid",
    cancelled: "cancelled", unposted: "unposted", posted: "posted",
    partial_posted: "partialPosted", good: "good",
    upcoming: "upcoming", critical: "critical", expired: "expired",
  };
  return map[status] || "offer";
}
