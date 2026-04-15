'use client';

import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';
import { getAvailableDrivers, getAvailableTrucks, getAvailableTrailers } from '@/lib/api';
import { useAssignTrip } from '@/lib/hooks/loads';
import type { TripResponse } from '@/lib/types/loads';
import { useState } from 'react';

interface AssignTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: string;
  loadNumber: string;
  trip: TripResponse;
}

interface AvailableDriver {
  id: string;
  first_name: string;
  last_name: string;
}

interface AvailableTruck {
  id: string;
  unit_number: string;
}

interface AvailableTrailer {
  id: string;
  unit_number: string;
}

export default function AssignTripDialog({
  open,
  onOpenChange,
  loadId,
  loadNumber,
  trip,
}: AssignTripDialogProps) {
  const assignTrip = useAssignTrip();
  const [error, setError] = useState('');
  const [driverId, setDriverId] = useState(trip.driver_id ?? '');
  const [truckId, setTruckId] = useState(trip.truck_id ?? '');
  const [trailerId, setTrailerId] = useState(trip.trailer_id ?? '');
  const [loadedMiles, setLoadedMiles] = useState(trip.loaded_miles != null ? String(trip.loaded_miles) : '');
  const [emptyMiles, setEmptyMiles] = useState(trip.empty_miles != null ? String(trip.empty_miles) : '');
  const [driverGross, setDriverGross] = useState(trip.driver_gross != null ? String(trip.driver_gross) : '');

  const { data: drivers = [], isLoading: driversLoading } = useQuery<AvailableDriver[]>({
    queryKey: ['drivers', 'available'],
    queryFn: getAvailableDrivers,
    enabled: open,
    staleTime: 15_000,
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery<AvailableTruck[]>({
    queryKey: ['fleet', 'trucks', 'available'],
    queryFn: getAvailableTrucks,
    enabled: open,
    staleTime: 15_000,
  });

  const { data: trailers = [], isLoading: trailersLoading } = useQuery<AvailableTrailer[]>({
    queryKey: ['fleet', 'trailers', 'available'],
    queryFn: getAvailableTrailers,
    enabled: open,
    staleTime: 15_000,
  });

  const reset = () => {
    setError('');
    setDriverId(trip.driver_id ?? '');
    setTruckId(trip.truck_id ?? '');
    setTrailerId(trip.trailer_id ?? '');
    setLoadedMiles(trip.loaded_miles != null ? String(trip.loaded_miles) : '');
    setEmptyMiles(trip.empty_miles != null ? String(trip.empty_miles) : '');
    setDriverGross(trip.driver_gross != null ? String(trip.driver_gross) : '');
  };

  const isLoading = driversLoading || trucksLoading || trailersLoading;

  const handleSave = async () => {
    setError('');
    try {
      await assignTrip.mutateAsync({
        loadId,
        tripId: trip.id,
        payload: {
          driver_id: driverId || undefined,
          truck_id: truckId || undefined,
          trailer_id: trailerId || undefined,
          loaded_miles: loadedMiles ? parseFloat(loadedMiles) : undefined,
          empty_miles: emptyMiles ? parseFloat(emptyMiles) : undefined,
          driver_gross: driverGross ? parseFloat(driverGross) : undefined,
        },
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to assign trip assets'));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Assign Assets</DialogTitle>
          <DialogDescription>
            {loadNumber} - {trip.trip_number}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Driver</Label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">Select driver...</option>
                {trip.driver_id && (
                  <option value={trip.driver_id}>
                    {trip.driver_name ?? 'Current assigned driver'}
                  </option>
                )}
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Truck</Label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
              >
                <option value="">Select truck...</option>
                {trip.truck_id && <option value={trip.truck_id}>{trip.truck_number ?? 'Current assigned truck'}</option>}
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.unit_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Trailer</Label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={trailerId}
                onChange={(e) => setTrailerId(e.target.value)}
              >
                <option value="">No trailer</option>
                {trip.trailer_id && (
                  <option value={trip.trailer_id}>{trip.trailer_number ?? 'Current assigned trailer'}</option>
                )}
                {trailers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.unit_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Loaded Miles</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={loadedMiles}
                  onChange={(e) => setLoadedMiles(e.target.value)}
                />
              </div>
              <div>
                <Label>Empty Miles</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={emptyMiles}
                  onChange={(e) => setEmptyMiles(e.target.value)}
                />
              </div>
              <div>
                <Label>Driver Gross ($)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={driverGross}
                  onChange={(e) => setDriverGross(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignTrip.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assignTrip.isPending}>
            {assignTrip.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Assignment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
