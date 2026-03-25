"use client";

/**
 * Auth Layout — wraps login/register pages with AuthProvider.
 * No sidebar or topbar — clean, centered layout.
 */

import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
