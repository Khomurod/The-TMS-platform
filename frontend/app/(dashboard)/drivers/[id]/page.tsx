/**
 * Driver Detail Page — Full profile with compliance, pay config, and metadata.
 */
'use client';

import { use } from 'react';
import { useDriverDetail, useDriverCompliance } from '@/lib/hooks/drivers';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-400',
  on_trip: 'bg-amber-500/20 text-amber-400',
  off_duty: 'bg-gray-500/20 text-gray-400',
  inactive: 'bg-red-500/20 text-red-400',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  company_w2: 'Company (W-2)',
  owner_operator_1099: 'Owner-Op (1099)',
  lease_operator: 'Lease Operator',
};

const PAY_LABELS: Record<string, string> = {
  cpm: '/mi', percentage: '%', fixed_per_load: '/load', hourly: '/hr', salary: '/yr',
};

function fmtDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date, label }: { date?: string; label: string }) {
  const days = daysUntil(date);
  let color = 'bg-emerald-500/20 text-emerald-400';
  let text = 'Valid';
  if (days === null) {
    color = 'bg-gray-500/20 text-gray-400';
    text = 'Not set';
  } else if (days < 0) {
    color = 'bg-red-500/20 text-red-400';
    text = 'Expired';
  } else if (days <= 7) {
    color = 'bg-red-500/20 text-red-400';
    text = `${days}d left`;
  } else if (days <= 30) {
    color = 'bg-amber-500/20 text-amber-400';
    text = `${days}d left`;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span>{fmtDate(date)}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{text}</span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: driver, isLoading, error } = useDriverDetail(id);
  const compliance = useDriverCompliance(id);

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

  if (error || !driver) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">Driver not found.</p>
          <Link href="/drivers" className="text-primary text-sm underline mt-2 inline-block">← Back to Drivers</Link>
        </div>
      </div>
    );
  }

  const urgencyIcons: Record<string, React.ReactNode> = {
    good: <Check className="w-5 h-5 text-emerald-400" />,
    upcoming: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    critical: <ShieldAlert className="w-5 h-5 text-red-400" />,
    expired: <ShieldAlert className="w-5 h-5 text-red-500" />,
  };

  const urgencyColors: Record<string, string> = {
    good: 'border-emerald-500/30 bg-emerald-500/5',
    upcoming: 'border-amber-500/30 bg-amber-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
    expired: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/drivers" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {driver.first_name} {driver.last_name}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[driver.status] ?? 'bg-muted text-muted-foreground'}`}>
              {driver.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {EMPLOYMENT_LABELS[driver.employment_type] ?? driver.employment_type}
            {driver.hire_date && ` · Hired ${fmtDate(driver.hire_date)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Compliance + Contact */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Card */}
          {compliance.data && (
            <div className={`rounded-xl border p-4 ${urgencyColors[compliance.data.urgency ?? 'good'] ?? ''}`}>
              <div className="flex items-center gap-2 mb-3">
                {urgencyIcons[compliance.data.urgency ?? 'good']}
                <span className="text-sm font-medium capitalize">{compliance.data.urgency ?? 'good'} Compliance</span>
              </div>
              {(compliance.data.violations?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">All documents current — no violations.</p>
              ) : (
                <ul className="space-y-1">
                  {compliance.data.violations.map((v: { severity?: string; message?: string }, i: number) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${v.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {v.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Document Expiry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="CDL Number" value={driver.cdl_number} />
              <InfoRow label="CDL Class" value={driver.cdl_class} />
              <ExpiryBadge date={driver.cdl_expiry_date} label="CDL Expiry" />
              <Separator />
              <ExpiryBadge date={driver.medical_card_expiry_date} label="Medical Card Expiry" />
            </CardContent>
          </Card>

          {/* Pay Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pay Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Pay Rate"
                value={
                  driver.pay_rate_value != null
                    ? `${driver.pay_rate_type === 'percentage' ? '' : '$'}${driver.pay_rate_value}${PAY_LABELS[driver.pay_rate_type ?? ''] ?? ''}`
                    : undefined
                }
              />
              <InfoRow label="Pay Rate Type" value={driver.pay_rate_type?.replace(/_/g, ' ')} />
              <InfoRow label="Tax Classification" value={driver.tax_classification} />
              <InfoRow label="Company Defaults" value={driver.use_company_defaults ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Contact + Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Phone" value={driver.phone} />
              <InfoRow label="Email" value={driver.email} />
              <InfoRow label="Date of Birth" value={fmtDate(driver.date_of_birth)} />
              <InfoRow label="Experience" value={driver.experience_years != null ? `${driver.experience_years} years` : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Status" value={driver.status.replace(/_/g, ' ')} />
              <InfoRow label="Active" value={driver.is_active ? 'Yes' : 'No'} />
              <InfoRow label="Created" value={fmtDate(driver.created_at)} />
              <InfoRow label="Updated" value={fmtDate(driver.updated_at)} />
            </CardContent>
          </Card>

          {driver.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{driver.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
