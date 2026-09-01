import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { roomTypes } from "@/content/rooms";

/**
 * Real remaining-unit count for a room type over a date range, backed by
 * public.check_room_availability() (20260831052141) — the same
 * predicate public.create_booking() uses to pick a unit, just a COUNT
 * instead of a row lock. Replaces the placeholder `room.units > 0` that
 * StepRooms used before (always true, regardless of real bookings).
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("check_room_availability", {
    _room_type_id: roomTypeId,
    _check_in: checkIn,
    _check_out: checkOut,
  } as never);
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

/** Remaining count for every room type at once, keyed by room_types.id. */
export function roomAvailabilityQuery(checkIn: string, checkOut: string) {
  return queryOptions({
    queryKey: ["public", "availability", checkIn, checkOut],
    queryFn: async (): Promise<Record<string, number>> => {
      const entries = await Promise.all(
        roomTypes.map(
          async (r) => [r.id, await checkRoomAvailability(r.id, checkIn, checkOut)] as const,
        ),
      );
      return Object.fromEntries(entries);
    },
    enabled: Boolean(checkIn && checkOut && checkOut > checkIn),
    staleTime: 30_000,
  });
}

export interface PublicBookingInput {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  paymentMethod: string;
  paymentReference: string;
}

export interface PublicBookingResult {
  id: string;
  reference: string;
  total: number;
}

/**
 * Creates a real booking via public.create_booking() — the same
 * function components/admin/BookingForm.tsx calls. There is one
 * inventory engine, not a public copy and an admin copy: this call
 * either atomically reserves a physical unit and returns the real
 * reference, or fails with a real "no units available" error if the
 * room type sold out between search and submission.
 *
 * Booking status starts at "payment_submitted" — Rosmon verifies every
 * mobile-money reference manually before a stay is confirmed, so this
 * does not claim more than is true yet.
 */
export async function createPublicBooking(
  input: PublicBookingInput,
): Promise<PublicBookingResult> {
  const { data, error } = await supabase.rpc("create_booking", {
    _room_type_id: input.roomTypeId,
    _check_in: input.checkIn,
    _check_out: input.checkOut,
    _guest_name: input.guestName,
    _guest_phone: input.guestPhone,
    _guest_email: input.guestEmail || null,
    _guests: input.guests,
    _source: "public_website",
    _payment_method: input.paymentMethod,
    _payment_reference: input.paymentReference,
    _booking_status: "payment_submitted",
    _payment_status: "submitted",
  } as never);
  if (error) throw new Error(error.message);
  const booking = data as { id: string; reference: string; total: number };
  return { id: booking.id, reference: booking.reference, total: Number(booking.total) };
}
