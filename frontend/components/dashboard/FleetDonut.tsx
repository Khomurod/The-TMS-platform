'use client';

import { useState, useEffect } from 'react';
import { useFleetStatus } from '@/lib/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS: Record<string, string> = {
  available: '#34D399',
  in_use: '#60A5FA',
  maintenance: '#F87171',
  out_of_service: '#9CA3AF',
};

export default function FleetDonut() {
  const { data, isLoading, error } = useFleetStatus();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
        <CardContent className="text-destructive text-sm">Error loading fleet data</CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Available', value: data?.available ?? 0 },
    { name: 'In Use', value: data?.in_use ?? data?.loaded ?? 0 },
    { name: 'Maintenance', value: data?.maintenance ?? data?.in_shop ?? 0 },
    ...(data?.out_of_service ? [{ name: 'Out of Service', value: data.out_of_service }] : []),
  ];

  const total = chartData.reduce((s, d) => s + d.value, 0);

  const getColor = (name: string): string => {
    const key = name.toLowerCase().replace(/\s/g, '_');
    return COLORS[key] ?? '#9CA3AF';
  };

  return (
    <Card className="h-full">
      <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="w-36 h-36 shrink-0">
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={getColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} units`]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                Loading…
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-sm">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getColor(entry.name) }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-medium ml-auto tabular-nums">
                  {entry.value}
                  <span className="text-muted-foreground font-normal ml-1 text-xs">
                    ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
