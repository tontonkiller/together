/**
 * True only for a real calendar date in YYYY-MM-DD form. The regex alone lets
 * through impossible dates like 2026-02-31, and `new Date(...)` silently rolls
 * those over (to March 3) instead of returning NaN — so we round-trip and check
 * the normalized date matches the input.
 */
export function isValidCalendarDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}
