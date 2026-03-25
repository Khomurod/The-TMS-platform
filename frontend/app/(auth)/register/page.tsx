"use client";

/**
 * Registration Page — Company signup for Kinetic TMS.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/register", form);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "var(--spacing-3) var(--spacing-4)",
    background: "var(--surface-container-high)",
    border: "1px solid transparent",
    borderRadius: "var(--radius-lg)",
    color: "var(--on-surface)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s ease",
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
          maxWidth: "480px",
          background: "var(--surface-low)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-10)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-8)" }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 4,
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

        {success ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-8)",
              background: "var(--success-container)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <h2 style={{ color: "var(--success)", fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
              ✓ Registration Successful!
            </h2>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem" }}>
              Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                marginBottom: "var(--spacing-6)",
              }}
            >
              Register your company
            </h2>

            {error && (
              <div
                style={{
                  background: "var(--error-container)",
                  border: "1px solid var(--error)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-3) var(--spacing-4)",
                  color: "var(--error)",
                  fontSize: "0.85rem",
                  marginBottom: "var(--spacing-4)",
                }}
              >
                {error}
              </div>
            )}

            {/* Company Name */}
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                Company Name
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={handleChange("company_name")}
                placeholder="Your trucking company"
                required
                style={inputStyle}
              />
            </div>

            {/* Name Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-4)", marginBottom: "var(--spacing-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={handleChange("first_name")}
                  placeholder="John"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={handleChange("last_name")}
                  placeholder="Doe"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@company.com"
                required
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "var(--spacing-6)" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                required
                minLength={8}
                style={inputStyle}
              />
            </div>

            {/* Submit */}
            <button
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
                letterSpacing: "0.02em",
              }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "var(--spacing-6)",
            fontSize: "0.85rem",
            color: "var(--on-surface-variant)",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
