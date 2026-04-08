ALTER TABLE public.orders DROP COLUMN IF EXISTS hubspot_contact_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS hubspot_synced_at;

DELETE FROM public.order_status_history WHERE status_type = 'crm';

ALTER TABLE public.order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_status_type_check;
ALTER TABLE public.order_status_history
  ADD CONSTRAINT order_status_history_status_type_check
  CHECK (status_type IN ('order', 'shipment', 'payment'));
