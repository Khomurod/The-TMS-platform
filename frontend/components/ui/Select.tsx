"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Select — Design System Component
   Token-driven via globals.css select-base class.
   ═══════════════════════════════════════════════════════════════ */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="form-label"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "select-base",
            error && "input-error",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <span id={`${selectId}-error`} className="form-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${selectId}-hint`} className="form-hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
