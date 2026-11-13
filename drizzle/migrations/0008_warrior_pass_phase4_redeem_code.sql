-- Warrior Pass Phase 4: atomic bulk code redemption. Additive only.
-- Marks one unused, unexpired code as redeemed by the caller and grants a family pass
-- in a single transaction. Callable only by the service role (redeem-code edge function).
CREATE OR REPLACE FUNCTION public.redeem_bulk_code(_user_id uuid, _code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code_id uuid;
  granted int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = _user_id AND kind = 'family_pass' AND revoked_at IS NULL
  ) THEN
    RETURN 'already_has_pass';
  END IF;

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
    -- Another request granted a pass in the meantime: undo the code redemption.
    RAISE EXCEPTION 'already_has_pass';
  END IF;

  RETURN 'ok';
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_bulk_code(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_bulk_code(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_bulk_code(uuid, text) TO service_role;
