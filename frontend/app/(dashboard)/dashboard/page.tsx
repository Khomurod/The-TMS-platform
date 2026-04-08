/**
 * Dashboard Home — redirects /dashboard to the executive dashboard.
 * This is the default landing page after login.
 */
'use client';

import KpiCard from '@/components/dashboard/KpiCard';
import FleetDonut from '@/components/dashboard/FleetDonut';
import ComplianceAlert from '@/components/dashboard/ComplianceAlert';
import RecentEvents from '@/components/dashboard/RecentEvents';
import { useKpis } from '@/lib/hooks/dashboard';
export default function DashboardPage() {
  const { data: kpis, isLoading, error } = useKpis();

  const loading = isLoading || !kpis;

  // Format a number with space-separated thousands (e.g. 125 750)
  const fmt = (n: number | undefined): string => {
    if (n === undefined || n === null) return '-';
    return n.toLocaleString('en-US').replace(/,/g, ' ');
  };

  const kpiItems = [
    { label: 'Gross Revenue', value: kpis ? fmt(Number(kpis.gross_revenue)) : '-', prefix: '$', trend: kpis?.revenue_trend },
    { label: 'Avg RPM', value: kpis ? Number(kpis.avg_rpm).toFixed(2) : '-', prefix: '$', trend: kpis?.rpm_trend },
    { label: 'Active Loads', value: kpis?.active_loads ?? '-', trend: kpis?.loads_trend },
    { label: 'Fleet Eff.', value: kpis?.fleet_efficiency ?? kpis?.fleet_effectiveness ?? '-', suffix: '%', trend: kpis?.efficiency_trend },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to Safehaul TMS — your operations command center.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiItems.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} prefix={k.prefix} suffix={k.suffix} trend={k.trend} />
        ))}
      </div>

      {/* Fleet Donut and Compliance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FleetDonut />
        <ComplianceAlert />
      </div>

      {/* Recent Events */}
      <RecentEvents />
    </div>
  );
}
