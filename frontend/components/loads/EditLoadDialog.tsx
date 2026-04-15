'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { extractApiError } from '@/lib/errors';
import { useUpdateLoad } from '@/lib/hooks/loads';
import type { LoadResponse } from '@/lib/types/loads';

interface EditLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: LoadResponse;
}

export default function EditLoadDialog({ open, onOpenChange, load }: EditLoadDialogProps) {
  const updateLoad = useUpdateLoad();
  const [error, setError] = useState('');
  const [brokerLoadId, setBrokerLoadId] = useState('');
  const [contactAgent, setContactAgent] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [totalMiles, setTotalMiles] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setBrokerLoadId(load.broker_load_id ?? '');
    setContactAgent(load.contact_agent ?? '');
    setBaseRate(load.base_rate != null ? String(load.base_rate) : '');
    setTotalMiles(load.total_miles != null ? String(load.total_miles) : '');
    setNotes(load.notes ?? '');
  }, [open, load]);

  const handleSubmit = async () => {
    setError('');
    try {
      await updateLoad.mutateAsync({
        loadId: load.id,
        payload: {
          broker_load_id: brokerLoadId.trim() || undefined,
          contact_agent: contactAgent.trim() || undefined,
          base_rate: baseRate ? parseFloat(baseRate) : undefined,
          total_miles: totalMiles ? parseFloat(totalMiles) : undefined,
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
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Load</DialogTitle>
          <DialogDescription>
            Update load details for {load.load_number}. Stops and accessorials are edited separately.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="space-y-4">
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
        </div>

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
