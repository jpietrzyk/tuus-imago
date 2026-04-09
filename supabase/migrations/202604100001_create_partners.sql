create table public.partners (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  nip text,
  contact_email text,
  phone text,
  city text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partners enable row level security;

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

create index if not exists partners_created_at_idx on public.partners(created_at desc);
