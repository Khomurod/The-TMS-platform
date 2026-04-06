"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Search, X, Package, Users, Truck, FileText,
  ArrowRight, Command, CornerDownLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CommandMenu — Ctrl+K Global Search Palette
   Redesigned: floating elevated palette with segmented pill bar,
   consistent hover states, and strong typographic hierarchy.
   ═══════════════════════════════════════════════════════════════ */

interface SearchResult {
  id: string;
  type: "load" | "driver" | "truck" | "invoice";
  title: string;
  subtitle?: string;
  href: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  load:    <Package  className="h-3.5 w-3.5" />,
  driver:  <Users    className="h-3.5 w-3.5" />,
  truck:   <Truck    className="h-3.5 w-3.5" />,
  invoice: <FileText className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  load:    "var(--status-dispatched)",
  driver:  "var(--status-assigned)",
  truck:   "var(--status-booked)",
  invoice: "var(--status-invoiced)",
};

const CATEGORY_LABELS: Record<string, string> = {
  load:    "Load",
  driver:  "Driver",
  truck:   "Truck",
  invoice: "Invoice",
};

const QUICK_ACTIONS = [
  { label: "Create new load",  href: "/loads/new",   icon: <Package  className="h-4 w-4" /> },
  { label: "View all loads",   href: "/loads",        icon: <Package  className="h-4 w-4" /> },
  { label: "View all drivers", href: "/drivers",      icon: <Users    className="h-4 w-4" /> },
  { label: "View fleet",       href: "/fleet",        icon: <Truck    className="h-4 w-4" /> },
  { label: "Accounting",       href: "/accounting",   icon: <FileText className="h-4 w-4" /> },
];

