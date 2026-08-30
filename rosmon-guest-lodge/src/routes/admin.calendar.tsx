import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  bookingsQuery,
  inventoryBlocksQuery,
  overlaps,
  roomTypesQuery,
  roomUnitsQuery,
  type BookingRow,
} from "@/lib/admin/queries";
import { occupyingStatuses } from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  view: z.enum(["day", "week"]).catch("week"),
  date: z.string().catch(() => new Date().toISOString().slice(0, 10)),
});

export const Route = createFileRoute("/admin/calendar")({
  validateSearch: searchSchema,
  component: CalendarPage,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
};

function CalendarPage() {
  const { view, date } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/calendar" });
  const bookings = useQuery(bookingsQuery);
  const units = useQuery(roomUnitsQuery);
  const roomTypes = useQuery(roomTypesQuery);
  const blocks = useQuery(inventoryBlocksQuery);

  const span = view === "day" ? 1 : 7;
  const days = Array.from({ length: span }, (_, i) => shift(date, i));
  const activeUnits = (units.data ?? []).filter((u) => u.is_active);
  const typeName = (id: string) => roomTypes.data?.find((r) => r.id === id)?.name ?? "";

  const set = (next: { view?: "day" | "week"; date?: string }) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  /** Bookings that hold a unit on a given night. Unassigned stays list separately. */
  const cellBooking = (unitId: string, day: string): BookingRow | undefined =>
    (bookings.data ?? []).find(
      (b) =>
        b.room_unit_id === unitId &&
        occupyingStatuses.includes(b.booking_status) &&
        overlaps(day, shift(day, 1), b.check_in, b.check_out),
    );

  const unassigned = (bookings.data ?? []).filter(
    (b) =>
      !b.room_unit_id &&
      occupyingStatuses.includes(b.booking_status) &&
      overlaps(days[0]!, shift(days[days.length - 1]!, 1), b.check_in, b.check_out),
  );

  const isBlocked = (unitId: string, day: string) =>
    (blocks.data ?? []).some(
      (bl) => bl.room_unit_id === unitId && overlaps(day, shift(day, 1), bl.start_date, bl.end_date),
    );

  const loading = bookings.isLoading || units.isLoading;

  return (
    <>
      <AdminPageHeader
        title="Calendar"
        description="15 units — 11 Standard, 4 Executive."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-hairline bg-card p-0.5">
              {(["day", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => set({ view: v })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs capitalize",
                    view === v ? "bg-gold text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              aria-label="Previous"
              onClick={() => set({ date: shift(date, -span) })}
              className="rounded-lg border border-hairline bg-card p-2"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => set({ date: iso(new Date()) })}
              className="rounded-lg border border-hairline bg-card px-3 py-2 text-xs"
            >
              Today
            </button>
            <button
              aria-label="Next"
              onClick={() => set({ date: shift(date, span) })}
              className="rounded-lg border border-hairline bg-card p-2"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />

      {bookings.isError && (
        <p className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(bookings.error as Error).message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-hairline bg-card">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-secondary/50" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline">
                <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-medium tracking-[0.08em] uppercase">
                  Unit
                </th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-3 text-center text-xs font-medium">
                    <span className="block text-muted-foreground">
                      {new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: "short",
                      })}
                    </span>
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeUnits.map((u) => (
                <tr key={u.id} className="border-b border-hairline last:border-0">
                  <th className="sticky left-0 z-10 bg-card px-4 py-2 text-left font-normal whitespace-nowrap">
                    <span className="font-medium">{u.internal_label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {typeName(u.room_type_id)}
                    </span>
                  </th>
                  {days.map((d) => {
                    const b = cellBooking(u.id, d);
                    const blocked = isBlocked(u.id, d);
                    return (
                      <td key={d} className="p-1 text-center align-middle">
                        {b ? (
                          <Link
                            to="/admin/bookings/$id"
                            params={{ id: b.id }}
                            className="block truncate rounded-md bg-gold/18 px-2 py-1.5 text-xs text-gold-deep hover:bg-gold/30"
                          >
                            {b.guest_name.split(" ")[0]}
                          </Link>
                        ) : blocked ? (
                          <span className="block rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                            Blocked
                          </span>
                        ) : (
                          <span className="block rounded-md bg-secondary/50 px-2 py-1.5 text-xs text-muted-foreground">
                            Free
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium tracking-[0.08em] uppercase">
          Unassigned stays in this range
        </h2>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every occupying booking in view has a unit assigned.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((b) => (
              <li key={b.id}>
                <Link
                  to="/admin/bookings/$id"
                  params={{ id: b.id }}
                  className="block rounded-xl border border-hairline bg-card px-4 py-3 text-sm hover:bg-secondary/60"
                >
                  <span className="font-medium">{b.guest_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {typeName(b.room_type_id)} · {b.check_in} → {b.check_out}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
