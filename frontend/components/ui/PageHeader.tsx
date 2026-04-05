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
    <div className="page-form-header sticky top-0 z-20 px-6 flex items-center justify-between gap-4">
      {/* Left: Breadcrumbs + Status */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 topbar-breadcrumb-sep" />
              )}
              {crumb.href ? (
                <Link href={crumb.href} className="topbar-breadcrumb-link">
                  {crumb.label}
                </Link>
              ) : (
                <span className="topbar-breadcrumb-current">
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
          <button key={i} onClick={action.onClick} className="btn btn-secondary btn-sm">
            {action.icon}
            {action.label}
          </button>
        ))}

        {/* Edit / Save Toggle */}
        {editAction && (
          <button onClick={editAction.onClick} className="btn btn-soft btn-sm">
            {editAction.icon}
            {editAction.label}
          </button>
        )}

        {/* Primary CTA */}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.loading}
            className="btn btn-primary btn-sm disabled:opacity-60 flex items-center gap-1.5"
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
            <button onClick={() => setShowKebab(!showKebab)} className="btn btn-secondary btn-sm">
              <MoreVertical className="h-4 w-4" />
            </button>
            {showKebab && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowKebab(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 dropdown-menu">
                  {kebabActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => { action.onClick(); setShowKebab(false); }}
                      className={`dropdown-item${action.destructive ? " dropdown-item--danger" : ""}`}
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
