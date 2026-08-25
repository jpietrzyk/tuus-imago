create table public.picture_frames (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'PLN',
  image_url text,
  color text,
  material text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one frame may be flagged as the checkout default.
create unique index picture_frames_one_default_idx
  on public.picture_frames (is_default)
  where is_default;

alter table public.picture_frames enable row level security;

create policy "Public can read active picture frames"
  on public.picture_frames for select
  using (is_active = true);

create or replace function public.handle_picture_frame_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger picture_frames_updated_at_trigger
  before update on public.picture_frames
  for each row
  execute function public.handle_picture_frame_updated_at();

alter table public.order_items
  add column frame_id uuid references public.picture_frames(id) on delete restrict,
  add column frame_name text,
  add column frame_price numeric(10,2) not null default 0;

create index if not exists picture_frames_active_sort_idx
  on public.picture_frames (is_active, sort_order, created_at);
