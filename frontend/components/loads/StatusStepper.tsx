/**
 * StatusStepper — Horizontal pipeline showing load progression through statuses.
 * Highlights the current status and shows completed/upcoming steps.
 */
'use client';

const STEPS = [
  { key: 'offer', label: 'Offer' },
  { key: 'booked', label: 'Booked' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'invoiced', label: 'Invoiced' },
  { key: 'paid', label: 'Paid' },
];

const STEP_INDEX: Record<string, number> = {};
STEPS.forEach((s, i) => { STEP_INDEX[s.key] = i; });

interface StatusStepperProps {
  currentStatus: string;
  className?: string;
}

export default function StatusStepper({ currentStatus, className = '' }: StatusStepperProps) {
  const currentIdx = STEP_INDEX[currentStatus] ?? -1;
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs font-medium text-red-400 bg-red-500/20 rounded-full px-3 py-1">
          Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center w-full ${className}`}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isUpcoming = idx > currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
            {/* Dot + Label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-400 border-emerald-400'
                    : isCurrent
                      ? 'bg-primary border-primary ring-4 ring-primary/20'
                      : 'bg-transparent border-muted-foreground/30'
                }`}
              />
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-primary'
                    : isCompleted
                      ? 'text-emerald-400'
                      : 'text-muted-foreground/50'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                  isCompleted
                    ? 'bg-emerald-400'
                    : isUpcoming
                      ? 'bg-muted-foreground/15'
                      : 'bg-primary/40'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
