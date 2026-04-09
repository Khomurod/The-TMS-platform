/**
 * Dashboard Layout — the authenticated shell with Sidebar + TopBar.
 * Wraps all /dashboard, /loads, /dispatch, /drivers, /fleet, /accounting, /settings routes.
 */

"use client";

import { useEffect, useState } from "react";
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
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    hydrate().then(() => setIsHydrated(true));
  }, [hydrate]);

  useEffect(() => {
    // Only redirect AFTER hydration is complete — prevents race condition
    // where isAuthenticated is false simply because hydrate() hasn't finished yet
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isLoading, isAuthenticated, router]);

  // Show loading skeleton while hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-[240px] bg-card border-r border-border">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-3/4" />
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
