// components/loads/LoadsTable.tsx — reusable data table for load board tabs

import type { LoadListItem } from '@/lib/types/loads';
import StatusBadge from '@/components/loads/StatusBadge';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LoadsTableProps {
  items: LoadListItem[];
  onRowClick?: (loadId: string) => void;
}

function formatCurrency(val?: number): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LoadsTable({ items, onRowClick }: LoadsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground text-sm">No loads found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[120px]">Load #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((load) => (
            <TableRow
              key={load.id}
              className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => onRowClick?.(load.id)}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/loads/${load.id}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {load.load_number}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={load.status} />
              </TableCell>
              <TableCell className="text-sm">
                {load.pickup_city ?? '—'}
              </TableCell>
              <TableCell className="text-sm">
                {load.delivery_city ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(load.pickup_date)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(load.delivery_date)}
              </TableCell>
              <TableCell className="text-sm">
                {load.driver_name ?? '—'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(load.total_rate ?? load.base_rate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
