/**
 * CreateUserDialog — Modal for inviting/creating a new internal user.
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
import { createUser } from '@/lib/api';
import { UserPlus, Loader2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

const ROLES = [
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'company_admin', label: 'Admin' },
];

export default function CreateUserDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dispatcher');

  const reset = () => {
    setError('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setRole('dispatcher');
  };

  const canSubmit = email.trim() && firstName.trim() && lastName.trim() && password.length >= 8;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createUser({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        role,
      });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to create user'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={
        <Button size="sm">
          <UserPlus className="w-4 h-4 mr-1" /> Invite User
        </Button>
      } />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Create an internal user account. They&apos;ll be able to log in immediately.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input className="mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input className="mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" />
          </div>

          <div>
            <Label>Password *</Label>
            <Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-destructive mt-1">Minimum 8 characters required</p>
            )}
          </div>

          <div>
            <Label>Role</Label>
            <select className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
