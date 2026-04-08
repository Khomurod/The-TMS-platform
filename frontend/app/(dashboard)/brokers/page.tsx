/**
 * Broker Directory — Searchable, paginated broker listing.
 */
'use client';

import { useState } from 'react';
import { useBrokers, type BrokerItem } from '@/lib/hooks/brokers';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import CreateBrokerDialog from '@/components/brokers/CreateBrokerDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

export default function BrokersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useBrokers(1, 50, search || undefined);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Broker Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
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

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search brokers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">Failed to load broker directory.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {search ? 'No brokers match your search.' : 'No brokers yet. Add your first broker above.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Company</TableHead>
                <TableHead>MC #</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((b: BrokerItem) => (
                <TableRow key={b.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.mc_number || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{b.contact_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.contact_phone || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.contact_email || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      b.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
