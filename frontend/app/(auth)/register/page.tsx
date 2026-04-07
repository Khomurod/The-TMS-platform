/**
 * Register Page — company onboarding form.
 *
 * Calls POST /auth/register via authStore.register().
 * Creates Company + User(company_admin) atomically.
 * Fields map to RegisterRequest schema in backend/app/auth/schemas.py:
 *   email, password, first_name, last_name, company_name, mc_number, dot_number
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    company_name: "",
    mc_number: "",
    dot_number: "",
  });
  const { register, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(formData);
      router.push("/dashboard");
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          <span className="text-lg font-semibold">Safehaul TMS</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Register your trucking company to get started
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="James"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              placeholder="Wenze"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@yourcompany.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            name="company_name"
            placeholder="Wenze Trucking"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

        {/* Authority numbers row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="mc_number">MC Number</Label>
            <Input
              id="mc_number"
              name="mc_number"
              placeholder="MC-789456"
              value={formData.mc_number}
              onChange={handleChange}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dot_number">DOT Number</Label>
            <Input
              id="dot_number"
              name="dot_number"
              placeholder="DOT-3214567"
              value={formData.dot_number}
              onChange={handleChange}
              className="h-11"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
