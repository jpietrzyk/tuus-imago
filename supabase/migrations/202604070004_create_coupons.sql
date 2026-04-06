create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  currency text not null default 'PLN',
  min_order_amount numeric(10,2),
  max_uses integer,
  used_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Public can read active coupons"
  on public.coupons for select
  using (is_active = true);

create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id),
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid not null references public.orders(id),
  used_at timestamptz not null default now()
);

alter table public.coupon_usages enable row level security;

create index if not exists coupon_usages_coupon_id_idx on public.coupon_usages(coupon_id);
create index if not exists coupon_usages_user_id_idx on public.coupon_usages(user_id);
