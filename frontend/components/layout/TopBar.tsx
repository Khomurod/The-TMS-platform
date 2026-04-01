"use client";

import { usePathname } from "next/navigation";
import { 
  Search, 
  HelpCircle, 
  Sun, 
  Settings, 
  Send, 
  Bell, 
  User, 
  Plus,
  ChevronDown,
  Globe,
  Columns3,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TopBar — Clean white header matching Datatruck reference.
   Breadcrumbs + search + action buttons.
   ═══════════════════════════════════════════════════════════════ */

export default function TopBar() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname.includes("drivers")) return ["HR management", "Drivers", "Active drivers"];
    if (pathname.includes("loads")) return ["Load management", "All Loads"];
    if (pathname.includes("fleet")) return ["Fleet management", "Trucks"];
    if (pathname.includes("dashboard")) return ["Dashboard", "Overview"];
    if (pathname.includes("accounting")) return ["Accounting", "Salary", "Batches"];
    if (pathname.includes("salary")) return ["Accounting", "Salary"];
    return ["Home"];
  };

  const breadcrumbs = getBreadcrumbs();

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
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          height: 32,
          overflow: "hidden",
        }}>
          <select style={{
            background: "#f1f5f9", border: "none",
            borderRight: "1px solid #e2e8f0",
            padding: "0 8px", height: "100%",
            fontSize: 11, color: "#475569",
            fontWeight: 600, cursor: "pointer", outline: "none",
          }}>
            <option>All</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Ctrl + K to search"
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: 12, color: "#334155", width: 160,
              }}
            />
          </div>
        </div>

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

        {/* Create */}
        <button style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 6,
          background: "#fff", border: "1px solid #e2e8f0",
          fontSize: 12, fontWeight: 600, color: "#334155",
          cursor: "pointer",
        }}>
          <Plus style={{ width: 14, height: 14, color: "#94a3b8" }} />
          Create new
        </button>

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
