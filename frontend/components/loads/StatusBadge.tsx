// components/loads/StatusBadge.tsx — colored status pill for load board

import { STATUS_COLORS } from '@/lib/types/loads';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
    >
      {label}
    </span>
  );
}
