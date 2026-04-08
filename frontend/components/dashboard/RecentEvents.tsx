// components/dashboard/RecentEvents.tsx

import { useRecentEvents } from '@/lib/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const EVENT_COLORS: Record<string, string> = {
  load_delivered: 'bg-success',
  driver_dispatched: 'bg-primary',
  settlement_posted: 'bg-info',
  load_booked: 'bg-chart-2',
  red: 'bg-destructive',
  green: 'bg-success',
  blue: 'bg-primary',
};

function timeAgo(ts: string | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecentEvents() {
  const { data, isLoading, error } = useRecentEvents();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>Loading…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">Error loading events</CardContent>
      </Card>
    );
  }

  const events = data?.events ?? data?.items ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent events.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e, i) => {
                const colorClass = EVENT_COLORS[e.event_type ?? e.color ?? ''] ?? 'bg-muted-foreground';
                return (
                  <li key={e.id ?? e.load_id ?? i} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{e.description}</p>
                      {e.load_number && (
                        <span className="text-xs text-muted-foreground">
                          {e.load_number} · {e.status?.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {e.timestamp && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(e.timestamp)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
