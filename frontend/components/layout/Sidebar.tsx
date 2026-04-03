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
  Shield, UserCog, Wrench, Puzzle, ListTodo, ShoppingBag, BarChart3,
  Construction, X, Boxes, FileText, Landmark,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Sidebar — Modernized (Tailwind + Data Attributes + Shared Modal)
   Dark navy, single-expand accordion, NewBadge integration,
   Safehaul branding, user identity footer.
   ═══════════════════════════════════════════════════════════════ */

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: { label: string; variant: "blue" | "green" | "orange"; launchDate?: string };
  implemented?: boolean;
  children?: { name: string; href: string; implemented?: boolean; badge?: { label: string; variant: "blue" | "green" | "orange"; launchDate?: string } }[];
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
    ]
  },
  {
    name: "Accounting", icon: Wallet,
    children: [
      { name: "Invoices", href: "/accounting?tab=invoices", implemented: true },
      { name: "Salary", href: "/accounting", implemented: true },
      { name: "Bills", href: "/accounting/bills", implemented: false },
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
  {
    name: "Fleet Management", icon: Truck,
    children: [
      { name: "Trucks", href: "/fleet", implemented: true },
      { name: "Trailers", href: "/fleet/trailers", implemented: false },
      { name: "Inspections", href: "/fleet/inspections", implemented: false },
    ]
  },
  {
    name: "HR Management", icon: Users,
    children: [
      { name: "Drivers", href: "/drivers", implemented: true },
      { name: "Users", href: "/users", implemented: false },
    ]
  },
  { name: "Safety", href: "/safety", icon: Shield, implemented: false },
  { name: "Maintenance", href: "/maintenance", icon: Wrench, implemented: false },
  { name: "Reports", href: "/reports", icon: BarChart3, implemented: false },
  { name: "Apps & Marketplace", href: "/apps", icon: ShoppingBag, badge: { label: "NEW", variant: "green" }, implemented: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Single-expand accordion — only one section open at a time
  const [openSection, setOpenSection] = useState<string | null>(() => {
    for (const item of navItems) {
      if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"))) {
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
      {/* Under Development Modal — using shared Modal component */}
      <Modal isOpen={showUnderDev} onClose={() => setShowUnderDev(false)} title="Under Development" size="sm">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
            <Construction className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed mb-5">
            This feature is currently being built and will be available soon. Stay tuned for updates!
          </p>
          <button
            onClick={() => setShowUnderDev(false)}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-none rounded-lg px-8 py-2.5 text-sm font-bold cursor-pointer hover:brightness-110 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            Got it
          </button>
        </div>
      </Modal>

      <aside className="w-60 min-w-60 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col h-screen sticky top-0 z-30 overflow-hidden border-r border-slate-700">
        {/* Brand */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700 gap-2.5 shrink-0">
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-50 text-[15px] font-bold tracking-tight">
            Safehaul TMS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1.5 px-2">
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
                    data-active={parentActive}
                    className="flex items-center w-full px-2.5 py-[7px] rounded-md border-none text-[13px] gap-2.5 mb-px cursor-pointer border-l-[3px] transition-colors
                      text-slate-300 border-l-transparent bg-transparent
                      hover:bg-white/5
                      data-[active=true]:text-blue-400 data-[active=true]:bg-blue-500/12 data-[active=true]:border-l-blue-500 data-[active=true]:font-semibold"
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" />
                    <span className="flex-1 text-left font-medium">{item.name}</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                ) : (
                  <Link
                    href={item.implemented ? item.href! : "#"}
                    onClick={(e) => handleNav(e, item.implemented)}
                    data-active={itemActive}
                    className="flex items-center px-2.5 py-[7px] rounded-md no-underline text-[13px] gap-2.5 mb-px border-l-[3px] transition-colors
                      text-slate-300 border-l-transparent bg-transparent
                      hover:bg-white/5
                      data-[active=true]:text-blue-400 data-[active=true]:bg-blue-500/12 data-[active=true]:border-l-blue-500 data-[active=true]:font-semibold"
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" />
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.badge && (
                      <NewBadge
                        label={item.badge.label}
                        variant={item.badge.variant}
                        launchDate={item.badge.launchDate}
                      />
                    )}
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="ml-5 border-l border-slate-700 pl-3 mb-0.5">
                    {item.children!.map(child => {
                      const childActive = isActivePath(child.href);
                      return (
                        <Link
                          key={child.name}
                          href={child.implemented ? child.href : "#"}
                          onClick={(e) => handleNav(e, child.implemented)}
                          data-active={childActive}
                          className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-[5px] no-underline text-[12.5px] mb-px transition-colors
                            text-slate-400 bg-transparent
                            hover:bg-white/[0.04]
                            data-[active=true]:text-blue-400 data-[active=true]:bg-blue-500/10 data-[active=true]:font-semibold"
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

        {/* Separator */}
        <div className="border-t border-slate-700 mx-4" />

        {/* Footer — Company + User Identity */}
        <div className="p-2.5 shrink-0">
          <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 text-[11px] font-semibold cursor-pointer mb-2.5 text-left hover:bg-white/[0.08] transition-colors">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{user?.company_name || "Company"}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </button>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-100 text-[12.5px] font-semibold leading-tight">{user ? `${user.first_name} ${user.last_name}` : "User"}</div>
              <div className="text-slate-500 text-[10.5px] leading-tight mt-0.5">{user?.email || ""}</div>
            </div>
            <button
              onClick={() => logout()}
              className="bg-transparent border-none text-slate-500 cursor-pointer p-1 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
