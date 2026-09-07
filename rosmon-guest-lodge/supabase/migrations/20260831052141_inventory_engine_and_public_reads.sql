-- =====================================================================
-- PART A — Real inventory engine (database-enforced, race-condition-safe)
-- =====================================================================
--
-- Before this migration, `bookings.room_unit_id` was never populated by
-- any code path (admin form did a plain INSERT with no unit column at
-- all), so the "provisional availability" text in the admin form was
-- informational only — nothing actually reserved a physical unit or
-- stopped a second overlapping booking. This adds the two pieces that
-- make unit assignment real:
--
--   1. An EXCLUDE constraint: Postgres itself refuses two rows with the
--      same room_unit_id and overlapping stay ranges, for any row in an
--      occupying status. This is enforced for every write to `bookings`
--      from any caller (this RPC, the admin panel's manual room_unit_id
--      reassignment dropdown, or anything added later) — it is not
--      something application code can be tricked into skipping.
--   2. public.create_booking(...): a SECURITY DEFINER function that
--      atomically picks one free unit and inserts the booking in a
--      single statement, so two simultaneous requests can't both read
--      "1 unit free" and both try to take it. Concurrent callers lock
--      candidate unit rows (FOR UPDATE SKIP LOCKED) so they fan out to
--      different units; the EXCLUDE constraint is the backstop that
--      guarantees correctness even if that heuristic ever picks the
--      same row.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stay daterange
  GENERATED ALWAYS AS (daterange(check_in, check_out, '[)')) STORED;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_unit_no_overlap
  EXCLUDE USING gist (room_unit_id WITH =, stay WITH &&)
  WHERE (booking_status IN ('pending_payment', 'payment_submitted', 'confirmed', 'checked_in'));

CREATE OR REPLACE FUNCTION public.create_booking(
  _room_type_id text,
  _check_in date,
  _check_out date,
  _guest_name text,
  _guest_phone text,
  _guest_email text,
  _guests integer,
  _source text,
  _payment_method text DEFAULT NULL,
  _payment_reference text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _booking_status public.booking_status DEFAULT 'pending_payment',
  _payment_status public.payment_status DEFAULT 'unpaid'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price   numeric(10,2);
  _unit_id uuid;
  _booking public.bookings;
BEGIN
  IF _check_out <= _check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;
  IF _check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in cannot be before today';
  END IF;
  IF coalesce(trim(_guest_name), '') = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;
  IF coalesce(trim(_guest_phone), '') = '' THEN
    RAISE EXCEPTION 'Guest phone is required';
  END IF;

  SELECT price_per_night INTO _price
  FROM public.room_types
  WHERE id = _room_type_id AND is_active;

  IF _price IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive room type: %', _room_type_id;
  END IF;

  -- One active unit of this type, free for every night of the stay:
  -- no overlapping occupying booking and no overlapping block (either
  -- a block on this exact unit, or a room-type-wide block, which must
  -- rule out every unit of the type, not just one — see room_units
  -- WHERE clause below). FOR UPDATE SKIP LOCKED means two concurrent
  -- callers fan out to different units instead of racing for the same
  -- row; the EXCLUDE constraint above is what actually guarantees no
  -- double booking even if this selection were ever wrong.
  SELECT ru.id INTO _unit_id
  FROM public.room_units ru
  WHERE ru.room_type_id = _room_type_id
    AND ru.is_active
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.room_unit_id = ru.id
        AND b.booking_status IN ('pending_payment', 'payment_submitted', 'confirmed', 'checked_in')
        AND b.stay && daterange(_check_in, _check_out, '[)')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_blocks ib
      WHERE (ib.room_unit_id = ru.id
             OR (ib.room_unit_id IS NULL AND ib.room_type_id = ru.room_type_id))
        AND daterange(ib.start_date, ib.end_date, '[)') && daterange(_check_in, _check_out, '[)')
    )
  ORDER BY ru.internal_label
  FOR UPDATE OF ru SKIP LOCKED
  LIMIT 1;

  IF _unit_id IS NULL THEN
    RAISE EXCEPTION 'No % units available for the selected dates', _room_type_id;
  END IF;

  INSERT INTO public.bookings (
    guest_name, guest_phone, guest_email, room_type_id, room_unit_id,
    check_in, check_out, guests, price_per_night, total,
    booking_status, payment_status, payment_method, payment_reference,
    notes, source
  ) VALUES (
    trim(_guest_name), trim(_guest_phone), NULLIF(trim(coalesce(_guest_email, '')), ''),
    _room_type_id, _unit_id,
    _check_in, _check_out, greatest(_guests, 1), _price, _price * (_check_out - _check_in),
    _booking_status, _payment_status, _payment_method, NULLIF(trim(coalesce(_payment_reference, '')), ''),
    NULLIF(trim(coalesce(_notes, '')), ''), _source
  )
  RETURNING * INTO _booking;

  RETURN _booking;
