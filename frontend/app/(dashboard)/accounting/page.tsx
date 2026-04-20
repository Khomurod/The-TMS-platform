/**
 * Accounting Page — Settlements listing with status management.
 */
'use client';

import { useSettlements, type SettlementItem } from '@/lib/hooks/accounting';
import { Skeleton } from '@/components/ui/skeleton';
import GenerateSettlementDialog from '@/components/accounting/GenerateSettlementDialog';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SETTLEMENT_STATUS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  unposted: 'bg-blue-500/20 text-blue-400',
  posted: 'bg-amber-500/20 text-amber-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
};

function formatCurrency(val?: number): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(val?: string): string {
  if (!val) return '—';
  let d: Date;
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(val)) {
    const [year, month, day] = val.split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(val);
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AccountingPage() {
  const { data, isLoading, error } = useSettlements();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Settlements, driver pay, and broker invoicing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateSettlementDialog />
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total} settlement{data.total !== 1 ? 's' : ''}
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
          <p className="text-destructive text-sm">Error loading settlements.</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No settlements found. Generate one from a completed load.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Settlement #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Loads</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((s: SettlementItem) => (
                <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/accounting/${s.id}`} className="text-primary hover:underline">
                      {s.settlement_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SETTLEMENT_STATUS[s.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{s.driver_name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(s.period_start)} – {formatDate(s.period_end)}
                  </TableCell>
                  <TableCell className="text-sm text-center">{s.load_count}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(s.gross_pay)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(s.net_pay)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.total > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {data.items.length} of {data.total} settlements
        </p>
      )}
    </div>
  );
}
