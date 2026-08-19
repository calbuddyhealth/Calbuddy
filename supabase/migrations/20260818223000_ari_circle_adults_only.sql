-- ARI XP — ARI Circle adults-only entitlement
-- 2026-08-18
--
-- Product policy:
--   * ARI XP registration remains 13+.
--   * Accounts age 13-17 may use the non-social ARI XP experience.
--   * ARI Circle is restricted to active, verified adult (18+) accounts.
--
-- This migration intentionally supersedes, rather than edits/deletes, the
-- historical Teen Circle migrations. Those migrations remain reproducible
-- database history; their teen-social permissions become dormant here.

begin;

-- ---------------------------------------------------------------------------
-- Canonical account age band (general ARI XP context, not Circle permission).
-- ---------------------------------------------------------------------------
create or replace function public.ari_account_age_band_for_date(date_of_birth date)
returns text
language sql
stable
set search_path = 'pg_catalog'
as $$
  select case
    when date_of_birth is null then 'unknown'
    when date_of_birth > current_date then 'unknown'
    when date_of_birth > current_date - interval '13 years' then 'under_13'
    when date_of_birth > current_date - interval '18 years' then 'teen'
    else 'adult'
  end;
$$;

revoke all on function public.ari_account_age_band_for_date(date) from public, anon;
grant execute on function public.ari_account_age_band_for_date(date) to authenticated;

-- Circle-specific age band deliberately no longer returns `teen`. Legacy
-- Circle functions that previously accepted band in ('teen','adult') therefore
-- fail closed for minors without rewriting dozens of historical function bodies.
create or replace function public.ari_circle_age_band_for_date(date_of_birth date)
returns text
language sql
stable
set search_path = 'pg_catalog'
as $$
  select case
    when public.ari_account_age_band_for_date(date_of_birth) = 'adult' then 'adult'
    when public.ari_account_age_band_for_date(date_of_birth) = 'teen' then 'under_18'
    when public.ari_account_age_band_for_date(date_of_birth) = 'under_13' then 'under_13'
    else null
  end;
$$;

