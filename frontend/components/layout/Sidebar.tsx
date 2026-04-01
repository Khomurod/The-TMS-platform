"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Building2, LayoutDashboard, Truck, Map, Users, Settings, Wallet,
  ChevronDown, ChevronRight, LogOut, Mail, Calendar, MapPin, 
  Shield, UserCog, Wrench, Puzzle, ListTodo, ShoppingBag, BarChart3,
  Construction,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Sidebar — Dark navy with Safehaul branding.
   Non-functional routes show "Under Development" modal.
   ═══════════════════════════════════════════════════════════════ */

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  implemented?: boolean;
  children?: { name: string; href: string; implemented?: boolean }[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, implemented: true },
  { name: "Mailbox", href: "/mailbox", icon: Mail, badge: "NEW", badgeColor: "#10b981", implemented: false },
  { 
    name: "Load Management", icon: Map,
    children: [
      { name: "All Loads", href: "/loads", implemented: true },
    ]
  },
  { name: "Planning Calendar", href: "/calendar", icon: Calendar, implemented: false },
  { name: "MAP", href: "/map", icon: MapPin, implemented: false },
  { 
    name: "Accounting", icon: Wallet,
    children: [
      { name: "Invoice", href: "/accounting/invoices", implemented: false },
      { name: "Salary", href: "/accounting/salary", implemented: false },
      { name: "Bill", href: "/accounting/bills", implemented: false },
    ]
  },
  { name: "Customer Management", href: "/customers", icon: UserCog, implemented: false },
  { name: "Safety", href: "/safety", icon: Shield, implemented: false },
  { 
    name: "Fleet Management", icon: Truck,
    children: [
      { name: "Trucks", href: "/fleet", implemented: true },
      { name: "Trailers", href: "/fleet/trailers", implemented: false },
    ]
  },
  { name: "Maintenance", href: "/maintenance", icon: Wrench, implemented: false },
  { 
    name: "HR Management", icon: Users,
    children: [
      { name: "Drivers", href: "/drivers", implemented: true },
      { name: "Users", href: "/users", implemented: false },
    ]
  },
  { name: "Reports", href: "/reports", icon: BarChart3, implemented: false },
  { 
    name: "Integration", icon: Puzzle, 
    children: [
      { name: "Connections", href: "/integrations", implemented: false },
    ]
  },
  { name: "Tasks", href: "/tasks", icon: ListTodo, implemented: false },
  { name: "Apps & Marketplace", href: "/apps", icon: ShoppingBag, badge: "NEW", badgeColor: "#10b981", implemented: false },
  { name: "Settings", href: "/settings", icon: Settings, implemented: true },
];

/* ── Under Development Modal ──────────────────────────────────── */
function UnderDevModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: "36px 40px",
          maxWidth: 420, width: "90%", textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
        }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #f59e0b, #f97316)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Construction style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          Under Development
        </h3>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
          This feature is currently being built and will be available soon. Stay tuned for updates!
        </p>
        <button
          onClick={onClose}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 32px", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Accounting": true,
    "HR Management": true,
    "Load Management": true,
    "Fleet Management": false,
    "Integration": false,
  });
  const [showUnderDev, setShowUnderDev] = useState(false);

  const toggleExpand = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isActivePath = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isParentActive = (item: NavItem) => item.children?.some(c => isActivePath(c.href)) ?? false;

  const handleNav = (e: React.MouseEvent, implemented?: boolean) => {
    if (!implemented) {
      e.preventDefault();
      setShowUnderDev(true);
    }
  };

  return (
    <>
      <UnderDevModal open={showUnderDev} onClose={() => setShowUnderDev(false)} />
      <aside style={{
        width: 240, minWidth: 240,
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0, zIndex: 30,
        overflow: "hidden", borderRight: "1px solid #334155",
      }}>
        {/* Brand */}
        <div style={{
          height: 56, display: "flex", alignItems: "center",
          padding: "0 16px", borderBottom: "1px solid #334155", gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Truck style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <span style={{ color: "#f8fafc", fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
            Safehaul TMS
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const parentActive = hasChildren && isParentActive(item);
            const itemActive = item.href ? isActivePath(item.href) : false;
            const isOpen = expanded[item.name] ?? false;

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.name)}
                    style={{
                      display: "flex", alignItems: "center", width: "100%",
                      padding: "7px 10px", borderRadius: 6, border: "none",
                      background: parentActive ? "rgba(59,130,246,0.12)" : "transparent",
                      color: parentActive ? "#60a5fa" : "#cbd5e1",
                      fontSize: 13, fontWeight: parentActive ? 600 : 500,
                      cursor: "pointer", gap: 10, marginBottom: 1,
                      borderLeft: parentActive ? "3px solid #3b82f6" : "3px solid transparent",
                    }}
                    onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
                    {isOpen ? <ChevronDown style={{ width: 14, height: 14, opacity: 0.5 }} /> : <ChevronRight style={{ width: 14, height: 14, opacity: 0.5 }} />}
                  </button>
                ) : (
                  <Link
                    href={item.implemented ? item.href! : "#"}
                    onClick={(e) => handleNav(e, item.implemented)}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "7px 10px", borderRadius: 6, textDecoration: "none",
                      color: itemActive ? "#60a5fa" : "#cbd5e1",
                      fontSize: 13, fontWeight: itemActive ? 600 : 500,
                      gap: 10, marginBottom: 1,
                      background: itemActive ? "rgba(59,130,246,0.12)" : "transparent",
                      borderLeft: itemActive ? "3px solid #3b82f6" : "3px solid transparent",
                    }}
                    onMouseEnter={e => { if (!itemActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.badge && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: item.badgeColor || "#3b82f6", color: "#fff" }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div style={{ marginLeft: 20, borderLeft: "1px solid #334155", paddingLeft: 12, marginBottom: 2 }}>
                    {item.children!.map(child => {
                      const childActive = isActivePath(child.href);
                      return (
                        <Link
                          key={child.name}
                          href={child.implemented ? child.href : "#"}
                          onClick={(e) => handleNav(e, child.implemented)}
                          style={{
                            display: "block", padding: "5px 10px", borderRadius: 5,
                            textDecoration: "none",
                            color: childActive ? "#60a5fa" : "#94a3b8",
                            fontSize: 12.5, fontWeight: childActive ? 600 : 400,
                            background: childActive ? "rgba(59,130,246,0.1)" : "transparent",
                            marginBottom: 1,
                          }}
                          onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
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

        {/* Footer */}
        <div style={{ padding: 10, borderTop: "1px solid #334155", flexShrink: 0 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "8px 10px", borderRadius: 6,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0", fontSize: 11, fontWeight: 600, cursor: "pointer",
            marginBottom: 10, textAlign: "left",
          }}>
            <Building2 style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.company_name || "Company"}</span>
            <ChevronRight style={{ width: 12, height: 12, color: "#64748b" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` : "?"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{user ? `${user.first_name} ${user.last_name}` : "User"}</div>
              <div style={{ color: "#64748b", fontSize: 10.5, lineHeight: 1.2, marginTop: 2 }}>{user?.email || ""}</div>
            </div>
            <button onClick={() => logout()} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }} title="Sign out">
              <LogOut style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
