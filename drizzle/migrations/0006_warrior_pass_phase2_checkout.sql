-- Warrior Pass, Phase 2. Additive only: two new tables, two new columns on the Warrior Pass orders table,
-- and one new function that only the service role can run.

-- 1. delivery_profiles (personal information: owner and admins can read, only the service role writes)
CREATE TABLE public.delivery_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name text,
  phone text,
  delivery_method text CHECK (delivery_method IN ('door','locker')),
  address_line1 text,
  address_line2 text,
  suburb text,
  city text,
  province text,
  postal_code text,
  locker_code text,
  consent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.delivery_profiles TO authenticated;
GRANT ALL ON public.delivery_profiles TO service_role;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.delivery_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Users read own delivery profile" ON public.delivery_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all delivery profiles" ON public.delivery_profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 2. orders: which children get Armour Kits with this order
ALTER TABLE public.orders ADD COLUMN extra_kit_child_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN included_kit_child_id uuid NULL REFERENCES public.children(id) ON DELETE SET NULL;
CREATE INDEX orders_included_kit_child_id_idx ON public.orders (included_kit_child_id);
CREATE INDEX orders_user_status_created_idx ON public.orders (user_id, status, created_at DESC);

-- 3. webhook_events (idempotency for payment provider events)
CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'yoco',
  type text,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.webhook_events AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read webhook events" ON public.webhook_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX webhook_events_received_at_idx ON public.webhook_events (received_at);

-- 4. Fulfil a paid order in one transaction. Returns true only the first time an order becomes paid.
CREATE OR REPLACE FUNCTION public.fulfill_warrior_pass_order(_order_id uuid, _payment_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  kid uuid;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;
  IF o.status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.orders
     SET status = 'paid', paid_at = now(), provider_payment_id = _payment_id, updated_at = now()
   WHERE id = _order_id;

  IF o.kind = 'family_pass' THEN
    INSERT INTO public.entitlements (user_id, kind, source, order_id)
    VALUES (o.user_id, 'family_pass', 'purchase', o.id)
    ON CONFLICT (user_id, kind) DO UPDATE
      SET source = 'purchase', order_id = EXCLUDED.order_id, revoked_at = NULL, granted_at = now()
      WHERE public.entitlements.revoked_at IS NOT NULL;

    IF o.included_kit_child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children c WHERE c.id = o.included_kit_child_id AND c.parent_id = o.user_id
    ) THEN
      INSERT INTO public.armour_kits (user_id, child_id, order_id, included_in_pass, status)
      VALUES (o.user_id, o.included_kit_child_id, o.id, true, 'locked')
      ON CONFLICT (child_id) DO NOTHING;
    END IF;
  END IF;

  FOREACH kid IN ARRAY o.extra_kit_child_ids LOOP
    IF EXISTS (SELECT 1 FROM public.children c WHERE c.id = kid AND c.parent_id = o.user_id) THEN
      INSERT INTO public.armour_kits (user_id, child_id, order_id, included_in_pass, status)
      VALUES (o.user_id, kid, o.id, false, 'locked')
      ON CONFLICT (child_id) DO NOTHING;
    END IF;
  END LOOP;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    o.user_id,
    'warrior_pass_unlocked',
    CASE WHEN o.kind = 'family_pass' THEN 'Warrior Pass unlocked' ELSE 'Armour Kit added' END,
    CASE WHEN o.kind = 'family_pass'
      THEN 'Every lesson is now open for every child in your family. Each Armour Kit ships when that child finishes the course.'
      ELSE 'Your extra Armour Kit is confirmed. It ships when your child finishes the course.'
    END,
    o.id
  );

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) TO service_role;