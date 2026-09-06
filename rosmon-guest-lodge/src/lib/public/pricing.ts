import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RoomType } from "@/content/rooms";

interface RoomPriceRow {
  id: string;
  price_per_night: number;
}

/**
 * The single place the public site reads room_types.price_per_night.
 * Keyed by room_types.id, which matches content/rooms.ts's `id` field
 * ("standard" / "executive") — see withLivePrices() below for how it's
 * applied. Requires the "Public read active room types" policy
 * (20260831052141); without it this returns empty and every route
 * silently falls back to the static content price.
 */
export const publicRoomPricesQuery = queryOptions({
  queryKey: ["public", "room-prices"],
  queryFn: async (): Promise<Record<string, number>> => {
    const { data, error } = (await supabase
      .from("room_types")
      .select("id, price_per_night")
      .eq("is_active", true)) as unknown as {
      data: RoomPriceRow[] | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(error.message);
    return Object.fromEntries((data ?? []).map((r) => [r.id, Number(r.price_per_night)]));
  },
  staleTime: 60_000,
});

/**
 * Overlays live prices onto the static room content (name, images,
 * amenities, description stay exactly as authored in content/rooms.ts —
 * only pricePerNight is ever replaced). If the price fetch hasn't
 * resolved yet, or a room id has no live row, the static content's price
 * is kept as a fallback rather than showing something broken or $0.
 */
export function withLivePrices(
  rooms: RoomType[],
  prices: Record<string, number> | undefined,
): RoomType[] {
  if (!prices) return rooms;
  return rooms.map((room) =>
    room.id in prices ? { ...room, pricePerNight: prices[room.id] } : room,
  );
}
