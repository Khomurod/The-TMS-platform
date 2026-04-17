/**
 * DriverDrawer — Slide-out details, editing, and deactivation for a driver.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
  DialogClose,
} from '@/components/ui/dialog';
import { useDriverDetail, useUpdateDriver, useDeleteDriver } from '@/lib/hooks/drivers';
import { Loader2, Trash2, Save, X } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

interface DriverDrawerProps {
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

export default function DriverDrawer({ driverId, isOpen, onClose }: DriverDrawerProps) {
  const { data: driver, isLoading } = useDriverDetail(driverId);
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [employmentType, setEmploymentType] = useState('company_w2');
  const [cdlNumber, setCdlNumber] = useState('');
  const [cdlClass, setCdlClass] = useState('');
  const [cdlExpiry, setCdlExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [payRateType, setPayRateType] = useState('cpm');
  const [payRateValue, setPayRateValue] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  // Sync form state when data loads
  useEffect(() => {
    if (driver) {
      setFirstName(driver.first_name || '');
      setLastName(driver.last_name || '');
      setPhone(driver.phone || '');
      setEmail(driver.email || '');
      setHomeAddress(driver.home_address || '');
      setEmploymentType(driver.employment_type || 'company_w2');
      setCdlNumber(driver.cdl_number || '');
      setCdlClass(driver.cdl_class || '');
      setCdlExpiry(driver.cdl_expiry_date || '');
      setMedicalExpiry(driver.medical_card_expiry_date || '');
      setPayRateType(driver.pay_rate_type || 'cpm');
      setPayRateValue(driver.pay_rate_value?.toString() || '');
      setHireDate(driver.hire_date || '');
      setNotes(driver.notes || '');
    }
  }, [driver]);

  const handleUpdate = async () => {
    if (!driverId) return;
    setError('');
    try {
      await updateMutation.mutateAsync({
        driverId,
        payload: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email: email || null,
          home_address: homeAddress || null,
          employment_type: employmentType,
          cdl_number: cdlNumber || null,
          cdl_class: cdlClass || null,
          cdl_expiry_date: cdlExpiry || null,
          medical_card_expiry_date: medicalExpiry || null,
          pay_rate_type: payRateType,
          pay_rate_value: payRateValue ? parseFloat(payRateValue) : null,
          hire_date: hireDate || null,
          notes: notes || null,
        },
      });
      onClose();
    } catch (err) {
      setError(extractApiError(err, 'Failed to update driver'));
    }
  };

  const handleDelete = async () => {
    if (!driverId) return;
    try {
      await deleteMutation.mutateAsync(driverId);
      setIsConfirmOpen(false);
      onClose();
    } catch (err) {
      setError(extractApiError(err, 'Failed to deactivate driver'));
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-background/60 backdrop-blur-xl border-l-white/10 shadow-2xl">
          <SheetHeader>
            <SheetTitle>Driver Profile</SheetTitle>
            <SheetDescription>
              View and edit driver information or compliance documents.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading driver profile...</p>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Home Address</Label>
                <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <select
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CDL Class</Label>
                  <Input value={cdlClass} onChange={(e) => setCdlClass(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>CDL Expiry</Label>
                  <Input type="date" value={cdlExpiry} onChange={(e) => setCdlExpiry(e.target.value)} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Compliance notes, internal comments..." />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="pt-4 flex flex-col gap-3">
                <Button className="w-full" onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="destructive"
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                  onClick={() => setIsConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deactivate Driver
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-background/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Deactivate Driver?</DialogTitle>
            <DialogDescription>
              This will hide the driver from future dispatch. Active trips must be completed first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
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
