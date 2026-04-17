/**
 * Sidebar - Role-adaptive navigation with nested Loads menu support.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { Separator } from "@/components/ui/separator";
import {
  ADMIN_NAV_ITEMS,
  ASSET_NAV_ITEMS,
  FINANCE_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  SYSTEM_NAV_ITEMS,
  type SidebarNavChild,
  type SidebarNavItem,
} from "@/lib/utils/constants";

function isHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isChildVisible(child: SidebarNavChild, userRole: UserRole) {
  return !child.roles || child.roles.includes(userRole);
}

function isItemVisible(item: SidebarNavItem, userRole: UserRole) {
  return item.roles.includes(userRole);
}

function getVisibleChildren(item: SidebarNavItem, userRole: UserRole) {
  return (item.children ?? []).filter((child) => isChildVisible(child, userRole));
}

interface NavSectionProps {
  items: SidebarNavItem[];
  userRole: UserRole;
  pathname: string;
  collapsed: boolean;
  openMenus: Record<string, boolean>;
  onToggleMenu: (title: string) => void;
  onExpandParent: (title: string) => void;
  onLinkClick: () => void;
}

function NavSection({
  items,
  userRole,
  pathname,
  collapsed,
  openMenus,
  onToggleMenu,
  onExpandParent,
  onLinkClick,
}: NavSectionProps) {
  const visibleItems = items
    .filter((item) => isItemVisible(item, userRole))
    .filter((item) => !item.children || getVisibleChildren(item, userRole).length > 0);

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const visibleChildren = getVisibleChildren(item, userRole);
        const isNested = visibleChildren.length > 0;
        const isActive = item.href
          ? isHrefActive(pathname, item.href)
          : visibleChildren.some((child) => isHrefActive(pathname, child.href));
        const isOpen = isActive || !!openMenus[item.title];

        if (!isNested && item.href) {
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/60 hover:bg-muted hover:text-foreground",
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary" : "",
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        }

        return (
          <div key={item.title} className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (collapsed) {
                  onExpandParent(item.title);
                  return;
                }
                onToggleMenu(item.title);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/60 hover:bg-muted hover:text-foreground",
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary" : "",
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              )}
            </button>

            {!collapsed && (
              <div
                className={cn(
                  "grid overflow-hidden transition-all duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="ml-3 mt-1 flex flex-col space-y-1 border-l border-white/10 pl-6">
                    {visibleChildren.map((child) => {
                      const isChildActive = isHrefActive(pathname, child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onLinkClick}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm transition-colors",
                            isChildActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-foreground/60 hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore();
  const pathname = usePathname();

  const collapsed = sidebarCollapsed && !sidebarOpen;
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleToggleMenu = (title: string) => {
    setOpenMenus((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const handleExpandParent = (title: string) => {
    setSidebarCollapsed(false);
    setOpenMenus((current) => ({
      ...current,
      [title]: true,
    }));
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
          "hidden lg:sticky lg:top-0 lg:flex",
          sidebarCollapsed ? "lg:w-[68px] overflow-hidden" : "lg:w-[240px]",
          sidebarOpen && "!flex fixed inset-y-0 left-0 z-50 w-[260px] overflow-visible shadow-2xl",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </div>
          {(!sidebarCollapsed || sidebarOpen) && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                Safehaul
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                TMS
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Operations
              </p>
            )}
            <NavSection
              items={MAIN_NAV_ITEMS}
              userRole={user.role}
              pathname={pathname}
              collapsed={collapsed}
              openMenus={openMenus}
              onToggleMenu={handleToggleMenu}
              onExpandParent={handleExpandParent}
              onLinkClick={handleLinkClick}
            />
          </div>

          <Separator className="my-3 bg-border" />

          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Assets
              </p>
            )}
            <NavSection
              items={ASSET_NAV_ITEMS}
              userRole={user.role}
              pathname={pathname}
              collapsed={collapsed}
              openMenus={openMenus}
              onToggleMenu={handleToggleMenu}
              onExpandParent={handleExpandParent}
              onLinkClick={handleLinkClick}
            />
          </div>

          <Separator className="my-3 bg-border" />

          <div className="mb-4">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Finance
              </p>
            )}
            <NavSection
              items={FINANCE_NAV_ITEMS}
              userRole={user.role}
              pathname={pathname}
              collapsed={collapsed}
              openMenus={openMenus}
              onToggleMenu={handleToggleMenu}
              onExpandParent={handleExpandParent}
              onLinkClick={handleLinkClick}
            />
          </div>

          <Separator className="my-3 bg-border" />

          <div>
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                System
              </p>
            )}
            <NavSection
              items={[...SYSTEM_NAV_ITEMS, ...ADMIN_NAV_ITEMS]}
              userRole={user.role}
              pathname={pathname}
              collapsed={collapsed}
              openMenus={openMenus}
              onToggleMenu={handleToggleMenu}
              onExpandParent={handleExpandParent}
              onLinkClick={handleLinkClick}
            />
          </div>
        </nav>

        <div className="hidden border-t border-border p-3 lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180",
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
