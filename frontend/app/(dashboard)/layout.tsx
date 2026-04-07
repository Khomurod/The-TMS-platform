/**
 * Dashboard Layout — the authenticated shell with Sidebar + TopBar.
 * Wraps all /dashboard, /loads, /dispatch, /drivers, /fleet, /accounting, /settings routes.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading skeleton while hydrating
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-[240px] bg-sidebar border-r border-sidebar-border">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full bg-sidebar-accent" />
            <Skeleton className="h-6 w-3/4 bg-sidebar-accent" />
            <Skeleton className="h-6 w-2/3 bg-sidebar-accent" />
            <Skeleton className="h-6 w-3/4 bg-sidebar-accent" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border px-6 flex items-center">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
