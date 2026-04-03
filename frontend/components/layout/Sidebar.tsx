"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import NewBadge from "@/components/ui/NewBadge";
import Modal from "@/components/ui/Modal";
import {
  Building2, LayoutDashboard, Truck, Map, Users, Settings, Wallet,
  ChevronDown, ChevronRight, LogOut, Mail, Calendar, MapPin,
  Shield, UserCog, Wrench, ShoppingBag, BarChart3,
  Construction, Boxes, ClipboardList, Radio, Layers,
  Compass, MonitorDot, FileText, DollarSign, CreditCard,
  Package, Gauge,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Sidebar — Enterprise Operations UI
   Light gray-blue background, compact nav, single-expand accordion,
   Safehaul branding, user identity footer.
   ═══════════════════════════════════════════════════════════════ */

interface NavChild {
  name: string;
  href: string;
  implemented?: boolean;
  badge?: { label: string; variant: "blue" | "green" | "orange"; launchDate?: string };
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: { label: string; variant: "blue" | "green" | "orange"; launchDate?: string };
  implemented?: boolean;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, implemented: true },
  { name: "Mailbox", href: "/mailbox", icon: Mail, badge: { label: "NEW", variant: "blue", launchDate: "2026-04-01" }, implemented: false },
  {
    name: "Load Management", icon: Map,
    children: [
      { name: "All Loads", href: "/loads", implemented: true },
      { name: "Live Loads", href: "/loads?tab=live", implemented: true },
      { name: "My Loads", href: "/loads?tab=my", implemented: false },
      { name: "LTL Trips", href: "/loads/ltl", implemented: false },
      { name: "Loadboard", href: "/loadboard", implemented: false, badge: { label: "NEW", variant: "blue" } },
      { name: "Planning Calendar", href: "/planning/calendar", implemented: false },
      { name: "Planning Board", href: "/planning/board", implemented: false },
      { name: "Dispatch Board", href: "/dispatch", implemented: false },
      { name: "Dispatch Board 2.0", href: "/dispatch/v2", implemented: false, badge: { label: "BETA", variant: "orange" } },
      { name: "MAP", href: "/map", implemented: false },
    ]
  },
  {
    name: "Accounting", icon: Wallet,
    children: [
      { name: "Invoice", href: "/accounting?tab=invoices", implemented: false },
      { name: "Salary", href: "/accounting", implemented: true },
      { name: "Bill", href: "/accounting/bills", implemented: false },
    ]
  },
  {
    name: "Customer Management", icon: UserCog,
    children: [
      { name: "Customers (Brokers)", href: "/customers", implemented: false },
      { name: "Vendors", href: "/vendors", implemented: false },
      { name: "Locations", href: "/locations", implemented: false },
    ]
  },
  { name: "Safety", href: "/safety", icon: Shield, implemented: false },
  {
    name: "Fleet Management", icon: Truck,
    children: [
      { name: "Trucks", href: "/fleet", implemented: true },
      { name: "Trailers", href: "/fleet/trailers", implemented: false },
      { name: "Inspections", href: "/fleet/inspections", implemented: false },
      { name: "Fleet Board", href: "/fleet/board", implemented: false },
      { name: "Inventory", href: "/fleet/inventory", implemented: false },
      { name: "Maintenance", href: "/fleet/maintenance", implemented: false },
    ]
  },
  {
    name: "HR Management", icon: Users,
    children: [
      { name: "Drivers", href: "/drivers", implemented: true },
      { name: "Users", href: "/users", implemented: false },
    ]
  },
  { name: "Reports", href: "/reports", icon: BarChart3, implemented: false },
  { name: "Apps & Marketplace", href: "/apps", icon: ShoppingBag, badge: { label: "NEW", variant: "green" }, implemented: false },
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

  const [showUnderDev, setShowUnderDev] = useState(false);

  const toggleExpand = (name: string) => {
    setOpenSection(prev => prev === name ? null : name);
  };

  const isActivePath = (href: string) => {
    const baseHref = href.split("?")[0];
    return pathname === baseHref || pathname.startsWith(baseHref + "/");
  };

  const isParentActive = (item: NavItem) => item.children?.some(c => isActivePath(c.href)) ?? false;

  const handleNav = (e: React.MouseEvent, implemented?: boolean) => {
    if (!implemented) {
      e.preventDefault();
      setShowUnderDev(true);
    }
  };

  return (
    <>
      {/* Under Development Modal */}
      <Modal isOpen={showUnderDev} onClose={() => setShowUnderDev(false)} title="Under Development" size="sm">
        <div className="flex flex-col items-center text-center py-2">
          <div
            className="w-12 h-12 rounded-[10px] flex items-center justify-center mb-3"
            style={{ backgroundColor: "var(--warning-container)" }}
          >
            <Construction className="w-6 h-6" style={{ color: "var(--warning)" }} />
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
            This feature is currently being built and will be available soon. Stay tuned for updates!
          </p>
          <button
            onClick={() => setShowUnderDev(false)}
            className="btn-enterprise-primary"
          >
            Got it
          </button>
        </div>
      </Modal>

      <aside
        className="flex flex-col h-screen sticky top-0 z-30 overflow-hidden shrink-0"
        style={{
          width: "var(--sidebar-width)",
          minWidth: "var(--sidebar-width)",
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* ── Brand ── */}
        <div
          className="flex items-center gap-2.5 shrink-0"
          style={{
            height: "var(--topbar-height)",
            padding: "0 16px",
            borderBottom: "1px solid var(--sidebar-border)",
          }}
        >
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
        <nav className="flex-1 overflow-y-auto py-1 px-2">
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
                    className="flex items-center w-full rounded-md border-none cursor-pointer transition-colors"
                    style={{
                      padding: "6px 10px",
                      gap: "8px",
                      marginBottom: "1px",
                      fontSize: "12.5px",
                      fontWeight: parentActive ? 600 : 500,
                      color: parentActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                      backgroundColor: parentActive ? "var(--sidebar-active-bg)" : "transparent",
                      borderLeft: parentActive ? "3px solid var(--sidebar-active-text)" : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!parentActive) e.currentTarget.style.backgroundColor = "var(--sidebar-hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (!parentActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
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
                    href={item.implemented ? item.href! : "#"}
                    onClick={(e) => handleNav(e, item.implemented)}
                    className="flex items-center rounded-md no-underline transition-colors"
                    style={{
                      padding: "6px 10px",
                      gap: "8px",
                      marginBottom: "1px",
                      fontSize: "12.5px",
                      fontWeight: itemActive ? 600 : 500,
                      color: itemActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                      backgroundColor: itemActive ? "var(--sidebar-active-bg)" : "transparent",
                      borderLeft: itemActive ? "3px solid var(--sidebar-active-text)" : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!itemActive) e.currentTarget.style.backgroundColor = "var(--sidebar-hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (!itemActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Icon className="w-[16px] h-[16px] shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <NewBadge
                        label={item.badge.label}
                        variant={item.badge.variant}
                        launchDate={item.badge.launchDate}
                      />
                    )}
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
                          href={child.implemented ? child.href : "#"}
                          onClick={(e) => handleNav(e, child.implemented)}
                          className="flex items-center rounded-[5px] no-underline transition-colors"
                          style={{
                            padding: "4px 10px",
                            gap: "6px",
                            marginBottom: "1px",
                            fontSize: "12px",
                            fontWeight: childActive ? 600 : 400,
                            color: childActive ? "var(--sidebar-active-text)" : "var(--sidebar-text-muted)",
                            backgroundColor: childActive ? "var(--sidebar-active-bg)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!childActive) e.currentTarget.style.backgroundColor = "var(--sidebar-hover-bg)";
                          }}
                          onMouseLeave={(e) => {
                            if (!childActive) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <span className="flex-1">{child.name}</span>
                          {child.badge && (
                            <NewBadge
                              label={child.badge.label}
                              variant={child.badge.variant}
                              launchDate={child.badge.launchDate}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Separator ── */}
        <div style={{ borderTop: "1px solid var(--sidebar-border)", margin: "0 12px" }} />

        {/* ── Footer — Company + User Identity ── */}
        <div className="p-2.5 shrink-0">
          <button
            className="flex items-center gap-2 w-full rounded-md cursor-pointer text-left transition-colors"
            style={{
              padding: "6px 10px",
              marginBottom: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--sidebar-text)",
              backgroundColor: "var(--surface-lowest)",
              border: "1px solid var(--outline-variant)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sidebar-hover-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-lowest)"; }}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {user?.company_name || "Company"}
            </span>
            <ChevronRight className="w-3 h-3" style={{ color: "var(--on-surface-variant)" }} />
          </button>
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
              className="border-none cursor-pointer p-1 rounded transition-colors focus-ring"
              style={{ background: "transparent", color: "var(--on-surface-variant)" }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
