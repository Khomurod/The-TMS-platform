"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-2)",
        marginBottom: "var(--spacing-2)",
      }}
    >
      {items.map((item, index) => (
        <span key={index} style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          {index > 0 && (
            <ChevronRight size={14} style={{ color: "var(--on-surface-variant)" }} />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="label-md"
              style={{
                color: "var(--on-surface-variant)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.6875rem",
                fontWeight: 600,
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="label-md"
              style={{
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.6875rem",
                fontWeight: 600,
              }}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
