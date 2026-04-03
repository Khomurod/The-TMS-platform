"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Breadcrumb — Design System Component
   Uses CSS classes instead of inline styles.
   ═══════════════════════════════════════════════════════════════ */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 mb-2"
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight size={14} style={{ color: "var(--on-surface-variant)" }} />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="label-sm"
              style={{
                color: "var(--on-surface-variant)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="label-sm"
              style={{
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
