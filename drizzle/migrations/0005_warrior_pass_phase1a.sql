-- Warrior Pass, Phase 1a. Additive only: new tables, new policies on new tables, one new function.
-- User references point at public.profiles(id), which cascades from auth.users.

-- 1. app_settings
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid NULL
);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.app_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.app_settings (key, value) VALUES
  ('paywall_enabled', 'false'::jsonb),
  ('grandfather_before', 'null'::jsonb),
  ('gate_lessons', '{"young":"young-m1-l5","teen":"teen-m1-l5"}'::jsonb),
  ('always_free_lessons', '[]'::jsonb),
  ('prices', '{"family_pass_cents":29900,"launch_family_pass_cents":24900,"launch_limit":100,"extra_kit_cents":9900,"currency":"ZAR"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('family_pass','extra_kit','book')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  provider text NOT NULL DEFAULT 'yoco',
  provider_checkout_id text UNIQUE,
  provider_payment_id text UNIQUE,
  child_id uuid NULL REFERENCES public.children(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.orders AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX orders_user_id_idx ON public.orders (user_id);
CREATE INDEX orders_child_id_idx ON public.orders (child_id);
CREATE INDEX orders_status_idx ON public.orders (status);

-- 3. entitlements
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('family_pass','book')),
  source text NOT NULL CHECK (source IN ('purchase','bulk_code','existing_family','admin_grant')),
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  bulk_code_id uuid NULL,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, kind)
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.entitlements AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own entitlements" ON public.entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all entitlements" ON public.entitlements FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX entitlements_order_id_idx ON public.entitlements (order_id);
CREATE INDEX entitlements_bulk_code_id_idx ON public.entitlements (bulk_code_id);

-- 4. armour_kits
CREATE TABLE public.armour_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  included_in_pass boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','earned','address_needed','ready_to_ship','shipped','delivered')),
  earned_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (child_id)
);
GRANT SELECT ON public.armour_kits TO authenticated;
GRANT ALL ON public.armour_kits TO service_role;
ALTER TABLE public.armour_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.armour_kits AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own armour kits" ON public.armour_kits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all armour kits" ON public.armour_kits FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX armour_kits_user_id_idx ON public.armour_kits (user_id);
CREATE INDEX armour_kits_order_id_idx ON public.armour_kits (order_id);
CREATE INDEX armour_kits_status_idx ON public.armour_kits (status);

-- 5. shipments (personal information: owner and admins only)
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.armour_kits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  suburb text,
  city text,
  province text,
  postal_code text,
  delivery_method text CHECK (delivery_method IN ('door','locker')),
  locker_code text,
  courier text DEFAULT 'courier_guy',
  waybill text,
  tracking_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','booked','collected','in_transit','delivered','failed')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.shipments AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own shipments" ON public.shipments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all shipments" ON public.shipments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX shipments_user_id_idx ON public.shipments (user_id);
CREATE INDEX shipments_kit_id_idx ON public.shipments (kit_id);
CREATE INDEX shipments_status_idx ON public.shipments (status);

-- 6. warrior_points
CREATE TABLE public.warrior_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  lesson_id text NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (child_id, reason, lesson_id)
);
GRANT SELECT ON public.warrior_points TO authenticated;
GRANT ALL ON public.warrior_points TO service_role;
ALTER TABLE public.warrior_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.warrior_points AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own warrior points" ON public.warrior_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_parent_of_child(auth.uid(), child_id));
CREATE POLICY "Admins read all warrior points" ON public.warrior_points FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX warrior_points_user_id_idx ON public.warrior_points (user_id);

-- 7. bulk_code_batches
CREATE TABLE public.bulk_code_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organisation text,
  seats integer NOT NULL CHECK (seats > 0),
  expires_at timestamptz NULL,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.bulk_code_batches TO authenticated;
GRANT ALL ON public.bulk_code_batches TO service_role;
ALTER TABLE public.bulk_code_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.bulk_code_batches AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read all bulk code batches" ON public.bulk_code_batches FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 8. bulk_codes
CREATE TABLE public.bulk_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.bulk_code_batches(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  redeemed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.bulk_codes TO authenticated;
GRANT ALL ON public.bulk_codes TO service_role;
ALTER TABLE public.bulk_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.bulk_codes AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read all bulk codes" ON public.bulk_codes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users read own redeemed codes" ON public.bulk_codes FOR SELECT TO authenticated USING (redeemed_by = auth.uid());
CREATE INDEX bulk_codes_batch_id_idx ON public.bulk_codes (batch_id);
CREATE INDEX bulk_codes_redeemed_by_idx ON public.bulk_codes (redeemed_by);

ALTER TABLE public.entitlements
  ADD CONSTRAINT entitlements_bulk_code_id_fkey FOREIGN KEY (bulk_code_id) REFERENCES public.bulk_codes(id) ON DELETE SET NULL;

-- Access check (read-only). Callers may only check themselves unless they are an admin.
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin(auth.uid()) THEN false
    ELSE (
      -- a) paywall switched off (anything other than json true)
      NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'paywall_enabled' AND value = 'true'::jsonb)
      -- b) admin
      OR public.is_admin(_user_id)
      -- c) grandfathering: no cutoff set, or account created before the cutoff
      OR NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'grandfather_before' AND jsonb_typeof(value) <> 'null')
      OR EXISTS (
        SELECT 1 FROM public.profiles p, public.app_settings s
        WHERE s.key = 'grandfather_before'
          AND jsonb_typeof(s.value) = 'string'
          AND p.id = _user_id
          AND p.created_at < (s.value #>> '{}')::timestamptz
      )
      -- d) active family pass
      OR EXISTS (
        SELECT 1 FROM public.entitlements e
        WHERE e.user_id = _user_id AND e.kind = 'family_pass' AND e.revoked_at IS NULL
      )
    )
  END
$$;
REVOKE EXECUTE ON FUNCTION public.has_course_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid) TO authenticated;