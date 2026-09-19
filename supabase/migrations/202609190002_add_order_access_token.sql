-- Binds the guest payment/status endpoints to the browser that created the
-- order. Null for orders created before this migration; those keep the legacy
-- UUID-only behavior in create-przelewy24-session / order-status.
alter table public.orders
  add column if not exists order_access_token text;
