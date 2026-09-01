import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { occupyingStatuses, type BookingStatus, type PaymentStatus } from "./constants";

export interface RoomTypeRow {
  id: string;
  name: string;
  descriptor: string | null;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  unit_count: number;
  amenities: string[];
  is_active: boolean;
  sort_order: number;
}

export interface RoomUnitRow {
  id: string;
  room_type_id: string;
  internal_label: string;
  is_active: boolean;
  notes: string | null;
}

export interface BookingRow {
  id: string;
  reference: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  room_type_id: string;
  room_unit_id: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  price_per_night: number;
  total: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryBlockRow {
  id: string;
  room_unit_id: string | null;
  room_type_id: string | null;
  start_date: string;
  end_date: string;
  kind: string;
  reason: string | null;
}

export interface StatusHistoryRow {
  id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  note: string | null;
  created_at: string;
}

const unwrap = <T>({ data, error }: { data: T | null; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
};

export const roomTypesQuery = queryOptions({
  queryKey: ["admin", "room-types"],
  queryFn: async () =>
    unwrap<RoomTypeRow[]>(
      (await supabase
        .from("room_types")
        .select("*")
        .order("sort_order")) as never,
    ),
});

export const roomUnitsQuery = queryOptions({
  queryKey: ["admin", "room-units"],
  queryFn: async () =>
    unwrap<RoomUnitRow[]>(
      (await supabase
        .from("room_units")
        .select("*")
        .order("internal_label")) as never,
    ),
});

export const bookingsQuery = queryOptions({
  queryKey: ["admin", "bookings"],
  queryFn: async () =>
    unwrap<BookingRow[]>(
      (await supabase
        .from("bookings")
        .select("*")
        .order("check_in", { ascending: true })) as never,
    ),
});

export const inventoryBlocksQuery = queryOptions({
  queryKey: ["admin", "inventory-blocks"],
  queryFn: async () =>
    unwrap<InventoryBlockRow[]>(
      (await supabase
        .from("inventory_blocks")
        .select("*")
        .order("start_date")) as never,
    ),
});

export function bookingQuery(id: string) {
  return queryOptions({
    queryKey: ["admin", "booking", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as BookingRow | null) ?? null;
    },
  });
}

export function bookingHistoryQuery(id: string) {
  return queryOptions({
    queryKey: ["admin", "booking-history", id],
    queryFn: async () =>
      unwrap<StatusHistoryRow[]>(
        (await supabase
          .from("booking_status_history")
          .select("id, from_status, to_status, note, created_at")
          .eq("booking_id", id)
          .order("created_at", { ascending: false })) as never,
      ),
  });
}

/* ------------------------------------------------------------------ */
/* Provisional availability                                            */
/* ------------------------------------------------------------------ */

/** Ranges overlap when each starts before the other ends (nightly model). */
export function overlaps(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut;
}

/**
 * Capacity estimate used by the admin manual-booking form only, to warn
 * staff before they submit. It is NOT the authoritative check — that is
 * public.create_booking() (see the 20260831052141 migration), a database
 * function that atomically assigns a unit and is protected by an EXCLUDE
 * constraint against overlapping bookings even under concurrent writes.
 * This function can only ever approximate that from data already loaded
 * client-side, so treat `remaining` as a hint, not a guarantee.
 */
export function provisionalAvailability(opts: {
  roomType: RoomTypeRow;
  units: RoomUnitRow[];
  bookings: BookingRow[];
  blocks: InventoryBlockRow[];
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}) {
  const { roomType, units, bookings, blocks, checkIn, checkOut } = opts;
  const activeUnits = units.filter(
    (u) => u.room_type_id === roomType.id && u.is_active,
  );
  const capacity = activeUnits.length;

  const relevantBlocks = blocks.filter((bl) =>
    overlaps(checkIn, checkOut, bl.start_date, bl.end_date),
  );
  // A room-type-wide block (no room_unit_id) rules out every unit of that
  // type — it must never be subtracted as though it were a single unit.
  const typeBlocked = relevantBlocks.some(
    (bl) => bl.room_type_id === roomType.id && !bl.room_unit_id,
  );
  const blockedUnitIds = new Set(
    typeBlocked
      ? activeUnits.map((u) => u.id)
      : relevantBlocks.filter((bl) => bl.room_unit_id).map((bl) => bl.room_unit_id!),
  );

  const occupyingBookings = bookings.filter(
    (b) =>
      b.room_type_id === roomType.id &&
      b.id !== opts.excludeBookingId &&
      occupyingStatuses.includes(b.booking_status) &&
      overlaps(checkIn, checkOut, b.check_in, b.check_out),
  );
  const occupiedUnitIds = new Set(
    occupyingBookings.filter((b) => b.room_unit_id).map((b) => b.room_unit_id!),
  );
  // A booking with no unit assigned yet (shouldn't happen going forward,
  // but may exist from before the inventory engine) still consumes one
  // unit of capacity even though we can't say which — count it separately
  // rather than dropping it.
  const unassignedOccupied = occupyingBookings.filter((b) => !b.room_unit_id).length;

  const consumedUnits = new Set([...blockedUnitIds, ...occupiedUnitIds]).size;
  const remaining = capacity - consumedUnits - unassignedOccupied;
  return {
    capacity,
    occupied: occupiedUnitIds.size + unassignedOccupied,
    blocked: blockedUnitIds.size,
    remaining,
    available: remaining > 0,
  };
}


/* ------------------------------------------------------------------ */
/* Content: gallery, testimonials, settings                            */
/* ------------------------------------------------------------------ */

export const galleryCategories = [
  "Property",
  "Standard",
  "Executive",
  "Restaurant",
  "Bar",
  "Exterior",
  "Other",
] as const;
export type AdminGalleryCategory = (typeof galleryCategories)[number];

export interface GalleryImageRow {
  id: string;
  storage_path: string;
  url: string;
  alt: string;
  category: string;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

export interface TestimonialRow {
  id: string;
  guest_name: string;
  quote: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface AppSettingRow {
  key: string;
  value: Record<string, unknown>;
}

export const galleryQuery = queryOptions({
  queryKey: ["admin", "gallery"],
  queryFn: async () =>
    unwrap<GalleryImageRow[]>(
      (await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order")
        .order("created_at")) as never,
    ),
});

export const testimonialsQuery = queryOptions({
  queryKey: ["admin", "testimonials"],
  queryFn: async () =>
    unwrap<TestimonialRow[]>(
      (await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order")
        .order("created_at")) as never,
    ),
});

export const settingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () =>
    unwrap<AppSettingRow[]>(
      (await supabase.from("app_settings").select("key, value")) as never,
    ),
});

/** Signed URL for a private gallery object (bucket is not public). */
export async function signedGalleryUrl(path: string, seconds = 3600) {
  const { data } = await supabase.storage.from("gallery").createSignedUrl(path, seconds);
  return data?.signedUrl ?? "";
}

/* ------------------------------------------------------------------ */
/* Unit status derivation (real data, no availability engine yet)      */
/* ------------------------------------------------------------------ */

export const unitStatuses = [
  "available",
  "booked",
  "held",
  "occupied",
  "blocked",
  "maintenance",
] as const;
export type UnitStatus = (typeof unitStatuses)[number];

export const unitStatusLabel: Record<UnitStatus, string> = {
  available: "Available",
  booked: "Booked",
  held: "Held",
  occupied: "Occupied",
  blocked: "Blocked",
  maintenance: "Maintenance",
};

/**
 * Status of one physical unit on a given date, derived from bookings and
 * inventory blocks. Replaced by the availability engine in a later milestone.
 */
export function unitStatusOn(opts: {
  unit: RoomUnitRow;
  bookings: BookingRow[];
  blocks: InventoryBlockRow[];
  date: string;
}): { status: UnitStatus; booking?: BookingRow; block?: InventoryBlockRow } {
  const { unit, date } = opts;
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const dayEnd = next.toISOString().slice(0, 10);

  const block = opts.blocks.find(
    (bl) =>
      (bl.room_unit_id === unit.id ||
        (!bl.room_unit_id && bl.room_type_id === unit.room_type_id)) &&
      overlaps(date, dayEnd, bl.start_date, bl.end_date),
  );
  if (block) {
    return {
      status: block.kind === "maintenance" ? "maintenance" : "blocked",
      block,
    };
  }
  if (!unit.is_active) return { status: "maintenance" };

  const booking = opts.bookings.find(
    (b) =>
      b.room_unit_id === unit.id &&
      occupyingStatuses.includes(b.booking_status) &&
      overlaps(date, dayEnd, b.check_in, b.check_out),
  );
  if (!booking) return { status: "available" };
  if (booking.booking_status === "checked_in") return { status: "occupied", booking };
  if (booking.booking_status === "pending_payment") return { status: "held", booking };
  return { status: "booked", booking };
}

export const unitStatusTone: Record<UnitStatus, string> = {
  available: "border-emerald-600/25 bg-emerald-500/10 text-emerald-700",
  booked: "border-sky-600/25 bg-sky-500/10 text-sky-700",
  held: "border-amber-600/25 bg-amber-500/10 text-amber-700",
  occupied: "border-violet-600/25 bg-violet-500/10 text-violet-700",
  blocked: "border-destructive/25 bg-destructive/10 text-destructive",
  maintenance: "border-orange-600/25 bg-orange-500/10 text-orange-700",
};
