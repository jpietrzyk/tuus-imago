-- Complaint photo attachments. The public /complaint form uploads photos
-- directly to Cloudinary with a signed upload and submits only their secure
-- URLs + public ids; submit-complaint re-validates that list before storing it.
-- The column is jsonb (array of { url, public_id }) so older rows keep an empty
-- array default and the admin detail view can render attachments.
--
-- The column and its CHECK are split because an inline constraint on
-- `ADD COLUMN IF NOT EXISTS` is re-created on every execution (PostgreSQL
-- re-adds column constraints even when the column already exists), which would
-- make this migration non-idempotent. The named drop/create pair below is
-- re-runnable.
alter table public.complaints
  add column if not exists photos jsonb not null default '[]'::jsonb;

alter table public.complaints
  drop constraint if exists complaints_photos_is_array;

alter table public.complaints
  add constraint complaints_photos_is_array
  check (jsonb_typeof(photos) = 'array');
