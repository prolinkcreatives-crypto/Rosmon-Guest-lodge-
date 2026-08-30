import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LogIn,
  LogOut,
  Wallet,
} from "lucide-react";
import {
  bookingsQuery,
  roomTypesQuery,
  roomUnitsQuery,
  type BookingRow,
} from "@/lib/admin/queries";
import { businessRules, formatMoney, occupyingStatuses } from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BookingStatusPill } from "@/components/admin/StatusPill";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Dashboard() {
  const bookings = useQuery(bookingsQuery);
  const roomTypes = useQuery(roomTypesQuery);
  const units = useQuery(roomUnitsQuery);

  const todayStr = iso(new Date());
  const rows = bookings.data ?? [];

  const arrivals = rows.filter(
    (b) => b.check_in === todayStr && !["cancelled", "expired"].includes(b.booking_status),
  );
  const departures = rows.filter(
    (b) =>
      b.check_out === todayStr && !["cancelled", "expired"].includes(b.booking_status),
  );
  const inHouse = rows.filter(
    (b) =>
      b.booking_status === "checked_in" ||
      (occupyingStatuses.includes(b.booking_status) &&
        b.check_in <= todayStr &&
        b.check_out > todayStr),
  );
  const awaitingPayment = rows.filter(
    (b) => b.payment_status === "unpaid" || b.payment_status === "submitted",
  );

  const capacity = (units.data ?? []).filter((u) => u.is_active).length || 15;
  const occupancy = Math.round((inHouse.length / capacity) * 100);

  const upcoming = rows
    .filter((b) => b.check_in >= todayStr && !["cancelled", "expired"].includes(b.booking_status))
    .slice(0, 6);

  const loading = bookings.isLoading || units.isLoading;

  return (
    <>
      <AdminPageHeader
        title="Today at Rosmon"
        description={`Check-in ${businessRules.checkInWindow} · Check-out ${businessRules.checkOutWindow}`}
        actions={
          <Link
            to="/admin/bookings"
            search={{ new: true }}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            New booking
          </Link>
        }
      />

      {bookings.isError && (
        <p className="mb-6 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load bookings: {(bookings.error as Error).message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={LogIn}
          label="Arrivals today"
          value={loading ? "—" : String(arrivals.length)}
          hint={businessRules.checkInWindow}
        />
        <Stat
          icon={LogOut}
          label="Departures today"
          value={loading ? "—" : String(departures.length)}
          hint={businessRules.checkOutWindow}
        />
        <Stat
          icon={DoorOpen}
          label="Occupancy"
          value={loading ? "—" : `${isFinite(occupancy) ? occupancy : 0}%`}
          hint={`${inHouse.length} of ${capacity} units`}
        />
        <Stat
          icon={Wallet}
          label="Awaiting payment"
          value={loading ? "—" : String(awaitingPayment.length)}
          hint={formatMoney(
            awaitingPayment.reduce((sum, b) => sum + Number(b.total), 0),
          )}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-[0.08em] uppercase">
              Upcoming arrivals
            </h2>
            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs text-gold"
            >
              All bookings <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline bg-card">
            {loading && <Skeletons />}
            {!loading && upcoming.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                No upcoming arrivals yet.
              </p>
            )}
            <ul className="divide-y divide-hairline">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/admin/bookings/$id"
                    params={{ id: b.id }}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.guest_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.reference} · {b.check_in} → {b.check_out}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gold">{formatMoney(b.total)}</span>
                      <BookingStatusPill status={b.booking_status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium tracking-[0.08em] uppercase">
              Quick actions
            </h2>
            <div className="grid gap-2">
              <QuickLink
                to="/admin/bookings"
                icon={ClipboardList}
                label="Manage bookings"
              />
              <QuickLink to="/admin/calendar" icon={CalendarDays} label="Open calendar" />
              <QuickLink to="/admin/rooms" icon={DoorOpen} label="Rooms & pricing" />
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-card p-4">
            <h2 className="text-sm font-medium tracking-[0.08em] uppercase">Inventory</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(roomTypes.data ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>
                    {r.name}{" "}
                    <span className="text-muted-foreground">× {r.unit_count}</span>
                  </span>
                  <span className="text-gold">{formatMoney(r.price_per_night)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-gold" strokeWidth={1.5} />
        <span className="text-xs tracking-[0.08em] uppercase">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-light">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/admin/bookings" | "/admin/calendar" | "/admin/rooms";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3 text-sm transition-colors hover:bg-secondary/60"
    >
      <Icon className="size-4 text-gold" strokeWidth={1.5} />
      {label}
      <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
    </Link>
  );
}

export function Skeletons({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-hairline">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export type { BookingRow };
