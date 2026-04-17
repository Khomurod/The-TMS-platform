/**
 * LoadDrawer - Slide-over panel for quick load preview and status advancement.
 * Opens from the Load Board when a row is clicked.
 */
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/loads/StatusBadge';
import { useAdvanceStatus, useDeleteLoad, useLoadDetail } from '@/lib/hooks/loads';
import { extractApiError } from '@/lib/errors';
import type { StopResponse } from '@/lib/types/loads';

interface LoadDrawerProps {
  loadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

function StopRow({ stop }: { stop: StopResponse }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex flex-col items-center">
        <span
          className={`inline-block h-3 w-3 flex-shrink-0 rounded-full border-2 ${
            stop.stop_type === 'pickup'
              ? 'border-blue-400 bg-blue-400/30'
              : 'border-emerald-400 bg-emerald-400/30'
          }`}
        />
        <div className="min-h-[16px] w-px flex-1 bg-border" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {stop.stop_type === 'pickup' ? 'Pickup' : 'Delivery'}
          </span>
          <span className="text-xs text-muted-foreground">#{stop.stop_sequence}</span>
        </div>
        <p className="mt-0.5 text-sm font-medium">
          {(stop.facility_name ?? [stop.city, stop.state].filter(Boolean).join(', ')) || '-'}
        </p>
        {stop.city && (
          <p className="text-xs text-muted-foreground">
            {[stop.city, stop.state, stop.zip_code].filter(Boolean).join(', ')}
          </p>
        )}
        {stop.scheduled_date && (
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(stop.scheduled_date)}</p>
        )}
      </div>
    </div>
  );
}

export default function LoadDrawer({ loadId, open, onOpenChange }: LoadDrawerProps) {
  const { data: load, isLoading } = useLoadDetail(open ? loadId : null);
  const advanceStatus = useAdvanceStatus();
  const deleteLoad = useDeleteLoad();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const nextStatus = load ? NEXT_STATUS[load.status] : null;
  const canDelete = load?.status === 'offer';

  const handleAdvance = () => {
    if (!load || !nextStatus) return;

    advanceStatus.mutate(
      { loadId: load.id, status: nextStatus },
      { onSuccess: () => {} },
    );
  };

  const handleDelete = async () => {
    if (!load) return;

    setDeleteError('');
    try {
      await deleteLoad.mutateAsync(load.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (err: unknown) {
      setDeleteError(extractApiError(err, 'Failed to delete load'));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setDeleteDialogOpen(false);
          setDeleteError('');
        }
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg">
        {isLoading || !load ? (
          <SheetHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-1 h-4 w-24" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <SheetTitle>{load.load_number}</SheetTitle>
                <StatusBadge status={load.status} />
              </div>
              <SheetDescription>
                {load.broker_load_id ? `Broker Ref: ${load.broker_load_id}` : 'Load Details'}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 px-4">
              <div className="grid grid-cols-3 gap-3 py-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Base Rate</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatCurrency(load.base_rate)}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Rate</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatCurrency(load.total_rate)}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Miles</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {load.total_miles != null ? Number(load.total_miles).toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="py-3">
                <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Stops</h3>
                {load.stops.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stops defined.</p>
                ) : (
                  <div>
                    {[...load.stops]
                      .sort((a, b) => a.stop_sequence - b.stop_sequence)
                      .map((stop) => (
                        <StopRow key={stop.id} stop={stop} />
                      ))}
                  </div>
                )}
              </div>

              <Separator />

              {load.trips.length > 0 && (
                <div className="py-3">
                  <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Trips ({load.trips.length})
                  </h3>
                  {load.trips.map((trip) => (
                    <div key={trip.id} className="mb-2 rounded-lg bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trip.trip_number}</span>
                        <StatusBadge status={trip.status} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Driver: {trip.driver_name ?? '-'}</span>
                        <span>Truck: {trip.truck_number ?? '-'}</span>
                        {trip.loaded_miles != null && <span>Loaded: {trip.loaded_miles} mi</span>}
                        {trip.empty_miles != null && <span>Empty: {trip.empty_miles} mi</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {load.accessorials.length > 0 && (
                <>
                  <Separator />
                  <div className="py-3">
                    <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      Accessorials ({load.accessorials.length})
                    </h3>
                    {load.accessorials.map((accessorial) => (
                      <div key={accessorial.id} className="flex items-center justify-between py-1">
                        <span className="text-sm capitalize">
                          {accessorial.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(accessorial.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {load.notes && (
                <>
                  <Separator />
                  <div className="py-3">
                    <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Notes</h3>
                    <p className="text-sm text-muted-foreground">{load.notes}</p>
                  </div>
                </>
              )}
            </ScrollArea>

            <SheetFooter>
              {nextStatus && !load.is_locked ? (
                <Button
                  onClick={handleAdvance}
                  disabled={advanceStatus.isPending}
                  className="w-full"
                >
                  {advanceStatus.isPending
                    ? 'Advancing...'
                    : `Advance to ${nextStatus.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}`}
                </Button>
              ) : (
                <p className="w-full text-center text-xs text-muted-foreground">
                  {load.is_locked ? 'Load is locked (post-invoiced)' : 'No further status transitions'}
                </p>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  Delete
                </Button>
              )}
            </SheetFooter>

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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
