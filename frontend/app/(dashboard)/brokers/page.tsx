/**
 * Broker Directory - Searchable, paginated broker listing.
 */
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useBrokers } from '@/lib/hooks/brokers';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import CreateBrokerDialog from '@/components/brokers/CreateBrokerDialog';
import BrokersTable from '@/components/brokers/BrokersTable';

export default function BrokersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useBrokers(1, 50, search || undefined);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Broker Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage brokers, MC numbers, and contact information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateBrokerDialog />
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total} broker{data.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search brokers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Failed to load broker directory.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? 'No brokers match your search.' : 'No brokers yet. Add your first broker above.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && <BrokersTable items={data.items} />}
    </div>
  );
}
