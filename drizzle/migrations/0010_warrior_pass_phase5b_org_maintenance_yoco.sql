-- Warrior Pass Phase 5b: organisation codes with kits, maintenance mode, public settings, Yoco webhook secret store. Additive only.

-- A. Organisation batches
ALTER TABLE public.bulk_code_batches
  ADD COLUMN contact_name text,
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text,
  ADD COLUMN price_per_learner_cents integer CHECK (price_per_learner_cents IS NULL OR price_per_learner_cents > 0),
  ADD COLUMN amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  ADD COLUMN payment_reference text,
  ADD COLUMN price_override_reason text,
  ADD COLUMN kits_included boolean DEFAULT true;

CREATE TABLE public.org_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.bulk_code_batches(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 2000),
  pendant_sets integer NOT NULL DEFAULT 0 CHECK (pendant_sets >= 0),
  recipient_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  suburb text,
  city text,
  province text,
  postal_code text,
  courier text,
  waybill text,
  tracking_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','packed','in_transit','delivered')),
  waiting_for_restock boolean NOT NULL DEFAULT false,
  stock_taken boolean NOT NULL DEFAULT false,
  delivery_cents integer CHECK (delivery_cents IS NULL OR delivery_cents >= 0),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX org_shipments_batch_id_key ON public.org_shipments (batch_id);
CREATE INDEX org_shipments_status_idx ON public.org_shipments (status);

GRANT SELECT ON public.org_shipments TO authenticated;
GRANT ALL ON public.org_shipments TO service_role;
ALTER TABLE public.org_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.org_shipments AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read org shipments" ON public.org_shipments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Takes an organisation parcel's kits off stock once. 'taken', 'already' or 'short'. Service role only.
CREATE OR REPLACE FUNCTION public.take_org_shipment_stock(_shipment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  s public.org_shipments%ROWTYPE;
  moved int;
BEGIN
  SELECT * INTO s FROM public.org_shipments WHERE id = _shipment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'shipment_not_found';
  END IF;
  IF s.stock_taken THEN
    RETURN 'already';
  END IF;
  UPDATE public.app_settings
     SET value = to_jsonb((value #>> '{}')::int - s.quantity), updated_at = now()
   WHERE key = 'kits_in_stock'
     AND jsonb_typeof(value) = 'number'
     AND (value #>> '{}')::numeric >= s.quantity;
  GET DIAGNOSTICS moved = ROW_COUNT;
  IF moved = 0 AND EXISTS (
    SELECT 1 FROM public.app_settings WHERE key = 'kits_in_stock' AND jsonb_typeof(value) = 'number'
  ) THEN
    RETURN 'short';
  END IF;
  UPDATE public.org_shipments
     SET stock_taken = true, waiting_for_restock = false, updated_at = now()
   WHERE id = _shipment_id;
  RETURN 'taken';
END;
$function$;
REVOKE ALL ON FUNCTION public.take_org_shipment_stock(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.take_org_shipment_stock(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_org_shipment_stock(uuid) TO service_role;

-- One code = one learner. First code unlocks the family, extra codes are recorded. Never creates kits.
CREATE OR REPLACE FUNCTION public.redeem_org_code(_user_id uuid, _code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code_id uuid;
  granted int;
BEGIN
  UPDATE public.bulk_codes bc
     SET redeemed_by = _user_id, redeemed_at = now()
    FROM public.bulk_code_batches b
   WHERE bc.code = _code
     AND bc.batch_id = b.id
     AND bc.redeemed_by IS NULL
     AND (b.expires_at IS NULL OR b.expires_at > now())
  RETURNING bc.id INTO code_id;

  IF code_id IS NULL THEN
    RETURN 'invalid';
  END IF;

  INSERT INTO public.entitlements (user_id, kind, source, bulk_code_id)
  VALUES (_user_id, 'family_pass', 'bulk_code', code_id)
  ON CONFLICT (user_id, kind) DO UPDATE
    SET source = 'bulk_code', bulk_code_id = EXCLUDED.bulk_code_id, order_id = NULL,
        revoked_at = NULL, granted_at = now()
    WHERE public.entitlements.revoked_at IS NOT NULL;
  GET DIAGNOSTICS granted = ROW_COUNT;

  IF granted = 0 THEN
    RETURN 'recorded';
  END IF;
  RETURN 'ok';
END;
$function$;
REVOKE ALL ON FUNCTION public.redeem_org_code(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_org_code(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_org_code(uuid, text) TO service_role;
COMMENT ON FUNCTION public.redeem_bulk_code(uuid, text) IS 'DEPRECATED: replaced by redeem_org_code (one code per learner)';

-- B. Maintenance mode
INSERT INTO public.app_settings (key, value) VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.maintenance_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) <= 254),
  consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX maintenance_signups_email_key ON public.maintenance_signups (email);

GRANT SELECT ON public.maintenance_signups TO authenticated;
GRANT ALL ON public.maintenance_signups TO service_role;
ALTER TABLE public.maintenance_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY require_registered_session ON public.maintenance_signups AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.session_is_registered()) WITH CHECK (public.session_is_registered());
CREATE POLICY "Admins read maintenance signups" ON public.maintenance_signups FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Public, read-only settings for every visitor: maintenance switch, public prices, seller and support email.
CREATE OR REPLACE FUNCTION public.public_site_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'maintenance_mode', coalesce((SELECT value = 'true'::jsonb FROM public.app_settings WHERE key = 'maintenance_mode'), false),
    'prices', (
      SELECT jsonb_build_object(
        'family_pass_cents', value->'family_pass_cents',
        'launch_family_pass_cents', value->'launch_family_pass_cents',
        'launch_limit', value->'launch_limit',
        'kit_cents', coalesce(value->'kit_cents', value->'extra_kit_cents'),
        'book_cents', value->'book_cents',
        'delivery_locker_cents', value->'delivery_locker_cents',
        'delivery_door_cents', value->'delivery_door_cents'
      )
      FROM public.app_settings WHERE key = 'prices'
    ),
    'receipt_business_name', (SELECT value FROM public.app_settings WHERE key = 'receipt_business_name'),
    'support_email', (SELECT value FROM public.app_settings WHERE key = 'support_email')
  )
$function$;
REVOKE ALL ON FUNCTION public.public_site_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_site_settings() TO anon, authenticated, service_role;

-- D. Payment provider secrets: service role only, no policies for anon or authenticated.
CREATE TABLE public.payment_provider_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  mode text CHECK (mode IS NULL OR mode IN ('test','live')),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.payment_provider_secrets FROM PUBLIC;
REVOKE ALL ON public.payment_provider_secrets FROM anon, authenticated;
GRANT ALL ON public.payment_provider_secrets TO service_role;
ALTER TABLE public.payment_provider_secrets ENABLE ROW LEVEL SECURITY;
