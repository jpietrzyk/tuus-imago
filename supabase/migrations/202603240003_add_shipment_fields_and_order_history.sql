alter table public.orders
add column if not exists shipping_method text not null default 'inpost_courier',
add column if not exists shipping_cost numeric(10,2) not null default 0,
add column if not exists shipment_status text not null default 'pending_fulfillment',
add column if not exists tracking_number text;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status_type text not null check (status_type in ('order', 'shipment')),
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_created_at_idx
on public.order_status_history(order_id, created_at desc);

insert into public.order_status_history (order_id, status_type, status, note)
select o.id, 'order', o.status, 'Backfilled initial order status.'
from public.orders o
where not exists (
  select 1
  from public.order_status_history h
  where h.order_id = o.id
    and h.status_type = 'order'
);

insert into public.order_status_history (order_id, status_type, status, note)
select o.id, 'shipment', o.shipment_status, 'Backfilled initial shipment status.'
from public.orders o
where not exists (
  select 1
  from public.order_status_history h
  where h.order_id = o.id
    and h.status_type = 'shipment'
);
