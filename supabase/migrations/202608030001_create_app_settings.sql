create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  data_type text not null check (data_type in ('boolean', 'integer', 'number', 'string')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create or replace function public.handle_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_settings_updated_at_trigger
  before update on public.app_settings
  for each row
  execute function public.handle_app_settings_updated_at();

-- Canonical DPI defaults. Keep in sync with:
--   netlify/functions/app-settings.ts (DEFAULTS)
--   src/components/image-uploader/image-dpi-rules.ts (DEFAULT_DPI_THRESHOLD)
insert into public.app_settings (key, value, data_type, description) values
  ('dpi_guard', 'true', 'boolean', 'Master switch for DPI enforcement on upload'),
  ('dpi_threshold', '72', 'integer', 'Minimum DPI required when DPI guard is on')
on conflict (key) do nothing;
