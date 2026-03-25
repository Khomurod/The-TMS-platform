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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--surface-lowest)",
          color: "var(--text-muted)",
          fontSize: "var(--text-lg)",
        }}
      >
        Loading...
      </div>
    );
  }

  // Don't render until authenticated
  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: "var(--sidebar-width)" }}>
        <TopBar />
        <main
          style={{
            padding: "var(--spacing-8) var(--spacing-10)",
            minHeight: "calc(100vh - 64px)",
          }}
        >
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
