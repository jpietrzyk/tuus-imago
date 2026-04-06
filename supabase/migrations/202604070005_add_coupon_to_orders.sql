alter table public.orders
  add column if not exists coupon_id uuid references public.coupons(id),
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(10,2) not null default 0;

create function public.link_guest_orders()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.orders
  set user_id = new.id
  where customer_email = new.email
    and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_link_orders
  after insert on auth.users
  for each row execute function public.link_guest_orders();
