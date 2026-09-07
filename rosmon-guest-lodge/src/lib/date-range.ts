/**
 * Shared by every check-in/check-out (or start/end) date-range picker in
 * the app: the hero search, the public booking flow, the admin manual
 * booking form, and admin inventory blocks. One set of rules, reused —
 * not reimplemented per screen. See the [check-in, check-out) convention
 * used throughout the inventory engine (checkout day itself is free).
 */

/** Today, as YYYY-MM-DD — use as a date input's `min` and as a default. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** `date` shifted by `n` days (negative allowed), as YYYY-MM-DD. */
export function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Earliest valid checkout for a given check-in. Minimum stay is one
 * night, so checkout can never equal or precede check-in.
 */
export function minCheckout(checkIn: string): string {
  return checkIn ? addDaysIso(checkIn, 1) : todayIso();
}

/**
 * Call whenever check-in changes: keeps the current checkout if it's
 * still valid (strictly after the new check-in), otherwise advances it
 * to check-in + 1 night. Prevents a stale, now-invalid checkout from
 * being left silently selected.
 */
export function reconcileCheckout(checkIn: string, currentCheckout: string): string {
  return currentCheckout && currentCheckout > checkIn
    ? currentCheckout
    : addDaysIso(checkIn, 1);
}
