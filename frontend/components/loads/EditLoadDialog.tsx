'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';
import { useUpdateLoad } from '@/lib/hooks/loads';
import type { LoadResponse } from '@/lib/types/loads';

interface EditLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: LoadResponse;
}

interface AccessorialEntry {
  type: string;
  amount: string;
  description: string;
}

interface StopEntry {
  stop_type: 'pickup' | 'delivery';
  stop_sequence: number;
  facility_name: string;
  city: string;
  state: string;
  zip_code: string;
  scheduled_date: string;
  notes: string;
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

export default function EditLoadDialog({ open, onOpenChange, load }: EditLoadDialogProps) {
  const updateLoad = useUpdateLoad();
  const [error, setError] = useState('');
  const [brokerLoadId, setBrokerLoadId] = useState(load.broker_load_id ?? '');
  const [contactAgent, setContactAgent] = useState(load.contact_agent ?? '');
  const [baseRate, setBaseRate] = useState(load.base_rate != null ? String(load.base_rate) : '');
  const [totalMiles, setTotalMiles] = useState(load.total_miles != null ? String(load.total_miles) : '');
  const [notes, setNotes] = useState(load.notes ?? '');
  const [activeTab, setActiveTab] = useState('general');
  const [accessorials, setAccessorials] = useState<AccessorialEntry[]>(
    (load.accessorials ?? []).map((acc) => ({
      type: acc.type,
      amount: String(acc.amount ?? ''),
      description: acc.description ?? '',
    }))
  );
  const [stops, setStops] = useState<StopEntry[]>(
    [...(load.stops ?? [])]
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((stop, idx) => ({
        stop_type: stop.stop_type === 'delivery' ? 'delivery' : 'pickup',
        stop_sequence: idx + 1,
        facility_name: stop.facility_name ?? '',
        city: stop.city ?? '',
        state: stop.state ?? '',
        zip_code: stop.zip_code ?? '',
        scheduled_date: stop.scheduled_date ? String(stop.scheduled_date).slice(0, 10) : '',
        notes: stop.notes ?? '',
      }))
  );

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

  const updateStop = (idx: number, field: keyof StopEntry, value: string) => {
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      {
        stop_type: 'delivery',
        stop_sequence: prev.length + 1,
        facility_name: '',
        city: '',
        state: '',
        zip_code: '',
        scheduled_date: '',
        notes: '',
      },
    ]);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stop_sequence: i + 1 })),
    );
  };

  const handleSubmit = async () => {
    setError('');
    const hasPickup = stops.some((s) => s.stop_type === 'pickup');
    const hasDelivery = stops.some((s) => s.stop_type === 'delivery');
    if (stops.length < 2 || !hasPickup || !hasDelivery) {
      setError('Route must include at least 2 stops with one pickup and one delivery.');
      return;
    }
    try {
      await updateLoad.mutateAsync({
        loadId: load.id,
        payload: {
          broker_load_id: brokerLoadId.trim() || undefined,
          contact_agent: contactAgent.trim() || undefined,
          base_rate: baseRate ? parseFloat(baseRate) : undefined,
          total_miles: totalMiles ? parseFloat(totalMiles) : undefined,
          accessorials: accessorials
            .filter((a) => a.amount && !Number.isNaN(parseFloat(a.amount)))
            .map((a) => ({
              type: a.type,
              amount: parseFloat(a.amount),
              description: a.description.trim() || undefined,
            })),
          stops: stops.map((stop, idx) => ({
            stop_type: stop.stop_type,
            stop_sequence: idx + 1,
            facility_name: stop.facility_name.trim() || undefined,
            city: stop.city.trim() || undefined,
            state: stop.state.trim() || undefined,
            zip_code: stop.zip_code.trim() || undefined,
            scheduled_date: stop.scheduled_date || undefined,
            notes: stop.notes.trim() || undefined,
          })),
          notes: notes.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to update load'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Load</DialogTitle>
          <DialogDescription>
            Update load details, route, and accessorials for {load.load_number}.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="data-[state=active]:bg-background">
              General
            </TabsTrigger>
            <TabsTrigger value="route" className="data-[state=active]:bg-background">
              Route
            </TabsTrigger>
            <TabsTrigger value="accessorials" className="data-[state=active]:bg-background">
              Accessorials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <div>
              <Label>Broker Load ID</Label>
              <Input
                className="mt-1"
                placeholder="e.g. TQL-77999"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Base Rate ($)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                />
              </div>
              <div>
                <Label>Total Miles</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={totalMiles}
                  onChange={(e) => setTotalMiles(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                className="mt-1"
                rows={4}
                placeholder="General load notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="route" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Route Stops</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <Plus className="w-3 h-3 mr-1" /> Add Stop
              </Button>
            </div>
            {stops.map((stop, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase">Stop #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      value={stop.stop_type}
                      onChange={(e) => updateStop(idx, 'stop_type', e.target.value as 'pickup' | 'delivery')}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStop(idx)}
                      disabled={stops.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Facility name"
                  value={stop.facility_name}
                  onChange={(e) => updateStop(idx, 'facility_name', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="City" value={stop.city} onChange={(e) => updateStop(idx, 'city', e.target.value)} />
                  <Input placeholder="State" value={stop.state} onChange={(e) => updateStop(idx, 'state', e.target.value)} />
                  <Input placeholder="ZIP" value={stop.zip_code} onChange={(e) => updateStop(idx, 'zip_code', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={stop.scheduled_date}
                    onChange={(e) => updateStop(idx, 'scheduled_date', e.target.value)}
                  />
                  <Input placeholder="Stop notes" value={stop.notes} onChange={(e) => updateStop(idx, 'notes', e.target.value)} />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="accessorials" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Accessorials</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAccessorial}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {accessorials.length === 0 ? (
              <p className="text-xs text-muted-foreground">No accessorials.</p>
            ) : (
              <div className="space-y-2">
                {accessorials.map((acc, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_120px_1fr_auto] gap-2 items-end">
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAccessorial(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateLoad.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateLoad.isPending}>
            {updateLoad.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
