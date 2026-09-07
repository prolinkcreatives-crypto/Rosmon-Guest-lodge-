-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'receptionist');

CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "Staff can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff read staff profiles" ON public.staff_profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Own profile upsert" ON public.staff_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.staff_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Bootstrap: first account created becomes admin so the panel is reachable.
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_staff
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- ROOM TYPES ----------------------------------------------------------
CREATE TABLE public.room_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  descriptor text,
  description text,
  price_per_night numeric(10,2) NOT NULL,
  max_guests integer NOT NULL DEFAULT 2,
  unit_count integer NOT NULL DEFAULT 0,
  amenities text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id text NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  internal_label text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.room_types TO authenticated;
GRANT ALL ON public.room_types TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.room_units TO authenticated;
GRANT ALL ON public.room_units TO service_role;

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read room types" ON public.room_types
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write room types" ON public.room_types
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins insert room types" ON public.room_types
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff read room units" ON public.room_units
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update room units" ON public.room_units
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins insert room units" ON public.room_units
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- BOOKINGS ------------------------------------------------------------
CREATE TYPE public.booking_status AS ENUM (
  'pending_payment', 'payment_submitted', 'confirmed', 'cancelled',
  'checked_in', 'checked_out', 'expired'
);
CREATE TYPE public.payment_status AS ENUM (
  'unpaid', 'submitted', 'verified', 'failed', 'refunded'
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text,
  room_type_id text NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  room_unit_id uuid REFERENCES public.room_units(id) ON DELETE SET NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  price_per_night numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  booking_status public.booking_status NOT NULL DEFAULT 'pending_payment',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_method text,
  payment_reference text,
  notes text,
  source text NOT NULL DEFAULT 'admin',
  hold_expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_check_in_idx ON public.bookings (check_in);
CREATE INDEX bookings_check_out_idx ON public.bookings (check_out);
CREATE INDEX bookings_status_idx ON public.bookings (booking_status);

CREATE TABLE public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status public.booking_status,
  to_status public.booking_status NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_unit_id uuid REFERENCES public.room_units(id) ON DELETE CASCADE,
  room_type_id text REFERENCES public.room_types(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  kind text NOT NULL DEFAULT 'block',
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
GRANT SELECT, INSERT ON public.booking_status_history TO authenticated;
GRANT ALL ON public.booking_status_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_blocks TO authenticated;
GRANT ALL ON public.inventory_blocks TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage bookings" ON public.bookings
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff read history" ON public.booking_status_history
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write history" ON public.booking_status_history
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage blocks" ON public.inventory_blocks
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Reference + updated_at + date sanity ---------------------------------
CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'RGL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_dates()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_set_reference BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_reference();
CREATE TRIGGER bookings_validate_dates BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_dates();
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER room_types_touch BEFORE UPDATE ON public.room_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SEED: room types and the 15 physical units ---------------------------
INSERT INTO public.room_types (id, name, descriptor, description, price_per_night, max_guests, unit_count, amenities, sort_order) VALUES
  ('standard', 'Standard', 'A calm, well-kept room with everything a good night needs.', 'Self-contained Standard room with hot water, air conditioning, DStv and Wi-Fi for up to two guests.', 250, 2, 11, ARRAY['Self-contained','Hot water','Air conditioning','DStv','Wi-Fi'], 1),
  ('executive', 'Executive', 'More space, warmer finishes and a quieter corner of the lodge.', 'Self-contained Executive room with more space, hot water, air conditioning, DStv and Wi-Fi for up to two guests.', 450, 2, 4, ARRAY['Self-contained','Hot water','Air conditioning','DStv','Wi-Fi'], 2);

INSERT INTO public.room_units (room_type_id, internal_label)
SELECT 'standard', 'S-' || lpad(g::text, 2, '0') FROM generate_series(1, 11) g;
INSERT INTO public.room_units (room_type_id, internal_label)
SELECT 'executive', 'E-' || lpad(g::text, 2, '0') FROM generate_series(1, 4) g;