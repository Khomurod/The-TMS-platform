"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   NewBadge — Bright pill for newly launched features
   Blueprint: Phase 3.3 / Phase 6 Differentiator
   Auto-expires after launch date + configurable days (default 30)
   ═══════════════════════════════════════════════════════════════ */

interface NewBadgeProps {
  label?: string;
  launchDate?: string;    // ISO date when feature launched
  expireDays?: number;    // Days after launch to auto-hide (default: 30)
  variant?: "blue" | "green" | "orange";
}

const VARIANT_COLORS = {
  blue: { bg: "#1E88E5", text: "#fff" },
  green: { bg: "#10b981", text: "#fff" },
  orange: { bg: "#f59e0b", text: "#fff" },
};

export default function NewBadge({
  label = "NEW",
  launchDate,
  expireDays = 30,
  variant = "blue",
}: NewBadgeProps) {
  // Auto-expire check
  if (launchDate) {
    const launch = new Date(launchDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > expireDays) return null;
  }

  const colors = VARIANT_COLORS[variant];

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full shrink-0 ml-auto"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}
