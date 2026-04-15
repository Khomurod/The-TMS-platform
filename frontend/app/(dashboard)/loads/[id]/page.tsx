/**
 * Load Detail Page — Full-page view of a single load with all stops, trips, and financials.
 */
'use client';

import { use, useState } from 'react';
import { useLoadDetail, useAdvanceStatus } from '@/lib/hooks/loads';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/loads/StatusBadge';
import StatusStepper from '@/components/loads/StatusStepper';
import EditLoadDialog from '@/components/loads/EditLoadDialog';
import AssignTripDialog from '@/components/loads/AssignTripDialog';
import { ArrowLeft, ChevronRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { StopResponse, AccessorialResponse, TripResponse } from '@/lib/types/loads';

const NEXT_STATUS: Record<string, string | null> = {
  offer: 'booked', booked: 'assigned', assigned: 'dispatched',
  dispatched: 'in_transit', in_transit: 'delivered', delivered: 'invoiced',
  invoiced: 'paid', paid: null, cancelled: null,
};

function fmt$(val?: number): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(val?: string): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StopTimeline({ stops }: { stops: StopResponse[] }) {
  const sorted = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
  return (
    <div className="space-y-0">
      {sorted.map((stop, idx) => (
        <div key={stop.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
              stop.stop_type === 'pickup' ? 'border-blue-400 bg-blue-400/30' : 'border-emerald-400 bg-emerald-400/30'
            }`} />
            {idx < sorted.length - 1 && <div className="w-px flex-1 bg-border min-h-[32px]" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {stop.stop_type} #{stop.stop_sequence}
              </span>
            </div>
            <p className="text-sm font-medium">
              {stop.facility_name || [stop.city, stop.state].filter(Boolean).join(', ') || '—'}
            </p>
            {stop.city && (
              <p className="text-xs text-muted-foreground">
                {[stop.address, stop.city, stop.state, stop.zip_code].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              {stop.scheduled_date && <span>Scheduled: {fmtDate(stop.scheduled_date)}</span>}
              {stop.arrival_date && <span className="text-emerald-400">Arrived: {fmtDate(stop.arrival_date)}</span>}
              {stop.departure_date && <span className="text-blue-400">Departed: {fmtDate(stop.departure_date)}</span>}
            </div>
            {stop.notes && <p className="text-xs text-muted-foreground mt-1 italic">{stop.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TripCard({
  trip,
  onAssign,
  canAssign,
}: {
  trip: TripResponse;
  onAssign: (trip: TripResponse) => void;
  canAssign: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{trip.trip_number}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          <Button size="sm" variant="outline" onClick={() => onAssign(trip)} disabled={!canAssign}>
            Assign Assets
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground block">Driver</span>
          <span>{trip.driver_name || '—'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Truck</span>
          <span>{trip.truck_number || '—'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Loaded Miles</span>
          <span>{trip.loaded_miles != null ? `${trip.loaded_miles.toLocaleString()} mi` : '—'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Driver Gross</span>
          <span>{fmt$(trip.driver_gross)}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: load, isLoading, error } = useLoadDetail(id);
  const advanceStatus = useAdvanceStatus();
  const [editOpen, setEditOpen] = useState(false);
  const [assignTripOpen, setAssignTripOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripResponse | null>(null);
  const handleAssignTrip = (trip: TripResponse) => {
    setSelectedTrip(trip);
    setAssignTripOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl mt-6" />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">
            {error ? 'Error loading load details.' : 'Load not found.'}
          </p>
          <Link href="/loads" className="text-primary text-sm underline mt-2 inline-block">
            ← Back to Load Board
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[load.status];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/loads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{load.load_number}</h1>
              <StatusBadge status={load.status} />
              {load.is_locked && (
                <span className="text-xs bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">Locked</span>
              )}
            </div>
            {load.broker_load_id && (
              <p className="text-sm text-muted-foreground mt-0.5">Broker Ref: {load.broker_load_id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!load.is_locked && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit Load
            </Button>
          )}
          {nextStatus && !load.is_locked && (
            <Button
              onClick={() => advanceStatus.mutate({ loadId: load.id, status: nextStatus })}
              disabled={advanceStatus.isPending}
            >
              Advance to {nextStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <StatusStepper currentStatus={load.status} className="py-2" />

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Base Rate</p>
            <p className="text-lg font-semibold mt-0.5">{fmt$(load.base_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Rate</p>
            <p className="text-lg font-semibold mt-0.5">{fmt$(load.total_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Miles</p>
            <p className="text-lg font-semibold mt-0.5">
              {load.total_miles != null ? `${Number(load.total_miles).toLocaleString()} mi` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">RPM</p>
            <p className="text-lg font-semibold mt-0.5">
              {load.total_rate && load.total_miles
                ? `$${(load.total_rate / load.total_miles).toFixed(2)}`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stops (left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Route ({load.stops.length} stops)</CardTitle>
            </CardHeader>
            <CardContent>
              {load.stops.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stops defined.</p>
              ) : (
                <StopTimeline stops={load.stops} />
              )}
            </CardContent>
          </Card>

          {/* Trips */}
          {load.trips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trips ({load.trips.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {load.trips
                  .sort((a, b) => a.sequence_number - b.sequence_number)
                  .map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      canAssign={!load.is_locked}
                      onAssign={handleAssignTrip}
                    />
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side panel (right 1/3) */}
        <div className="space-y-6">
          {/* Accessorials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accessorials</CardTitle>
            </CardHeader>
            <CardContent>
              {load.accessorials.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <div className="space-y-2">
                  {load.accessorials.map((acc: AccessorialResponse) => (
                    <div key={acc.id} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{acc.type.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{fmt$(acc.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{fmt$(load.accessorials.reduce((s, a) => s + (a.amount || 0), 0))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Load Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipment ID</span>
                <span className="font-medium">{load.shipment_id || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Agent</span>
                <span>{load.contact_agent || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{fmtDate(load.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{fmtDate(load.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {load.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{load.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {editOpen && <EditLoadDialog open={editOpen} onOpenChange={setEditOpen} load={load} />}
      {assignTripOpen && selectedTrip && (
        <AssignTripDialog
          open={assignTripOpen}
          onOpenChange={setAssignTripOpen}
          loadId={load.id}
          loadNumber={load.load_number}
          trip={selectedTrip}
        />
      )}
    </div>
  );
}
