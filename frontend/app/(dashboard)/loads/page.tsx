/**
 * Load Board - Tabbed view with Live, Upcoming, Completed, and All loads.
 * Core operational module of the TMS.
 */
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import LoadsTable from '@/components/loads/LoadsTable';
import LoadDrawer from '@/components/loads/LoadDrawer';
import CreateLoadDialog from '@/components/loads/CreateLoadDialog';
import DocumentUploadGateway from '@/components/loads/DocumentUploadGateway';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  useAllLoads,
  useCompletedLoads,
  useLiveLoads,
  useUpcomingLoads,
} from '@/lib/hooks/loads';

type BoardTab = 'live' | 'upcoming' | 'completed' | 'all';

export default function LoadsPage() {
  const [activeTab, setActiveTab] = useState<BoardTab>('all');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const page = 1;
  const pageSize = 20;

  const live = useLiveLoads(page, pageSize);
  const upcoming = useUpcomingLoads(page, pageSize);
  const completed = useCompletedLoads(page, pageSize);
  const allLoads = useAllLoads(page, pageSize);

  const handleRowClick = (loadId: string) => {
    setSelectedLoadId(loadId);
    setDrawerOpen(true);
  };

  const renderTabContent = (data: typeof live, label: string) => {
    const normalizedLabel = label.toLowerCase();
    const errorLabel = normalizedLabel.endsWith('loads')
      ? normalizedLabel
      : `${normalizedLabel} loads`;

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
          <p className="text-sm text-destructive">
            Error loading {errorLabel}. Please retry.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <LoadsTable items={data.data?.items ?? []} onRowClick={handleRowClick} />
        {data.data && (
          <p className="text-right text-xs text-muted-foreground">
            Showing {data.data.items.length} of {data.data.total} loads
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Load Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your freight - Live, Upcoming, Completed, and all loads.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" onClick={() => setGatewayOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Load
          </Button>

          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-muted-foreground">
              All Loads: <span className="font-medium text-foreground">{allLoads.data?.total ?? '-'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">
              Live: <span className="font-medium text-foreground">{live.data?.total ?? '-'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">
              Upcoming: <span className="font-medium text-foreground">{upcoming.data?.total ?? '-'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">
              Completed: <span className="font-medium text-foreground">{completed.data?.total ?? '-'}</span>
            </span>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as BoardTab)}
        className="w-full"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            All Loads
          </TabsTrigger>
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

        <TabsContent value="all" className="mt-4">
          {renderTabContent(allLoads, 'All Loads')}
        </TabsContent>

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

      <LoadDrawer
        loadId={selectedLoadId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <DocumentUploadGateway
        open={gatewayOpen}
        onOpenChange={setGatewayOpen}
        onParseSuccess={(data) => {
          setParsedData(data);
          setCreateDialogOpen(true);
        }}
        onManualEntry={() => {
          setParsedData(null);
          setCreateDialogOpen(true);
        }}
      />

      <CreateLoadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialData={parsedData}
      />
    </div>
  );
}
