/**
 * Load Board — Tabbed view with Live, Upcoming, and Completed loads.
 * Core operational module of the TMS.
 */
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import LoadsTable from '@/components/loads/LoadsTable';
import LoadDrawer from '@/components/loads/LoadDrawer';
import CreateLoadDialog from '@/components/loads/CreateLoadDialog';
import { useLiveLoads, useUpcomingLoads, useCompletedLoads } from '@/lib/hooks/loads';

type BoardTab = 'live' | 'upcoming' | 'completed';

export default function LoadsPage() {
  const [activeTab, setActiveTab] = useState<BoardTab>('live');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const live = useLiveLoads();
  const upcoming = useUpcomingLoads();
  const completed = useCompletedLoads();

  const handleRowClick = (loadId: string) => {
    setSelectedLoadId(loadId);
    setDrawerOpen(true);
  };

  const renderTabContent = (
    data: typeof live,
    label: string,
  ) => {
    if (data.isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (data.error) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">
            Error loading {label.toLowerCase()} loads. Please retry.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <LoadsTable
          items={data.data?.items ?? []}
          onRowClick={handleRowClick}
        />
        {data.data && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {data.data.items.length} of {data.data.total} loads
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Load Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your freight — Live, Upcoming, and Completed loads.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CreateLoadDialog />
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">
              Live: <span className="text-foreground font-medium">{live.data?.total ?? '—'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">
              Upcoming: <span className="text-foreground font-medium">{upcoming.data?.total ?? '—'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">
              Completed: <span className="text-foreground font-medium">{completed.data?.total ?? '—'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabbed Board */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as BoardTab)}
        className="w-full"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="live" className="data-[state=active]:bg-background">
            Live Loads
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-background">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-background">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          {renderTabContent(live, 'Live')}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {renderTabContent(upcoming, 'Upcoming')}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {renderTabContent(completed, 'Completed')}
        </TabsContent>
      </Tabs>

      {/* Load Detail Drawer */}
      <LoadDrawer
        loadId={selectedLoadId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
