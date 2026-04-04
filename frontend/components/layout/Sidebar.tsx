"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Building2, LayoutDashboard, Truck, Map, Users, Settings, Wallet,
  ChevronDown, ChevronRight, LogOut,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Sidebar — Enterprise Operations UI
   Clean, trust-building navigation. Only shows implemented routes.
   ═══════════════════════════════════════════════════════════════ */

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

/**
 * Only implemented, working routes.
 * Unimplemented routes have been removed to avoid trust-breaking UX.
 */
const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Load Management", icon: Map,
    children: [
      { name: "All Loads", href: "/loads" },
    ]
  },
  {
    name: "Accounting", icon: Wallet,
    children: [
      { name: "Settlements", href: "/accounting" },
    ]
  },
  {
    name: "Fleet", icon: Truck,
    children: [
      { name: "Trucks", href: "/fleet" },
    ]
  },
  {
    name: "HR", icon: Users,
    children: [
      { name: "Drivers", href: "/drivers" },
    ]
  },
  { name: "Settings", href: "/settings", icon: Settings },
];



export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Single-expand accordion
  const [openSection, setOpenSection] = useState<string | null>(() => {
    for (const item of navItems) {
      if (item.children?.some(c => pathname === c.href.split("?")[0] || pathname.startsWith(c.href.split("?")[0] + "/"))) {
        return item.name;
      }
    }
    return null;
  });

  const toggleExpand = (name: string) => {
    setOpenSection(prev => prev === name ? null : name);
  };

  const isActivePath = (href: string) => {
    const baseHref = href.split("?")[0];
    return pathname === baseHref || pathname.startsWith(baseHref + "/");
  };

  const isParentActive = (item: NavItem) => item.children?.some(c => isActivePath(c.href)) ?? false;

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <Truck className="w-3.5 h-3.5 text-white" />
        </div>
        <span
          className="text-[14px] font-bold tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          Safehaul TMS
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-1.5 px-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const parentActive = hasChildren && isParentActive(item);
          const itemActive = item.href ? isActivePath(item.href) : false;
          const isOpen = openSection === item.name;

          return (
            <div key={item.name}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={`sidebar-nav-item ${parentActive ? "sidebar-nav-item--active" : ""}`}
                  aria-expanded={isOpen}
                >
                  <Icon className="w-[16px] h-[16px] shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen
                    ? <ChevronDown className="w-3 h-3 opacity-50" />
                    : <ChevronRight className="w-3 h-3 opacity-50" />
                  }
                </button>
              ) : (
                <Link
                  href={item.href!}
                  className={`sidebar-nav-item ${itemActive ? "sidebar-nav-item--active" : ""}`}
                  aria-current={itemActive ? "page" : undefined}
                >
                  <Icon className="w-[16px] h-[16px] shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              )}

              {/* Children */}
              {hasChildren && isOpen && (
                <div
                  className="mb-0.5"
                  style={{
                    marginLeft: "20px",
                    paddingLeft: "12px",
                    borderLeft: "1px solid var(--outline-variant)",
                  }}
                >
                  {item.children!.map(child => {
                    const childActive = isActivePath(child.href);
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`sidebar-nav-child ${childActive ? "sidebar-nav-child--active" : ""}`}
                        aria-current={childActive ? "page" : undefined}
                      >
                        <span className="flex-1">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </nav>

      {/* ── Footer — Company + User Identity ── */}
      <div className="sidebar-footer">
        <div
          className="sidebar-nav-item"
          style={{
            marginBottom: "8px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "var(--surface-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            borderLeft: "1px solid var(--outline-variant)",
          }}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {user?.company_name || "Company"}
          </span>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--on-surface-variant)" }} />
        </div>
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold leading-tight" style={{ color: "var(--on-surface)" }}>
              {user ? `${user.first_name} ${user.last_name}` : "User"}
            </div>
            <div className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {user?.email || ""}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="topbar-icon-btn focus-ring"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
