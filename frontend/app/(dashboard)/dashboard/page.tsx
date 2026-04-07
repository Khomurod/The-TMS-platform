/**
 * Dashboard Home — redirects /dashboard to the executive dashboard.
 * This is the default landing page after login.
 */

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to Safehaul TMS — your operations command center.
        </p>
      </div>

      {/* KPI cards, fleet donut, compliance alerts, and recent events will be built in Phase 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Gross Revenue", "Avg RPM", "Active Loads", "Fleet Eff."].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">—</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
