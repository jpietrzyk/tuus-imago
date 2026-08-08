-- Database Linter security hardening (supabase linter warnings).
-- Append-only fix-forward; corrects both already-applied and fresh databases.

-- function_search_path_mutable: pin search_path on helper/trigger functions
-- that were created without an explicit search_path.
alter function public.handle_promotion_updated_at() set search_path = public;
alter function public.generate_order_number() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.handle_app_settings_updated_at() set search_path = public;
alter function public.handle_content_pages_updated_at() set search_path = public;

-- anon/authenticated_security_definer_function_executable: these SECURITY DEFINER
-- functions are not meant to be called via the REST API.
--
-- handle_new_user() and link_guest_orders() are triggers on auth.users; they are
-- never invoked via RPC. Trigger firing does not require EXECUTE privilege for the
-- acting role, so revoking it does not affect them.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.link_guest_orders() from anon, authenticated, public;

-- increment_coupon_used_count(uuid) is only ever called from the create-order
-- Netlify function using the service_role key. service_role holds its own explicit
-- EXECUTE grant, so dropping anon/authenticated/public keeps that path working.
revoke execute on function public.increment_coupon_used_count(uuid) from anon, authenticated, public;
