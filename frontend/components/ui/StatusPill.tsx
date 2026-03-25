interface StatusPillProps {
  label: string;
  color: string;
  bg: string;
}

export default function StatusPill({ label, color, bg }: StatusPillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-1)",
        padding: "2px var(--spacing-3)",
        borderRadius: "var(--radius-full)",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        color,
        backgroundColor: bg,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--radius-full)",
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}
