/**
 * BrokerDrawer - Slide-over editor for broker details with soft delete.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/stores/authStore';
import { extractApiError } from '@/lib/errors';
import { useBrokerDetail, useDeleteBroker, useUpdateBroker } from '@/lib/hooks/brokers';

const brokerFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255, 'Company name is too long'),
  mc_number: z.string().max(50, 'MC number is too long'),
  billing_address: z.string(),
  contact_name: z.string().max(255, 'Contact name is too long'),
  contact_phone: z.string().max(20, 'Phone number is too long'),
  contact_email: z.union([
    z.literal(''),
    z.string().email('Enter a valid email address'),
  ]),
  notes: z.string(),
});

type BrokerFormValues = z.infer<typeof brokerFormSchema>;

const EMPTY_FORM_VALUES: BrokerFormValues = {
  name: '',
  mc_number: '',
  billing_address: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  notes: '',
};

interface BrokerDrawerProps {
  brokerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function toFormValues(broker: {
  name: string;
  mc_number?: string;
  billing_address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
}): BrokerFormValues {
  return {
    name: broker.name ?? '',
    mc_number: broker.mc_number ?? '',
    billing_address: broker.billing_address ?? '',
    contact_name: broker.contact_name ?? '',
    contact_phone: broker.contact_phone ?? '',
    contact_email: broker.contact_email ?? '',
    notes: broker.notes ?? '',
  };
}

function toPayload(values: BrokerFormValues) {
  return {
    name: values.name.trim(),
    mc_number: values.mc_number.trim() || undefined,
    billing_address: values.billing_address.trim() || undefined,
    contact_name: values.contact_name.trim() || undefined,
    contact_phone: values.contact_phone.trim() || undefined,
    contact_email: values.contact_email.trim() || undefined,
    notes: values.notes.trim() || undefined,
  };
}

export default function BrokerDrawer({ brokerId, isOpen, onClose }: BrokerDrawerProps) {
  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === 'company_admin';
  const { data: broker, isLoading, error } = useBrokerDetail(isOpen ? brokerId : null);
  const updateBroker = useUpdateBroker();
  const deleteBroker = useDeleteBroker();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    if (broker) {
      form.reset(toFormValues(broker));
    }
  }, [broker, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [form, isOpen]);

  const contactSummary = useMemo(() => {
    if (!broker) return 'Broker details';
    return broker.contact_name || broker.contact_email || broker.contact_phone || 'Broker details';
  }, [broker]);

  const handleClose = () => {
    setDeleteDialogOpen(false);
    setSubmitError('');
    setDeleteError('');
    onClose();
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!brokerId) return;

    setSubmitError('');
    try {
      await updateBroker.mutateAsync({
        brokerId,
        payload: toPayload(values),
      });
      handleClose();
    } catch (err: unknown) {
      setSubmitError(extractApiError(err, 'Failed to update broker'));
    }
  });

  const handleDelete = async () => {
    if (!brokerId) return;

    setDeleteError('');
    try {
      await deleteBroker.mutateAsync(brokerId);
      setDeleteDialogOpen(false);
      handleClose();
    } catch (err: unknown) {
      setDeleteError(extractApiError(err, 'Failed to delete broker'));
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="w-full border-white/10 bg-popover/95 sm:max-w-lg supports-backdrop-filter:backdrop-blur-xl"
        >
          {isLoading ? (
            <SheetHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-1 h-4 w-32" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </SheetHeader>
          ) : error || !broker ? (
            <>
              <SheetHeader>
                <SheetTitle>Broker Details</SheetTitle>
                <SheetDescription>Unable to load this broker.</SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load broker details. Please try again.
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-base font-semibold">
                    {broker.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{broker.name}</SheetTitle>
                    <SheetDescription className="truncate">
                      {contactSummary}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4">
                <form id="broker-drawer-form" onSubmit={handleSubmit} className="space-y-5 py-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="broker-name">Company Name</Label>
                        <Input
                          id="broker-name"
                          aria-invalid={!!form.formState.errors.name}
                          {...form.register('name')}
                        />
                        {form.formState.errors.name && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broker-mc-number">MC Number</Label>
                        <Input
                          id="broker-mc-number"
                          aria-invalid={!!form.formState.errors.mc_number}
                          {...form.register('mc_number')}
                        />
                        {form.formState.errors.mc_number && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.mc_number.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="broker-contact-name">Contact Name</Label>
                        <Input
                          id="broker-contact-name"
                          aria-invalid={!!form.formState.errors.contact_name}
                          {...form.register('contact_name')}
                        />
                        {form.formState.errors.contact_name && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.contact_name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broker-contact-phone">Phone</Label>
                        <Input
                          id="broker-contact-phone"
                          aria-invalid={!!form.formState.errors.contact_phone}
                          {...form.register('contact_phone')}
                        />
                        {form.formState.errors.contact_phone && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.contact_phone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="broker-contact-email">Email</Label>
                        <Input
                          id="broker-contact-email"
                          type="email"
                          aria-invalid={!!form.formState.errors.contact_email}
                          {...form.register('contact_email')}
                        />
                        {form.formState.errors.contact_email && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.contact_email.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="broker-billing-address">Billing Address</Label>
                        <Textarea
                          id="broker-billing-address"
                          rows={3}
                          aria-invalid={!!form.formState.errors.billing_address}
                          {...form.register('billing_address')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broker-notes">Notes</Label>
                        <Textarea
                          id="broker-notes"
                          rows={4}
                          aria-invalid={!!form.formState.errors.notes}
                          {...form.register('notes')}
                        />
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {submitError}
                    </div>
                  )}
                </form>
              </ScrollArea>

              <Separator />

              <SheetFooter className="bg-white/[0.03]">
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteBroker.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete Broker
                  </Button>
                )}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={updateBroker.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="broker-drawer-form"
                    disabled={updateBroker.isPending}
                  >
                    {updateBroker.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open && !deleteBroker.isPending) {
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Broker</DialogTitle>
            <DialogDescription>
              Are you sure? This will hide the broker from future loads.
            </DialogDescription>
          </DialogHeader>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteBroker.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBroker.isPending}
            >
              {deleteBroker.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Broker'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
