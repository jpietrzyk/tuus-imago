-- Backfill the FK-based shipping reference for historical orders that only
-- stored the legacy free-text `shipping_method`. Matches by name first, then
-- falls back to the active default method. Idempotent: only touches null FKs.
update public.orders o
set
  shipping_method_id = m.id,
  shipping_delivery_time = coalesce(o.shipping_delivery_time, m.delivery_time)
from public.shipping_methods m
where o.shipping_method_id is null
  and o.shipping_method is not null
  and m.name = o.shipping_method;

update public.orders o
set
  shipping_method_id = m.id,
  shipping_delivery_time = coalesce(o.shipping_delivery_time, m.delivery_time)
from public.shipping_methods m
where o.shipping_method_id is null
  and m.is_default = true
  and m.is_active = true;
