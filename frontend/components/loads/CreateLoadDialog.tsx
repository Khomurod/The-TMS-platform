/**
 * CreateLoadDialog — Multi-step wizard for creating new loads.
 * Step 1: Broker & Rate Info
 * Step 2: Route (Stops)
 * Step 3: Extras & Review
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { createLoad, searchBrokers } from '@/lib/api';
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';

interface BrokerOption {
  id: string;
  name: string;
  mc_number?: string;
}

interface StopEntry {
  stop_type: 'pickup' | 'delivery';
  stop_sequence: number;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  scheduled_date: string;
  notes: string;
}

interface AccessorialEntry {
  type: string;
  amount: string;
  description: string;
}

const ACCESSORIAL_TYPES = [
  'fuel_surcharge',
  'detention',
  'layover',
  'lumper',
  'stop_off',
  'tarp',
  'other',
];

function emptyStop(type: 'pickup' | 'delivery', seq: number): StopEntry {
  return {
    stop_type: type,
    stop_sequence: seq,
    facility_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    scheduled_date: '',
    notes: '',
  };
}

export interface ParsedLoadData {
  broker_name?: string;
  broker_id?: string;
  broker_load_id?: string;
  base_rate?: number | string;
  total_miles?: number | string;
  pickup_facility?: string;
  pickup_address?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_zip?: string;
  pickup_date?: string;
  delivery_facility?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_date?: string;
  commodity?: string;
  weight?: number | string;
  [key: string]: unknown;
}

export default function CreateLoadDialog({
  open,
  onOpenChange,
  initialData,
}: {
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
  initialData?: ParsedLoadData | null;
} = {}) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open! : internalOpen;
  const setDialogOpen = (val: boolean) => {
    if (isControlled) onOpenChange?.(val);
    else setInternalOpen(val);
  };
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — broker & rate
  const [brokerId, setBrokerId] = useState('');
  const [brokerSearch, setBrokerSearch] = useState('');
  const [brokerResults, setBrokerResults] = useState<BrokerOption[]>([]);
  const [brokerName, setBrokerName] = useState('');
  const [brokerLoadId, setBrokerLoadId] = useState('');
  const [contactAgent, setContactAgent] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [totalMiles, setTotalMiles] = useState('');

  // Step 2 — stops
  const [stops, setStops] = useState<StopEntry[]>([
    emptyStop('pickup', 1),
    emptyStop('delivery', 2),
  ]);

  // Step 3 — extras
  const [accessorials, setAccessorials] = useState<AccessorialEntry[]>([]);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setStep(1);
    setError('');
    setBrokerId('');
    setBrokerSearch('');
    setBrokerResults([]);
    setBrokerName('');
    setBrokerLoadId('');
    setContactAgent('');
    setBaseRate('');
    setTotalMiles('');
    setStops([emptyStop('pickup', 1), emptyStop('delivery', 2)]);
    setAccessorials([]);
    setNotes('');
  };

  useEffect(() => {
    if (dialogOpen && initialData) {
      if (initialData.broker_name) setBrokerName(initialData.broker_name);
      if (initialData.broker_id) setBrokerId(initialData.broker_id);
      if (initialData.broker_load_id) setBrokerLoadId(initialData.broker_load_id);
      if (initialData.base_rate) setBaseRate(String(initialData.base_rate));
      if (initialData.total_miles) setTotalMiles(String(initialData.total_miles));
      
      const newStops = [emptyStop('pickup', 1), emptyStop('delivery', 2)];
      if (initialData.pickup_facility) {
        newStops[0].facility_name = initialData.pickup_facility;
      }
      if (initialData.pickup_address) {
        newStops[0].address = initialData.pickup_address;
      }
      if (initialData.pickup_city) {
        newStops[0].city = initialData.pickup_city;
      }
      if (initialData.pickup_state) {
        newStops[0].state = initialData.pickup_state;
      }
      if (initialData.pickup_zip) {
        newStops[0].zip_code = initialData.pickup_zip;
      }
      if (initialData.pickup_date) {
        newStops[0].scheduled_date = initialData.pickup_date;
      }

      if (initialData.delivery_facility) {
        newStops[1].facility_name = initialData.delivery_facility;
      }
      if (initialData.delivery_address) {
        newStops[1].address = initialData.delivery_address;
      }
      if (initialData.delivery_city) {
        newStops[1].city = initialData.delivery_city;
      }
      if (initialData.delivery_state) {
        newStops[1].state = initialData.delivery_state;
      }
      if (initialData.delivery_zip) {
        newStops[1].zip_code = initialData.delivery_zip;
      }
      if (initialData.delivery_date) {
        newStops[1].scheduled_date = initialData.delivery_date;
      }
      
      const notesParts = [];
      if (initialData.commodity) notesParts.push(`Commodity: ${initialData.commodity}`);
      if (initialData.weight) notesParts.push(`Weight: ${initialData.weight}`);
      if (notesParts.length > 0) {
        setNotes(notesParts.join(' | '));
      }
      
      setStops(newStops);
    }
  }, [dialogOpen, initialData]);

  const handleBrokerSearch = useCallback(async (q: string) => {
    setBrokerSearch(q);
    if (q.length < 1) {
      setBrokerResults([]);
      return;
    }
    try {
      const results = await searchBrokers(q);
      setBrokerResults(results ?? []);
    } catch {
      setBrokerResults([]);
    }
  }, []);

  const selectBroker = (b: BrokerOption) => {
    setBrokerId(b.id);
    setBrokerName(b.name);
    setBrokerSearch('');
    setBrokerResults([]);
  };

  const updateStop = (idx: number, field: keyof StopEntry, value: string) => {
    setStops((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };

  const addStop = () => {
    const nextSeq = stops.length + 1;
    setStops((prev) => [...prev, emptyStop('delivery', nextSeq)]);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stop_sequence: i + 1 })),
    );
  };

  const addAccessorial = () => {
    setAccessorials((prev) => [...prev, { type: 'fuel_surcharge', amount: '', description: '' }]);
  };

  const removeAccessorial = (idx: number) => {
    setAccessorials((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAccessorial = (idx: number, field: keyof AccessorialEntry, value: string) => {
    setAccessorials((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    );
  };

  const totalRate =
    (parseFloat(baseRate) || 0) +
    accessorials.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  const canSubmit =
    stops.length >= 2 && baseRate && parseFloat(baseRate) > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createLoad({
        broker_id: brokerId || undefined,
        broker_load_id: brokerLoadId || undefined,
        contact_agent: contactAgent || undefined,
        base_rate: parseFloat(baseRate) || undefined,
        total_miles: parseFloat(totalMiles) || undefined,
        notes: notes || undefined,
        stops: stops.map((s) => ({
          stop_type: s.stop_type,
          stop_sequence: s.stop_sequence,
          facility_name: s.facility_name || undefined,
          address: s.address || undefined,
          city: s.city || undefined,
          state: s.state || undefined,
          zip_code: s.zip_code || undefined,
          scheduled_date: s.scheduled_date || undefined,
          notes: s.notes || undefined,
        })),
        accessorials: accessorials
          .filter((a) => a.amount && parseFloat(a.amount) > 0)
          .map((a) => ({
            type: a.type,
            amount: parseFloat(a.amount),
            description: a.description || undefined,
          })),
      });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      reset();
      setDialogOpen(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to create load'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(val) => {
        setDialogOpen(val);
        if (!val) reset();
      }}
    >
      {!isControlled && (
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Load
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create New Load
            <span className="text-muted-foreground text-sm font-normal ml-2">
              Step {step} of 3
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {step === 1 && 'Broker information and rate details.'}
            {step === 2 && 'Define the route — at least one pickup and one delivery.'}
            {step === 3 && 'Add accessorials and review.'}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        {/* ── Step 1: Broker & Rate ─────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Label>Broker</Label>
              {brokerName ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium">{brokerName}</span>
                  <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() => {
                      setBrokerId('');
                      setBrokerName('');
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="Search brokers…"
                    value={brokerSearch}
                    onChange={(e) => handleBrokerSearch(e.target.value)}
                    className="mt-1"
                  />
                  {brokerResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
                      {brokerResults.map((b) => (
                        <li
                          key={b.id}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => selectBroker(b)}
                        >
                          {b.name}
                          {b.mc_number && (
                            <span className="text-xs text-muted-foreground ml-2">MC# {b.mc_number}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Broker Load ID</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. BKR-12345"
                  value={brokerLoadId}
                  onChange={(e) => setBrokerLoadId(e.target.value)}
                />
              </div>
              <div>
                <Label>Contact Agent</Label>
                <Input
                  className="mt-1"
                  placeholder="Agent name"
                  value={contactAgent}
                  onChange={(e) => setContactAgent(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Rate ($)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  placeholder="3,450.00"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                />
              </div>
              <div>
                <Label>Total Miles</Label>
                <Input
                  className="mt-1"
                  type="number"
                  placeholder="1,200"
                  value={totalMiles}
                  onChange={(e) => setTotalMiles(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Route (Stops) ────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {stops.map((stop, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        stop.stop_type === 'pickup' ? 'bg-blue-400' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-sm font-medium capitalize">{stop.stop_type} #{stop.stop_sequence}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs rounded border border-border bg-background px-2 py-1"
                      value={stop.stop_type}
                      onChange={(e) => updateStop(idx, 'stop_type', e.target.value)}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                    {stops.length > 2 && (
                      <button
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => removeStop(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    placeholder="Facility name"
                    value={stop.facility_name}
                    onChange={(e) => updateStop(idx, 'facility_name', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Street address"
                    value={stop.address}
                    onChange={(e) => updateStop(idx, 'address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={stop.city}
                    onChange={(e) => updateStop(idx, 'city', e.target.value)}
                  />
                  <Input
                    placeholder="State"
                    value={stop.state}
                    onChange={(e) => updateStop(idx, 'state', e.target.value)}
                  />
                  <Input
                    placeholder="ZIP"
                    value={stop.zip_code}
                    onChange={(e) => updateStop(idx, 'zip_code', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Scheduled Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={stop.scheduled_date}
                      onChange={(e) => updateStop(idx, 'scheduled_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes (PO#, Seal#)</Label>
                    <Input
                      className="mt-1"
                      placeholder="Optional"
                      value={stop.notes}
                      onChange={(e) => updateStop(idx, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addStop} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add Stop
            </Button>
          </div>
        )}

        {/* ── Step 3: Extras & Review ──────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Accessorials</h3>
                <Button variant="outline" size="sm" onClick={addAccessorial}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {accessorials.length === 0 && (
                <p className="text-xs text-muted-foreground">No accessorials added.</p>
              )}
              {accessorials.map((acc, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_100px_1fr_auto] gap-2 mb-2 items-end">
                  <div>
                    <select
                      className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                      value={acc.type}
                      onChange={(e) => updateAccessorial(idx, 'type', e.target.value)}
                    >
                      {ACCESSORIAL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="$"
                    value={acc.amount}
                    onChange={(e) => updateAccessorial(idx, 'amount', e.target.value)}
                  />
                  <Input
                    placeholder="Description"
                    value={acc.description}
                    onChange={(e) => updateAccessorial(idx, 'description', e.target.value)}
                  />
                  <button
                    className="text-destructive hover:text-destructive/80 pb-1"
                    onClick={() => removeAccessorial(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                className="mt-1"
                placeholder="General load notes…"
                value={notes}
                rows={3}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Separator />

            {/* Review summary */}
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <h3 className="text-sm font-medium">Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Broker:</span>
                <span>{brokerName || '—'}</span>
                <span className="text-muted-foreground">Base Rate:</span>
                <span>{baseRate ? `$${parseFloat(baseRate).toFixed(2)}` : '—'}</span>
                <span className="text-muted-foreground">Accessorials:</span>
                <span>
                  {accessorials.length > 0
                    ? `$${accessorials.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toFixed(2)} (${accessorials.length})`
                    : '—'}
                </span>
                <span className="text-muted-foreground font-medium">Total Rate:</span>
                <span className="font-semibold">${totalRate.toFixed(2)}</span>
                <span className="text-muted-foreground">Miles:</span>
                <span>{totalMiles || '—'}</span>
                <span className="text-muted-foreground">Stops:</span>
                <span>{stops.length}</span>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose
              render={
                <Button variant="ghost">
                  Cancel
                </Button>
              }
            />
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create Load'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
