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

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen text-[15px] font-semibold"
        style={{ backgroundColor: "var(--surface)", color: "var(--on-surface-variant)" }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div 
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--surface)", color: "var(--on-surface)" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 w-full relative min-w-0">
        <TopBar />
        <main 
          className="flex-1 w-full overflow-x-hidden p-5"
          style={{ backgroundColor: "var(--surface-low)" }}
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
