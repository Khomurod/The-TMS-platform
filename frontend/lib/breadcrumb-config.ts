/**
 * Breadcrumb Route Configuration — Centralized route → label mapping.
 * Replaces hardcoded pathname string matching in TopBar.tsx.
 */

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

/**
 * Static route → breadcrumb mapping.
 * Keys are pathname prefixes; values are ordered breadcrumb segments.
 */
const ROUTE_MAP: Record<string, BreadcrumbSegment[]> = {
  "/dashboard": [
    { label: "Dashboard" },
  ],
  "/loads/new": [
    { label: "Load Management", href: "/loads" },
    { label: "Create Load" },
  ],
  "/loads": [
    { label: "Load Management" },
    { label: "All Loads" },
  ],
  "/drivers": [
    { label: "HR Management" },
    { label: "Drivers" },
  ],
  "/fleet": [
    { label: "Fleet Management" },
    { label: "Trucks" },
  ],
  "/accounting": [
    { label: "Accounting" },
    { label: "Settlements" },
  ],
  "/settings": [
    { label: "Settings" },
    { label: "Company Profile" },
  ],
};

/**
 * Dynamic route patterns — matched when no static route matches.
 * Order matters: more specific patterns should come first.
 */
const DYNAMIC_PATTERNS: { pattern: RegExp; breadcrumbs: (match: RegExpMatchArray) => BreadcrumbSegment[] }[] = [
  {
    pattern: /^\/loads\/([^/]+)$/,
    breadcrumbs: () => [
      { label: "Load Management", href: "/loads" },
      { label: "All Loads", href: "/loads" },
      { label: "Load Detail" },
    ],
  },
  {
    pattern: /^\/drivers\/([^/]+)$/,
    breadcrumbs: () => [
      { label: "HR Management", href: "/drivers" },
      { label: "Drivers", href: "/drivers" },
      { label: "Driver Profile" },
    ],
  },
  {
    pattern: /^\/fleet\/([^/]+)$/,
    breadcrumbs: () => [
      { label: "Fleet Management", href: "/fleet" },
      { label: "Trucks", href: "/fleet" },
      { label: "Truck Detail" },
    ],
  },
];

/**
 * Get breadcrumb segments for a given pathname.
 * Tries static mapping first, then dynamic patterns, then fallback.
 */
export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  // Try exact static match first
  if (ROUTE_MAP[pathname]) {
    return ROUTE_MAP[pathname];
  }

  // Try prefix match (for routes with query params or nested paths)
  const sortedKeys = Object.keys(ROUTE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (pathname.startsWith(key + "/") || pathname === key) {
      return ROUTE_MAP[key];
    }
  }

  // Try dynamic patterns
  for (const { pattern, breadcrumbs } of DYNAMIC_PATTERNS) {
    const match = pathname.match(pattern);
    if (match) {
      return breadcrumbs(match);
    }
  }

  // Fallback
  return [{ label: "Home" }];
}
