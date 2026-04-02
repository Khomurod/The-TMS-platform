"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Search, Sun, Settings, Send, Bell, User, Plus,
  ChevronDown, Globe, Package, Users, Truck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TopBar — Phase 6 Enhanced (Blueprint §3.5)
   Breadcrumbs + Ctrl+K search + "Create new" dropdown + notifications
   ═══════════════════════════════════════════════════════════════ */

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const getBreadcrumbs = () => {
    if (pathname.includes("/drivers/") && pathname.split("/").length > 2) return ["HR Management", "Drivers", "Driver Profile"];
    if (pathname.includes("/loads/") && pathname.split("/").length > 2) return ["Load Management", "All Loads", "Load Detail"];
    if (pathname.includes("drivers")) return ["HR Management", "Drivers", "Active Drivers"];
    if (pathname.includes("loads")) return ["Load Management", "All Loads"];
    if (pathname.includes("fleet")) return ["Fleet Management", "Trucks"];
    if (pathname.includes("dashboard")) return ["Dashboard", "Overview"];
    if (pathname.includes("accounting")) return ["Accounting", "Salary", "Batches"];
    return ["Home"];
  };

  const breadcrumbs = getBreadcrumbs();

  const createOptions = [
    { label: "New Load", href: "/loads/new", icon: <Package className="h-3.5 w-3.5" /> },
    { label: "New Driver", href: "#", icon: <Users className="h-3.5 w-3.5" /> },
    { label: "New Truck", href: "#", icon: <Truck className="h-3.5 w-3.5" /> },
  ];

  return (
    <header style={{
      height: 48,
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Left: Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <span style={{ margin: "0 8px", color: "#cbd5e1", fontSize: 12 }}>/</span>
            )}
            <span style={{
              fontSize: 13,
              color: i === breadcrumbs.length - 1 ? "#0f172a" : "#64748b",
              fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right: Search + Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search — clicks open CommandMenu */}
        <button
          onClick={onSearchClick}
          style={{
            display: "flex", alignItems: "center",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            height: 32,
            padding: "0 12px",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <Search style={{ width: 14, height: 14, color: "#94a3b8" }} />
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
            Ctrl + K to search
          </span>
          <kbd style={{
            fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
            background: "#e2e8f0", color: "#64748b", marginLeft: 8,
          }}>⌘K</kbd>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />

        {/* Version */}
        <button style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, color: "#0f172a",
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "#eff6ff", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Globe style={{ width: 13, height: 13, color: "#3b82f6" }} />
          </span>
          Safehaul 2.0
          <ChevronDown style={{ width: 12, height: 12, color: "#94a3b8" }} />
        </button>

        {/* Create New — with dropdown (§3.5) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6,
              background: "#fff", border: "1px solid #e2e8f0",
              fontSize: 12, fontWeight: 600, color: "#334155",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: 14, height: 14, color: "#94a3b8" }} />
            Create new
            <ChevronDown style={{ width: 12, height: 12, color: "#94a3b8" }} />
          </button>

          {showCreateMenu && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowCreateMenu(false)} />
              <div style={{
                position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 20,
                background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)", minWidth: 180,
                padding: "4px 0",
              }}>
                {createOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setShowCreateMenu(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 14px", fontSize: 12.5, fontWeight: 500,
                      color: "#334155", textDecoration: "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {opt.icon}
                    {opt.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live Support */}
        <button style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 700, color: "#10b981",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#10b981", display: "inline-block",
          }} />
          Live Support
        </button>

        {/* Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit" }}>
            <Sun style={{ width: 16, height: 16 }} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit" }}>
            <Settings style={{ width: 16, height: 16 }} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit" }}>
            <Send style={{ width: 16, height: 16 }} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit", position: "relative" }}>
            <Bell style={{ width: 16, height: 16 }} />
            <span style={{
              position: "absolute", top: 2, right: 2,
              width: 6, height: 6, borderRadius: "50%",
              background: "#ef4444",
            }} />
          </button>
          <button style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#f1f5f9", border: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", marginLeft: 4, color: "#475569",
          }}>
            <User style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </header>
  );
}
