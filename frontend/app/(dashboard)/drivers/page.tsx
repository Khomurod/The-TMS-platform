/**
 * Drivers Page — Driver roster with compliance status indicators.
 */
'use client';

import { useDrivers, type DriverItem } from '@/lib/hooks/drivers';
import { Skeleton } from '@/components/ui/skeleton';
import CreateDriverDialog from '@/components/drivers/CreateDriverDialog';
import DriverDialog from '@/components/drivers/DriverDialog';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-400',
  on_trip: 'bg-amber-500/20 text-amber-400',
  off_duty: 'bg-gray-500/20 text-gray-400',
  inactive: 'bg-red-500/20 text-red-400',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  company_w2: 'Company (W2)',
  owner_operator_1099: 'Owner-Op (1099)',
  lease_operator: 'Lease',
};

function isExpiringSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function ComplianceDot({ dateStr }: { dateStr?: string }) {
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  if (isExpired(dateStr)) return <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Expired" />;
  if (isExpiringSoon(dateStr)) return <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Expiring soon" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Valid" />;
}

export default function DriversPage() {
  const { data, isLoading, error } = useDrivers();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (id: string) => {
    setSelectedDriverId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Driver roster, compliance tracking, and pay rate configuration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateDriverDialog />
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total} driver{data.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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
          <p className="text-destructive text-sm">Error loading drivers.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No drivers found.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>CDL</TableHead>
                <TableHead>Medical</TableHead>
                <TableHead className="text-right">Pay Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((d: DriverItem) => (
                <TableRow 
                  key={d.id} 
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(d.id)}
                >
                  <TableCell className="font-medium text-primary">
                    {d.first_name} {d.last_name}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[d.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {EMPLOYMENT_LABELS[d.employment_type] ?? d.employment_type}
                  </TableCell>
                  <TableCell className="text-sm">{d.phone ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ComplianceDot dateStr={d.cdl_expiry_date} />
                      <span className="text-xs text-muted-foreground">
                        {d.cdl_expiry_date ? new Date(d.cdl_expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ComplianceDot dateStr={d.medical_card_expiry_date} />
                      <span className="text-xs text-muted-foreground">
                        {d.medical_card_expiry_date ? new Date(d.medical_card_expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {d.pay_rate_type && d.pay_rate_value
                      ? `${d.pay_rate_type === 'cpm' ? '$' : ''}${d.pay_rate_value}${d.pay_rate_type === 'percentage' ? '%' : d.pay_rate_type === 'cpm' ? '/mi' : ''}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {data.items.length} of {data.total} drivers
        </p>
      )}

      <DriverDialog
        driverId={selectedDriverId} 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
