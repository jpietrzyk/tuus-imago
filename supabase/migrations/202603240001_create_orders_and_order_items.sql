create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := format(
      'TI-%s-%s',
      to_char(now(), 'YYYY'),
      lpad(nextval('public.order_number_seq')::text, 6, '0')
    );
  end if;

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'pending_payment',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null,
  shipping_country text not null,
  terms_accepted boolean not null,
  privacy_accepted boolean not null,
  marketing_consent boolean not null default false,
  currency text not null default 'PLN',
  items_count integer not null check (items_count >= 1 and items_count <= 3),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  slot_index smallint not null check (slot_index between 0 and 2),
  slot_key text not null check (slot_key in ('left', 'center', 'right')),
  transformed_url text not null,
  public_id text,
  secure_url text,
  transformations jsonb not null,
  ai_adjustments jsonb,
  created_at timestamptz not null default now(),
  unique(order_id, slot_key)
);

create trigger orders_generate_order_number
before insert on public.orders
for each row
execute function public.generate_order_number();

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
