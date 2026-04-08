/**
 * Sidebar — Role-adaptive navigation. Renders different menu items
 * based on the user's role from authStore (UserRole enum).
 *
 * Menu structure mirrors the API router prefixes:
 *   /dashboard → Dashboard
 *   /loads     → Load Board
 *   /dispatch  → Dispatch Center
 *   /drivers   → Drivers
 *   /fleet/*   → Fleet (trucks, trailers)
 *   /accounting/* → Accounting
 *   /settings  → Settings
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Users,
  Truck,
  DollarSign,
  Settings,
  ChevronLeft,
  Shield,
  Building2,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[]; // Which roles can see this item
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "company_admin", "dispatcher", "accountant"],
  },
  {
    href: "/loads",
    label: "Load Board",
    icon: Package,
    roles: ["super_admin", "company_admin", "dispatcher", "accountant"],
  },
  {
    href: "/dispatch",
    label: "Dispatch",
    icon: Rocket,
    roles: ["super_admin", "company_admin", "dispatcher"],
  },
  {
    href: "/brokers",
    label: "Brokers",
    icon: Building2,
    roles: ["super_admin", "company_admin", "dispatcher"],
  },
];

const ASSET_ITEMS: NavItem[] = [
  {
    href: "/drivers",
    label: "Drivers",
    icon: Users,
    roles: ["super_admin", "company_admin", "dispatcher", "accountant"],
  },
  {
    href: "/fleet",
    label: "Fleet",
    icon: Truck,
    roles: ["super_admin", "company_admin", "dispatcher", "accountant"],
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["super_admin", "company_admin", "dispatcher", "accountant"],
  },
];

const FINANCE_ITEMS: NavItem[] = [
  {
    href: "/accounting",
    label: "Accounting",
    icon: DollarSign,
    roles: ["super_admin", "company_admin", "accountant"],
  },
];

const SYSTEM_ITEMS: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["super_admin", "company_admin"],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Admin Portal",
    icon: Shield,
    roles: ["super_admin"],
  },
];

function NavSection({
  items,
  userRole,
  pathname,
  collapsed,
}: {
  items: NavItem[];
  userRole: UserRole;
  pathname: string;
  collapsed: boolean;
}) {
  const visibleItems = items.filter((item) => item.roles.includes(userRole));
  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-1">
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/60 hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                isActive ? "text-primary" : ""
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  // Auto-close mobile sidebar on navigation
  const handleNavClick = () => {
    // Close mobile sidebar on link click (small screens)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (!user) return null;
  const role = user.role;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex h-screen flex-col bg-card border-r border-border transition-all duration-200",
          // Desktop: sticky, width based on collapsed state
          "hidden lg:flex lg:sticky lg:top-0",
          sidebarCollapsed ? "lg:w-[68px] overflow-hidden" : "lg:w-[240px]",
          // Mobile: fixed overlay when open
          sidebarOpen && "!flex fixed inset-y-0 left-0 z-50 w-[260px] shadow-2xl overflow-visible"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          {(!sidebarCollapsed || sidebarOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                Safehaul
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                TMS
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" onClick={handleNavClick}>
          {/* Operations */}
          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Operations
              </p>
            )}
            <NavSection
              items={NAV_ITEMS}
              userRole={role}
              pathname={pathname}
              collapsed={sidebarCollapsed && !sidebarOpen}
            />
          </div>

          <Separator className="bg-border my-3" />

          {/* Assets */}
          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Assets
              </p>
            )}
            <NavSection
              items={ASSET_ITEMS}
              userRole={role}
              pathname={pathname}
              collapsed={sidebarCollapsed && !sidebarOpen}
            />
          </div>

          <Separator className="bg-border my-3" />

          {/* Finance */}
          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Finance
              </p>
            )}
            <NavSection
              items={FINANCE_ITEMS}
              userRole={role}
              pathname={pathname}
              collapsed={sidebarCollapsed && !sidebarOpen}
            />
          </div>

          <Separator className="bg-border my-3" />

          {/* System */}
          <div>
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                System
              </p>
            )}
            <NavSection
              items={[...SYSTEM_ITEMS, ...ADMIN_ITEMS]}
              userRole={role}
              pathname={pathname}
              collapsed={sidebarCollapsed && !sidebarOpen}
            />
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="border-t border-border p-3 hidden lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
