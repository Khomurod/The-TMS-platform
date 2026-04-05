"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Truck, LayoutDashboard, Map, Users, Settings, Wallet,
  ChevronDown, ChevronRight, LogOut, PanelLeft, Building2,
} from "lucide-react";

const STORAGE_KEY = "tms-sidebar-collapsed";

interface NavChild { name: string; href: string; }
interface NavGroup { label: string; items: NavItem[]; }
interface NavItem {
  name: string; href?: string;
  icon: React.ElementType; children?: NavChild[];
}

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { name: "Load Management", icon: Map, children: [{ name: "All Loads", href: "/loads" }] },
    ],
  },
  {
    label: "Accounting",
    items: [
      { name: "Accounting", icon: Wallet, children: [{ name: "Settlements", href: "/accounting" }] },
    ],
  },
  {
    label: "Fleet",
    items: [
      { name: "Fleet", icon: Truck, children: [{ name: "Trucks", href: "/fleet" }] },
    ],
  },
  {
    label: "People",
    items: [
      { name: "HR", icon: Users, children: [{ name: "Drivers", href: "/drivers" }] },
    ],
  },
];

const settingsItem: NavItem = { name: "Settings", href: "/settings", icon: Settings };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch { /* noop */ }
  }, []);

  // Auto-open the section containing the active route
  const findActiveGroup = () => {
    for (const g of navGroups) {
      for (const item of g.items) {
        if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"))) {
          return item.name;
        }
      }
    }
    return null;
  };

  const [openSection, setOpenSection] = useState<string | null>(findActiveGroup);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  };

  const toggleExpand = (name: string) => {
    if (collapsed) return;
    setOpenSection(prev => prev === name ? null : name);
  };

  const isActivePath = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isParentActive = (item: NavItem) =>
    item.children?.some(c => isActivePath(c.href)) ?? false;

  const renderNavItem = (item: NavItem) => {
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
            className={`sidebar-nav-item${parentActive ? " sidebar-nav-item--active" : ""}`}
            title={collapsed ? item.name : undefined}
            aria-expanded={collapsed ? undefined : isOpen}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="sidebar-label flex-1 text-left">{item.name}</span>
            {!collapsed && (
              isOpen
                ? <ChevronDown className="w-3 h-3 sidebar-collapse-hide" style={{ opacity: 0.5 }} />
                : <ChevronRight className="w-3 h-3 sidebar-collapse-hide" style={{ opacity: 0.5 }} />
            )}
          </button>
        ) : (
          <Link
            href={item.href!}
            className={`sidebar-nav-item${itemActive ? " sidebar-nav-item--active" : ""}`}
            aria-current={itemActive ? "page" : undefined}
            title={collapsed ? item.name : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="sidebar-label flex-1">{item.name}</span>
          </Link>
        )}

        {hasChildren && isOpen && !collapsed && (
          <div className="sidebar-nav-children mb-0.5" style={{ marginLeft: 16, paddingLeft: 12, borderLeft: "1px solid var(--sidebar-border)" }}>
            {item.children!.map(child => {
              const childActive = isActivePath(child.href);
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`sidebar-nav-child${childActive ? " sidebar-nav-child--active" : ""}`}
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
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      data-collapsed={String(collapsed)}
    >
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="sidebar-brand-text">Safehaul</span>
        <button
          onClick={toggleCollapsed}
          className="sidebar-toggle-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft
            className="w-4 h-4"
            style={{
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: "transform var(--transition-slow)",
            }}
          />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(renderNavItem)}
          </div>
        ))}

        {/* Settings — always visible at bottom of nav */}
        <div style={{ marginTop: 8 }}>
          {renderNavItem(settingsItem)}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        {/* Company block */}
        <div
          className="sidebar-company-block"
          title={collapsed ? (user?.company_name || "Company") : undefined}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--sidebar-text-muted)" }} />
          <span className="sidebar-label flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
            {user?.company_name || "Company"}
          </span>
        </div>

        {/* User row */}
        <div className="sidebar-user">
          <div
            className="sidebar-user-avatar"
            title={collapsed ? (user ? `${user.first_name} ${user.last_name}` : "User") : undefined}
          >
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user ? `${user.first_name} ${user.last_name}` : "User"}
            </div>
            <div className="sidebar-user-email">{user?.email || ""}</div>
          </div>
          <button
            onClick={() => logout()}
            className="sidebar-toggle-btn"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
