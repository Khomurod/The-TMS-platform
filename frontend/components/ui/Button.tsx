import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
    color: "var(--on-primary)",
    border: "none",
    fontWeight: 600,
  },
  secondary: {
    background: "var(--surface-lowest)",
    color: "var(--on-surface)",
    border: "1px solid rgba(199, 196, 216, 0.15)",
    fontWeight: 500,
  },
  tertiary: {
    background: "transparent",
    color: "var(--primary)",
    border: "none",
    fontWeight: 500,
  },
};

export default function Button({
  variant = "primary",
  children,
  icon,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-2)",
        padding: "var(--spacing-3) var(--spacing-6)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "opacity 0.15s ease, background-color 0.15s ease",
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "primary") (e.currentTarget as HTMLElement).style.opacity = "0.9";
        if (variant === "tertiary")
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-container-high)";
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") (e.currentTarget as HTMLElement).style.opacity = "1";
        if (variant === "tertiary")
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
