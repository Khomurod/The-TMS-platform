"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            // Base
            "w-full px-3.5 py-2.5 rounded-lg text-sm",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "shadow-sm",
            // Transitions
            "transition-all duration-150 ease-in-out",
            // Focus
            "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            "dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
            // Hover
            "hover:border-slate-300 dark:hover:border-slate-600",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900",
            // Error
            error && "border-red-500 dark:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20 focus:border-red-500",
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1">
            {error}
          </span>
        )}
        {hint && !error && (
          <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
