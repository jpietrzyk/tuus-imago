-- Admin-only aggregates that would otherwise fetch the entire orders table.
-- orders is service-role-only; these functions must not be REST-callable by
-- anon/authenticated, hence the revokes below.
create or replace function public.admin_customer_list()
returns table (
  customer_email text,
  customer_name text,
  order_count bigint,
  total_revenue numeric,
  last_order_date timestamptz,
  marketing_consent boolean
)
language sql
security definer
set search_path = public
as $$
  select
    o.customer_email,
    (array_agg(o.customer_name order by o.created_at desc))[1] as customer_name,
    count(*)::bigint as order_count,
    coalesce(sum(o.total_price), 0) as total_revenue,
    max(o.created_at) as last_order_date,
    bool_or(coalesce(o.marketing_consent, false)) as marketing_consent
  from public.orders o
  group by o.customer_email
  order by max(o.created_at) desc;
$$;

create or replace function public.admin_revenue_by_month()
returns table (
  month text,
  revenue numeric,
  count bigint
)
language sql
security definer
set search_path = public
as $$
  with monthly as (
    select
      to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month,
      coalesce(sum(o.total_price), 0) as revenue,
      count(*)::bigint as count
    from public.orders o
    group by 1
    order by 1 desc
    limit 12
  )
  select month, revenue, count from monthly order by month asc;
$$;

revoke execute on function public.admin_customer_list() from anon, authenticated, public;
revoke execute on function public.admin_revenue_by_month() from anon, authenticated, public;
