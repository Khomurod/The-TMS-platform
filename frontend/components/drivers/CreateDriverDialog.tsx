/**
 * CreateDriverDialog — Modal for adding a new driver.
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
import { Separator } from '@/components/ui/separator';
import { createDriver } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

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

export default function CreateDriverDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employmentType, setEmploymentType] = useState('company_w2');
  const [cdlNumber, setCdlNumber] = useState('');
  const [cdlClass, setCdlClass] = useState('');
  const [cdlExpiry, setCdlExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [payRateType, setPayRateType] = useState('cpm');
  const [payRateValue, setPayRateValue] = useState('');
  const [hireDate, setHireDate] = useState('');

  const reset = () => {
    setError('');
    setFirstName(''); setLastName('');
    setPhone(''); setEmail('');
    setEmploymentType('company_w2');
    setCdlNumber(''); setCdlClass('');
    setCdlExpiry(''); setMedicalExpiry('');
    setPayRateType('cpm'); setPayRateValue('');
    setHireDate('');
  };

  const canSubmit = firstName.trim() && lastName.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createDriver({
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        email: email || undefined,
        employment_type: employmentType,
        cdl_number: cdlNumber || undefined,
        cdl_class: cdlClass || undefined,
        cdl_expiry_date: cdlExpiry || undefined,
        medical_card_expiry_date: medicalExpiry || undefined,
        pay_rate_type: payRateType,
        pay_rate_value: payRateValue ? parseFloat(payRateValue) : undefined,
        hire_date: hireDate || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to create driver'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Driver
        </Button>
      } />
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>Enter driver details, compliance documents, and pay configuration.</DialogDescription>
        </DialogHeader>

        <Separator className="my-3" />

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input className="mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Robert" />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input className="mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Williams" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="driver@email.com" />
            </div>
          </div>

          {/* Employment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employment Type</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Hire Date</Label>
              <Input className="mt-1" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* CDL / Compliance */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>CDL Number</Label>
              <Input className="mt-1" value={cdlNumber} onChange={(e) => setCdlNumber(e.target.value)} />
            </div>
            <div>
              <Label>CDL Class</Label>
              <Input className="mt-1" value={cdlClass} onChange={(e) => setCdlClass(e.target.value)} placeholder="A" />
            </div>
            <div>
              <Label>CDL Expiry</Label>
              <Input className="mt-1" type="date" value={cdlExpiry} onChange={(e) => setCdlExpiry(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Medical Card Expiry</Label>
            <Input className="mt-1 max-w-xs" type="date" value={medicalExpiry} onChange={(e) => setMedicalExpiry(e.target.value)} />
          </div>

          <Separator />

          {/* Pay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pay Rate Type</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={payRateType} onChange={(e) => setPayRateType(e.target.value)}>
                {PAY_RATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Pay Rate Value</Label>
              <Input className="mt-1" type="number" step="0.01" value={payRateValue} onChange={(e) => setPayRateValue(e.target.value)} placeholder="0.65" />
            </div>
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : 'Create Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