const CATEGORIES = ["load", "driver", "truck", "invoice"] as const;

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchError, setSearchError] = useState(false);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setCategoryFilter(null);
      setSearchError(false);
    }
  }, [isOpen]);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (categoryFilter) params.set("type", categoryFilter);
        const res = await api.get(`/search?${params}`);
        setResults(res.data.items || []);
        setSearchError(false);
      } catch {
        setResults([]);
        setSearchError(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryFilter]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query.trim() ? results : QUICK_ACTIONS;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && results[selectedIndex]) {
        navigateTo(results[selectedIndex].href);
      } else if (!query.trim() && QUICK_ACTIONS[selectedIndex]) {
        navigateTo(QUICK_ACTIONS[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [query, results, selectedIndex, onClose]);

  const navigateTo = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  const showQuickActions = !query.trim();

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={onClose}
      />

      {/* ── Command Palette ── */}
      <div
        className="fixed z-50 w-full max-w-[620px] rounded-2xl overflow-hidden animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu — search and navigate"
        style={{
          top: "clamp(100px, 18vh, 200px)",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "var(--surface-lowest)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 32px 80px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* ── Search Input Row ── */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            borderBottom: "1px solid var(--outline-variant)",
            background: "color-mix(in srgb, var(--primary) 3%, var(--surface-lowest))",
          }}
        >
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--primary)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search loads, drivers, trucks, invoices…"
            className="flex-1 py-4 bg-transparent outline-none text-[15px] font-medium"
            style={{
              color: "var(--on-surface)",
            }}
            aria-autocomplete="list"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
            style={{
              backgroundColor: "var(--surface-container)",
              color: "var(--on-surface-variant)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* ── Category Filter — Segmented Pill Bar ── */}
        <div
          className="flex items-center gap-1 px-3 py-2"
          style={{
            borderBottom: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-low)",
          }}
        >
          {/* "All" pill */}
          <button
            onClick={() => setCategoryFilter(null)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
            style={{
              backgroundColor: categoryFilter === null
                ? "var(--surface-lowest)"
                : "transparent",
              color: categoryFilter === null
                ? "var(--primary)"
                : "var(--on-surface-variant)",
              boxShadow: categoryFilter === null ? "var(--shadow-sm)" : "none",
            }}
          >
            All
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
              style={{
                backgroundColor: categoryFilter === cat
                  ? "var(--surface-lowest)"
                  : "transparent",
                color: categoryFilter === cat
                  ? CATEGORY_COLORS[cat]
                  : "var(--on-surface-variant)",
                boxShadow: categoryFilter === cat ? "var(--shadow-sm)" : "none",
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{ color: categoryFilter === cat ? CATEGORY_COLORS[cat] : "var(--on-surface-variant)" }}
              >
                {CATEGORY_ICONS[cat]}
              </span>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* ── Results Area ── */}
        <div className="max-h-[380px] overflow-y-auto">
          {showQuickActions ? (
            <div className="py-1">
              <div className="px-4 py-2.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Quick Actions
                </span>
              </div>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => navigateTo(action.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100"
                  style={{
                    backgroundColor: selectedIndex === i
                      ? "var(--surface-low)"
                      : "transparent",
                    color: "var(--on-surface)",
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: selectedIndex === i
                        ? "var(--primary-fixed)"
                        : "var(--surface-container)",
                      color: selectedIndex === i
                        ? "var(--primary)"
                        : "var(--on-surface-variant)",
                    }}
                  >
                    {action.icon}
                  </span>
                  <span className="text-[13px] font-medium flex-1">{action.label}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-opacity"
                    style={{
                      color: "var(--outline)",
                      opacity: selectedIndex === i ? 1 : 0,
                    }}
                  />
                </button>
              ))}
            </div>
          ) : loading ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div
                className="h-5 w-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--outline-variant)",
                  borderTopColor: "var(--primary)",
                }}
              />
              <p className="text-[12px]" style={{ color: "var(--on-surface-variant)" }}>
                Searching…
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              <div className="px-4 py-2.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Results — {results.length}
                </span>
              </div>
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => navigateTo(result.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100"
                  style={{
                    backgroundColor: selectedIndex === i
                      ? "var(--surface-low)"
                      : "transparent",
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[result.type] + "18",
                      color: CATEGORY_COLORS[result.type],
                    }}
                  >
                    {CATEGORY_ICONS[result.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-medium truncate"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div
                        className="text-[11px] truncate mt-0.5"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[result.type] + "15",
                      color: CATEGORY_COLORS[result.type],
                    }}
                  >
                    {CATEGORY_LABELS[result.type]}
                  </span>
                </button>
              ))}
            </div>
          ) : searchError ? (
            <div className="py-14 flex flex-col items-center gap-2 text-center px-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: "var(--error-container)" }}
              >
                <Search className="h-5 w-5" style={{ color: "var(--error)" }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--on-surface)" }}>
                Search unavailable
              </p>
              <p className="text-[12px]" style={{ color: "var(--on-surface-variant)" }}>
                Try using the quick actions below
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.slice(0, 3).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigateTo(action.href)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-container)",
                      color: "var(--on-surface)",
                    }}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-14 flex flex-col items-center gap-2 text-center px-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: "var(--surface-container)" }}
              >
                <Search className="h-5 w-5" style={{ color: "var(--on-surface-variant)" }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--on-surface)" }}>
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-[12px]" style={{ color: "var(--on-surface-variant)" }}>
                Try a different term, or filter by category above
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[11px]"
          style={{
            borderTop: "1px solid var(--outline-variant)",
            background: "var(--surface-low)",
            color: "var(--on-surface-variant)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <CornerDownLeft className="h-2.5 w-2.5 inline" />
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                esc
              </kbd>
              close
            </span>
          </div>
          <span className="flex items-center gap-1.5 opacity-60">
            <Command className="h-3 w-3" />
            <kbd
              className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold"
              style={{
                backgroundColor: "var(--surface-container)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              Ctrl+K
            </kbd>
          </span>
        </div>
      </div>
    </>
  );
}
