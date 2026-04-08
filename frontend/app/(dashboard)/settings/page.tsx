/**
 * Settings Page — Company profile and user management.
 */
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompanyProfile, useCompanyUsers, type CompanyUser } from '@/lib/hooks/settings';
import { updateCompanyProfile } from '@/lib/api';
import { Pencil, Loader2, X } from 'lucide-react';
import CreateUserDialog from '@/components/settings/CreateUserDialog';

const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Admin',
  dispatcher: 'Dispatcher',
  accountant: 'Accountant',
  super_admin: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  company_admin: 'bg-purple-500/20 text-purple-400',
  dispatcher: 'bg-blue-500/20 text-blue-400',
  accountant: 'bg-emerald-500/20 text-emerald-400',
  super_admin: 'bg-red-500/20 text-red-400',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'company' | 'users'>('company');
  const company = useCompanyProfile();
  const users = useCompanyUsers();

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMc, setEditMc] = useState('');
  const [editDot, setEditDot] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const startEditing = () => {
    if (!company.data) return;
    setEditName(company.data.name ?? '');
    setEditMc(company.data.mc_number ?? '');
    setEditDot(company.data.dot_number ?? '');
    setEditPhone(company.data.phone ?? '');
    setEditEmail(company.data.email ?? '');
    setEditAddress(company.data.address ?? '');
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanyProfile({
        name: editName || undefined,
        mc_number: editMc || undefined,
        dot_number: editDot || undefined,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        address: editAddress || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      setEditing(false);
    } catch {
      // TODO: toast error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Company profile, user management, and default configurations.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'company' | 'users')} className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="company" className="data-[state=active]:bg-background">Company Profile</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background">Users &amp; Permissions</TabsTrigger>
        </TabsList>

        {/* ── Company Profile Tab ─────────────────────────────── */}
        <TabsContent value="company" className="mt-4">
          {company.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          )}

          {company.error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-destructive text-sm">Error loading company profile.</p>
            </div>
          )}

          {company.data && !editing && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{company.data.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <InfoRow label="MC Number" value={company.data.mc_number} />
                    <InfoRow label="DOT Number" value={company.data.dot_number} />
                    <InfoRow label="Phone" value={company.data.phone} />
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="Email" value={company.data.email} />
                    <InfoRow label="Address" value={company.data.address} />
                    <InfoRow
                      label="Status"
                      value={company.data.is_active ? 'Active' : 'Inactive'}
                      valueClass={company.data.is_active ? 'text-emerald-400' : 'text-red-400'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {company.data && editing && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edit Company Profile</CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input className="mt-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <Label>MC Number</Label>
                    <Input className="mt-1" value={editMc} onChange={(e) => setEditMc(e.target.value)} />
                  </div>
                  <div>
                    <Label>DOT Number</Label>
                    <Input className="mt-1" value={editDot} onChange={(e) => setEditDot(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="mt-1" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input className="mt-1" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input className="mt-1" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Users Tab ──────────────────────────────────────── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <CreateUserDialog />
          </div>
          {users.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}

          {users.error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-destructive text-sm">Error loading users.</p>
            </div>
          )}

          {users.data && users.data.items.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}

          {users.data && users.data.items.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.items.map((u: CompanyUser) => (
                    <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {users.data && (
            <p className="text-xs text-muted-foreground text-right mt-2">
              {users.data.total} user{users.data.total !== 1 ? 's' : ''}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value?: string | null;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );
}
