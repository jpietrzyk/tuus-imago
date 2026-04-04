alter table public.orders
add column if not exists hubspot_contact_id text,
add column if not exists hubspot_synced_at timestamptz;

alter table public.order_status_history
drop constraint if exists order_status_history_status_type_check;

alter table public.order_status_history
add constraint order_status_history_status_type_check
check (status_type in ('order', 'shipment', 'payment', 'crm'));
