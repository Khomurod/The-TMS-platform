"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   ProfitBox — Load profit summary sidebar card
   Blueprint: Phase 5.3
   Displays revenue, costs, and gross profit with red/green styling
   ═══════════════════════════════════════════════════════════════ */

interface ProfitRow {
  label: string;
  value: number;
  type: "positive" | "negative" | "total";
}

interface ProfitBoxProps {
  totalMileRevenue?: number;
  accessorials?: number;
  driverEarnings?: number;
  bills?: number;
  grossProfit?: number;
  isLoading?: boolean;
}

export default function ProfitBox({
  totalMileRevenue = 0,
  accessorials = 0,
  driverEarnings = 0,
  bills = 0,
  grossProfit,
  isLoading = false,
}: ProfitBoxProps) {
  const computedProfit = grossProfit ?? (totalMileRevenue + accessorials - driverEarnings - bills);

  const rows: ProfitRow[] = [
    { label: "Total mile revenue", value: totalMileRevenue, type: "positive" },
    { label: "Accessorials", value: accessorials, type: "positive" },
    { label: "Driver earnings", value: driverEarnings, type: "negative" },
    { label: "Bills", value: bills, type: "negative" },
  ];

  const fmtCurrency = (v: number) =>
    `$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div
        className="card p-4 space-y-3"
        style={{ backgroundColor: "var(--surface-lowest)" }}
      >
        <div className="h-4 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--surface-container-high)" }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 w-full rounded animate-pulse" style={{ backgroundColor: "var(--surface-container)" }} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="card p-4"
      style={{ backgroundColor: "var(--surface-lowest)" }}
    >
      <h3
        className="title-sm mb-3"
        style={{ color: "var(--on-surface)" }}
      >
        Profit Summary
      </h3>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-xs"
          >
            <span style={{ color: "var(--on-surface-variant)" }}>
              {row.label}
            </span>
            <span
              className="font-medium tabular-nums"
              style={{
                color:
                  row.type === "negative"
                    ? "var(--error)"
                    : "var(--on-surface)",
              }}
            >
              {row.type === "negative" ? `(${fmtCurrency(row.value)})` : fmtCurrency(row.value)}
            </span>
          </div>
        ))}

        {/* Divider + Gross Profit */}
        <hr style={{ borderColor: "var(--outline-variant)" }} />
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--on-surface)" }}
          >
            Gross profit
          </span>
          <span
            className="text-base font-bold tabular-nums"
            style={{
              color: computedProfit >= 0 ? "var(--success)" : "var(--error)",
            }}
          >
            {computedProfit < 0 ? `-${fmtCurrency(computedProfit)}` : fmtCurrency(computedProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}
