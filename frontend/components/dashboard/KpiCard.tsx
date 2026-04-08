// components/dashboard/KpiCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: number;
}

export default function KpiCard({ label, value, prefix, suffix, trend }: KpiCardProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-lg font-semibold text-muted-foreground">{prefix}</span>
          )}
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {suffix && (
            <span className="text-lg font-semibold text-muted-foreground">{suffix}</span>
          )}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-xs font-medium",
            trend > 0 ? "text-emerald-600" : "text-red-500"
          )}>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
