"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Container,
  Users,
  Receipt,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Loads", href: "/loads", icon: Truck },
  { label: "Fleet", href: "/fleet", icon: Container },
  { label: "Drivers", href: "/drivers", icon: Users },
  { label: "Accounting", href: "/accounting", icon: Receipt },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minHeight: "100vh",
        backgroundColor: "var(--surface-low)",
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-8) 0",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        transition: "background-color 0.2s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 var(--spacing-8)",
          marginBottom: "var(--spacing-12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          <h1
            className="headline-sm"
            style={{ color: "var(--on-surface)", margin: 0, lineHeight: 1.2 }}
          >
            Kinetic TMS
          </h1>
          <Zap
            size={18}
            style={{ color: "var(--primary)" }}
            strokeWidth={2.5}
          />
        </div>
        <span
          className="label-sm"
          style={{
            color: "var(--on-surface-variant)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.625rem",
          }}
        >
          Precision Logistics
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-3)",
                padding: "var(--spacing-3) var(--spacing-8)",
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                backgroundColor: isActive ? "var(--surface-lowest)" : "transparent",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-lowest)";
                  (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
                }
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile (bottom) */}
      <div
        style={{
          padding: "var(--spacing-4) var(--spacing-8)",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-3)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-full)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--on-primary)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          AR
        </div>
        <div>
          <div className="body-sm" style={{ fontWeight: 600, color: "var(--on-surface)" }}>
            Alex Rivera
          </div>
          <div className="label-sm">Fleet Director</div>
        </div>
      </div>
    </aside>
  );
}
