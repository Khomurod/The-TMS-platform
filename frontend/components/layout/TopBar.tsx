"use client";

import { Moon, Sun, Bell, Zap, Search } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: 64,
        backgroundColor: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--spacing-10)",
        marginLeft: "var(--sidebar-width)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        transition: "background-color 0.2s ease",
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-3)",
          backgroundColor: "var(--surface-container-high)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-2) var(--spacing-4)",
          width: "clamp(280px, 40%, 480px)",
          transition: "background-color 0.2s ease",
        }}
        className="ghost-border"
      >
        <Search size={16} style={{ color: "var(--on-surface-variant)" }} />
        <input
          type="text"
          placeholder="Search loads, drivers, or trucks..."
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--on-surface)",
            fontSize: "0.875rem",
            width: "100%",
            fontFamily: "var(--font-body)",
          }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--on-surface-variant)",
            padding: "var(--spacing-2)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            transition: "color 0.15s ease",
          }}
          aria-label="Toggle dark mode"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--on-surface-variant)",
            padding: "var(--spacing-2)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Notification badge */}
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--error)",
            }}
          />
        </button>

        {/* App Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2)",
            color: "var(--on-surface)",
            fontSize: "0.8125rem",
            fontWeight: 500,
          }}
        >
          <span>Kinetic TMS</span>
          <Zap size={14} style={{ color: "var(--primary)" }} strokeWidth={2.5} />
        </div>
      </div>
    </header>
  );
}
