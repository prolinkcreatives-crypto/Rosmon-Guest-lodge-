import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { z } from "zod";
import { bookingsQuery, roomTypesQuery } from "@/lib/admin/queries";
import {
  bookingStatuses,
  bookingStatusLabel,
  formatMoney,
  nightsBetween,
  type BookingStatus,
} from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BookingStatusPill, PaymentStatusPill } from "@/components/admin/StatusPill";
import { BookingForm } from "@/components/admin/BookingForm";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(bookingStatuses).optional(),
  new: z.boolean().optional(),
});

export const Route = createFileRoute("/admin/bookings/")({
  validateSearch: searchSchema,
  component: BookingsPage,
});

const field =
  "rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

function BookingsPage() {
  const { q = "", status, new: creating } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/bookings/" });
  const bookings = useQuery(bookingsQuery);
  const roomTypes = useQuery(roomTypesQuery);
  const [term, setTerm] = useState(q);

  const typeName = (id: string) =>
    roomTypes.data?.find((r) => r.id === id)?.name ?? "Room";

  const needle = q.trim().toLowerCase();
  const rows = (bookings.data ?? []).filter((b) => {
    if (status && b.booking_status !== status) return false;
    if (!needle) return true;
    return [b.reference, b.guest_name, b.guest_phone, b.guest_email ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const setSearch = (next: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description="Every reservation across all channels."
        actions={
          <button
            onClick={() => setSearch({ new: true })}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" /> New booking
          </button>
        }
      />

      {creating && (
        <div className="mb-8 rounded-2xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-light">Manual booking</h2>
            <button
              aria-label="Close"
              onClick={() => setSearch({ new: undefined })}
              className="rounded-lg border border-hairline p-1.5"
            >
              <X className="size-4" />
            </button>
          </div>
          <BookingForm
            onDone={(id) => navigate({ to: "/admin/bookings/$id", params: { id } })}
          />
        </div>
      )}

      <form
        className="mb-5 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch({ q: term || undefined });
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search reference, guest, phone or email"
            className={`${field} w-full pl-9`}
          />
        </div>
        <select
          className={field}
          value={status ?? ""}
          onChange={(e) =>
            setSearch({ status: (e.target.value || undefined) as BookingStatus | undefined })
          }
        >
          <option value="">All statuses</option>
          {bookingStatuses.map((s) => (
            <option key={s} value={s}>
              {bookingStatusLabel[s]}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-hairline bg-card px-4 text-sm">
          Search
        </button>
      </form>

      {bookings.isError && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(bookings.error as Error).message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-hairline bg-card">
        {bookings.isLoading && (
          <div className="divide-y divide-hairline">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-secondary/40" />
            ))}
          </div>
        )}

        {!bookings.isLoading && rows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No bookings match this view.
          </p>
        )}

        <ul className="divide-y divide-hairline">
          {rows.map((b) => (
            <li key={b.id}>
              <Link
                to="/admin/bookings/$id"
                params={{ id: b.id }}
                className="grid gap-2 px-4 py-4 transition-colors hover:bg-secondary/60 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{b.guest_name}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {b.reference}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {typeName(b.room_type_id)} · {b.check_in} → {b.check_out} ·{" "}
                    {nightsBetween(b.check_in, b.check_out)} night(s) · {b.guests} guest(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="text-sm text-gold">{formatMoney(b.total)}</span>
                  <PaymentStatusPill status={b.payment_status} />
                  <BookingStatusPill status={b.booking_status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
