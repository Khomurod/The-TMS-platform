"use client";

/**
 * Dashboard Layout — protected route.
 * Dark sidebar + white topbar + light gray content area.
 * Ctrl+K CommandMenu integration (Phase 6).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import CommandMenu from "@/components/layout/CommandMenu";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Truck } from "lucide-react";

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Ctrl+K / Cmd+K keyboard shortcut (Blueprint §3.5)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--surface)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-pulse">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--on-surface-variant)]">Loading Safehaul...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onSearchClick={() => setCommandMenuOpen(true)} />
        <main className="flex-1 flex flex-col bg-[var(--surface)] overflow-hidden min-h-0">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Menu */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
      />
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
