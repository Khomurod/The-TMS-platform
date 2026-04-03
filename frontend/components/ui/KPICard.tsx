import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className="card p-[var(--spacing-8)] flex-1 min-w-[180px] relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
      {/* Header row */}
      <div className="flex items-start justify-between mb-[var(--spacing-4)]">
        <span
          className="label-lg text-[var(--on-surface-variant)] text-[0.625rem] tracking-[0.08em]"
        >
          {title}
        </span>

        {/* Icon or Badge */}
        <div className="flex items-center gap-[var(--spacing-2)]">
          {badge && (
            <span
              className={cn(
                "text-[0.6875rem] font-semibold",
                !badgeColor && "text-[var(--success)]",
              )}
              style={badgeColor ? { color: badgeColor } : undefined}
            >
              {badge}
            </span>
          )}
          {icon && (
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--on-surface-variant)] group-hover:bg-[var(--surface-container-highest)] transition-colors">
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="title-lg tabular-nums text-[1.75rem] font-extrabold text-[var(--on-surface)] mb-[var(--spacing-1)] font-[var(--font-display)]">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span
          className={cn(
            "body-sm text-xs",
            !subtitleColor && "text-[var(--on-surface-variant)]",
          )}
          style={subtitleColor ? { color: subtitleColor } : undefined}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
