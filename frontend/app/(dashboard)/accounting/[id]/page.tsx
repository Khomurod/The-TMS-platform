/**
 * Settlement Detail Page — Full line items breakdown, financial summary, and status actions.
 */
'use client';

import { use } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettlementDetail, type SettlementLineItem } from '@/lib/hooks/accounting';
import { postSettlement, undoPostSettlement, paySettlement, downloadSettlementPdf } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  unposted: 'bg-blue-500/20 text-blue-400',
  posted: 'bg-amber-500/20 text-amber-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
};

const LINE_ITEM_COLORS: Record<string, string> = {
  load_pay: 'text-foreground',
  accessorial: 'text-blue-400',
  deduction: 'text-red-400',
  bonus: 'text-emerald-400',
};

function fmt$(val?: number): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data: settlement, isLoading, error } = useSettlementDetail(id);
  const [actionLoading, setActionLoading] = useState('');

  const handleAction = async (action: 'post' | 'undo' | 'pay') => {
    setActionLoading(action);
    try {
      if (action === 'post') await postSettlement(id);
      else if (action === 'undo') await undoPostSettlement(id);
      else if (action === 'pay') await paySettlement(id);
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    } catch {
      // TODO: toast error
    } finally {
      setActionLoading('');
    }
  };

  const handlePdfDownload = async () => {
    setActionLoading('pdf');
    try {
      const blob = await downloadSettlementPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settlement?.settlement_number ?? 'settlement'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // TODO: toast error
    } finally {
      setActionLoading('');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl mt-6" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">Settlement not found.</p>
          <Link href="/accounting" className="text-primary text-sm underline mt-2 inline-block">← Back to Accounting</Link>
        </div>
      </div>
    );
  }

  const loadPayItems = settlement.line_items.filter((li) => li.type === 'load_pay');
  const accessorialItems = settlement.line_items.filter((li) => li.type === 'accessorial');
  const deductionItems = settlement.line_items.filter((li) => li.type === 'deduction');
  const bonusItems = settlement.line_items.filter((li) => li.type === 'bonus');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{settlement.settlement_number}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[settlement.status] ?? 'bg-muted text-muted-foreground'}`}>
                {settlement.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {settlement.driver_name || '—'} · {fmtDate(settlement.period_start)} – {fmtDate(settlement.period_end)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePdfDownload} disabled={actionLoading === 'pdf'}>
            {actionLoading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
            PDF
          </Button>
          {settlement.status === 'unposted' && (
            <Button size="sm" onClick={() => handleAction('post')} disabled={!!actionLoading}>
              {actionLoading === 'post' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Post
            </Button>
          )}
          {settlement.status === 'posted' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleAction('undo')} disabled={!!actionLoading}>
                Undo Post
              </Button>
              <Button size="sm" onClick={() => handleAction('pay')} disabled={!!actionLoading}>
                {actionLoading === 'pay' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Mark Paid
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Gross Pay</p>
            <p className="text-lg font-semibold mt-0.5">{fmt$(settlement.gross_pay)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Accessorials</p>
            <p className="text-lg font-semibold mt-0.5 text-blue-400">{fmt$(settlement.total_accessorials)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Deductions</p>
            <p className="text-lg font-semibold mt-0.5 text-red-400">-{fmt$(settlement.total_deductions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Net Pay</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-400">{fmt$(settlement.net_pay)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items ({settlement.line_items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {settlement.line_items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No line items.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Load Pay */}
                  {loadPayItems.map((li: SettlementLineItem) => (
                    <LineItemRow key={li.id} item={li} />
                  ))}
                  {/* Accessorials */}
                  {accessorialItems.map((li) => (
                    <LineItemRow key={li.id} item={li} />
                  ))}
                  {/* Bonuses */}
                  {bonusItems.map((li) => (
                    <LineItemRow key={li.id} item={li} />
                  ))}
                  {/* Deductions */}
                  {deductionItems.map((li) => (
                    <LineItemRow key={li.id} item={li} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary at bottom */}
          <div className="mt-4 space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Pay</span>
              <span>{fmt$(settlement.gross_pay)}</span>
            </div>
            <div className="flex justify-between text-blue-400">
              <span>+ Accessorials</span>
              <span>{fmt$(settlement.total_accessorials)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>− Deductions</span>
              <span>{fmt$(settlement.total_deductions)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Net Pay</span>
              <span className="text-emerald-400">{fmt$(settlement.net_pay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block">Created</span>
          <span>{fmtDate(settlement.created_at)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Updated</span>
          <span>{fmtDate(settlement.updated_at)}</span>
        </div>
        {settlement.paid_at && (
          <div>
            <span className="text-muted-foreground block">Paid At</span>
            <span>{fmtDate(settlement.paid_at)}</span>
          </div>
        )}
        {settlement.truck_number && (
          <div>
            <span className="text-muted-foreground block">Truck</span>
            <span>{settlement.truck_number}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LineItemRow({ item }: { item: SettlementLineItem }) {
  const isNegative = item.type === 'deduction';
  return (
    <TableRow className="hover:bg-muted/20 transition-colors">
      <TableCell>
        <span className={`text-xs font-medium capitalize ${LINE_ITEM_COLORS[item.type] ?? ''}`}>
          {item.type.replace(/_/g, ' ')}
        </span>
      </TableCell>
      <TableCell className="text-sm">{item.description || '—'}</TableCell>
      <TableCell className={`text-right font-medium ${isNegative ? 'text-red-400' : ''}`}>
        {isNegative ? '-' : ''}{fmt$(Math.abs(item.amount))}
      </TableCell>
    </TableRow>
  );
}
