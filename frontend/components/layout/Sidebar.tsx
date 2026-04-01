"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Building2, 
  LayoutDashboard, 
  Truck, 
  Map, 
  Users, 
  Settings, 
  Wallet,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  LogOut
} from "lucide-react";

/* ── Navigation tree with nested sub-items ────────────────────── */
const mainLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Load Management", href: "/loads", icon: Map, badge: "NEW" },
  { name: "Fleet Management", href: "/fleet", icon: Truck },
  { 
    name: "HR Management", 
    icon: Users,
    subItems: [
      { name: "Drivers", href: "/drivers" },
      { name: "Users", href: "/users" }
    ]
  },
  { name: "Accounting", href: "/accounting", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedHr, setExpandedHr] = useState(true);

  return (
    <aside 
      className="flex flex-col h-screen overflow-hidden sticky top-0 z-20 shrink-0 border-r"
      style={{
        width: "var(--sidebar-width, 230px)",
        backgroundColor: "var(--surface-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      {/* ── Brand Header ─────────────────────────────────────── */}
      <div 
        className="h-16 flex items-center px-5 shrink-0 border-b"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-container))" }}
          >
            <Truck className="h-4 w-4 text-white" />
          </div>
          <span 
            className="text-[15px] font-bold tracking-tight"
            style={{ color: "var(--on-surface)", fontFamily: "var(--font-display)" }}
          >
            Safehaul TMS
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {mainLinks.map((link) => {
            
            /* --- Collapsible parent with sub-items --- */
            if (link.subItems) {
              const isActiveParent = link.subItems.some(sub => pathname.startsWith(sub.href));
              const Icon = link.icon;
              return (
                <div key={link.name}>
                  <button 
                    onClick={() => setExpandedHr(!expandedHr)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors"
                    style={{ 
                      color: isActiveParent ? "var(--primary)" : "var(--on-surface-variant)",
                    }}
                    onMouseEnter={e => {
                      if (!isActiveParent) e.currentTarget.style.backgroundColor = "var(--surface-container)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="text-[13px] font-semibold">{link.name}</span>
                    </div>
                    {expandedHr 
                      ? <ChevronDown className="h-3.5 w-3.5 opacity-50" /> 
                      : <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    }
                  </button>
                  
                  {expandedHr && (
                    <div 
                      className="ml-[22px] mt-0.5 mb-1 border-l pl-3 space-y-0.5"
                      style={{ borderColor: "var(--outline-variant)" }}
                    >
                      {link.subItems.map(sub => {
                        const isSubActive = pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className="flex items-center px-3 py-1.5 rounded-lg transition-colors text-[12.5px] font-medium"
                            style={{ 
                              backgroundColor: isSubActive ? "var(--primary-fixed)" : "transparent",
                              color: isSubActive ? "var(--primary)" : "var(--on-surface-variant)",
                              fontWeight: isSubActive ? 700 : 500,
                            }}
                            onMouseEnter={e => {
                              if (!isSubActive) e.currentTarget.style.backgroundColor = "var(--surface-container)";
                            }}
                            onMouseLeave={e => {
                              if (!isSubActive) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* --- Standard flat link --- */
            const isActive = pathname.startsWith(link.href) || (pathname === "/" && link.href === "/dashboard");
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--primary-fixed)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                  fontWeight: isActive ? 700 : 500,
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-container)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[13px] font-semibold">{link.name}</span>
                {link.badge && (
                  <span 
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "var(--info)", color: "white" }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Footer Profile ───────────────────────────────────── */}
      <div 
        className="shrink-0 p-3 border-t"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        {/* Company Selector */}
        <button 
          className="flex items-center w-full gap-2 px-3 py-2 rounded-lg transition-colors text-left mb-3"
          style={{ 
            backgroundColor: "var(--surface-low)", 
            border: "1px solid var(--outline-variant)",
          }}
        >
          <Building2 className="h-4 w-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          <span className="text-[11px] font-bold truncate" style={{ color: "var(--on-surface)" }}>
            WENZE TRANSPORT SERVICES
          </span>
          <ChevronDown className="h-3 w-3 ml-auto shrink-0 opacity-40" />
        </button>

        {/* User Profile */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: "var(--primary-fixed)", color: "var(--primary)" }}
            >
              TR
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12.5px] font-semibold leading-none mb-1 truncate" style={{ color: "var(--on-surface)" }}>
                Tom Robinson
              </span>
              <span className="text-[10.5px] leading-none truncate" style={{ color: "var(--on-surface-variant)" }}>
                hr@wenze.com
              </span>
            </div>
          </div>
          <button 
            className="p-1 rounded transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--error)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--on-surface-variant)"}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
