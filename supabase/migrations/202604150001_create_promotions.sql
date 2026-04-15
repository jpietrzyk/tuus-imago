create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slogan text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  currency text not null default 'PLN',
  min_order_amount numeric(10,2),
  min_slots integer check (min_slots is null or min_slots >= 1),
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

create policy "Public can read active promotions"
  on public.promotions for select
  using (is_active = true);

create or replace function public.handle_promotion_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger promotions_updated_at_trigger
  before update on public.promotions
  for each row
  execute function public.handle_promotion_updated_at();
