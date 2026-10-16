CREATE OR REPLACE FUNCTION public.handle_admin_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- The single source of truth for Kiki admins.
  if lower(new.email) in (
    'embhele@gmail.com',
    'eben@privateclients.co.za',
    'nonalatose@gmail.com',
    'ntose@doterra.com'
  ) then
    update public.profiles set is_admin = true where id = new.id;
  end if;
  return new;
end;
$function$;

UPDATE public.profiles p
SET is_admin = (lower(coalesce(u.email, p.email, '')) IN (
  'embhele@gmail.com','eben@privateclients.co.za','nonalatose@gmail.com','ntose@doterra.com'))
FROM auth.users u
WHERE u.id = p.id
  AND p.is_admin IS DISTINCT FROM (lower(coalesce(u.email, p.email, '')) IN (
  'embhele@gmail.com','eben@privateclients.co.za','nonalatose@gmail.com','ntose@doterra.com'));

UPDATE public.profiles p SET is_admin = false
WHERE p.is_admin AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);