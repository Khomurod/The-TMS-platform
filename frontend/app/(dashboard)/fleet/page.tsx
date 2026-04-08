/**
 * Fleet Management Page — Trucks & Trailers with DOT compliance indicators.
 */
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTrucks, useTrailers, type TruckItem, type TrailerItem } from '@/lib/hooks/fleet';
import CreateEquipmentDialog from '@/components/fleet/CreateEquipmentDialog';
import Link from 'next/link';

const EQUIP_STATUS: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-400',
  in_use: 'bg-amber-500/20 text-amber-400',
  maintenance: 'bg-red-500/20 text-red-400',
};

function DotBadge({ dateStr }: { dateStr?: string }) {
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  const expiry = new Date(dateStr);
  const now = Date.now();
  const diff = expiry.getTime() - now;
  const isExpired = diff < 0;
  const isSoon = !isExpired && diff < 30 * 24 * 60 * 60 * 1000;
  const formatted = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : isSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      <span className="text-xs text-muted-foreground">{formatted}</span>
    </div>
  );
}

export default function FleetPage() {
  const [tab, setTab] = useState<'trucks' | 'trailers'>('trucks');
  const trucks = useTrucks();
  const trailers = useTrailers();

  const renderSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trucks, trailers, DOT inspections, and maintenance tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateEquipmentDialog type="truck" />
          <CreateEquipmentDialog type="trailer" />
          <span className="text-sm text-muted-foreground">
            Trucks: <span className="text-foreground font-medium">{trucks.data?.total ?? '—'}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Trailers: <span className="text-foreground font-medium">{trailers.data?.total ?? '—'}</span>
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'trucks' | 'trailers')} className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="trucks" className="data-[state=active]:bg-background">Trucks</TabsTrigger>
          <TabsTrigger value="trailers" className="data-[state=active]:bg-background">Trailers</TabsTrigger>
        </TabsList>

        <TabsContent value="trucks" className="mt-4">
          {trucks.isLoading && renderSkeleton()}
          {trucks.error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-destructive text-sm">Error loading trucks.</p>
            </div>
          )}
          {trucks.data && trucks.data.items.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No trucks found.</p>
            </div>
          )}
          {trucks.data && trucks.data.items.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Unit #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Year / Make / Model</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>DOT Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trucks.data.items.map((t: TruckItem) => (
                    <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/fleet/trucks/${t.id}`} className="text-primary hover:underline">{t.unit_number}</Link>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${EQUIP_STATUS[t.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {[t.year, t.make, t.model].filter(Boolean).join(' ') || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{t.vin ?? '—'}</TableCell>
                      <TableCell className="text-sm">{t.license_plate ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{t.ownership_type?.replace(/_/g, ' ') ?? '—'}</TableCell>
                      <TableCell><DotBadge dateStr={t.dot_inspection_expiry} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trailers" className="mt-4">
          {trailers.isLoading && renderSkeleton()}
          {trailers.error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-destructive text-sm">Error loading trailers.</p>
            </div>
          )}
          {trailers.data && trailers.data.items.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No trailers found.</p>
            </div>
          )}
          {trailers.data && trailers.data.items.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Unit #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Year / Make / Model</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>DOT Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trailers.data.items.map((t: TrailerItem) => (
                    <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/fleet/trailers/${t.id}`} className="text-primary hover:underline">{t.unit_number}</Link>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${EQUIP_STATUS[t.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{t.trailer_type?.replace(/_/g, ' ') ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {[t.year, t.make, t.model].filter(Boolean).join(' ') || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{t.ownership_type?.replace(/_/g, ' ') ?? '—'}</TableCell>
                      <TableCell><DotBadge dateStr={t.dot_inspection_expiry} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
