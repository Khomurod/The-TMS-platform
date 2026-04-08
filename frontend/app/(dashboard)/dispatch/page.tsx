/**
 * Dispatch Center — Shows upcoming/booked loads ready for dispatch.
 * Dispatcher selects a load, assigns driver + equipment, and dispatches.
 */
'use client';

import { useState } from 'react';
import { useUpcomingLoads } from '@/lib/hooks/loads';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/loads/StatusBadge';
import DispatchDialog from '@/components/loads/DispatchDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(val?: number): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DispatchPage() {
  const { data, isLoading, error } = useUpcomingLoads(1, 50);
  const [dispatchLoadId, setDispatchLoadId] = useState('');
  const [dispatchLoadNumber, setDispatchLoadNumber] = useState('');
  const [dispatchOpen, setDispatchOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dispatch Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a load, assign driver and equipment, verify compliance, and dispatch.
          </p>
        </div>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} load{data.total !== 1 ? 's' : ''} awaiting dispatch
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">Error loading dispatchable loads.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No loads awaiting dispatch. Create a new load first.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Load #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((load) => (
                <TableRow key={load.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-primary">{load.load_number}</TableCell>
                  <TableCell><StatusBadge status={load.status} /></TableCell>
                  <TableCell className="text-sm">{load.pickup_city ?? '—'}</TableCell>
                  <TableCell className="text-sm">{load.delivery_city ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(load.pickup_date)}</TableCell>
                  <TableCell className="text-sm">{load.broker_name ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(load.total_rate ?? load.base_rate)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      onClick={() => {
                        setDispatchLoadId(load.id);
                        setDispatchLoadNumber(load.load_number);
                        setDispatchOpen(true);
                      }}
                    >
                      Dispatch
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <DispatchDialog
        loadId={dispatchLoadId}
        loadNumber={dispatchLoadNumber}
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
      />
    </div>
  );
}
