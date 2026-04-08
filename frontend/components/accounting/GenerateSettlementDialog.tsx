/**
 * GenerateSettlementDialog — Modal to generate a new settlement for a driver.
 * Selects driver + date range, triggers POST /settlements/generate.
 */
'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSettlement, getDrivers } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';

interface DriverOption {
  id: string;
  first_name: string;
  last_name: string;
}

export default function GenerateSettlementDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const [driverId, setDriverId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Load drivers when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingDrivers(true);
    getDrivers({ page: 1, page_size: 100, status: 'available' })
      .then((res) => setDrivers(res?.items ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, [open]);

  const reset = () => {
    setDriverId('');
    setPeriodStart('');
    setPeriodEnd('');
    setError('');
  };

  const canSubmit = driverId && periodStart && periodEnd && periodStart <= periodEnd;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await generateSettlement({
        driver_id: driverId,
        period_start: periodStart,
        period_end: periodEnd,
      });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Generate Settlement
        </Button>
      } />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Generate Settlement</DialogTitle>
          <DialogDescription>
            Select a driver and date range to generate a draft settlement with Trip-level pay calculations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Driver *</Label>
            {loadingDrivers ? (
              <div className="mt-1 h-9 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <select
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">Select a driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Period Start *</Label>
              <Input
                className="mt-1"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Period End *</Label>
              <Input
                className="mt-1"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {periodStart && periodEnd && periodStart > periodEnd && (
            <p className="text-destructive text-xs">Period end must be after period start.</p>
          )}
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating…
              </>
            ) : (
              'Generate Settlement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
