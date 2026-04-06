create function public.increment_coupon_used_count(coupon_row_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = coupon_row_id;
end;
$$;
