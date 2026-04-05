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

  const isMac = mounted && typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  const breadcrumbs = getBreadcrumbs(pathname);

  const createOptions = [
    { label: "New Load",   href: "/loads/new",   icon: <Package className="h-3.5 w-3.5" /> },
    { label: "New Driver", href: "/drivers/new",  icon: <Users   className="h-3.5 w-3.5" /> },
    { label: "New Truck",  href: "/fleet/new",    icon: <Truck   className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="topbar">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center">
            {i > 0 && (
              <ChevronRight className="mx-1.5 w-3 h-3 topbar-breadcrumb-sep" />
            )}
            {crumb.href ? (
              <Link href={crumb.href} className="topbar-breadcrumb-link body-md">
                {crumb.label}
              </Link>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? "topbar-breadcrumb-current" : "topbar-breadcrumb-parent"}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Search pill — prominent, center-of-bar feel */}
        <button
          onClick={onSearchClick}
          className="topbar-search-pill"
          aria-label={`Search (${shortcutLabel})`}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="topbar-search-label hidden sm:inline">Search everything...</span>
          <kbd className="topbar-kbd ml-auto hidden sm:inline-flex">{shortcutLabel}</kbd>
        </button>

        {/* Create new — solid primary button for clear hierarchy */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="btn btn-primary btn-sm"
            aria-expanded={showCreateMenu}
            aria-haspopup="true"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new
            <ChevronDown className="w-3 h-3" />
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

        {/* Icon cluster */}
        <div className="flex items-center gap-0.5">
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
