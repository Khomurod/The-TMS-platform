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
   Blueprint: Phase 3.5 / Phase 6 Differentiator
   Full-screen overlay with category filtering and keyboard nav
   ═══════════════════════════════════════════════════════════════ */

interface SearchResult {
  id: string;
  type: "load" | "driver" | "truck" | "invoice";
  title: string;
  subtitle?: string;
  href: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  load: <Package className="h-4 w-4" />,
  driver: <Users className="h-4 w-4" />,
  truck: <Truck className="h-4 w-4" />,
  invoice: <FileText className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  load: "var(--status-dispatched)",
  driver: "var(--status-assigned)",
  truck: "var(--status-booked)",
  invoice: "var(--status-invoiced)",
};

const CATEGORY_LABELS: Record<string, string> = {
  load: "Load",
  driver: "Driver",
  truck: "Truck",
  invoice: "Invoice",
};

const QUICK_ACTIONS = [
  { label: "Create new load", href: "/loads/new", icon: <Package className="h-4 w-4" /> },
  { label: "View all loads", href: "/loads", icon: <Package className="h-4 w-4" /> },
  { label: "View all drivers", href: "/drivers", icon: <Users className="h-4 w-4" /> },
  { label: "View fleet", href: "/fleet", icon: <Truck className="h-4 w-4" /> },
  { label: "Accounting", href: "/accounting", icon: <FileText className="h-4 w-4" /> },
];

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
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setCategoryFilter(null);
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Command Palette */}
      <div
        className="fixed z-50 w-full max-w-[640px] rounded-2xl overflow-hidden animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu — search and navigate"
        style={{
          top: "clamp(120px, 22vh, 240px)",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "var(--surface-lowest)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 32px 80px -16px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-5"
          style={{ borderBottom: "1px solid var(--outline-variant)", backgroundColor: "rgba(37, 99, 235, 0.02)" }}
        >
          <Search className="h-6 w-6 shrink-0" style={{ color: "var(--primary)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search loads, drivers, trucks..."
            className="flex-1 py-4 text-[15px] bg-transparent outline-none"
            style={{ color: "var(--on-surface)", fontWeight: 500 }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ backgroundColor: "var(--surface-container-high)", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips */}
        <div
          className="flex items-center gap-2 px-5 py-2.5"
          style={{ borderBottom: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-low)" }}
        >
          {["load", "driver", "truck", "invoice"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className="px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
              style={{
                backgroundColor: categoryFilter === cat ? CATEGORY_COLORS[cat] : "var(--surface-container-high)",
                color: categoryFilter === cat ? "#fff" : "var(--on-surface-variant)",
                border: categoryFilter === cat ? `1px solid ${CATEGORY_COLORS[cat]}` : "1px solid var(--outline-variant)",
              }}
            >
              {cat}
            </button>
          ))}
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter(null)}
              className="ml-auto text-[11px] font-medium transition-colors flex items-center gap-0.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {showQuickActions ? (
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
                  Quick Actions
                </span>
              </div>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => navigateTo(action.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                  style={{
                    backgroundColor: selectedIndex === i ? "var(--surface-container-high)" : "transparent",
                    color: "var(--on-surface)",
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--primary-fixed)", color: "var(--primary)" }}
                  >
                    {action.icon}
                  </span>
                  <span className="text-sm font-medium flex-1">{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--outline)" }} />
                </button>
              ))}
            </div>
          ) : loading ? (
            <div className="py-12 text-center">
              <div className="h-5 w-5 border-2 border-[var(--outline-variant)] border-t-[var(--primary)] rounded-full animate-spin mx-auto" />
              <p className="text-xs mt-3" style={{ color: "var(--on-surface-variant)" }}>Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => navigateTo(result.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: selectedIndex === i ? "var(--surface-container-high)" : "transparent",
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[result.type] + "20", color: CATEGORY_COLORS[result.type] }}
                  >
                    {CATEGORY_ICONS[result.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-[11px] truncate" style={{ color: "var(--on-surface-variant)" }}>
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                  >
                    {CATEGORY_LABELS[result.type]}
                  </span>
                </button>
              ))}
            </div>
          ) : searchError ? (
            <div className="py-12 text-center">
              <Search className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--error)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>Search unavailable</p>
              <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
                Try using the quick actions below
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.slice(0, 3).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigateTo(action.href)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: "var(--surface-container-high)", color: "var(--on-surface)" }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>No results for “{query}”</p>
              <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
                Try a different search term or browse by category
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 text-[11px]"
          style={{
            borderTop: "1px solid var(--outline-variant)",
            background: "linear-gradient(180deg, var(--surface-low), var(--surface-container))",
            color: "var(--on-surface-variant)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold" style={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold" style={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }}>
                <CornerDownLeft className="h-2.5 w-2.5 inline" />
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold" style={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }}>esc</kbd>
              close
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <Command className="h-3 w-3" />
            <kbd className="px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold" style={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }}>Ctrl+K</kbd>
          </span>
        </div>
      </div>
    </>
  );
}
