-- Warrior Pass Phase 5a: client-approved prices, kits sold separately, stock, bonus pendants, receipts. Additive only.

-- A. Prices. Merge so existing keys keep working; extra_kit_cents stays as an alias of kit_cents.
UPDATE public.app_settings
   SET value = value || jsonb_build_object(
         'family_pass_cents', 19900,
         'launch_family_pass_cents', 14900,
         'launch_limit', 100,
         'kit_cents', 9900,
         'extra_kit_cents', 9900,
         'book_cents', 9700,
         'org_tiers', '[{"min":1,"max":99,"cents":12900},{"min":100,"max":299,"cents":10900},{"min":300,"max":null,"cents":8900}]'::jsonb,
         'delivery_locker_cents', 6500,
         'delivery_door_cents', 11000,
         'currency', 'ZAR'
       ),
       updated_at = now()
 WHERE key = 'prices';

-- C, E, F. New settings.
INSERT INTO public.app_settings (key, value) VALUES
  ('kits_in_stock', '50'::jsonb),
  ('pendant_sets_in_stock', '30'::jsonb),
  ('receipt_business_name', '"Boss Moves Media"'::jsonb),
  ('support_email', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES
  ('library_book_path', '"kikis-armour-of-god-premium-edition.pdf"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- D. Bonus pendant sets.
CREATE TABLE public.bonus_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  status text NOT NULL DEFAULT 'owed' CHECK (status IN ('owed','added_to_shipment','handed_over')),
  shipment_id uuid NULL REFERENCES public.shipments(id) ON DELETE SET NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bonus_awards_user_id_idx ON public.bonus_awards (user_id);
CREATE INDEX bonus_awards_shipment_id_idx ON public.bonus_awards (shipment_id);
CREATE INDEX bonus_awards_status_idx ON public.bonus_awards (status);

GRANT SELECT ON public.bonus_awards TO authenticated;
GRANT ALL ON public.bonus_awards TO service_role;
ALTER TABLE public.bonus_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.bonus_awards AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read bonus awards" ON public.bonus_awards FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Atomic award: takes one pendant set off stock, refuses at zero. Service role only (admin-orders).
CREATE OR REPLACE FUNCTION public.award_bonus_pendant(_user_id uuid, _note text, _created_by uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  taken int;
BEGIN
  UPDATE public.app_settings
     SET value = to_jsonb((value #>> '{}')::int - 1), updated_at = now()
   WHERE key = 'pendant_sets_in_stock'
     AND jsonb_typeof(value) = 'number'
     AND (value #>> '{}')::numeric >= 1;
  GET DIAGNOSTICS taken = ROW_COUNT;
  IF taken = 0 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.bonus_awards (user_id, note, created_by)
  VALUES (_user_id, NULLIF(left(btrim(coalesce(_note, '')), 300), ''), _created_by)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.award_bonus_pendant(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_bonus_pendant(uuid, text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_bonus_pendant(uuid, text, uuid) TO service_role;

-- B, C. Fulfilment: the pass no longer includes a kit; paid kits come off stock in the same transaction.
CREATE OR REPLACE FUNCTION public.fulfill_warrior_pass_order(_order_id uuid, _payment_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.orders%ROWTYPE;
  kid uuid;
  added int;
  kits_added int := 0;
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

    -- Older orders only: new orders never set included_kit_child_id.
    IF o.included_kit_child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children c WHERE c.id = o.included_kit_child_id AND c.parent_id = o.user_id
    ) THEN
      INSERT INTO public.armour_kits (user_id, child_id, order_id, included_in_pass, status)
      VALUES (o.user_id, o.included_kit_child_id, o.id, true, 'locked')
      ON CONFLICT (child_id) DO NOTHING;
      GET DIAGNOSTICS added = ROW_COUNT;
      kits_added := kits_added + added;
    END IF;
  END IF;

  IF o.kind = 'book' THEN
    INSERT INTO public.entitlements (user_id, kind, source, order_id)
    VALUES (o.user_id, 'book', 'purchase', o.id)
    ON CONFLICT (user_id, kind) DO UPDATE
      SET source = 'purchase', order_id = EXCLUDED.order_id, revoked_at = NULL, granted_at = now()
      WHERE public.entitlements.revoked_at IS NOT NULL;
  END IF;

  FOREACH kid IN ARRAY o.extra_kit_child_ids LOOP
    IF EXISTS (SELECT 1 FROM public.children c WHERE c.id = kid AND c.parent_id = o.user_id) THEN
      INSERT INTO public.armour_kits (user_id, child_id, order_id, included_in_pass, status)
      VALUES (o.user_id, kid, o.id, false, 'locked')
      ON CONFLICT (child_id) DO NOTHING;
      GET DIAGNOSTICS added = ROW_COUNT;
      kits_added := kits_added + added;
    END IF;
  END LOOP;

  -- Take the paid kits off stock. Never below zero; a sale is never undone for stock.
  IF kits_added > 0 THEN
    UPDATE public.app_settings
       SET value = to_jsonb(GREATEST((value #>> '{}')::int - kits_added, 0)), updated_at = now()
     WHERE key = 'kits_in_stock' AND jsonb_typeof(value) = 'number';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    o.user_id,
    CASE WHEN o.kind = 'book' THEN 'family_library_unlocked' ELSE 'warrior_pass_unlocked' END,
    CASE o.kind
      WHEN 'family_pass' THEN 'Warrior Pass unlocked'
      WHEN 'book' THEN 'Family library unlocked'
      ELSE 'Armour Kit confirmed'
    END,
    CASE
      WHEN o.kind = 'family_pass' AND kits_added > 0 THEN 'Every lesson is now open for every child in your family. Each Armour Kit is posted when that child finishes the course.'
      WHEN o.kind = 'family_pass' THEN 'Every lesson is now open for every child in your family.'
      WHEN o.kind = 'book' THEN 'Kiki''s Armour of God, Premium Edition is ready to download in your Family library.'
      ELSE 'Your Armour Kit order is confirmed. Each kit is posted when that child finishes the course.'
    END,
    o.id
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_warrior_pass_order(uuid, text) TO service_role;
