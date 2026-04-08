// components/dashboard/ComplianceAlert.tsx

import { useComplianceAlerts } from '@/lib/hooks/dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ComplianceAlert() {
  const { data, isLoading, error } = useComplianceAlerts();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>Loading…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">Error loading alerts</CardContent>
      </Card>
    );
  }

  const alerts = data?.alerts ?? data?.items ?? [];
  const criticalCount = data?.critical_count ?? 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Compliance Alerts</CardTitle>
        {criticalCount > 0 && (
          <Badge variant="destructive">
            {criticalCount} Critical
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">All clear!</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={a.entity_id ?? a.id ?? i} className="text-sm">
                  <span className="font-medium">{a.entity_name ?? a.driver_name}</span> – {a.description ?? a.type}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
