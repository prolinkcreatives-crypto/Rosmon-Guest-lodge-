-- The public booking flow could only show a binary available/unavailable
-- (via check_room_availability, which returns a single count). It has no
-- way to tell a guest WHY a room type has zero remaining — under
-- maintenance, fully booked, or otherwise blocked — without exposing
-- which physical unit is in which state, which must stay internal.
--
-- This returns a per-status count across a room type's units (mirroring
-- lib/admin/queries.ts's unitStatusOn precedence exactly: a block wins
-- over a booking, maintenance-kind blocks are reported separately from
-- other blocks) without naming any unit. check_room_availability() is
-- left in place — nothing currently calls it from application code after
-- this change, but dropping a working function isn't worth the risk for
-- no functional gain.
CREATE OR REPLACE FUNCTION public.room_type_availability(
  _room_type_id text,
  _check_in date,
  _check_out date
)
RETURNS TABLE (
  total integer,
  available integer,
  booked integer,
  held integer,
  occupied integer,
  maintenance integer,
  blocked integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH unit_status AS (
    SELECT
      ru.id,
      CASE
        WHEN block.kind = 'maintenance' THEN 'maintenance'
        WHEN block.id IS NOT NULL THEN 'blocked'
        WHEN bk.booking_status = 'checked_in' THEN 'occupied'
        WHEN bk.booking_status = 'pending_payment' THEN 'held'
        WHEN bk.id IS NOT NULL THEN 'booked'
        ELSE 'available'
      END AS status
    FROM public.room_units ru
    LEFT JOIN LATERAL (
      SELECT ib.id, ib.kind
      FROM public.inventory_blocks ib
      WHERE (ib.room_unit_id = ru.id
             OR (ib.room_unit_id IS NULL AND ib.room_type_id = ru.room_type_id))
        AND daterange(ib.start_date, ib.end_date, '[)') && daterange(_check_in, _check_out, '[)')
      LIMIT 1
    ) block ON true
    LEFT JOIN LATERAL (
      SELECT b.id, b.booking_status
      FROM public.bookings b
      WHERE b.room_unit_id = ru.id
        AND b.booking_status IN ('pending_payment', 'payment_submitted', 'confirmed', 'checked_in')
        AND b.stay && daterange(_check_in, _check_out, '[)')
      LIMIT 1
    ) bk ON true
    WHERE ru.room_type_id = _room_type_id AND ru.is_active
  )
  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE status = 'available')::integer,
    count(*) FILTER (WHERE status = 'booked')::integer,
    count(*) FILTER (WHERE status = 'held')::integer,
    count(*) FILTER (WHERE status = 'occupied')::integer,
    count(*) FILTER (WHERE status = 'maintenance')::integer,
    count(*) FILTER (WHERE status = 'blocked')::integer
  FROM unit_status;
$$;

REVOKE ALL ON FUNCTION public.room_type_availability(text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.room_type_availability(text, date, date) TO anon, authenticated;
