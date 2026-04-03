"use client";

/**
 * Registration Page — Company signup for Safehaul TMS.
 * Uses design system tokens and CSS classes exclusively.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Truck, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

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

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
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

        {success ? (
          <div
            className="card-flat"
            style={{
              textAlign: "center",
              padding: "var(--spacing-8)",
              background: "var(--success-container)",
            }}
          >
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--success)" }} />
            <h2 className="headline-sm" style={{ color: "var(--success)", marginBottom: 8 }}>
              Registration Successful!
            </h2>
            <p className="body-md" style={{ color: "var(--on-surface-variant)" }}>
              Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="headline-md" style={{ marginBottom: "var(--spacing-6)", color: "var(--on-surface)" }}>
              Register your company
            </h2>

            {error && (
              <div
                className="body-md"
                role="alert"
                style={{
                  background: "var(--error-container)",
                  border: "1px solid var(--error)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-3) var(--spacing-4)",
                  color: "var(--error)",
                  marginBottom: "var(--spacing-4)",
                }}
              >
                {error}
              </div>
            )}

            {/* Company Name */}
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label htmlFor="reg-company" className="form-label">Company Name</label>
              <input
                id="reg-company"
                type="text"
                value={form.company_name}
                onChange={handleChange("company_name")}
                placeholder="Your trucking company"
                required
                className="input-base"
              />
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: "var(--spacing-4)" }}>
              <div>
                <label htmlFor="reg-first" className="form-label">First Name</label>
                <input
                  id="reg-first"
                  type="text"
                  value={form.first_name}
                  onChange={handleChange("first_name")}
                  placeholder="John"
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label htmlFor="reg-last" className="form-label">Last Name</label>
                <input
                  id="reg-last"
                  type="text"
                  value={form.last_name}
                  onChange={handleChange("last_name")}
                  placeholder="Doe"
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@company.com"
                required
                className="input-base"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "var(--spacing-6)" }}>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                required
                minLength={8}
                className="input-base"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="body-md" style={{ textAlign: "center", marginTop: "var(--spacing-6)", color: "var(--on-surface-variant)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
