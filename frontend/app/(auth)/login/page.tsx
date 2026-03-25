"use client";

/**
 * Login Page — matching the Kinetic Precision Framework aesthetic.
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
      setError("Invalid email or password");
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
        background: "var(--surface-lowest)",
        padding: "var(--space-400)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--surface-low)",
          borderRadius: "var(--radius-300)",
          padding: "var(--space-600)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-500)" }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "var(--space-100)",
            }}
          >
            KINETIC
          </div>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
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
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--space-400)",
            }}
          >
            Sign in to your account
          </h2>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "var(--radius-200)",
                padding: "var(--space-200) var(--space-300)",
                color: "#ef4444",
                fontSize: "var(--text-sm)",
                marginBottom: "var(--space-300)",
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "var(--space-300)" }}>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "var(--space-100)",
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
              style={{
                width: "100%",
                padding: "var(--space-200) var(--space-300)",
                background: "var(--surface-container-high)",
                border: "1px solid transparent",
                borderRadius: "var(--radius-200)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.background = "var(--surface-lowest)";
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.background = "var(--surface-container-high)";
                e.target.style.borderColor = "transparent";
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "var(--space-400)" }}>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "var(--space-100)",
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
              style={{
                width: "100%",
                padding: "var(--space-200) var(--space-300)",
                background: "var(--surface-container-high)",
                border: "1px solid transparent",
                borderRadius: "var(--radius-200)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.background = "var(--surface-lowest)";
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.background = "var(--surface-container-high)";
                e.target.style.borderColor = "transparent";
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "var(--space-200) var(--space-300)",
              background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
              border: "none",
              borderRadius: "var(--radius-200)",
              color: "#fff",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s ease",
              letterSpacing: "0.02em",
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-400)",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
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
