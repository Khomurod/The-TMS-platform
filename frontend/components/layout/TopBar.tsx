"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Search, Sun, Moon, Settings, Send, Bell, User, Plus,
  ChevronDown, Globe, Package, Users, Truck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TopBar — Modernized (Tailwind + Dark Mode + Wired Buttons)
   Breadcrumbs + Ctrl+K search + "Create new" dropdown
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

  // Prevent hydration mismatch for theme icon
  useEffect(() => setMounted(true), []);

  const getBreadcrumbs = () => {
    if (pathname.includes("/drivers/") && pathname.split("/").length > 2) return ["HR Management", "Drivers", "Driver Profile"];
    if (pathname.includes("/loads/") && pathname.split("/").length > 2) return ["Load Management", "All Loads", "Load Detail"];
    if (pathname.includes("drivers")) return ["HR Management", "Drivers", "Active Drivers"];
    if (pathname.includes("loads")) return ["Load Management", "All Loads"];
    if (pathname.includes("fleet")) return ["Fleet Management", "Trucks"];
    if (pathname.includes("dashboard")) return ["Dashboard", "Overview"];
    if (pathname.includes("accounting")) return ["Accounting", "Salary", "Batches"];
    return ["Home"];
  };

  const breadcrumbs = getBreadcrumbs();

  const createOptions = [
    { label: "New Load", href: "/loads/new", icon: <Package className="h-3.5 w-3.5" /> },
    { label: "New Driver", href: "#", icon: <Users className="h-3.5 w-3.5" /> },
    { label: "New Truck", href: "#", icon: <Truck className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="h-12 bg-[var(--surface-lowest)] border-b border-[var(--outline-variant)] flex items-center justify-between px-5 sticky top-0 z-10 shrink-0 transition-colors">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center">
            {i > 0 && (
              <span className="mx-2 text-[var(--outline-variant)] text-xs">/</span>
            )}
            <span
              className={`text-[13px] ${
                i === breadcrumbs.length - 1
                  ? "text-[var(--on-surface)] font-bold"
                  : "text-[var(--on-surface-variant)] font-medium"
              }`}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Search — clicks open CommandMenu */}
        <button
          onClick={onSearchClick}
          className="flex items-center h-8 px-3 gap-1.5 bg-[var(--surface)] border border-[var(--outline-variant)] rounded-lg cursor-pointer hover:border-[var(--outline)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <Search className="w-3.5 h-3.5 text-[var(--on-surface-variant)]" />
          <span className="text-xs text-[var(--on-surface-variant)] whitespace-nowrap">
            Ctrl + K to search
          </span>
          <kbd className="text-[9px] font-bold px-1 py-[1px] rounded bg-[var(--surface-container)] text-[var(--on-surface-variant)] ml-2">
            ⌘K
          </kbd>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--outline-variant)]" />

        {/* Version */}
        <button className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-xs font-bold text-[var(--on-surface)] hover:opacity-80 transition-opacity">
          <span className="w-[22px] h-[22px] rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-[13px] h-[13px] text-blue-500" />
          </span>
          Safehaul 2.0
          <ChevronDown className="w-3 h-3 text-[var(--on-surface-variant)]" />
        </button>

        {/* Create New — with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-1.5 px-3 py-[5px] rounded-md bg-[var(--surface-lowest)] border border-[var(--outline-variant)] text-xs font-semibold text-[var(--on-surface)] cursor-pointer hover:border-[var(--outline)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--on-surface-variant)]" />
            Create new
            <ChevronDown className="w-3 h-3 text-[var(--on-surface-variant)]" />
          </button>

          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--surface-lowest)] rounded-lg border border-[var(--outline-variant)] shadow-lg min-w-[180px] py-1 animate-in fade-in zoom-in-95 duration-150">
                {createOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[var(--on-surface)] no-underline hover:bg-[var(--surface-container)] rounded-md mx-1 transition-colors focus-visible:outline-none focus-visible:bg-[var(--surface-container)]"
                  >
                    {opt.icon}
                    {opt.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live Support */}
        <button className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[11px] font-bold text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Live Support
        </button>

        {/* Icon Actions */}
        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
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
            className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Messages (placeholder) */}
          <button
            className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
            aria-label="Messages"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Notifications — red dot removed (no notification infrastructure yet) */}
          <button
            className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User Avatar */}
          <button
            className="w-7 h-7 rounded-full bg-[var(--surface-container)] border border-[var(--outline-variant)] flex items-center justify-center cursor-pointer ml-1 text-[var(--on-surface-variant)] hover:border-[var(--outline)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="User menu"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