END;
$$;

-- Table-level INSERT on `bookings` stays staff-only (unchanged from the
-- first migration) — anon/public callers can ONLY create a booking
-- through this function, which validates dates, resolves the current
-- price server-side, and assigns a unit atomically. Nothing about the
-- underlying RLS on `bookings` is loosened.
REVOKE ALL ON FUNCTION public.create_booking(
  text, date, date, text, text, text, integer, text, text, text, text,
  public.booking_status, public.payment_status
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(
  text, date, date, text, text, text, integer, text, text, text, text,
  public.booking_status, public.payment_status
) TO anon, authenticated;

-- Read-only companion so the public site can show real availability
-- before a guest submits (same predicate as create_booking, no row lock,
-- no PII — just a count).
CREATE OR REPLACE FUNCTION public.check_room_availability(
  _room_type_id text,
  _check_in date,
  _check_out date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.room_units ru
  WHERE ru.room_type_id = _room_type_id
    AND ru.is_active
    AND _check_out > _check_in
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.room_unit_id = ru.id
        AND b.booking_status IN ('pending_payment', 'payment_submitted', 'confirmed', 'checked_in')
        AND b.stay && daterange(_check_in, _check_out, '[)')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_blocks ib
      WHERE (ib.room_unit_id = ru.id
             OR (ib.room_unit_id IS NULL AND ib.room_type_id = ru.room_type_id))
        AND daterange(ib.start_date, ib.end_date, '[)') && daterange(_check_in, _check_out, '[)')
    );
$$;

REVOKE ALL ON FUNCTION public.check_room_availability(text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_room_availability(text, date, date) TO anon, authenticated;

-- =====================================================================
-- PART B — Public read access for operational pricing
-- =====================================================================
-- room_types had no anon grant or policy at all — the public site could
-- not have read live prices even if it tried. Row content is the same
-- data already shown publicly (name, price, amenities); only active
-- room types are exposed.
GRANT SELECT ON public.room_types TO anon;
CREATE POLICY "Public read active room types" ON public.room_types
  FOR SELECT TO anon USING (is_active);

-- =====================================================================
-- PART C — Public read access for the gallery bucket
-- =====================================================================
-- gallery_images already has a public/anon "is_published" read policy
-- (20260828072932). The bucket itself only allowed staff reads
-- (20260828073003), so the public site could not resolve a working URL
-- for any CMS-managed photo. The bucket stays PRIVATE (public: false,
-- set in 20260830150608) — this does not change that. It adds a
-- narrowly-scoped anon SELECT policy so the public site can mint a
-- signed URL for a specific object, and only when that exact object is
-- referenced by a published gallery_images row.
CREATE POLICY "Public read published gallery objects" ON storage.objects
  FOR SELECT TO anon USING (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM public.gallery_images gi
      WHERE gi.storage_path = storage.objects.name AND gi.is_published
    )
  );
