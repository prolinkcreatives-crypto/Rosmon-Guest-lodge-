import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  bookingsQuery,
  inventoryBlocksQuery,
  provisionalAvailability,
  roomTypesQuery,
  roomUnitsQuery,
} from "@/lib/admin/queries";
import { formatMoney, nightsBetween } from "@/lib/admin/constants";
import { todayIso, minCheckout, reconcileCheckout } from "@/lib/date-range";

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";
const labelClass = "mb-1.5 block text-xs font-medium";

/** Staff-side manual booking capture (walk-ins and phone reservations). */
export function BookingForm({ onDone }: { onDone?: (id: string) => void }) {
  const queryClient = useQueryClient();
  const roomTypes = useQuery(roomTypesQuery);
  const units = useQuery(roomUnitsQuery);
  const bookings = useQuery(bookingsQuery);
  const blocks = useQuery(inventoryBlocksQuery);

  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    room_type_id: "",
    check_in: todayIso(),
    check_out: minCheckout(todayIso()),
    guests: 1,
    payment_method: "cash",
    payment_reference: "",
    notes: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const roomType =
    roomTypes.data?.find((r) => r.id === form.room_type_id) ?? roomTypes.data?.[0];
  const selectedId = form.room_type_id || roomType?.id || "";
  const nights = nightsBetween(form.check_in, form.check_out);
  const total = roomType ? Number(roomType.price_per_night) * nights : 0;

  const availability = useMemo(() => {
    if (!roomType || !units.data || !bookings.data || !blocks.data || nights < 1)
      return null;
    return provisionalAvailability({
      roomType,
      units: units.data,
      bookings: bookings.data,
      blocks: blocks.data,
      checkIn: form.check_in,
      checkOut: form.check_out,
    });
  }, [roomType, units.data, bookings.data, blocks.data, form.check_in, form.check_out, nights]);

  const create = useMutation({
    mutationFn: async () => {
      if (!roomType) throw new Error("Choose a room type");
      if (nights < 1) throw new Error("Check-out must be after check-in");
      // create_booking() re-validates dates, resolves the current price
      // itself, and atomically assigns a free unit — it is the same
      // function the public booking flow calls, so admin and customer
      // bookings can never diverge into two different inventory checks.
      // It raises a real error (surfaced below) if nothing is free,
      // rather than letting the "Provisional inventory" hint be the only
      // thing standing between staff and an overbook.
      const { data, error } = await supabase.rpc("create_booking", {
        _room_type_id: roomType.id,
        _check_in: form.check_in,
        _check_out: form.check_out,
        _guest_name: form.guest_name.trim(),
        _guest_phone: form.guest_phone.trim(),
        _guest_email: form.guest_email.trim() || null,
        _guests: form.guests,
        _source: "front_desk",
        _payment_method: form.payment_method,
        _payment_reference: form.payment_reference.trim() || null,
        _notes: form.notes.trim() || null,
        _booking_status: "confirmed",
        _payment_status: form.payment_reference ? "submitted" : "unpaid",
      } as never);
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    onSuccess: (data) => {
      toast.success("Booking created");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      onDone?.(data.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="guest_name">
            Guest name
          </label>
          <input
            id="guest_name"
            required
            className={field}
            value={form.guest_name}
            onChange={(e) => set("guest_name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="guest_phone">
            Phone
          </label>
          <input
            id="guest_phone"
            required
            className={field}
            value={form.guest_phone}
            onChange={(e) => set("guest_phone", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="guest_email">
            Email (optional)
          </label>
          <input
            id="guest_email"
            type="email"
            className={field}
            value={form.guest_email}
            onChange={(e) => set("guest_email", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="room_type">
            Room type
          </label>
          <select
            id="room_type"
            className={field}
            value={selectedId}
            onChange={(e) => set("room_type_id", e.target.value)}
          >
            {(roomTypes.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {formatMoney(r.price_per_night)}/night
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="check_in">
            Check-in
          </label>
          <input
            id="check_in"
            type="date"
            min={todayIso()}
            className={field}
            value={form.check_in}
            onChange={(e) => {
              const check_in = e.target.value;
              setForm((f) => ({
                ...f,
                check_in,
                check_out: reconcileCheckout(check_in, f.check_out),
              }));
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="check_out">
            Check-out
          </label>
          <input
            id="check_out"
            type="date"
            min={minCheckout(form.check_in)}
            className={field}
            value={form.check_out}
            onChange={(e) => set("check_out", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="guests">
            Guests
          </label>
          <input
            id="guests"
            type="number"
            min={1}
            max={roomType?.max_guests ?? 2}
            className={field}
            value={form.guests}
            onChange={(e) => set("guests", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="payment_method">
            Payment method
          </label>
          <select
            id="payment_method"
            className={field}
            value={form.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile money</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="payment_reference">
            Payment reference
          </label>
          <input
            id="payment_reference"
            className={field}
            value={form.payment_reference}
            onChange={(e) => set("payment_reference", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          className={field}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-hairline bg-secondary/50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {nights} night{nights === 1 ? "" : "s"} ·{" "}
            {roomType ? formatMoney(roomType.price_per_night) : "—"} per night
          </span>
          <span className="font-display text-xl text-gold">{formatMoney(total)}</span>
        </div>
        {availability && (
          <p className="mt-2 text-xs text-muted-foreground">
            Provisional inventory: {Math.max(0, availability.remaining)} of{" "}
            {availability.capacity} {roomType?.name} units free for these dates.
            {availability.remaining <= 0 && (
              <span className="text-destructive"> Overbooking risk.</span>
            )}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={create.isPending || nights < 1}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {create.isPending && <Loader2 className="size-4 animate-spin" />}
        Create booking
      </button>
    </form>
  );
}
