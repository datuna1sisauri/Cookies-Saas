-- Allow the public embed script to load banner colors without exposing full domain rows.
create or replace function public.get_banner_settings(p_domain_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select settings
  from public.domains
  where id = p_domain_id;
$$;

revoke all on function public.get_banner_settings(uuid) from public;
grant execute on function public.get_banner_settings(uuid) to anon, authenticated;
