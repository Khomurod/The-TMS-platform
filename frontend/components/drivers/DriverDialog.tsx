/**
 * DriverDialog — Slide-out details, editing, and deactivation for a driver.
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DriverDetail } from '@/lib/hooks/drivers';
import { useDriverDetail, useUpdateDriver, useDeleteDriver } from '@/lib/hooks/drivers';
import { Loader2, Trash2, Save } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

interface DriverDialogProps {
  driverId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const EMPLOYMENT_TYPES = [
  { value: 'company_w2', label: 'Company (W-2)' },
  { value: 'owner_operator_1099', label: 'Owner-Operator (1099)' },
  { value: 'lease_operator', label: 'Lease Operator' },
];

const PAY_RATE_TYPES = [
  { value: 'cpm', label: 'Per Mile (CPM)' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_per_load', label: 'Fixed Per Load' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
];

type DriverFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;
  employmentType: string;
  cdlNumber: string;
  cdlClass: string;
  cdlExpiry: string;
  medicalExpiry: string;
  payRateType: string;
  payRateValue: string;
  hireDate: string;
  notes: string;
};

const buildDriverFormValues = (driver: DriverDetail): DriverFormValues => ({
  firstName: driver.first_name || '',
  lastName: driver.last_name || '',
  phone: driver.phone || '',
  email: driver.email || '',
  homeAddress: driver.home_address || '',
  employmentType: driver.employment_type || 'company_w2',
  cdlNumber: driver.cdl_number || '',
  cdlClass: driver.cdl_class || '',
  cdlExpiry: driver.cdl_expiry_date || '',
  medicalExpiry: driver.medical_card_expiry_date || '',
  payRateType: driver.pay_rate_type || 'cpm',
  payRateValue: driver.pay_rate_value?.toString() || '',
  hireDate: driver.hire_date || '',
  notes: driver.notes || '',
});

interface DriverDialogFormProps {
  driver: DriverDetail;
  error: string;
  isSubmitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

function DriverDialogForm({
  driver,
  error,
  isSubmitting,
  onSubmit,
}: DriverDialogFormProps) {
  const [form, setForm] = useState<DriverFormValues>(() => buildDriverFormValues(driver));

  const setField = (field: keyof DriverFormValues, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdate = async () => {
    await onSubmit({
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone || null,
      email: form.email || null,
      home_address: form.homeAddress || null,
      employment_type: form.employmentType,
      cdl_number: form.cdlNumber || null,
      cdl_class: form.cdlClass || null,
      cdl_expiry_date: form.cdlExpiry || null,
      medical_card_expiry_date: form.medicalExpiry || null,
      pay_rate_type: form.payRateType,
      pay_rate_value: form.payRateValue ? parseFloat(form.payRateValue) : null,
      hire_date: form.hireDate || null,
      notes: form.notes || null,
    });
  };

  return (
    <div className="py-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Home Address</Label>
        <Input
          value={form.homeAddress}
          onChange={(e) => setField('homeAddress', e.target.value)}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <select
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={form.employmentType}
            onChange={(e) => setField('employmentType', e.target.value)}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Hire Date</Label>
          <Input
            type="date"
            value={form.hireDate}
            onChange={(e) => setField('hireDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CDL Number</Label>
          <Input
            value={form.cdlNumber}
            onChange={(e) => setField('cdlNumber', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>CDL Class</Label>
          <Input value={form.cdlClass} onChange={(e) => setField('cdlClass', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CDL Expiry</Label>
          <Input
            type="date"
            value={form.cdlExpiry}
            onChange={(e) => setField('cdlExpiry', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Medical Card Expiry</Label>
          <Input
            type="date"
            value={form.medicalExpiry}
            onChange={(e) => setField('medicalExpiry', e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pay Rate Type</Label>
          <select
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={form.payRateType}
            onChange={(e) => setField('payRateType', e.target.value)}
          >
            {PAY_RATE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Pay Rate Value</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={form.payRateValue}
            onChange={(e) => setField('payRateValue', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Compliance notes, internal comments..."
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="pt-4 flex flex-col gap-3">
        <Button className="w-full min-h-[44px] min-w-[44px]" onClick={handleUpdate} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default function DriverDialog({ driverId, isOpen, onClose }: DriverDialogProps) {
  const { data: driver, isLoading } = useDriverDetail(driverId);
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    setIsConfirmOpen(false);
    onClose();
  };

  const handleUpdate = async (payload: Record<string, unknown>) => {
    if (!driverId) return;
    setError('');
    try {
      await updateMutation.mutateAsync({
        driverId,
        payload,
      });
      handleClose();
    } catch (err) {
      setError(extractApiError(err, 'Failed to update driver'));
    }
  };

  const handleDelete = async () => {
    if (!driverId) return;
    setError('');
    try {
      await deleteMutation.mutateAsync(driverId);
      handleClose();
    } catch (err) {
      setError(extractApiError(err, 'Failed to deactivate driver'));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Driver Profile</DialogTitle>
            <DialogDescription>
              View and edit driver information or compliance documents.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading driver profile...</p>
            </div>
          ) : driver ? (
            <DriverDialogForm
              key={driver.id}
              driver={driver}
              error={error}
              isSubmitting={updateMutation.isPending}
              onSubmit={handleUpdate}
            />
          ) : (
            <div className="py-6">
              <p className="text-sm text-muted-foreground">Driver details could not be loaded.</p>
            </div>
          )}

          {!isLoading && driver && (
            <div className="pb-6">
              <Button
                variant="destructive"
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 min-h-[44px] min-w-[44px]"
                onClick={() => setIsConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deactivate Driver
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-background/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Deactivate Driver?</DialogTitle>
            <DialogDescription>
              This will hide the driver from future dispatch. Active trips must be completed first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="min-h-[44px] min-w-[44px]" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
