
create or replace function public.handle_admin_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email in (
    'ntose@doterra.com',
    'eben@privateclients.co.za'
  ) then
    update public.profiles
      set is_admin = true
      where id = new.id;
  end if;
  return new;
end;
$$;
