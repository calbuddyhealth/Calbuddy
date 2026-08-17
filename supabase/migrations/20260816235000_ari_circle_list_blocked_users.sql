create or replace function public.ari_circle_list_blocked_users()
returns table (
  relationship_id uuid,
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  blocked_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with caller as (
    select auth.uid() as user_id
  ), blocked as (
    select
      c.id as relationship_id,
      case
        when c.requester_user_id = caller.user_id then c.addressee_user_id
        else c.requester_user_id
      end as blocked_user_id,
      coalesce(c.updated_at, c.created_at) as blocked_at
    from public.ari_circle_connections c
    cross join caller
    where caller.user_id is not null
      and c.status = 'blocked'
      and c.blocked_by_user_id = caller.user_id
      and (c.requester_user_id = caller.user_id or c.addressee_user_id = caller.user_id)
  )
  select
    b.relationship_id,
    b.blocked_user_id as user_id,
    p.display_name,
    p.handle,
    p.avatar_url,
    b.blocked_at
  from blocked b
  left join public.ari_circle_profiles p
    on p.user_id = b.blocked_user_id
  order by b.blocked_at desc nulls last;
$$;

revoke all on function public.ari_circle_list_blocked_users() from public;
revoke all on function public.ari_circle_list_blocked_users() from anon;
grant execute on function public.ari_circle_list_blocked_users() to authenticated;
grant execute on function public.ari_circle_list_blocked_users() to service_role;
