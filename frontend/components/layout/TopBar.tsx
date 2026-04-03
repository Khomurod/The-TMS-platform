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
   TopBar — Enterprise Operations Header
   54px height, white bg, breadcrumbs + compact action controls.
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
    <header
      className="flex items-center justify-between sticky top-0 z-10 shrink-0"
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "var(--surface-lowest)",
        borderBottom: "1px solid var(--outline-variant)",
        padding: "0 20px",
      }}
    >
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center">
            {i > 0 && (
              <span
                className="mx-2 text-[11px]"
                style={{ color: "var(--outline)" }}
              >
                /
              </span>
            )}
            <span
              style={{
                fontSize: "13px",
                fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                color: i === breadcrumbs.length - 1 ? "var(--on-surface)" : "var(--on-surface-variant)",
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className="btn-enterprise"
          style={{ gap: "6px" }}
        >
          <Search className="w-3.5 h-3.5" style={{ color: "var(--on-surface-variant)" }} />
          <span style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>
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
            ⌘K
          </kbd>
        </button>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "20px",
            backgroundColor: "var(--outline-variant)",
          }}
        />

        {/* Version Selector */}
        <button
          className="btn-enterprise"
          style={{ border: "none", backgroundColor: "transparent" }}
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--primary-fixed)",
            }}
          >
            <Globe className="w-[11px] h-[11px]" style={{ color: "var(--primary)" }} />
          </span>
          <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>
            Safehaul 2.0
          </span>
          <ChevronDown className="w-3 h-3" style={{ color: "var(--on-surface-variant)" }} />
        </button>

        {/* Create New */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="btn-enterprise"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: "var(--on-surface-variant)" }} />
            Create new
            <ChevronDown className="w-3 h-3" style={{ color: "var(--on-surface-variant)" }} />
          </button>

          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-md py-1 min-w-[180px]"
                style={{
                  backgroundColor: "var(--surface-lowest)",
                  border: "1px solid var(--outline-variant)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {createOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-2 no-underline rounded-[4px] mx-1 transition-colors"
                    style={{
                      padding: "7px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--on-surface)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
        <button
          className="flex items-center gap-1.5 border-none cursor-pointer"
          style={{
            background: "transparent",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--success)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--success)",
              display: "inline-block",
            }}
          />
          Live Support
        </button>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "20px",
            backgroundColor: "var(--outline-variant)",
          }}
        />

        {/* Icon Actions */}
        <div className="flex items-center gap-0.5">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="focus-ring"
            style={{
              padding: "5px",
              borderRadius: "var(--radius-md)",
              color: "var(--on-surface-variant)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
            className="focus-ring"
            style={{
              padding: "5px",
              borderRadius: "var(--radius-md)",
              color: "var(--on-surface-variant)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Messages */}
          <button
            className="focus-ring"
            style={{
              padding: "5px",
              borderRadius: "var(--radius-md)",
              color: "var(--on-surface-variant)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label="Messages"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            className="focus-ring relative"
            style={{
              padding: "5px",
              borderRadius: "var(--radius-md)",
              color: "var(--on-surface-variant)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-low)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User Avatar */}
          <button
            className="flex items-center justify-center cursor-pointer ml-1 focus-ring"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--surface-container)",
              border: "1px solid var(--outline-variant)",
              color: "var(--on-surface-variant)",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--outline)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--outline-variant)"; }}
            aria-label="User menu"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
