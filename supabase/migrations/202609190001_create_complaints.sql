-- Complaints are submitted from the public /complaint form through the
-- rate-limited submit-complaint Netlify function and managed in the admin
-- panel. Like orders, the table is service-role only (RLS enabled, no policies).
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  address text,
  order_number text not null,
  order_date date,
  product text,
  complaint_type text not null check (
    complaint_type in ('damaged', 'defective', 'wrong', 'missing', 'quality', 'other')
  ),
  description text not null,
  resolution text,
  status text not null default 'new' check (
    status in ('new', 'in_review', 'resolved', 'rejected')
  ),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

create index if not exists complaints_status_created_idx
  on public.complaints (status, created_at desc);

create trigger complaints_updated_at_trigger
  before update on public.complaints
  for each row
  execute function public.set_updated_at();
