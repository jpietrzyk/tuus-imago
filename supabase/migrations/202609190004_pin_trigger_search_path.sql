-- Database linter hardening follow-up: these trigger functions were created
-- after 202608080002_function_security_hardening.sql and never got an explicit
-- search_path, so the mutable-search_path warning returned.
alter function public.handle_picture_frame_updated_at() set search_path = public;
alter function public.handle_picture_canvas_updated_at() set search_path = public;
alter function public.handle_shipping_method_updated_at() set search_path = public;
