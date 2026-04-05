"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Truck, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left: Hero Panel ── */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          {/* Brand */}
          <div className="auth-hero-logo">
            <div className="auth-hero-logo-icon">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="auth-hero-logo-text">Safehaul TMS</span>
          </div>

          {/* Headline */}
          <h1 className="auth-hero-headline">
            The complete platform for modern freight operations
          </h1>
          <p className="auth-hero-sub">
            Manage loads, drivers, fleet, and accounting in one unified workspace built for serious operators.
          </p>

          {/* Features */}
          <div>
            {[
              "Real-time dispatch and load tracking",
              "Driver settlements and payroll automation",
              "Fleet compliance and maintenance tracking",
              "Accounting and revenue analytics",
            ].map((f) => (
              <div key={f} className="auth-hero-feature">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--sidebar-active-text)", flexShrink: 0 }} />
                <span className="auth-hero-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="auth-panel">
        <div className="auth-panel-inner">
          {/* Form header */}
          <div className="mb-8">
            <h2 className="headline-sm" style={{ color: "var(--on-surface)", marginBottom: 6 }}>
              Welcome back
            </h2>
            <p className="body-md" style={{ color: "var(--on-surface-variant)" }}>
              Sign in to your Safehaul account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5 body-md"
              style={{ background: "var(--error-container)", color: "var(--error)", border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input-base"
                  style={{ paddingRight: 40 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--on-surface-variant)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-2"
              style={{ justifyContent: "center" }}
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="body-sm mt-6 text-center" style={{ color: "var(--on-surface-variant)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "var(--primary)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
