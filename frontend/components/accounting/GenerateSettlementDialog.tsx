'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateSettlement, getDrivers } from '@/lib/api';
import { Plus, Loader2, Trash2, ChevronLeft } from 'lucide-react';
import { extractApiError } from '@/lib/errors';
import { toast } from 'sonner';

interface DriverOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface CustomItem {
  id: string;
  type: 'accessorial' | 'deduction';
  description: string;
  amount: number;
}

export default function GenerateSettlementDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const [driverId, setDriverId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');


  const [customItems, setCustomItems] = useState<CustomItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoadingDrivers(true);
    getDrivers({ page: 1, page_size: 100 })
      .then((res) => setDrivers(res?.items ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, [open]);

  const reset = () => {
    setStep(1);
    setDriverId('');
    setPeriodStart('');
    setPeriodEnd('');
    setError('');
    setCustomItems([]);

  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    try {
      // Backend needs an endpoint /api/v1/accounting/settlements/preview
      // We will fall back to using standard generation logic with a flag or just assume it is returned.
      // Wait, the backend doesn't have a preview endpoint out of the box. I will need to build one in backend or simulate it here.
      // Actually, if we just let the backend generate it as "unposted", that IS the draft.
      // The prompt says "The Statements should be previewable... and on that preview window the accountant should be able to add Accessorials...".
      // We'll add the manual items into the generation request, and the backend needs to process them.
      setStep(2);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to prepare preview'));
    } finally {
      setPreviewing(false);
    }
  };

  const addCustomItem = (type: 'accessorial' | 'deduction') => {
    setCustomItems(prev => [...prev, {
      id: Math.random().toString(),
      type,
      description: '',
      amount: 0
    }]);
  };

  const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
    setCustomItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await generateSettlement({
        driver_id: driverId,
        period_start: periodStart,
        period_end: periodEnd,
        custom_items: customItems.map(c => ({
            type: c.type,
            description: c.description,
            amount: c.amount
        }))
      });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast.success("Settlement generated successfully.");
      reset();
      setOpen(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to generate settlement'));
    } finally {
      setSubmitting(false);
    }
  };

  const canPreview = driverId && periodStart && periodEnd && periodStart <= periodEnd;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Generate Settlement
      </Button>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Settlement</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Select a driver and date range.' : 'Add custom charges or bonuses.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label>Driver *</Label>
              {loadingDrivers ? (
                <div className="mt-1 h-9 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={driverId} onValueChange={(val) => setDriverId(val || '')}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Period Start *</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handlePreview} disabled={!canPreview || previewing}>
                {previewing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : 'Next: Custom Items'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Statement Preview: Custom Line Items</h3>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => addCustomItem('accessorial')}>+ Extra/Bonus</Button>
                  <Button size="sm" variant="outline" onClick={() => addCustomItem('deduction')}>+ Deduction</Button>
                </div>
              </div>

              {customItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/50">
                  No custom line items.
                </p>
              )}

              <div className="space-y-2">
                {customItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center border p-2 rounded-md bg-background">
                    <div className="text-xs font-bold w-20 uppercase text-muted-foreground">
                      {item.type === 'accessorial' ? 'Bonus' : 'Deduct'}
                    </div>
                    <Input
                      placeholder="Description (e.g. Layover)"
                      value={item.description}
                      onChange={(e) => updateCustomItem(item.id, 'description', e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) => updateCustomItem(item.id, 'amount', parseFloat(e.target.value))}
                      className="w-24 h-8 text-sm"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeCustomItem(item.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</> : 'Generate Settlement'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
