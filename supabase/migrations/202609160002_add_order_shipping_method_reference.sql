-- Link an order to the shipping method chosen at checkout and keep a snapshot
-- of the delivery time that was shown to the customer.
alter table public.orders
  add column if not exists shipping_method_id uuid
    references public.shipping_methods(id) on delete restrict,
  add column if not exists shipping_delivery_time text;

create index if not exists orders_shipping_method_id_idx
  on public.orders (shipping_method_id);
