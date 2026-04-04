"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Copy, Check, Pencil } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   EntityLink — Inline clickable entity reference with copy
   Used inside table cells for Load #, Driver name, Truck # etc.
   Blueprint: Phase 4.3
   ═══════════════════════════════════════════════════════════════ */

interface EntityLinkProps {
  href?: string;
  label: string;
  copyable?: boolean;
  inlineEdit?: boolean;
  secondaryText?: string;
  onClick?: () => void;
}

export default function EntityLink({
  href,
  label,
  copyable = false,
  inlineEdit = false,
  secondaryText,
  onClick,
}: EntityLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(label);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }, [label]);

  const content = (
    <span className="inline-flex items-center gap-1.5 group/entity max-w-full">
      <span
        className="font-medium truncate transition-colors"
        style={{ color: "var(--primary)" }}
      >
        {label}
      </span>

      {copyable && (
        <button
          onClick={handleCopy}
          className="shrink-0 opacity-0 group-hover/entity:opacity-100 transition-opacity p-0.5 rounded"
          style={{ color: copied ? "var(--success)" : "var(--on-surface-variant)" }}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}

      {inlineEdit && (
        <span
          className="shrink-0 opacity-0 group-hover/entity:opacity-100 transition-opacity"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <Pencil className="h-3 w-3" />
        </span>
      )}

      {secondaryText && (
        <span
          className="text-[10px] font-medium truncate"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {secondaryText}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="hover:underline underline-offset-2 inline-flex max-w-full"
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full ${onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={onClick}
    >
      {content}
    </span>
  );
}
