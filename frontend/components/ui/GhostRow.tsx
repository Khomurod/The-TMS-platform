"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   GhostRow — Placeholder row for inline creation
   Blueprint: Phase 5.2
   Used in Stops, Commodities, and Deductions tables
   ═══════════════════════════════════════════════════════════════ */

interface GhostColumn {
  placeholder: string;
  icon?: React.ReactNode;
  width?: string;
}

interface GhostRowProps {
  columns: GhostColumn[];
  onActivate: () => void;
  isActive?: boolean;
  activeContent?: React.ReactNode;
}

export default function GhostRow({
  columns,
  onActivate,
  isActive = false,
  activeContent,
}: GhostRowProps) {
  if (isActive && activeContent) {
    return <>{activeContent}</>;
  }

  return (
    <tr
      onClick={onActivate}
      className="cursor-pointer transition-colors group"
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px dashed var(--outline-variant)",
      }}
    >
      {columns.map((col, i) => (
        <td
          key={i}
          className="px-4 py-3 text-xs"
          style={{
            color: "var(--outline)",
            width: col.width,
          }}
        >
          <span className="flex items-center gap-1.5 group-hover:text-[var(--primary)] transition-colors">
            {col.icon}
            {col.placeholder}
          </span>
        </td>
      ))}
    </tr>
  );
}
