/**
 * Simple className merge utility.
 * Filters out falsy values and joins with space.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
