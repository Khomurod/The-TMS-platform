"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Input — Design System Component
   Token-driven via globals.css input-base class.
   ═══════════════════════════════════════════════════════════════ */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="form-label"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input-base",
            error && "input-error",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="form-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="form-hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

/* ═══════════════════════════════════════════════════════════════
   FormField — Reusable form field wrapper
   Replaces the Modal.tsx FormField export.
   ═══════════════════════════════════════════════════════════════ */

interface FormFieldProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, required, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className={cn("form-label", required && "form-label-required")}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