revoke all on function public.ari_circle_age_band_for_date(date) from public, anon;
grant execute on function public.ari_circle_age_band_for_date(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Single canonical Circle entitlement.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_user_is_adult(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    target_user_id is not null
    and exists (
      select 1
      from public.ari_account_state s
      where s.user_id = target_user_id
        and s.status = 'active'
        and public.ari_account_age_band_for_date(s.date_of_birth) = 'adult'
    );
$$;

revoke all on function public.ari_circle_user_is_adult(uuid) from public, anon;
grant execute on function public.ari_circle_user_is_adult(uuid) to authenticated;

create or replace function public.ari_circle_current_user_is_adult()
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select auth.uid() is not null
    and public.ari_circle_user_is_adult(auth.uid());
$$;

revoke all on function public.ari_circle_current_user_is_adult() from public, anon;
grant execute on function public.ari_circle_current_user_is_adult() to authenticated;

create or replace function public.ari_circle_assert_adult_access()
returns void
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.ari_circle_current_user_is_adult() then
    raise exception 'ARI Circle is available to adults age 18 and older.';
  end if;
end;
$$;

revoke all on function public.ari_circle_assert_adult_access() from public, anon;
grant execute on function public.ari_circle_assert_adult_access() to authenticated;

-- User-facing age state is intentionally coarse. DOB remains private in
-- ari_account_state and is not returned to the client/model by this RPC.
create or replace function public.ari_circle_my_age_band()
returns text
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_account_age_band_for_date(s.date_of_birth)
  from public.ari_account_state s
  where s.user_id = auth.uid();
$$;

revoke all on function public.ari_circle_my_age_band() from public, anon;
grant execute on function public.ari_circle_my_age_band() to authenticated;

create or replace function public.ari_circle_my_age_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  account_status text;
  dob date;
  band text;
  allowed boolean := false;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select s.status, s.date_of_birth
    into account_status, dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  band := public.ari_account_age_band_for_date(dob);
  allowed := account_status = 'active' and band = 'adult';

  return jsonb_build_object(
    'verified', dob is not null and band in ('teen','adult'),
    'age_band', band,
    'teen_mode', account_status = 'active' and band = 'teen',
    'circle_allowed', allowed,
    'circle_minimum_age', 18,
    'partner_mode', case when allowed then 'adult' else 'locked' end,
    'policy', 'adults_only_v1'
  );
end;
$$;

revoke all on function public.ari_circle_my_age_state() from public, anon;
grant execute on function public.ari_circle_my_age_state() to authenticated;

-- Legacy Circle-only DOB verification no longer creates a teen social cohort.
-- Signup remains 13+ through the existing ARI XP registration gate.
create or replace function public.ari_circle_verify_my_age(requested_date_of_birth date)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  existing_dob date;
  band text;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  band := public.ari_account_age_band_for_date(requested_date_of_birth);
  if band <> 'adult' then
    raise exception 'ARI Circle is available to adults age 18 and older.';
  end if;

  select s.date_of_birth
    into existing_dob
  from public.ari_account_state s
  where s.user_id = caller_id
  for update;

  if not found then
    insert into public.ari_account_state (
      user_id, status, date_of_birth, age_verified_at, age_gate_version
    ) values (
      caller_id, 'active', requested_date_of_birth, now(), 'ari-circle-adults-only-v1'
    );
  elsif existing_dob is null then
    update public.ari_account_state
    set date_of_birth = requested_date_of_birth,
        age_verified_at = now(),
        age_gate_version = 'ari-circle-adults-only-v1',
        updated_at = now()
    where user_id = caller_id;
  elsif existing_dob <> requested_date_of_birth then
    raise exception 'Date of birth is already verified for this account';
  end if;

  return public.ari_circle_my_age_state();
end;
$$;

revoke all on function public.ari_circle_verify_my_age(date) from public, anon;
grant execute on function public.ari_circle_verify_my_age(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Core social relationship helpers now require adult/adult pairs.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_same_verified_cohort(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_user_is_adult(user_a)
    and public.ari_circle_user_is_adult(user_b);
$$;

revoke all on function public.ari_circle_same_verified_cohort(uuid,uuid) from public, anon;
grant execute on function public.ari_circle_same_verified_cohort(uuid,uuid) to authenticated;

create or replace function public.ari_circle_feed_assert_same_cohort(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(target_user_id);
$$;

revoke all on function public.ari_circle_feed_assert_same_cohort(uuid) from public, anon;
grant execute on function public.ari_circle_feed_assert_same_cohort(uuid) to authenticated;

create or replace function public.ari_circle_can_view_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(target_user_id)
    and target_user_id is not null
    and (
      target_user_id = auth.uid()
      or not public.ari_circle_social_pair_is_blocked(auth.uid(), target_user_id)
    );
$$;

revoke all on function public.ari_circle_can_view_user(uuid) from public, anon;
grant execute on function public.ari_circle_can_view_user(uuid) to authenticated;

create or replace function public.ari_circle_are_connected(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(first_user_id)
    and public.ari_circle_user_is_adult(second_user_id)
    and auth.uid() in (first_user_id, second_user_id)
    and exists (
      select 1 from public.ari_circle_connections c
      where c.status = 'accepted'
        and (
          (c.requester_user_id = first_user_id and c.addressee_user_id = second_user_id)
          or (c.requester_user_id = second_user_id and c.addressee_user_id = first_user_id)
        )
    );
$$;

revoke all on function public.ari_circle_are_connected(uuid,uuid) from public, anon;
grant execute on function public.ari_circle_are_connected(uuid,uuid) to authenticated;

create or replace function public.ari_circle_is_blocked_between(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(first_user_id)
    and public.ari_circle_user_is_adult(second_user_id)
    and auth.uid() in (first_user_id, second_user_id)
    and exists (
      select 1 from public.ari_circle_connections c
      where c.status = 'blocked'
        and (
          (c.requester_user_id = first_user_id and c.addressee_user_id = second_user_id)
          or (c.requester_user_id = second_user_id and c.addressee_user_id = first_user_id)
        )
    );
$$;

revoke all on function public.ari_circle_is_blocked_between(uuid,uuid) from public, anon;
grant execute on function public.ari_circle_is_blocked_between(uuid,uuid) to authenticated;

create or replace function public.ari_circle_social_pair_is_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(user_a)
    and public.ari_circle_user_is_adult(user_b)
    and exists (
      select 1
      from public.ari_circle_connections rel
      where rel.status = 'blocked'
        and (
          (rel.requester_user_id = user_a and rel.addressee_user_id = user_b)
          or (rel.requester_user_id = user_b and rel.addressee_user_id = user_a)
        )
    );
$$;

revoke all on function public.ari_circle_social_pair_is_blocked(uuid,uuid) from public, anon;
grant execute on function public.ari_circle_social_pair_is_blocked(uuid,uuid) to authenticated;

create or replace function public.ari_circle_feed_is_blocked(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(target_user_id)
    and exists (
      select 1
      from public.ari_circle_connections rel
      where rel.status = 'blocked'
        and (
          (rel.requester_user_id = auth.uid() and rel.addressee_user_id = target_user_id)
          or (rel.requester_user_id = target_user_id and rel.addressee_user_id = auth.uid())
        )
    );
$$;

revoke all on function public.ari_circle_feed_is_blocked(uuid) from public, anon;
grant execute on function public.ari_circle_feed_is_blocked(uuid) to authenticated;

create or replace function public.ari_circle_is_conversation_member(requested_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_current_user_is_adult()
    and exists (
      select 1
      from public.ari_conversation_members m
      where m.conversation_id = requested_conversation_id
        and m.user_id = auth.uid()
    );
$$;

revoke all on function public.ari_circle_is_conversation_member(uuid) from public, anon;
grant execute on function public.ari_circle_is_conversation_member(uuid) to authenticated;

create or replace function public.ari_circle_mute_state(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_current_user_is_adult()
    and public.ari_circle_user_is_adult(target_user_id)
    and exists (
      select 1 from public.ari_circle_mutes m
      where m.muter_user_id = auth.uid() and m.muted_user_id = target_user_id
    );
$$;

revoke all on function public.ari_circle_mute_state(uuid) from public, anon;
grant execute on function public.ari_circle_mute_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Direct profile writes must be adult, even through SECURITY DEFINER paths.
-- The historical trigger name/function remains in migration history but is
-- replaced with an adults-only guard here.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_enforce_adult_profile_access()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if not public.ari_circle_user_is_adult(new.user_id) then
    raise exception 'ARI Circle is available to adults age 18 and older.';
  end if;
  return new;
end;
$$;

revoke all on function public.ari_circle_enforce_adult_profile_access() from public, anon, authenticated;

drop trigger if exists ari_circle_profiles_teen_private_media_guard on public.ari_circle_profiles;
drop trigger if exists ari_circle_profiles_adults_only_guard on public.ari_circle_profiles;
create trigger ari_circle_profiles_adults_only_guard
before insert or update on public.ari_circle_profiles
for each row execute function public.ari_circle_enforce_adult_profile_access();

-- ---------------------------------------------------------------------------
-- Defense in depth for every Circle/social table.
--
-- RESTRICTIVE RLS blocks direct Data API access. The trigger additionally
-- blocks authenticated teen mutations that arrive through legacy SECURITY
-- DEFINER RPCs (which otherwise bypass table RLS). Trusted server/service-role
-- work without an end-user auth.uid() remains possible for moderation/admin.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_adult_mutation_guard()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is not null and not public.ari_circle_current_user_is_adult() then
    raise exception 'ARI Circle is available to adults age 18 and older.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.ari_circle_adult_mutation_guard() from public, anon, authenticated;

do $$
declare
  table_name text;
  circle_tables text[] := array[
    'ari_circle_challenge_entries',
    'ari_circle_challenge_entry_reactions',
    'ari_circle_challenge_members',
    'ari_circle_challenge_votes',
    'ari_circle_challenges',
    'ari_circle_comments',
    'ari_circle_connections',
    'ari_circle_feed_comments',
    'ari_circle_feed_hidden_posts',
    'ari_circle_feed_posts',
    'ari_circle_feed_reactions',
    'ari_circle_moments',
    'ari_circle_mutes',
    'ari_circle_notifications',
    'ari_circle_partner_intents',
    'ari_circle_partner_invites',
    'ari_circle_profiles',
    'ari_circle_top_members',
    'ari_circle_user_rewards',
    'ari_conversation_members',
    'ari_conversations',
    'ari_message_requests',
    'ari_messages'
  ];
begin
  foreach table_name in array circle_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'ARI Circle adults only', table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using (public.ari_circle_current_user_is_adult()) with check (public.ari_circle_current_user_is_adult())',
      'ARI Circle adults only', table_name
    );

    -- The profile table already has a dedicated adult profile trigger above.
    if table_name <> 'ari_circle_profiles' then
      execute format('drop trigger if exists ari_circle_adults_only_mutation_guard on public.%I', table_name);
      execute format(
        'create trigger ari_circle_adults_only_mutation_guard before insert or update or delete on public.%I for each row execute function public.ari_circle_adult_mutation_guard()',
        table_name
      );
    end if;
  end loop;
end
$$;

-- Restrict all known Circle buckets for authenticated clients. Existing bucket
-- policies stay in place but cannot make a non-adult request pass this policy.
drop policy if exists "ARI Circle adults only" on storage.objects;
create policy "ARI Circle adults only"
on storage.objects
as restrictive
for all
to authenticated
using (
  bucket_id not in (
    'ari-circle-media',
    'ari-circle-post-media',
    'ari-circle-challenge-media',
    'ari-circle-teen-media'
  )
  or public.ari_circle_current_user_is_adult()
)
with check (
  bucket_id not in (
    'ari-circle-media',
    'ari-circle-post-media',
    'ari-circle-challenge-media',
    'ari-circle-teen-media'
  )
  or public.ari_circle_current_user_is_adult()
);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER read surfaces that do not already flow through the age-band
-- helpers above are explicitly gated, preventing direct RPC bypasses.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_friend_requests_list()
returns table(connection_id uuid, user_id uuid, display_name text, handle text, avatar_url text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  perform public.ari_circle_assert_adult_access();
  return query
  select c.id, c.requester_user_id, coalesce(p.display_name,'ARI User'), p.handle::text, p.avatar_url, c.created_at
  from public.ari_circle_connections c
  left join public.ari_circle_profiles p on p.user_id = c.requester_user_id
  where c.addressee_user_id = auth.uid()
    and c.status = 'pending'
    and public.ari_circle_user_is_adult(c.requester_user_id)
  order by c.created_at desc;
end;
$$;

create or replace function public.ari_circle_list_blocked_users()
returns table(relationship_id uuid, user_id uuid, display_name text, handle text, avatar_url text, blocked_at timestamptz)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  perform public.ari_circle_assert_adult_access();
  return query
  with blocked as (
    select
      c.id as relationship_id,
      case when c.requester_user_id = auth.uid() then c.addressee_user_id else c.requester_user_id end as blocked_user_id,
      coalesce(c.updated_at,c.created_at) as blocked_at
    from public.ari_circle_connections c
    where c.status = 'blocked'
      and c.blocked_by_user_id = auth.uid()
      and (c.requester_user_id = auth.uid() or c.addressee_user_id = auth.uid())
  )
  select b.relationship_id,b.blocked_user_id,p.display_name,p.handle::text,p.avatar_url,b.blocked_at
  from blocked b
  left join public.ari_circle_profiles p on p.user_id = b.blocked_user_id
  where public.ari_circle_user_is_adult(b.blocked_user_id)
  order by b.blocked_at desc nulls last;
end;
$$;

create or replace function public.ari_circle_my_social_counts()
returns table(friend_count bigint, request_count bigint)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  perform public.ari_circle_assert_adult_access();
  return query
  select
    (select count(*)::bigint from public.ari_circle_connections c
      where c.status='accepted' and c.blocked_by_user_id is null
        and (c.requester_user_id=auth.uid() or c.addressee_user_id=auth.uid())) as friend_count,
    (select count(*)::bigint from public.ari_circle_connections c
      where c.status='pending' and c.blocked_by_user_id is null
        and c.addressee_user_id=auth.uid()) as request_count;
end;
$$;

-- Message list/thread are especially important because their historical
-- SECURITY DEFINER bodies did not perform an age check.
create or replace function public.ari_circle_messages_list(result_limit integer default 50)
returns table(conversation_id uuid, other_user_id uuid, display_name text, handle text, avatar_url text, last_message_body text, last_message_at timestamptz, unread_count bigint)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  safe_limit integer := least(greatest(coalesce(result_limit,50),1),100);
begin
  perform public.ari_circle_assert_adult_access();
  return query
  with mine as (
    select cm.conversation_id,cm.last_read_at,cm.hidden_at
    from public.ari_conversation_members cm where cm.user_id=caller_id
  ), other_member as (
    select m.conversation_id,m.user_id
    from public.ari_conversation_members m join mine x on x.conversation_id=m.conversation_id
    where m.user_id<>caller_id and public.ari_circle_user_is_adult(m.user_id)
  )
  select c.id,om.user_id,coalesce(p.display_name::text,'ARI User'),p.handle::text,p.avatar_url::text,
    case when lm.deleted_at is not null then 'Message deleted' else lm.body end,
    coalesce(lm.created_at,c.last_message_at,c.updated_at,c.created_at),
    (select count(*) from public.ari_messages um join mine mx on mx.conversation_id=um.conversation_id
      where um.conversation_id=c.id and um.sender_user_id<>caller_id
        and um.created_at>coalesce(mx.last_read_at,'epoch'::timestamptz) and um.deleted_at is null)
  from public.ari_conversations c
  join mine x on x.conversation_id=c.id
  join other_member om on om.conversation_id=c.id
  left join public.ari_circle_profiles p on p.user_id=om.user_id
  left join lateral (
    select msg.body,msg.created_at,msg.deleted_at from public.ari_messages msg
    where msg.conversation_id=c.id order by msg.created_at desc limit 1
  ) lm on true
  where x.hidden_at is null or coalesce(lm.created_at,c.last_message_at,c.updated_at,c.created_at)>x.hidden_at
  order by coalesce(lm.created_at,c.last_message_at,c.updated_at,c.created_at) desc
  limit safe_limit;
end;
$$;

create or replace function public.ari_circle_messages_thread(requested_conversation_id uuid, result_limit integer default 150)
returns table(message_id uuid, sender_user_id uuid, body text, created_at timestamptz, sender_display_name text, sender_avatar_url text, edited_at timestamptz, deleted_at timestamptz, can_edit boolean)
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  safe_limit integer := least(greatest(coalesce(result_limit,150),1),300);
  latest_own_id uuid;
  other_read_at timestamptz;
  other_user_id uuid;
begin
  perform public.ari_circle_assert_adult_access();
  if not exists(select 1 from public.ari_conversation_members cm where cm.conversation_id=requested_conversation_id and cm.user_id=caller_id) then
    raise exception 'Conversation unavailable';
  end if;

  select cm.user_id into other_user_id
  from public.ari_conversation_members cm
  where cm.conversation_id=requested_conversation_id and cm.user_id<>caller_id limit 1;
  if other_user_id is null or not public.ari_circle_user_is_adult(other_user_id) then
    raise exception 'Conversation unavailable';
  end if;

  select m.id into latest_own_id from public.ari_messages m
  where m.conversation_id=requested_conversation_id and m.sender_user_id=caller_id and m.deleted_at is null
  order by m.created_at desc limit 1;
  select cm.last_read_at into other_read_at from public.ari_conversation_members cm
  where cm.conversation_id=requested_conversation_id and cm.user_id<>caller_id limit 1;
  update public.ari_conversation_members cm set last_read_at=now()
  where cm.conversation_id=requested_conversation_id and cm.user_id=caller_id;

  return query
  select m.id,m.sender_user_id,case when m.deleted_at is not null then 'Message deleted' else m.body end,m.created_at,
    coalesce(p.display_name::text,'ARI User'),p.avatar_url::text,m.edited_at,m.deleted_at,
    (m.id=latest_own_id and m.deleted_at is null and (other_read_at is null or other_read_at<m.created_at))
  from public.ari_messages m
  left join public.ari_circle_profiles p on p.user_id=m.sender_user_id
  where m.conversation_id=requested_conversation_id
  order by m.created_at asc limit safe_limit;
end;
$$;

create or replace function public.ari_circle_relationship_state(requested_user_id uuid)
returns table(relationship_state text, connection_id uuid)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  rel public.ari_circle_connections%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then
    raise exception 'Profile unavailable';
  end if;
  if requested_user_id=caller_id then return query select 'self'::text,null::uuid; return; end if;

  select c.* into rel from public.ari_circle_connections c
  where (c.requester_user_id=caller_id and c.addressee_user_id=requested_user_id)
     or (c.requester_user_id=requested_user_id and c.addressee_user_id=caller_id)
  order by c.updated_at desc nulls last,c.created_at desc limit 1;

  if rel.id is null then return query select 'stranger'::text,null::uuid;
  elsif rel.status='blocked' or rel.blocked_by_user_id is not null then return query select 'blocked'::text,rel.id;
  elsif rel.status='accepted' then return query select 'friend'::text,rel.id;
  elsif rel.status='pending' and rel.requester_user_id=caller_id then return query select 'outgoing_pending'::text,rel.id;
  elsif rel.status='pending' then return query select 'incoming_pending'::text,rel.id;
  else return query select 'stranger'::text,rel.id;
  end if;
end;
$$;

-- Profile read RPCs retain their existing behavior for adults, but an under-18
-- caller cannot use self-profile shortcuts to bypass the Circle entitlement.
create or replace function public.ari_circle_profile_posts_v2(requested_user_id uuid, result_limit integer default 20)
returns table(post_id uuid, body text, legacy_media_url text, media_path text, media_type text, media_duration_seconds numeric, created_at timestamptz, reaction_count bigint, comment_count bigint, reaction_summary jsonb)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare safe_limit integer:=least(greatest(coalesce(result_limit,20),1),40);
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then raise exception 'Profile unavailable'; end if;
  if requested_user_id<>auth.uid() and public.ari_circle_social_pair_is_blocked(auth.uid(),requested_user_id) then raise exception 'This profile activity is unavailable'; end if;
  return query
  select p.id,p.body,p.media_url,p.media_path,p.media_type,p.media_duration_seconds,p.created_at,
    (select count(*) from public.ari_circle_feed_reactions r where r.post_id=p.id),
    (select count(*) from public.ari_circle_feed_comments c where c.post_id=p.id),
    coalesce((select jsonb_agg(jsonb_build_object('emoji',x.emoji,'count',x.cnt) order by x.cnt desc,x.emoji)
      from (select r.emoji,count(*)::bigint cnt from public.ari_circle_feed_reactions r where r.post_id=p.id group by r.emoji) x),'[]'::jsonb)
  from public.ari_circle_feed_posts p where p.author_user_id=requested_user_id
  order by p.created_at desc limit safe_limit;
end;
$$;

create or replace function public.ari_circle_profile_posts(requested_user_id uuid, result_limit integer default 20)
returns table(post_id uuid, post_type text, body text, media_url text, activity text, created_at timestamptz, reaction_count bigint, comment_count bigint, reaction_summary jsonb)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare safe_limit integer:=least(greatest(coalesce(result_limit,20),1),40);
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then raise exception 'Profile unavailable'; end if;
  if requested_user_id<>auth.uid() and public.ari_circle_social_pair_is_blocked(auth.uid(),requested_user_id) then raise exception 'This profile activity is unavailable'; end if;
  return query
  select p.id,p.post_type,p.body,p.media_url,p.activity,p.created_at,
    (select count(*) from public.ari_circle_feed_reactions r where r.post_id=p.id),
    (select count(*) from public.ari_circle_feed_comments c where c.post_id=p.id),
    coalesce((select jsonb_agg(jsonb_build_object('emoji',x.emoji,'count',x.cnt) order by x.cnt desc,x.emoji)
      from (select r.emoji,count(*)::bigint cnt from public.ari_circle_feed_reactions r where r.post_id=p.id group by r.emoji) x),'[]'::jsonb)
  from public.ari_circle_feed_posts p where p.author_user_id=requested_user_id
  order by p.created_at desc limit safe_limit;
end;
$$;

create or replace function public.ari_circle_profile_rewards(requested_user_id uuid)
returns table(reward_key text, awarded_at timestamptz, metadata jsonb, is_selected boolean)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then raise exception 'Profile unavailable'; end if;
  return query
  select r.reward_key,r.awarded_at,r.metadata,(p.selected_reward_key=r.reward_key)
  from public.ari_circle_user_rewards r join public.ari_circle_profiles p on p.user_id=r.user_id
  where r.user_id=requested_user_id order by r.awarded_at desc;
end;
$$;

create or replace function public.ari_circle_profile_social_summary(requested_user_id uuid)
returns table(user_id uuid, post_count bigint, reward_count bigint, reaction_count bigint, selected_reward_key text)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then raise exception 'Profile unavailable'; end if;
  return query select requested_user_id,
    (select count(*) from public.ari_circle_feed_posts p where p.author_user_id=requested_user_id),
    (select count(*) from public.ari_circle_user_rewards r where r.user_id=requested_user_id),
    (select count(*) from public.ari_circle_feed_reactions r join public.ari_circle_feed_posts p on p.id=r.post_id where p.author_user_id=requested_user_id),
    (select p.selected_reward_key from public.ari_circle_profiles p where p.user_id=requested_user_id);
end;
$$;

-- Grant only the same authenticated access these public RPCs intentionally use.
revoke all on function public.ari_circle_friend_requests_list() from public, anon;
grant execute on function public.ari_circle_friend_requests_list() to authenticated;
revoke all on function public.ari_circle_list_blocked_users() from public, anon;
grant execute on function public.ari_circle_list_blocked_users() to authenticated;
revoke all on function public.ari_circle_my_social_counts() from public, anon;
grant execute on function public.ari_circle_my_social_counts() to authenticated;
revoke all on function public.ari_circle_messages_list(integer) from public, anon;
grant execute on function public.ari_circle_messages_list(integer) to authenticated;
revoke all on function public.ari_circle_messages_thread(uuid,integer) from public, anon;
grant execute on function public.ari_circle_messages_thread(uuid,integer) to authenticated;
revoke all on function public.ari_circle_relationship_state(uuid) from public, anon;
grant execute on function public.ari_circle_relationship_state(uuid) to authenticated;
revoke all on function public.ari_circle_profile_posts_v2(uuid,integer) from public, anon;
grant execute on function public.ari_circle_profile_posts_v2(uuid,integer) to authenticated;
revoke all on function public.ari_circle_profile_posts(uuid,integer) from public, anon;
grant execute on function public.ari_circle_profile_posts(uuid,integer) to authenticated;
revoke all on function public.ari_circle_profile_rewards(uuid) from public, anon;
grant execute on function public.ari_circle_profile_rewards(uuid) to authenticated;
revoke all on function public.ari_circle_profile_social_summary(uuid) from public, anon;
grant execute on function public.ari_circle_profile_social_summary(uuid) to authenticated;

commit;
