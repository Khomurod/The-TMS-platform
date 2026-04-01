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
  ChevronDown,
  ChevronRight,
  LogOut,
  Mail,
  Calendar,
  MapPin,
  Receipt,
  FileText,
  Shield,
  UserCog,
  Wrench,
  Puzzle,
  ListTodo,
  ShoppingBag,
  BarChart3,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Sidebar — Dark navy theme matching Datatruck reference.
   Dense B2B SaaS navigation with collapsible sections.
   ═══════════════════════════════════════════════════════════════ */

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  children?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mailbox", href: "/mailbox", icon: Mail, badge: "NEW", badgeColor: "#10b981" },
  { 
    name: "Load Management", icon: Map,
    children: [
      { name: "All Loads", href: "/loads" },
    ]
  },
  { name: "Planning Calendar", href: "/calendar", icon: Calendar },
  { name: "MAP", href: "/map", icon: MapPin },
  { 
    name: "Accounting", icon: Wallet,
    children: [
      { name: "Invoice", href: "/accounting/invoices" },
      { name: "Salary", href: "/accounting/salary" },
      { name: "Bill", href: "/accounting/bills" },
    ]
  },
  { name: "Customer Management", href: "/customers", icon: UserCog },
  { name: "Safety", href: "/safety", icon: Shield },
  { 
    name: "Fleet Management", icon: Truck,
    children: [
      { name: "Trucks", href: "/fleet" },
      { name: "Trailers", href: "/fleet/trailers" },
    ]
  },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { 
    name: "HR Management", icon: Users,
    children: [
      { name: "Drivers", href: "/drivers" },
      { name: "Users", href: "/users" },
    ]
  },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { 
    name: "Integration", icon: Puzzle,
    children: [
      { name: "Connections", href: "/integrations" },
    ]
  },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Apps & Marketplace", href: "/apps", icon: ShoppingBag, badge: "NEW", badgeColor: "#10b981" },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Accounting": true,
    "HR Management": true,
    "Load Management": true,
    "Fleet Management": false,
    "Integration": false,
  });

  const toggleExpand = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isParentActive = (item: NavItem) => item.children?.some(c => isActive(c.href)) ?? false;

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 30,
        overflow: "hidden",
        borderRight: "1px solid #334155",
      }}
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid #334155",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Truck style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <span style={{ color: "#f8fafc", fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
          datatruck
        </span>
      </div>

      {/* ── Collapse / Expand Toggle ─────────────────────── */}
      <div style={{
        padding: "8px 12px 4px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <button style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "4px 6px",
          color: "#94a3b8", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center",
        }}>
          <LayoutDashboard style={{ width: 14, height: 14 }} />
        </button>
        <button style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "4px 6px",
          color: "#94a3b8", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center",
        }}>
          <Map style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "6px 8px",
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const parentActive = hasChildren && isParentActive(item);
          const itemActive = item.href ? isActive(item.href) : false;
          const isOpen = expanded[item.name] ?? false;

          return (
            <div key={item.name}>
              {/* Parent / leaf item */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: parentActive ? "rgba(59,130,246,0.12)" : "transparent",
                    color: parentActive ? "#60a5fa" : "#cbd5e1",
                    fontSize: 13,
                    fontWeight: parentActive ? 600 : 500,
                    cursor: "pointer",
                    gap: 10,
                    marginBottom: 1,
                    transition: "background 0.15s",
                    borderLeft: parentActive ? "3px solid #3b82f6" : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
                  {isOpen 
                    ? <ChevronDown style={{ width: 14, height: 14, opacity: 0.5 }} />
                    : <ChevronRight style={{ width: 14, height: 14, opacity: 0.5 }} />
                  }
                </button>
              ) : (
                <Link
                  href={item.href!}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 10px",
                    borderRadius: 6,
                    textDecoration: "none",
                    color: itemActive ? "#60a5fa" : "#cbd5e1",
                    fontSize: 13,
                    fontWeight: itemActive ? 600 : 500,
                    gap: 10,
                    marginBottom: 1,
                    transition: "background 0.15s",
                    background: itemActive ? "rgba(59,130,246,0.12)" : "transparent",
                    borderLeft: itemActive ? "3px solid #3b82f6" : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!itemActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      padding: "2px 6px", borderRadius: 4,
                      background: item.badgeColor || "#3b82f6",
                      color: "#fff",
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Children */}
              {hasChildren && isOpen && (
                <div style={{ marginLeft: 20, borderLeft: "1px solid #334155", paddingLeft: 12, marginBottom: 2 }}>
                  {item.children!.map(child => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        style={{
                          display: "block",
                          padding: "5px 10px",
                          borderRadius: 5,
                          textDecoration: "none",
                          color: childActive ? "#60a5fa" : "#94a3b8",
                          fontSize: 12.5,
                          fontWeight: childActive ? 600 : 400,
                          background: childActive ? "rgba(59,130,246,0.1)" : "transparent",
                          transition: "background 0.15s",
                          marginBottom: 1,
                        }}
                        onMouseEnter={e => { if (!childActive) e.currentTarget.style.background= "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────── */}
      <div style={{
        padding: 10,
        borderTop: "1px solid #334155",
        flexShrink: 0,
      }}>
        {/* Company */}
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "8px 10px", borderRadius: 6,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#e2e8f0", fontSize: 11, fontWeight: 600,
          cursor: "pointer", marginBottom: 10, textAlign: "left",
        }}>
          <Building2 style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            WENZE TRANSPORT SERVICES
          </span>
          <ChevronRight style={{ width: 12, height: 12, color: "#64748b" }} />
        </button>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            TR
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>Tom Robinson</div>
            <div style={{ color: "#64748b", fontSize: 10.5, lineHeight: 1.2, marginTop: 2 }}>hr@wenze.com</div>
          </div>
          <button
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}
            title="Sign out"
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
