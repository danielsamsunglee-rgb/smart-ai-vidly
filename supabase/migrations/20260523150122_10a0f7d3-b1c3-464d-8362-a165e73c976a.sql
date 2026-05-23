
alter function public.has_role(uuid, public.app_role) set search_path = public;
alter function public.is_admin(uuid) set search_path = public;
alter function public.is_admin_email(text) set search_path = public;
alter function public.handle_new_user() set search_path = public;

revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.is_admin(uuid) from anon, public;
revoke execute on function public.is_admin_email(text) from anon, public, authenticated;
revoke execute on function public.handle_new_user() from anon, public, authenticated;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
