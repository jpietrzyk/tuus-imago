-- Seed a default shipping method matching the historical flat rate so checkout
-- has a selectable option out of the box. The admin can edit or replace it.
insert into public.shipping_methods (
  name,
  description,
  price,
  currency,
  delivery_time,
  is_active,
  is_default,
  sort_order
)
select
  'InPost Kurier',
  'Przesyłka kurierska InPost',
  14.99,
  'PLN',
  '1-2 dni robocze',
  true,
  true,
  0
where not exists (select 1 from public.shipping_methods);
