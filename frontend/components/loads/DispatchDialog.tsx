/**
 * DispatchDialog — Modal for dispatching a load.
 * Selects driver, truck, trailer from available resources,
 * shows inline compliance check, then dispatches.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  dispatchLoad,
  getAvailableDrivers,
  getAvailableTrucks,
  getAvailableTrailers,
  getDriverCompliance,
} from '@/lib/api';
import { Loader2, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

interface AvailableDriver {
  id: string;
  first_name: string;
  last_name: string;
  cdl_class?: string;
  phone?: string;
}

interface AvailableTruck {
  id: string;
  unit_number: string;
  make?: string;
  model?: string;
  dot_inspection_expiry?: string;
}

interface AvailableTrailer {
  id: string;
  unit_number: string;
  trailer_type?: string;
  make?: string;
  model?: string;
  dot_inspection_expiry?: string;
}

interface ComplianceResult {
  driver_id: string;
  driver_name: string;
  urgency: string;
  violations: { field: string; severity: string; message: string }[];
}

interface DispatchDialogProps {
  loadId: string;
  loadNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DispatchDialog({
  loadId,
  loadNumber,
  open,
  onOpenChange,
}: DispatchDialogProps) {
  const queryClient = useQueryClient();

  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [trucks, setTrucks] = useState<AvailableTruck[]>([]);
  const [trailers, setTrailers] = useState<AvailableTrailer[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');

  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available resources when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getAvailableDrivers(),
      getAvailableTrucks(),
      getAvailableTrailers(),
    ])
      .then(([d, t, tr]) => {
        setDrivers(d ?? []);
        setTrucks(t ?? []);
        setTrailers(tr ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Check compliance when driver selected
  const checkCompliance = useCallback(async (driverId: string) => {
    if (!driverId) {
      setCompliance(null);
      return;
    }
    setComplianceLoading(true);
    try {
      const result = await getDriverCompliance(driverId);
      setCompliance(result);
    } catch {
      setCompliance(null);
    } finally {
      setComplianceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      checkCompliance(selectedDriver);
    } else {
      setCompliance(null);
    }
  }, [selectedDriver, checkCompliance]);

  const canDispatch =
    selectedDriver &&
    selectedTruck &&
    compliance &&
    compliance.urgency !== 'expired';

  const handleDispatch = async () => {
    setSubmitting(true);
    setError('');
    try {
      await dispatchLoad(loadId, {
        driver_id: selectedDriver,
        truck_id: selectedTruck,
        trailer_id: selectedTrailer || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Dispatch failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedTrailer('');
    setCompliance(null);
    setError('');
  };

  const urgencyColor: Record<string, string> = {
    good: 'text-emerald-400',
    upcoming: 'text-amber-400',
    critical: 'text-red-400',
    expired: 'text-red-500',
  };

  const urgencyIcon: Record<string, React.ReactNode> = {
    good: <Check className="w-4 h-4 text-emerald-400" />,
    upcoming: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    critical: <ShieldAlert className="w-4 h-4 text-red-400" />,
    expired: <ShieldAlert className="w-4 h-4 text-red-500" />,
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Dispatch {loadNumber}</DialogTitle>
          <DialogDescription>
            Assign driver, truck, and trailer to dispatch this load.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Driver Selection */}
            <div>
              <label className="text-sm font-medium">Driver *</label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">Select a driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                    {d.cdl_class ? ` (CDL ${d.cdl_class})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Truck Selection */}
            <div>
              <label className="text-sm font-medium">Truck *</label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
              >
                <option value="">Select a truck…</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.unit_number}
                    {t.make ? ` — ${t.make}` : ''}
                    {t.model ? ` ${t.model}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Trailer Selection (optional) */}
            <div>
              <label className="text-sm font-medium">Trailer (optional)</label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedTrailer}
                onChange={(e) => setSelectedTrailer(e.target.value)}
              >
                <option value="">No trailer</option>
                {trailers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.unit_number}
                    {t.trailer_type ? ` (${t.trailer_type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Compliance Check */}
            {selectedDriver && (
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Compliance Check</span>
                  {complianceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                {compliance && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {urgencyIcon[compliance.urgency]}
                      <span className={`text-sm font-medium capitalize ${urgencyColor[compliance.urgency]}`}>
                        {compliance.urgency}
                      </span>
                      <span className="text-xs text-muted-foreground">— {compliance.driver_name}</span>
                    </div>
                    {compliance.violations.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {compliance.violations.map((v, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${v.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            {v.message}
                          </li>
                        ))}
                      </ul>
                    )}
                    {compliance.violations.length === 0 && (
                      <p className="text-xs text-emerald-400">All compliance checks passed ✓</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            onClick={handleDispatch}
            disabled={!canDispatch || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Dispatching…
              </>
            ) : (
              'Dispatch Load'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
