-- Enable RLS on order_status_history, consistent with orders and order_items.
-- No public read/write policies: all access goes through Netlify functions
-- using the service role key, which bypasses RLS.

alter table public.order_status_history enable row level security;
