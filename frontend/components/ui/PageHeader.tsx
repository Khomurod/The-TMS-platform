"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, MoreVertical } from "lucide-react";
import StatusBadge, { statusToIntent } from "./StatusBadge";

/* ═══════════════════════════════════════════════════════════════
   PageHeader — Breadcrumbs, status, actions, edit toggle
   Blueprint: Phase 5.1 — Sticky header for detail pages
   ═══════════════════════════════════════════════════════════════ */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  statusBadge?: { intent: string; label: string };
  primaryAction?: { label: string; onClick: () => void; loading?: boolean };
  secondaryActions?: ActionItem[];
  editAction?: { label: string; icon?: React.ReactNode; onClick: () => void };
  kebabActions?: ActionItem[];
}

export default function PageHeader({
  breadcrumbs,
  statusBadge,
  primaryAction,
  secondaryActions,
  editAction,
  kebabActions,
}: PageHeaderProps) {
  const [showKebab, setShowKebab] = useState(false);

  return (
    <div
      className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between gap-4"
      style={{
        backgroundColor: "var(--surface-lowest)",
        borderBottom: "1px solid var(--outline-variant)",
        boxShadow: "0 1px 3px var(--shadow-ambient)",
      }}
    >
      {/* Left: Breadcrumbs + Status */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "var(--outline)" }} />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="font-medium hover:underline underline-offset-2 transition-colors"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Status Badge */}
        {statusBadge && (
          <StatusBadge intent={statusToIntent(statusBadge.intent)}>
            {statusBadge.label}
          </StatusBadge>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Secondary Actions */}
        {secondaryActions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--outline-variant)",
              color: "var(--on-surface)",
              backgroundColor: "var(--surface-lowest)",
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}

        {/* Edit / Save Toggle */}
        {editAction && (
          <button
            onClick={editAction.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--outline-variant)",
              color: "var(--primary)",
              backgroundColor: "var(--primary-fixed)",
            }}
          >
            {editAction.icon}
            {editAction.label}
          </button>
        )}

        {/* Primary CTA */}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.loading}
            className="gradient-primary px-4 py-1.5 rounded-lg text-xs font-semibold shadow-ambient disabled:opacity-60 flex items-center gap-1.5"
          >
            {primaryAction.loading && (
              <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {primaryAction.label}
          </button>
        )}

        {/* Kebab Menu */}
        {kebabActions && kebabActions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowKebab(!showKebab)}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                border: "1px solid var(--outline-variant)",
                color: "var(--on-surface-variant)",
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showKebab && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowKebab(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[180px]"
                  style={{
                    backgroundColor: "var(--surface-lowest)",
                    border: "1px solid var(--outline-variant)",
                  }}
                >
                  {kebabActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => { action.onClick(); setShowKebab(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left"
                      style={{
                        color: action.destructive ? "var(--error)" : "var(--on-surface)",
                      }}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
