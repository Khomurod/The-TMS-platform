import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  subtitleColor,
  icon,
  badge,
  badgeColor,
}: KPICardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-lowest)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--spacing-8)",
        flex: 1,
        minWidth: 180,
        position: "relative",
        transition: "background-color 0.2s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "var(--spacing-4)",
        }}
      >
        <span
          className="label-lg"
          style={{
            color: "var(--on-surface-variant)",
            fontSize: "0.625rem",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>

        {/* Icon or Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          {badge && (
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: badgeColor || "var(--success)",
              }}
            >
              {badge}
            </span>
          )}
          {icon && (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface-container-high)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--on-surface-variant)",
              }}
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div
        className="title-lg tabular-nums"
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          color: "var(--on-surface)",
          marginBottom: "var(--spacing-1)",
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span
          className="body-sm"
          style={{
            color: subtitleColor || "var(--on-surface-variant)",
            fontSize: "0.75rem",
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
