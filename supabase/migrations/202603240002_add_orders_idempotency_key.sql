alter table public.orders
add column if not exists idempotency_key text;

update public.orders
set idempotency_key = gen_random_uuid()::text
where idempotency_key is null;

alter table public.orders
alter column idempotency_key set not null;

create unique index if not exists orders_idempotency_key_idx
on public.orders(idempotency_key);
