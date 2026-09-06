import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Every admin write goes through here.
 *
 * PostgREST answers an UPDATE/DELETE that RLS filtered out with a success
 * status and zero rows — no error. Without this check the UI would show
 * "Saved" while the database was untouched, which is exactly the failure we
 * must never present. Asking for the affected rows back (`.select()`) turns
 * that silent no-op into a visible failure.
 */
export function assertWrite<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  label: string,
): T[] {
  if (result.error) {
    // Keep the raw database error in the console for diagnosis.
    console.error(`[admin write] ${label} failed`, result.error);
    const detail = [result.error.message, result.error.details, result.error.hint]
      .filter(Boolean)
      .join(" — ");
    throw new Error(`${label} failed: ${detail}`);
  }
  const rows = result.data ?? [];
  if (rows.length === 0) {
    console.error(
      `[admin write] ${label} affected 0 rows — the row is missing or your role is not permitted to change it.`,
    );
    throw new Error(
      `${label} did not save. The database rejected the change (your role may be read-only). Nothing was stored.`,
    );
  }
  return rows;
}

/** Storage operations return a different shape; surface their errors the same way. */
export function assertStorage(
  result: { error: { message: string } | null },
  label: string,
): void {
  if (result.error) {
    console.error(`[admin storage] ${label} failed`, result.error);
    throw new Error(`${label} failed: ${result.error.message}`);
  }
}
