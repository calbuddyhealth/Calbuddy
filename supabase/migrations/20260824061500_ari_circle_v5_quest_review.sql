-- ARI Circle V5 — organizer review queue for verified Community Quest XP.

begin;

create or replace function public.ari_circle_quest_submissions(requested_quest_id uuid)
returns table (
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  member_status text,
  proof_note text,
  submitted_at timestamptz,
  verified_at timestamptz
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  select * into q from public.ari_circle_quests where id=requested_quest_id;
  if not found then raise exception 'Quest unavailable'; end if;
  if caller_id<>q.creator_user_id and not public.ari_circle_can_create_xp_quest(caller_id) then
    raise exception 'Organizer access required';
  end if;

  return query
  select qm.user_id,p.display_name,p.handle::text,p.avatar_url,qm.status,qm.proof_note,qm.submitted_at,qm.verified_at
  from public.ari_circle_quest_members qm
  join public.ari_circle_profiles p on p.user_id=qm.user_id
  where qm.quest_id=q.id and qm.status in ('submitted','verified')
  order by qm.submitted_at asc nulls last;
end;
$$;

revoke all on function public.ari_circle_quest_submissions(uuid) from public, anon;
grant execute on function public.ari_circle_quest_submissions(uuid) to authenticated;

commit;
