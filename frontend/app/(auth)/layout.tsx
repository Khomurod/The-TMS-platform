/**
 * Auth Layout — minimal layout for login/register pages (no sidebar).
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-sidebar relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-primary/20" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-8 text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight">
            Safehaul TMS
          </h1>
          <p className="mt-3 text-sidebar-foreground/60 text-sm leading-relaxed">
            Enterprise-grade transportation management. Track loads, manage fleet,
            dispatch drivers, and process settlements — all in one platform.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              "Load Management",
              "Fleet Tracking",
              "Driver Compliance",
              "Settlements & Pay",
              "Multi-Tenant",
            ].map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-sidebar-border px-3 py-1 text-xs text-sidebar-foreground/50"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Right side — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
