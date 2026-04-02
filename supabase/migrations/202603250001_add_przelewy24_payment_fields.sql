alter table public.orders
add column if not exists payment_provider text,
add column if not exists payment_status text not null default 'pending',
add column if not exists payment_session_id text,
add column if not exists payment_token text,
add column if not exists payment_order_id bigint,
add column if not exists payment_method_id integer,
add column if not exists payment_registered_at timestamptz,
add column if not exists payment_paid_at timestamptz,
add column if not exists payment_verified_at timestamptz,
add column if not exists payment_error text;

create unique index if not exists orders_payment_session_id_idx
on public.orders(payment_session_id)
where payment_session_id is not null;

create index if not exists orders_payment_order_id_idx
on public.orders(payment_order_id)
where payment_order_id is not null;

alter table public.order_status_history
drop constraint if exists order_status_history_status_type_check;

alter table public.order_status_history
add constraint order_status_history_status_type_check
check (status_type in ('order', 'shipment', 'payment'));

update public.orders
set
  payment_provider = coalesce(payment_provider, 'przelewy24'),
  payment_status = case
    when status = 'paid' then 'verified'
    else coalesce(payment_status, 'pending')
  end,
  payment_paid_at = case
    when status = 'paid' and payment_paid_at is null then updated_at
    else payment_paid_at
  end,
  payment_verified_at = case
    when status = 'paid' and payment_verified_at is null then updated_at
    else payment_verified_at
  end;

insert into public.order_status_history (order_id, status_type, status, note)
select o.id, 'payment', o.payment_status, 'Backfilled payment status.'
from public.orders o
where not exists (
  select 1
  from public.order_status_history h
  where h.order_id = o.id
    and h.status_type = 'payment'
);
