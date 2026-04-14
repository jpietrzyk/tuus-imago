alter table public.orders
  add column if not exists ref_code text;

create index if not exists orders_ref_code_idx on public.orders(ref_code)
  where ref_code is not null;
