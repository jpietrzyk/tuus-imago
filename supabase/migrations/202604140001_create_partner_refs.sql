create table public.partner_refs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  ref_code text not null unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_refs enable row level security;

create trigger partner_refs_set_updated_at
  before update on public.partner_refs
  for each row execute function public.set_updated_at();

create index if not exists partner_refs_partner_id_idx on public.partner_refs(partner_id);
create index if not exists partner_refs_ref_code_idx on public.partner_refs(ref_code);

create table public.referral_events (
  id uuid primary key default gen_random_uuid(),
  partner_ref_id uuid not null references public.partner_refs(id) on delete cascade,
  path text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.referral_events enable row level security;

create index if not exists referral_events_partner_ref_id_idx on public.referral_events(partner_ref_id);
create index if not exists referral_events_created_at_idx on public.referral_events(created_at desc);
