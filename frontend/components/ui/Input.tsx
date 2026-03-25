import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
        {label && (
          <label
            className="label-md"
            style={{ color: "var(--on-surface-variant)", fontWeight: 500 }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            backgroundColor: "var(--surface-container-high)",
            border: "1px solid rgba(199, 196, 216, 0.15)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-3) var(--spacing-4)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-body)",
            color: "var(--on-surface)",
            outline: "none",
            transition: "background-color 0.15s ease, border-color 0.15s ease",
            width: "100%",
            ...(error ? { borderColor: "var(--error)" } : {}),
            ...style,
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-lowest)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-container-high)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(199, 196, 216, 0.15)";
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: "0.75rem", color: "var(--error)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
