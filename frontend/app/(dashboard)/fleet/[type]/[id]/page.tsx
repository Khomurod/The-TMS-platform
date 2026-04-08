/**
 * Fleet Equipment Detail — Truck or Trailer detail with DOT inspection tracking.
 */
'use client';

import { use } from 'react';
import { useTruckDetail, useTrailerDetail } from '@/lib/hooks/fleet';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-400',
  in_use: 'bg-blue-500/20 text-blue-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  out_of_service: 'bg-red-500/20 text-red-400',
};

function fmtDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  );
}

function DOTInspectionCard({ inspectionDate, expiryDate }: { inspectionDate?: string; expiryDate?: string }) {
  const days = daysUntil(expiryDate);
  let urgency: 'good' | 'upcoming' | 'critical' | 'expired' | 'unknown' = 'unknown';
  if (days === null) urgency = 'unknown';
  else if (days < 0) urgency = 'expired';
  else if (days <= 7) urgency = 'critical';
  else if (days <= 30) urgency = 'upcoming';
  else urgency = 'good';

  const styles: Record<string, { border: string; icon: React.ReactNode; label: string }> = {
    good: { border: 'border-emerald-500/30 bg-emerald-500/5', icon: <Check className="w-5 h-5 text-emerald-400" />, label: `Valid — ${days} days remaining` },
    upcoming: { border: 'border-amber-500/30 bg-amber-500/5', icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, label: `Expiring in ${days} days` },
    critical: { border: 'border-red-500/30 bg-red-500/5', icon: <ShieldAlert className="w-5 h-5 text-red-400" />, label: `Critical — ${days} days remaining` },
    expired: { border: 'border-red-500/30 bg-red-500/5', icon: <ShieldAlert className="w-5 h-5 text-red-500" />, label: `Expired ${Math.abs(days!)} days ago` },
    unknown: { border: 'border-gray-500/30 bg-gray-500/5', icon: <AlertTriangle className="w-5 h-5 text-gray-400" />, label: 'No inspection data' },
  };

  const s = styles[urgency];

  return (
    <div className={`rounded-xl border p-4 ${s.border}`}>
      <div className="flex items-center gap-2 mb-3">
        {s.icon}
        <span className="text-sm font-medium">DOT Inspection</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{s.label}</p>
      <div className="space-y-2">
        <InfoRow label="Last Inspection" value={fmtDate(inspectionDate)} />
        <InfoRow label="Expiry Date" value={fmtDate(expiryDate)} />
        {days !== null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Inspection Lifecycle</span>
              <span>{Math.max(0, days)} days left</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  urgency === 'good' ? 'bg-emerald-400' :
                  urgency === 'upcoming' ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (days / 365) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FleetDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = use(params);
  const isTruck = type === 'trucks';
  const truck = useTruckDetail(isTruck ? id : null);
  const trailer = useTrailerDetail(!isTruck ? id : null);
  const { data, isLoading, error } = isTruck ? truck : trailer;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">{isTruck ? 'Truck' : 'Trailer'} not found.</p>
          <Link href="/fleet" className="text-primary text-sm underline mt-2 inline-block">← Back to Fleet</Link>
        </div>
      </div>
    );
  }

  const equip = data as unknown as Record<string, unknown>;
  const unitNumber = equip.unit_number as string;
  const status = equip.status as string;
  const trailerType = !isTruck ? (equip.trailer_type as string | undefined) : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/fleet" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{unitNumber}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'}`}>
              {status.replace(/_/g, ' ')}
            </span>
            {!isTruck && trailerType && (
              <span className="text-xs bg-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 capitalize">
                {trailerType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTruck ? 'Truck' : 'Trailer'}
            {equip.year ? ` · ${equip.year}` : ''}
            {equip.make ? ` ${equip.make}` : ''}
            {equip.model ? ` ${equip.model}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DOT Inspection */}
        <DOTInspectionCard
          inspectionDate={equip.dot_inspection_date as string | undefined}
          expiryDate={equip.dot_inspection_expiry as string | undefined}
        />

        {/* Unit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Unit Number" value={unitNumber} />
            <InfoRow label="Year" value={equip.year as number | undefined} />
            <InfoRow label="Make" value={equip.make as string | undefined} />
            <InfoRow label="Model" value={equip.model as string | undefined} />
            <InfoRow label="VIN" value={equip.vin as string | undefined} />
            <InfoRow label="License Plate" value={equip.license_plate as string | undefined} />
            <InfoRow label="Ownership" value={(equip.ownership_type as string | undefined)?.replace(/_/g, ' ')} />
            {!isTruck && <InfoRow label="Trailer Type" value={trailerType?.replace(/_/g, ' ')} />}
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={status.replace(/_/g, ' ')} />
            <InfoRow label="Active" value={(equip.is_active as boolean) ? 'Yes' : 'No'} />
            <InfoRow label="Created" value={fmtDate(equip.created_at as string | undefined)} />
            <InfoRow label="Updated" value={fmtDate(equip.updated_at as string | undefined)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
