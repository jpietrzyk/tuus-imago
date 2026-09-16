create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'PLN',
  delivery_time text,
  -- Order subtotal from which shipping becomes free. Null = never free.
  free_shipping_threshold numeric(10,2) check (free_shipping_threshold >= 0),
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one shipping method may be flagged as the checkout default.
create unique index shipping_methods_one_default_idx
  on public.shipping_methods (is_default)
  where is_default;

alter table public.shipping_methods enable row level security;

create policy "Public can read active shipping methods"
  on public.shipping_methods for select
  using (is_active = true);

create or replace function public.handle_shipping_method_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shipping_methods_updated_at_trigger
  before update on public.shipping_methods
  for each row
  execute function public.handle_shipping_method_updated_at();

create index if not exists shipping_methods_active_sort_idx
  on public.shipping_methods (is_active, sort_order, created_at);
