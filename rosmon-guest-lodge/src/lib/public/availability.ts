import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { roomTypes } from "@/content/rooms";

export interface RoomTypeAvailability {
  total: number;
  available: number;
  booked: number;
  held: number;
  occupied: number;
  maintenance: number;
  blocked: number;
}

/**
 * Per-status breakdown for a room type over a date range, backed by
 * public.room_type_availability() (20260902043817) — the same
 * unit-status precedence as lib/admin/queries.ts's unitStatusOn (a block
 * wins over a booking; maintenance is reported separately from other
 * blocks), aggregated so no specific unit is ever named publicly.
 */
export async function fetchRoomTypeAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
): Promise<RoomTypeAvailability> {
  const { data, error } = await supabase.rpc("room_type_availability", {
    _room_type_id: roomTypeId,
    _check_in: checkIn,
    _check_out: checkOut,
  } as never);
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as RoomTypeAvailability | undefined;
  return (
    row ?? {
      total: 0,
      available: 0,
      booked: 0,
      held: 0,
      occupied: 0,
      maintenance: 0,
      blocked: 0,
    }
  );
}

/** Every room type's breakdown at once, keyed by room_types.id. */
export function roomAvailabilityQuery(checkIn: string, checkOut: string) {
  return queryOptions({
    queryKey: ["public", "availability", checkIn, checkOut],
    queryFn: async (): Promise<Record<string, RoomTypeAvailability>> => {
      const entries = await Promise.all(
        roomTypes.map(
          async (r) => [r.id, await fetchRoomTypeAvailability(r.id, checkIn, checkOut)] as const,
        ),
      );
      return Object.fromEntries(entries);
    },
    enabled: Boolean(checkIn && checkOut && checkOut > checkIn),
    staleTime: 30_000,
  });
}

/**
 * A guest-facing reason a room type has zero remaining. Never names a
 * specific unit — only Rosmon staff see unit labels. When the zero
 * units share one clear cause, name it (matches the wording asked for:
 * maintenance / booked / temporarily held / a generic "unavailable" for
 * anything else, including a mix of causes).
 */
export function explainUnavailable(a: RoomTypeAvailability): string {
  if (a.total === 0 || a.available > 0) return "";
  if (a.maintenance === a.total) return "Under maintenance for these dates";
  if (a.blocked === a.total) return "Unavailable for these dates";
  if (a.held === a.total) return "Temporarily held for these dates";
  if (a.booked + a.occupied === a.total) return "Fully booked for these dates";
  return "Unavailable for these dates";
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
