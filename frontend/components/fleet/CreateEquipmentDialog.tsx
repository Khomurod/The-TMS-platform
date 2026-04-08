/**
 * CreateEquipmentDialog — Modal for adding a new Truck or Trailer.
 */
'use client';

import { useState } from 'react';
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
import { createTruck, createTrailer } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';

const OWNERSHIP_TYPES = ['owned', 'financed', 'leased', 'rented'];
const TRAILER_TYPES = ['dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy', 'tanker', 'other'];

interface CreateEquipmentDialogProps {
  type: 'truck' | 'trailer';
}

export default function CreateEquipmentDialog({ type }: CreateEquipmentDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [unitNumber, setUnitNumber] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [ownershipType, setOwnershipType] = useState('owned');
  const [trailerType, setTrailerType] = useState('dry_van');
  const [dotInspectionDate, setDotInspectionDate] = useState('');
  const [dotInspectionExpiry, setDotInspectionExpiry] = useState('');

  const reset = () => {
    setError('');
    setUnitNumber(''); setYear(''); setMake(''); setModel('');
    setVin(''); setLicensePlate('');
    setOwnershipType('owned'); setTrailerType('dry_van');
    setDotInspectionDate(''); setDotInspectionExpiry('');
  };

  const canSubmit = unitNumber.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        unit_number: unitNumber,
        year: year ? parseInt(year) : undefined,
        make: make || undefined,
        model: model || undefined,
        vin: vin || undefined,
        license_plate: licensePlate || undefined,
        ownership_type: ownershipType,
        dot_inspection_date: dotInspectionDate || undefined,
        dot_inspection_expiry: dotInspectionExpiry || undefined,
      };
      if (type === 'trailer') {
        payload.trailer_type = trailerType;
        await createTrailer(payload);
      } else {
        await createTruck(payload);
      }
      queryClient.invalidateQueries({ queryKey: [type === 'truck' ? 'trucks' : 'trailers'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to create ${type}`);
    } finally {
      setSubmitting(false);
    }
  };

  const label = type === 'truck' ? 'Truck' : 'Trailer';

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add {label}
        </Button>
      } />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add New {label}</DialogTitle>
          <DialogDescription>Enter unit details, VIN, and DOT inspection information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit Number *</Label>
              <Input className="mt-1" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder={type === 'truck' ? 'TRK-101' : 'TRL-201'} />
            </div>
            <div>
              <Label>Year</Label>
              <Input className="mt-1" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Make</Label>
              <Input className="mt-1" value={make} onChange={(e) => setMake(e.target.value)} placeholder={type === 'truck' ? 'Peterbilt' : 'Great Dane'} />
            </div>
            <div>
              <Label>Model</Label>
              <Input className="mt-1" value={model} onChange={(e) => setModel(e.target.value)} placeholder={type === 'truck' ? '579' : 'Champion'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>VIN</Label>
              <Input className="mt-1" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="1XPWD40X1ED..." />
            </div>
            <div>
              <Label>License Plate</Label>
              <Input className="mt-1" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ownership</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm capitalize" value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
                {OWNERSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {type === 'trailer' && (
              <div>
                <Label>Trailer Type</Label>
                <select className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={trailerType} onChange={(e) => setTrailerType(e.target.value)}>
                  {TRAILER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>DOT Inspection Date</Label>
              <Input className="mt-1" type="date" value={dotInspectionDate} onChange={(e) => setDotInspectionDate(e.target.value)} />
            </div>
            <div>
              <Label>DOT Inspection Expiry</Label>
              <Input className="mt-1" type="date" value={dotInspectionExpiry} onChange={(e) => setDotInspectionExpiry(e.target.value)} />
            </div>
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : `Create ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
