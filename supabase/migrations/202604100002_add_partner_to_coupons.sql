alter table public.coupons
  add column if not exists partner_id uuid references public.partners(id) on delete set null;

create index if not exists coupons_partner_id_idx on public.coupons(partner_id) where partner_id is not null;
