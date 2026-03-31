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
  ChevronRight
} from "lucide-react";

const mainLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Load Management", href: "/loads", icon: Map, badge: "NEW" },
  { name: "Fleet Management", href: "/fleet", icon: Truck },
  { 
    name: "HR Management", 
    href: "/hr-parent", // Prevents active collision
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
    <aside className="w-[var(--sidebar-width,240px)] bg-[var(--surface-lowest)] border-r border-[var(--outline-variant)] flex flex-col h-screen overflow-hidden sticky top-0 transition-all duration-300 z-20">
      
      {/* Brand Header */}
      <div className="h-[64px] flex items-center px-5 border-b border-[var(--outline-variant)] shrink-0">
        <div className="flex items-center gap-2 text-[var(--primary)] title-md tracking-tight font-display font-bold">
          <Truck className="h-5 w-5 fill-current" />
          Safehaul TMS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {mainLinks.map((link) => {
          
          if (link.subItems) {
            const isActiveParent = link.subItems.some(sub => pathname.startsWith(sub.href));
            return (
              <div key={link.name} className="flex flex-col">
                <button 
                  onClick={() => setExpandedHr(!expandedHr)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-[var(--radius-md)] transition-colors w-full
                    ${isActiveParent 
                      ? "text-[var(--primary)]" 
                      : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
                    }`}
                >
                  <div className="flex items-center">
                    <link.icon className={`mr-2.5 h-4 w-4 ${isActiveParent ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)]"}`} />
                    <span className={`label-md ${isActiveParent ? "font-bold" : "font-semibold"}`}>{link.name}</span>
                  </div>
                  {expandedHr 
                    ? <ChevronDown className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" /> 
                    : <ChevronRight className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
                  }
                </button>
                
                {expandedHr && (
                  <div className="mt-0.5 mb-1 ml-4 border-l border-[var(--outline-variant)] pl-2 space-y-0.5">
                    {link.subItems.map(sub => {
                      const isSubActive = pathname.startsWith(sub.href);
                      return (
                         <Link
                          key={sub.name}
                          href={sub.href}
                          className={`flex items-center px-3 py-1.5 rounded-[var(--radius-md)] transition-colors
                            ${isSubActive 
                              ? "bg-[var(--primary-fixed)] text-[var(--primary)] label-md font-bold" 
                              : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] label-md"
                            }`}
                        >
                          {sub.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname.startsWith(link.href) || (pathname === "/" && link.href === "/dashboard");
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-1.5 rounded-[var(--radius-md)] transition-colors
                ${isActive 
                  ? "bg-[var(--primary-fixed)] text-[var(--primary)]" 
                  : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
                }`}
            >
              <Icon className={`mr-2.5 h-4 w-4 ${isActive ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)]"}`} />
              <span className={`label-md ${isActive ? "font-bold" : "font-semibold"}`}>{link.name}</span>
              {link.badge && (
                <span className="ml-auto bg-[var(--info)] text-[var(--on-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="shrink-0 p-3 border-t border-[var(--outline-variant)]">
        <button className="flex items-center w-full gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-container)] transition-colors text-left ghost-border bg-[var(--surface-lowest)] mb-3 shadow-ambient">
          <Building2 className="h-4 w-4 text-[var(--on-surface-variant)]" />
          <span className="label-sm font-bold text-[var(--on-surface)] truncate w-full">WENZE TRANSPORT</span>
        </button>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[var(--primary-fixed)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">
              TR
            </div>
            <div className="flex flex-col">
              <span className="label-md font-semibold text-[var(--on-surface)] leading-none mb-0.5">Tom Robinson</span>
              <span className="text-[10px] text-[var(--on-surface-variant)] leading-none">hr@wenze.com</span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-[var(--on-surface-variant)] cursor-pointer hover:text-[var(--on-surface)] transition-colors" />
        </div>
      </div>
    </aside>
  );
}
