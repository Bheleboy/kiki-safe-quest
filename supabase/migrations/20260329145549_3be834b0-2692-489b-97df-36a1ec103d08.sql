
create or replace function public.handle_admin_email()
returns trigger as $$
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
$$ language plpgsql security definer;

drop trigger if exists on_admin_email_confirmed on auth.users;
create trigger on_admin_email_confirmed
  after update on auth.users
  for each row
  when (
    new.email_confirmed_at is not null
    and old.email_confirmed_at is null
  )
  execute procedure public.handle_admin_email();
