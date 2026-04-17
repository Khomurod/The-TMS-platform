/**
 * Load Detail Page - Full-page view of a single load with all stops, trips, and financials.
 */
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, Pencil } from 'lucide-react';
import { useAdvanceStatus, useDeleteLoad, useLoadDetail } from '@/lib/hooks/loads';
import { extractApiError } from '@/lib/errors';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/loads/StatusBadge';
import StatusStepper from '@/components/loads/StatusStepper';
import EditLoadDialog from '@/components/loads/EditLoadDialog';
import AssignTripDialog from '@/components/loads/AssignTripDialog';
import type {
  AccessorialResponse,
  StopResponse,
  TripResponse,
} from '@/lib/types/loads';

const NEXT_STATUS: Record<string, string | null> = {
  offer: 'booked',
  booked: 'assigned',
  assigned: 'dispatched',
  dispatched: 'in_transit',
  in_transit: 'delivered',
  delivered: 'invoiced',
  invoiced: 'paid',
  paid: null,
  cancelled: null,
};

function formatCurrency(value?: number): string {
  if (value == null) return '-';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StopTimeline({ stops }: { stops: StopResponse[] }) {
  const sortedStops = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);

  return (
    <div className="space-y-0">
      {sortedStops.map((stop, index) => (
        <div key={stop.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`h-3 w-3 flex-shrink-0 rounded-full border-2 ${
                stop.stop_type === 'pickup'
                  ? 'border-blue-400 bg-blue-400/30'
                  : 'border-emerald-400 bg-emerald-400/30'
              }`}
            />
            {index < sortedStops.length - 1 && <div className="min-h-[32px] w-px flex-1 bg-border" />}
          </div>
          <div className="min-w-0 flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {stop.stop_type} #{stop.stop_sequence}
              </span>
            </div>
            <p className="text-sm font-medium">
              {stop.facility_name || [stop.city, stop.state].filter(Boolean).join(', ') || '-'}
            </p>
            {stop.city && (
              <p className="text-xs text-muted-foreground">
                {[stop.address, stop.city, stop.state, stop.zip_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
              {stop.scheduled_date && <span>Scheduled: {formatDate(stop.scheduled_date)}</span>}
              {stop.arrival_date && (
                <span className="text-emerald-400">Arrived: {formatDate(stop.arrival_date)}</span>
              )}
              {stop.departure_date && (
                <span className="text-blue-400">Departed: {formatDate(stop.departure_date)}</span>
              )}
            </div>
            {stop.notes && <p className="mt-1 text-xs italic text-muted-foreground">{stop.notes}</p>}
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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{trip.trip_number}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          <Button size="sm" variant="outline" onClick={() => onAssign(trip)} disabled={!canAssign}>
            Assign Assets
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <span className="block text-xs text-muted-foreground">Driver</span>
          <span>{trip.driver_name || '-'}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Truck</span>
          <span>{trip.truck_number || '-'}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Loaded Miles</span>
          <span>{trip.loaded_miles != null ? `${trip.loaded_miles.toLocaleString()} mi` : '-'}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Driver Gross</span>
          <span>{formatCurrency(trip.driver_gross)}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: load, isLoading, error } = useLoadDetail(id);
  const advanceStatus = useAdvanceStatus();
  const deleteLoad = useDeleteLoad();
  const [editOpen, setEditOpen] = useState(false);
  const [assignTripOpen, setAssignTripOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<TripResponse | null>(null);

  const handleAssignTrip = (trip: TripResponse) => {
    setSelectedTrip(trip);
    setAssignTripOpen(true);
  };

  const handleDelete = async () => {
    if (!load) return;

    setDeleteError('');
    try {
      await deleteLoad.mutateAsync(load.id);
      setDeleteDialogOpen(false);
      router.push('/loads');
    } catch (err: unknown) {
      setDeleteError(extractApiError(err, 'Failed to delete load'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">
            {error ? 'Error loading load details.' : 'Load not found.'}
          </p>
          <Link href="/loads" className="mt-2 inline-block text-sm text-primary underline">
            Back to Load Board
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[load.status];
  const canDelete = load.status === 'offer';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/loads" className="text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{load.load_number}</h1>
              <StatusBadge status={load.status} />
              {load.is_locked && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                  Locked
                </span>
              )}
            </div>
            {load.broker_load_id && (
              <p className="mt-0.5 text-sm text-muted-foreground">Broker Ref: {load.broker_load_id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!load.is_locked && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit Load
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Delete
            </Button>
          )}
          {nextStatus && !load.is_locked && (
            <Button
              onClick={() => advanceStatus.mutate({ loadId: load.id, status: nextStatus })}
              disabled={advanceStatus.isPending}
            >
              Advance to {nextStatus.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <StatusStepper currentStatus={load.status} className="py-2" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pb-4 pt-4">
            <p className="text-xs text-muted-foreground">Base Rate</p>
            <p className="mt-0.5 text-lg font-semibold">{formatCurrency(load.base_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pb-4 pt-4">
            <p className="text-xs text-muted-foreground">Total Rate</p>
            <p className="mt-0.5 text-lg font-semibold">{formatCurrency(load.total_rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pb-4 pt-4">
            <p className="text-xs text-muted-foreground">Total Miles</p>
            <p className="mt-0.5 text-lg font-semibold">
              {load.total_miles != null ? `${Number(load.total_miles).toLocaleString()} mi` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pb-4 pt-4">
            <p className="text-xs text-muted-foreground">RPM</p>
            <p className="mt-0.5 text-lg font-semibold">
              {load.total_rate && load.total_miles
                ? `$${(load.total_rate / load.total_miles).toFixed(2)}`
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accessorials</CardTitle>
            </CardHeader>
            <CardContent>
              {load.accessorials.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <div className="space-y-2">
                  {load.accessorials.map((accessorial: AccessorialResponse) => (
                    <div key={accessorial.id} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{accessorial.type.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{formatCurrency(accessorial.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        load.accessorials.reduce((sum, accessorial) => sum + (accessorial.amount || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipment ID</span>
                <span className="font-medium">{load.shipment_id || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Agent</span>
                <span>{load.contact_agent || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(load.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(load.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

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

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(next) => {
          setDeleteDialogOpen(next);
          if (!next && !deleteLoad.isPending) {
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Load</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this load? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoad.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoad.isPending}
            >
              {deleteLoad.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
