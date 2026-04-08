/**
 * CreateTenantDialog — Super Admin modal for creating a new tenant company + admin user.
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
import { createTenant } from '@/lib/api';
import { Plus, Loader2, Building2 } from 'lucide-react';

export default function CreateTenantDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirst, setAdminFirst] = useState('');
  const [adminLast, setAdminLast] = useState('');

  const reset = () => {
    setError('');
    setCompanyName(''); setMcNumber(''); setDotNumber('');
    setAdminEmail(''); setAdminPassword('');
    setAdminFirst(''); setAdminLast('');
  };

  const canSubmit =
    companyName.trim() &&
    adminEmail.trim() &&
    adminPassword.length >= 8 &&
    adminFirst.trim() &&
    adminLast.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createTenant({
        company_name: companyName,
        mc_number: mcNumber || undefined,
        dot_number: dotNumber || undefined,
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_first_name: adminFirst,
        admin_last_name: adminLast,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Tenant
        </Button>
      } />
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Provision a new company with its first admin user. They can log in immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Details</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <Label>Company Name *</Label>
              <Input className="mt-1" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Trucking" />
            </div>
            <div>
              <Label>MC Number</Label>
              <Input className="mt-1" value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} placeholder="MC-789012" />
            </div>
            <div>
              <Label>DOT Number</Label>
              <Input className="mt-1" value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} placeholder="DOT-345678" />
            </div>
          </div>

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin User</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input className="mt-1" value={adminFirst} onChange={(e) => setAdminFirst(e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input className="mt-1" value={adminLast} onChange={(e) => setAdminLast(e.target.value)} placeholder="Doe" />
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <Input className="mt-1" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="jane@acmetrucking.com" />
          </div>
          <div>
            <Label>Password *</Label>
            <Input className="mt-1" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min 8 characters" />
            {adminPassword.length > 0 && adminPassword.length < 8 && (
              <p className="text-xs text-destructive mt-1">Minimum 8 characters</p>
            )}
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : 'Create Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
