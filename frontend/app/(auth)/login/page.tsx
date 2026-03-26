"use client";

/**
 * Login Page — Kinetic Precision Framework aesthetic.
 * Uses correct design tokens from globals.css.
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface)",
        padding: "var(--spacing-8)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--surface-low)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-10)",
          boxShadow: "0 8px 32px var(--shadow-ambient)",
        }}
        className="ghost-border"
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-8)" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "4px",
            }}
          >
            KINETIC
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--on-surface-variant)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Transportation Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "var(--spacing-6)",
            }}
          >
            Sign in to your account
          </h2>

          {error && (
            <div
              style={{
                background: "var(--error-container)",
                border: "1px solid var(--error)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-2) var(--spacing-3)",
                color: "var(--error)",
                fontSize: "0.85rem",
                marginBottom: "var(--spacing-4)",
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--on-surface-variant)",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "var(--spacing-3) var(--spacing-4)",
                background: "var(--surface-container-high)",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-lg)",
                color: "var(--on-surface)",
                fontSize: "0.9rem",
                outline: "none",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => {
                e.target.style.background = "var(--surface-lowest)";
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-fixed)";
              }}
              onBlur={(e) => {
                e.target.style.background = "var(--surface-container-high)";
                e.target.style.borderColor = "var(--outline-variant)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "var(--spacing-6)" }}>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--on-surface-variant)",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "var(--spacing-3) var(--spacing-4)",
                background: "var(--surface-container-high)",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-lg)",
                color: "var(--on-surface)",
                fontSize: "0.9rem",
                outline: "none",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => {
                e.target.style.background = "var(--surface-lowest)";
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-fixed)";
              }}
              onBlur={(e) => {
                e.target.style.background = "var(--surface-container-high)";
                e.target.style.borderColor = "var(--outline-variant)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="gradient-primary"
            style={{
              width: "100%",
              padding: "var(--spacing-3) var(--spacing-4)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s ease",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-body)",
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "var(--spacing-6)",
            fontSize: "0.85rem",
            color: "var(--on-surface-variant)",
          }}
        >
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Register your company
          </a>
        </p>
      </div>
    </div>
  );
}
