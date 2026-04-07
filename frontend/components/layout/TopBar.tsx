"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import {
  Search, Sun, Moon, Plus,
  ChevronDown, Package, Users, Truck, Check,
} from "lucide-react";

interface TopBarProps {
  onSearchClick?: () => void;
}

/* Page title from pathname */
function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/loads": "Load Management",
    "/loads/new": "New Load",
    "/drivers": "Drivers",
    "/drivers/new": "New Driver",
    "/fleet": "Fleet",
    "/fleet/new": "New Equipment",
    "/accounting": "Accounting",
    "/settings": "Settings",
  };
  // Check exact match first, then prefix match
  if (map[pathname]) return map[pathname];
  for (const [path, title] of Object.entries(map)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Dashboard";
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const pageTitle = getPageTitle(pathname);
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  const createOptions = [
    { label: "New Load",   href: "/loads/new",   icon: <Package className="h-3.5 w-3.5" /> },
    { label: "New Driver", href: "/drivers/new",  icon: <Users   className="h-3.5 w-3.5" /> },
    { label: "New Truck",  href: "/fleet/new",    icon: <Truck   className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="topbar">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="topbar-page-title">{pageTitle}</h1>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">

        {/* Search pill */}
        <button
          onClick={onSearchClick}
          className="topbar-search-pill"
          aria-label="Search"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="topbar-search-label hidden sm:inline">Search anything...</span>
        </button>

        {/* Theme toggle */}
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

        {/* Create new — green button */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="topbar-create-btn"
            aria-expanded={showCreateMenu}
            aria-haspopup="true"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create new</span>
            <ChevronDown className="w-3 h-3 hidden sm:block" />
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

        {/* User Avatar */}
        <button
          onClick={() => router.push("/settings")}
          className="topbar-avatar"
          title={user ? `${user.first_name} ${user.last_name}` : "Profile"}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
