"use client";

/**
 * Dashboard Layout — protected route.
 * Wraps all dashboard pages with AuthProvider + Sidebar + TopBar.
 * Redirects to /login if not authenticated.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--surface)] text-[var(--on-surface-variant)] title-md">
        Loading...
      </div>
    );
  }

  // Don't render until authenticated
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--on-surface)] font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full relative">
        <TopBar />
        {/* Step 1: Fixed Box Model - Children render their own cards entirely on the surface background */}
        <main className="flex-1 w-full overflow-x-hidden bg-[var(--surface-low)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </AuthProvider>
  );
}
