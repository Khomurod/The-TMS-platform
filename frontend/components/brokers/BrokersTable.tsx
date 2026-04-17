/**
 * BrokersTable - Clickable broker directory table with edit drawer.
 */
'use client';

import { useState } from 'react';
import type { BrokerItem } from '@/lib/hooks/brokers';
import BrokerDrawer from '@/components/brokers/BrokerDrawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BrokersTableProps {
  items: BrokerItem[];
}

export default function BrokersTable({ items }: BrokersTableProps) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (brokerId: string) => {
    setSelectedBrokerId(brokerId);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setSelectedBrokerId(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-card/80 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/[0.04]">
              <TableHead>Company</TableHead>
              <TableHead>MC #</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((broker) => (
              <TableRow
                key={broker.id}
                className="cursor-pointer border-white/10 transition-colors hover:bg-white/5"
                onClick={() => handleRowClick(broker.id)}
              >
                <TableCell className="font-medium">{broker.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {broker.mc_number || '-'}
                </TableCell>
                <TableCell className="text-sm">{broker.contact_name || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {broker.contact_phone || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {broker.contact_email || '-'}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      broker.is_active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {broker.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BrokerDrawer
        brokerId={selectedBrokerId}
        isOpen={drawerOpen}
        onClose={handleClose}
      />
    </>
  );
}
