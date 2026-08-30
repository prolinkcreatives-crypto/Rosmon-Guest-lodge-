import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { assertWrite } from "@/lib/admin/write";
import {
  bookingHistoryQuery,
  bookingQuery,
  roomTypesQuery,
  roomUnitsQuery,
} from "@/lib/admin/queries";
import {
  bookingStatuses,
  bookingStatusLabel,
  businessRules,
  formatMoney,
  nightsBetween,
  paymentStatuses,
  paymentStatusLabel,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BookingStatusPill, PaymentStatusPill } from "@/components/admin/StatusPill";

export const Route = createFileRoute("/admin/bookings/$id")({
  component: BookingDetail,
});

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

function BookingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const booking = useQuery(bookingQuery(id));
  const history = useQuery(bookingHistoryQuery(id));
  const roomTypes = useQuery(roomTypesQuery);
  const units = useQuery(roomUnitsQuery);

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      assertWrite(
        await supabase
          .from("bookings")
          .update(patch as never)
          .eq("id", id)
          .select(),
        "Updating booking",
      );
    },
    onSuccess: () => {
      toast.success("Booking updated");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (booking.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary/50" />;
  }

  if (booking.isError) {
    return (
      <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {(booking.error as Error).message}
      </p>
    );
  }

  const b = booking.data;
  if (!b) {
    return (
      <div className="rounded-xl border border-hairline bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">This booking no longer exists.</p>
        <Link to="/admin/bookings" className="mt-4 inline-block text-sm text-gold">
          Back to bookings
        </Link>
      </div>
    );
  }

  const roomType = roomTypes.data?.find((r) => r.id === b.room_type_id);
  const typeUnits = (units.data ?? []).filter((u) => u.room_type_id === b.room_type_id);
  const nights = nightsBetween(b.check_in, b.check_out);

  return (
    <>
      <Link
        to="/admin/bookings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ChevronLeft className="size-4" /> Bookings
      </Link>

      <AdminPageHeader
        title={b.guest_name}
        description={`${b.reference} · created ${new Date(b.created_at).toLocaleString()}`}
        actions={
          <div className="flex items-center gap-2">
            <PaymentStatusPill status={b.payment_status} />
            <BookingStatusPill status={b.booking_status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Stay">
            <Row label="Room type" value={roomType?.name ?? "—"} />
            <Row
              label="Unit"
              value={
                <select
                  className={field}
                  value={b.room_unit_id ?? ""}
                  onChange={(e) =>
                    update.mutate({ room_unit_id: e.target.value || null })
                  }
                >
                  <option value="">Unassigned</option>
                  {typeUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.internal_label}
                    </option>
                  ))}
                </select>
              }
            />
            <Row label="Check-in" value={`${b.check_in} · ${businessRules.checkInWindow}`} />
            <Row
              label="Check-out"
              value={`${b.check_out} · ${businessRules.checkOutWindow}`}
            />
            <Row label="Nights" value={String(nights)} />
            <Row label="Guests" value={String(b.guests)} />
          </Card>

          <Card title="Guest">
            <Row label="Name" value={b.guest_name} />
            <Row
              label="Phone"
              value={<a href={`tel:${b.guest_phone}`} className="text-gold">{b.guest_phone}</a>}
            />
            <Row
              label="Email"
              value={
                b.guest_email ? (
                  <a href={`mailto:${b.guest_email}`} className="text-gold">
                    {b.guest_email}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Row label="Source" value={b.source.replace("_", " ")} />
            <Row label="Notes" value={b.notes ?? "—"} />
          </Card>

          <Card title="Pricing & payment">
            <Row label="Rate per night" value={formatMoney(b.price_per_night)} />
            <Row label="Nights" value={String(nights)} />
            <Row
              label="Total"
              value={<span className="font-display text-xl text-gold">{formatMoney(b.total)}</span>}
            />
            <Row label="Method" value={b.payment_method?.replace("_", " ") ?? "—"} />
            <Row
              label="Payment reference"
              value={
                <input
                  className={field}
                  defaultValue={b.payment_reference ?? ""}
                  placeholder="Transaction / deposit slip reference"
                  onBlur={(e) => {
                    const value = e.target.value.trim() || null;
                    if (value !== (b.payment_reference ?? null))
                      update.mutate({ payment_reference: value });
                  }}
                />
              }
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <label className="block text-xs font-medium">Booking status</label>
            <select
              className={field}
              value={b.booking_status}
              onChange={(e) =>
                update.mutate({ booking_status: e.target.value as BookingStatus })
              }
            >
              {bookingStatuses.map((s) => (
                <option key={s} value={s}>
                  {bookingStatusLabel[s]}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-medium">Payment status</label>
            <select
              className={field}
              value={b.payment_status}
              onChange={(e) =>
                update.mutate({ payment_status: e.target.value as PaymentStatus })
              }
            >
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabel[s]}
                </option>
              ))}
            </select>

            <div className="mt-4 grid gap-2">
              <button
                onClick={() => update.mutate({ booking_status: "checked_in" })}
                className="rounded-lg bg-gold px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Check in
              </button>
              <button
                onClick={() => update.mutate({ booking_status: "checked_out" })}
                className="rounded-lg border border-hairline px-3 py-2 text-sm"
              >
                Check out
              </button>
              <button
                onClick={() => {
                  if (confirm("Cancel this booking?"))
                    update.mutate({ booking_status: "cancelled" });
                }}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive"
              >
                Cancel booking
              </button>
            </div>
            {update.isPending && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </p>
            )}
          </Card>

          <Card title="History">
            {history.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!history.isLoading && (history.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No status changes yet.</p>
            )}
            <ul className="space-y-3">
              {(history.data ?? []).map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                  <p>
                    {h.from_status ? `${bookingStatusLabel[h.from_status]} → ` : ""}
                    {bookingStatusLabel[h.to_status]}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <button
            onClick={() => navigate({ to: "/admin/calendar" })}
            className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 text-sm"
          >
            View on calendar
          </button>
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="mb-4 text-sm font-medium tracking-[0.08em] uppercase">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  );
}
