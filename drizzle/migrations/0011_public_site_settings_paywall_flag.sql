CREATE OR REPLACE FUNCTION public.public_site_settings()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'maintenance_mode', coalesce((SELECT value = 'true'::jsonb FROM public.app_settings WHERE key = 'maintenance_mode'), false),
    'paywall_enabled', coalesce((SELECT value = 'true'::jsonb FROM public.app_settings WHERE key = 'paywall_enabled'), false),
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