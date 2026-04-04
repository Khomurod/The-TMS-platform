"use client";

import React from "react";
import Link from "next/link";
import { Package, Users, Truck, Calculator, ArrowRight, Plus } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   EmptyState — Custom empty table illustrations
   Blueprint: Phase 4.1 emptyState prop + Phase 6.3 Differentiator
   ═══════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  learnMoreHref?: string;
}

// Pre-built module empty states
export const MODULE_EMPTY_STATES = {
  loads: {
    icon: <Package className="h-10 w-10" />,
    title: "No loads yet",
    description: "Create your first load to start tracking shipments and managing dispatches.",
    ctaLabel: "Create Load",
    ctaHref: "/loads/new",
  },
  drivers: {
    icon: <Users className="h-10 w-10" />,
    title: "No drivers on file",
    description: "Add your first driver to start dispatching and tracking compliance.",
    ctaLabel: "Add Driver",
    ctaHref: "/drivers/new",
  },
  fleet: {
    icon: <Truck className="h-10 w-10" />,
    title: "No trucks registered",
    description: "Register your fleet to begin assignments and maintenance tracking.",
    ctaLabel: "Add Truck",
    ctaHref: "/fleet/new",
  },
  settlements: {
    icon: <Calculator className="h-10 w-10" />,
    title: "No settlements yet",
    description: "Settlements are created automatically when loads are delivered.",
    ctaLabel: "View Delivered Loads",
    ctaHref: "/loads",
  },
} as const;

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  learnMoreHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] flex-1 px-6 text-center">
      {/* Illustration Circle */}
      {icon && (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{
            backgroundColor: "var(--primary-fixed)",
            color: "var(--primary)",
          }}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        className="headline-sm mb-2"
        style={{ color: "var(--on-surface)" }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="body-md max-w-md mb-6"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {description}
      </p>

      {/* CTA */}
      <div className="flex items-center gap-3">
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            {/^(Create|Add|New)/.test(ctaLabel) && <Plus className="h-4 w-4" />}
            {ctaLabel}
          </Link>
        )}

        {ctaLabel && ctaOnClick && !ctaHref && (
          <button
            onClick={ctaOnClick}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            {/^(Create|Add|New)/.test(ctaLabel) && <Plus className="h-4 w-4" />}
            {ctaLabel}
          </button>
        )}

        {learnMoreHref && (
          <Link
            href={learnMoreHref}
            className="text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: "var(--primary)" }}
          >
            Learn more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
