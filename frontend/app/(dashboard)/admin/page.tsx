/**
 * Admin Portal — Super Admin tenant management page.
 * Lists all companies with status toggle and impersonation.
 */
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminCompanies, type AdminCompany } from '@/lib/hooks/admin';
import { toggleCompanyStatus, impersonateCompany } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CreateTenantDialog from '@/components/admin/CreateTenantDialog';
import { Shield, Power, LogIn, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: companies, isLoading, error } = useAdminCompanies();
  const [actionLoading, setActionLoading] = useState('');

  const handleToggle = async (companyId: string) => {
    setActionLoading(`toggle-${companyId}`);
    try {
      await toggleCompanyStatus(companyId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    } catch {
      // TODO: toast error
    } finally {
      setActionLoading('');
    }
  };

  const handleImpersonate = async (companyId: string) => {
    setActionLoading(`imp-${companyId}`);
    try {
      const result = await impersonateCompany(companyId);
      if (result?.access_token) {
        sessionStorage.setItem('access_token', result.access_token);
        window.location.href = '/dashboard';
      }
    } catch {
      // TODO: toast error
    } finally {
      setActionLoading('');
    }
  };

  const activeCount = companies?.filter((c) => c.is_active).length ?? 0;
  const totalCount = companies?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-400" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Multi-tenant management — provision, suspend, and impersonate companies.
            </p>
          </div>
        </div>
        <CreateTenantDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Tenants</p>
            <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold mt-0.5 text-emerald-400">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Suspended</p>
            <p className="text-2xl font-bold mt-0.5 text-red-400">{totalCount - activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">Failed to load companies. Ensure you have super_admin privileges.</p>
        </div>
      )}

      {companies && companies.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No tenants provisioned yet.</p>
        </div>
      )}

      {companies && companies.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Company</TableHead>
                <TableHead>MC Number</TableHead>
                <TableHead>DOT Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c: AdminCompany) => (
                <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.mc_number || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.dot_number || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {c.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(c.id)}
                        disabled={actionLoading === `toggle-${c.id}`}
                        className={c.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}
                      >
                        {actionLoading === `toggle-${c.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5 mr-1" />
                        )}
                        {c.is_active ? 'Suspend' : 'Activate'}
                      </Button>
                      {c.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonate(c.id)}
                          disabled={actionLoading === `imp-${c.id}`}
                        >
                          {actionLoading === `imp-${c.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5 mr-1" />
                          )}
                          Impersonate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
