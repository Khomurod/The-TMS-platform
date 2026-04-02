"use client";

import React from "react";
import { Check } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   StatusStepper — Horizontal stage progression bar
   Blueprint: Phase 5.1 — Load Detail header
   Shows the 8-stage pipeline with current stage highlighted
   ═══════════════════════════════════════════════════════════════ */

interface StatusStepperProps {
  stages: Array<{ key: string; label: string }>;
  currentStage: string;
}

export default function StatusStepper({ stages, currentStage }: StatusStepperProps) {
  const currentIdx = stages.findIndex((s) => s.key === currentStage);

  return (
    <div
      className="flex items-center gap-0 px-6 py-3 overflow-x-auto"
      style={{
        backgroundColor: "var(--surface-lowest)",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      {stages.map((stage, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <React.Fragment key={stage.key}>
            {/* Step Circle + Label */}
            <div className="flex flex-col items-center shrink-0" style={{ minWidth: 80 }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: isCompleted
                    ? "var(--status-delivered)"
                    : isCurrent
                    ? "var(--primary)"
                    : "var(--surface-container-high)",
                  color: isCompleted || isCurrent ? "#fff" : "var(--on-surface-variant)",
                  boxShadow: isCurrent ? "0 0 0 3px var(--primary-fixed)" : "none",
                }}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold mt-1.5 whitespace-nowrap"
                style={{
                  color: isCurrent
                    ? "var(--primary)"
                    : isCompleted
                    ? "var(--status-delivered)"
                    : "var(--on-surface-variant)",
                }}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector Line */}
            {i < stages.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 rounded-full transition-all"
                style={{
                  backgroundColor: isCompleted
                    ? "var(--status-delivered)"
                    : "var(--outline-variant)",
                  minWidth: 24,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* Pre-built stage definitions for Load lifecycle */
export const LOAD_STAGES = [
  { key: "offer", label: "Offer" },
  { key: "booked", label: "Booked" },
  { key: "assigned", label: "Assigned" },
  { key: "dispatched", label: "Dispatched" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "invoiced", label: "Invoiced" },
  { key: "paid", label: "Paid" },
];
