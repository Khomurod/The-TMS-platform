"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)]",
    "shadow-md shadow-blue-500/20",
    "hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110",
  ),
  secondary: cn(
    "text-slate-700 dark:text-slate-300",
    "bg-white dark:bg-slate-800",
    "border border-slate-200 dark:border-slate-700",
    "shadow-sm",
    "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
  ),
  tertiary: cn(
    "text-blue-600 dark:text-blue-400",
    "bg-transparent",
    "hover:bg-blue-50 dark:hover:bg-blue-500/10",
  ),
  danger: cn(
    "text-white bg-red-600",
    "shadow-md shadow-red-500/20",
    "hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-150",
          "active:scale-[0.98] active:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
