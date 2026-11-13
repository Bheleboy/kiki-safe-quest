-- Warrior Pass, Phase 3. Additive only: one new column and two new indexes on the Warrior Pass
-- shipments table, and an updated version of the Phase 2 fulfilment function that also handles books.

-- 1. Sibling kits that ship together share a group id.
ALTER TABLE public.shipments ADD COLUMN shipment_group_id uuid NULL;
CREATE INDEX shipments_shipment_group_id_idx ON public.shipments (shipment_group_id);

-- 2. One shipment per Armour Kit (makes kit release idempotent).
CREATE UNIQUE INDEX shipments_kit_id_unique_idx ON public.shipments (kit_id);

-- 3. Fulfil a paid order in one transaction. Returns true only the first time an order becomes paid.
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
    END IF;
  END LOOP;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    o.user_id,
    CASE WHEN o.kind = 'book' THEN 'family_library_unlocked' ELSE 'warrior_pass_unlocked' END,
    CASE o.kind
      WHEN 'family_pass' THEN 'Warrior Pass unlocked'
      WHEN 'book' THEN 'Family library unlocked'
      ELSE 'Armour Kit added'
    END,
    CASE o.kind
      WHEN 'family_pass' THEN 'Every lesson is now open for every child in your family. Each Armour Kit ships when that child finishes the course.'
      WHEN 'book' THEN 'Kiki''s Armour of God is ready to download in your Family library.'
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