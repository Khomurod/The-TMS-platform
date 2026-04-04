"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getBreadcrumbs } from "@/lib/breadcrumb-config";
import {
  Search, Sun, Moon, Settings, Plus,
  ChevronDown, ChevronRight, Package, Users, Truck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TopBar — Enterprise Operations Header
   Route-metadata-driven breadcrumbs, compact action controls.
   ═══════════════════════════════════════════════════════════════ */

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Platform-aware shortcut label
  const isMac = mounted && typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  // Route-metadata-driven breadcrumbs (replaces hardcoded string matching)
  const breadcrumbs = getBreadcrumbs(pathname);

  const createOptions = [
    { label: "New Load", href: "/loads/new", icon: <Package className="h-3.5 w-3.5" /> },
    { label: "New Driver", href: "/drivers/new", icon: <Users className="h-3.5 w-3.5" /> },
    { label: "New Truck", href: "/fleet/new", icon: <Truck className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="topbar">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center">
            {i > 0 && (
              <ChevronRight
                className="mx-1.5 w-3 h-3"
                style={{ color: "var(--outline)" }}
              />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="body-md"
                style={{
                  color: "var(--on-surface-variant)",
                  textDecoration: "none",
                }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                  color: i === breadcrumbs.length - 1 ? "var(--on-surface)" : "var(--on-surface-variant)",
                }}
              >
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className="btn btn-secondary btn-sm"
        >
          <Search className="w-3.5 h-3.5" style={{ color: "var(--on-surface-variant)" }} />
          <span style={{ color: "var(--on-surface-variant)", fontSize: "12px" }}>
            Search
          </span>
          <kbd
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "1px 4px",
              borderRadius: "3px",
              backgroundColor: "var(--surface-container)",
              color: "var(--on-surface-variant)",
              marginLeft: "4px",
              border: "1px solid var(--outline-variant)",
            }}
          >
            {shortcutLabel}
          </kbd>
        </button>

        <div className="topbar-divider" />

        {/* Create New */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="btn btn-secondary btn-sm"
            aria-expanded={showCreateMenu}
            aria-haspopup="true"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: "var(--on-surface-variant)" }} />
            Create new
            <ChevronDown className="w-3 h-3" style={{ color: "var(--on-surface-variant)" }} />
          </button>

          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 dropdown-menu">
                {createOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setShowCreateMenu(false)}
                    className="dropdown-item"
                  >
                    {opt.icon}
                    {opt.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="topbar-divider" />

        {/* Icon Actions */}
        <div className="flex items-center gap-0.5">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="topbar-icon-btn focus-ring"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push("/settings")}
            className="topbar-icon-btn focus-ring"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
