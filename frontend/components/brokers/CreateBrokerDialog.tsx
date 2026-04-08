/**
 * CreateBrokerDialog — Modal for adding a new broker to the directory.
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
import { Textarea } from '@/components/ui/textarea';
import { createBroker } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';

export default function CreateBrokerDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setError('');
    setName(''); setMcNumber(''); setBillingAddress('');
    setContactName(''); setContactPhone(''); setContactEmail('');
    setNotes('');
  };

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createBroker({
        name,
        mc_number: mcNumber || undefined,
        billing_address: billingAddress || undefined,
        contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        notes: notes || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create broker');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Broker
        </Button>
      } />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add New Broker</DialogTitle>
          <DialogDescription>Enter broker company details and contact information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company Name *</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Logistics" />
            </div>
            <div>
              <Label>MC Number</Label>
              <Input className="mt-1" value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} placeholder="MC-123456" />
            </div>
          </div>

          <div>
            <Label>Billing Address</Label>
            <Input className="mt-1" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="123 Main St, Dallas, TX 75201" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input className="mt-1" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 555-1234" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@abc.com" />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : 'Create Broker'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
