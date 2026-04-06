create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  name text not null,
  phone text,
  address text not null,
  city text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

create policy "Users can CRUD own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row
  execute function public.set_updated_at();

create index if not exists addresses_user_id_idx on public.addresses(user_id);
