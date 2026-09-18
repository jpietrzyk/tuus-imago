-- Prevent privilege escalation through the "Users can update own profile" RLS
-- policy. The policy only checks auth.uid() = id, so without a column guard any
-- signed-in user could run
--   update profiles set is_admin = true where id = auth.uid()
-- through the public anon key and reach the admin API (which trusts is_admin).
--
-- The trigger blocks admin-flag changes whenever the statement runs as an
-- authenticated end user. It deliberately allows:
--   * service-role/Management API statements (auth.uid() is null), and
--   * any other profile field update by the owner.

create or replace function public.prevent_profile_admin_self_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and auth.uid() = old.id
  then
    raise exception 'is_admin can only be changed by an administrator'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_admin_self_update on public.profiles;

create trigger profiles_prevent_admin_self_update
  before update on public.profiles
  for each row
  execute function public.prevent_profile_admin_self_update();

-- Defense in depth: make the implicit update check explicit so the policy is
-- self-documenting and a future edit cannot silently drop the id constraint.
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
