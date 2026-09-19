-- Plan-independent rate limiting for public endpoints that cannot use a native
-- Netlify code-based rule (those are capped by plan). Only the service role may
-- read/write this table; callers go through check_rate_limit().
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_hits enable row level security;

create index if not exists rate_limit_hits_key_created_idx
  on public.rate_limit_hits (key, created_at desc);

create index if not exists rate_limit_hits_created_idx
  on public.rate_limit_hits (created_at);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_key is null
    or length(p_key) = 0
    or p_limit is null
    or p_limit <= 0
    or p_window_seconds is null
    or p_window_seconds <= 0 then
    return true;
  end if;

  delete from public.rate_limit_hits
  where created_at < now() - interval '1 day';

  delete from public.rate_limit_hits
  where key = p_key
    and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into v_count
  from public.rate_limit_hits
  where key = p_key;

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer)
  from anon, authenticated, public;
