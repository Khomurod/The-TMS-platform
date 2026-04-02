"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   ComplianceDot — 3-Tier Compliance Urgency Indicator
   Blueprint: Phase 6.1 Differentiator
   
   good     → solid green dot
   upcoming → solid yellow dot
   critical → pulsing red dot
   expired  → solid dark red dot
   ═══════════════════════════════════════════════════════════════ */

type ComplianceUrgency = "good" | "upcoming" | "critical" | "expired";

interface ComplianceDotProps {
  urgency: ComplianceUrgency;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const URGENCY_CONFIG: Record<
  ComplianceUrgency,
  { color: string; label: string; pulse: boolean }
> = {
  good: { color: "var(--compliance-good)", label: "All current", pulse: false },
  upcoming: { color: "var(--compliance-upcoming)", label: "Expiring soon", pulse: false },
  critical: { color: "var(--compliance-critical)", label: "Critical", pulse: true },
  expired: { color: "var(--compliance-expired)", label: "Expired", pulse: false },
};

export default function ComplianceDot({
  urgency,
  size = "sm",
  showLabel = false,
}: ComplianceDotProps) {
  const config = URGENCY_CONFIG[urgency];
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex">
        <span
          className={`${dotSize} rounded-full inline-block`}
          style={{ backgroundColor: config.color }}
        />
        {config.pulse && (
          <span
            className={`${dotSize} rounded-full absolute inline-flex animate-ping`}
            style={{ backgroundColor: config.color, opacity: 0.6 }}
          />
        )}
      </span>
      {showLabel && (
        <span
          className="text-xs font-medium"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </span>
  );
}
