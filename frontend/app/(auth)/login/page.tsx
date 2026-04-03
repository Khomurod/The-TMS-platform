"use client";

/**
 * Login Page — Safehaul Design System.
 * Uses design system tokens and CSS classes exclusively.
 * No inline styles for focus/blur — CSS handles it.
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Truck } from "lucide-react";
import Button from "@/components/ui/Button";

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
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-8)" }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Truck className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="auth-logo">Safehaul</div>
          <p className="auth-subtitle">Transportation Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="headline-md" style={{ marginBottom: "var(--spacing-6)", color: "var(--on-surface)" }}>
            Sign in to your account
          </h2>

          {error && (
            <div
              className="body-md"
              style={{
                background: "var(--error-container)",
                border: "1px solid var(--error)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-2) var(--spacing-3)",
                color: "var(--error)",
                marginBottom: "var(--spacing-4)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="input-base"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "var(--spacing-6)" }}>
            <label htmlFor="login-password" className="form-label">
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
              className="input-base"
            />
          </div>

          {/* Submit Button */}
          <Button
            id="login-submit"
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <p className="body-md" style={{ textAlign: "center", marginTop: "var(--spacing-6)", color: "var(--on-surface-variant)" }}>
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            Register your company
          </a>
        </p>
      </div>
    </div>
  );
}
