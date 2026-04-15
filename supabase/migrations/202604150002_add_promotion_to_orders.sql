alter table public.orders
  add column promotion_id uuid references public.promotions(id),
  add column promotion_discount_amount numeric(10,2) not null default 0;
