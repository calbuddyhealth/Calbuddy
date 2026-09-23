-- ARI Circle owner photo review.
-- Lets the verified server owner resolve any still-pending profile photo
-- immediately without waiting for the automated moderation worker.

begin;

alter table public.ari_circle_profile_photos
  add column if not exists moderation_source text,
  add column if not exists moderated_by_user_id uuid references auth.users(id) on delete set null;

create index if not exists ari_circle_profile_photos_pending_owner_review_idx
  on public.ari_circle_profile_photos(updated_at desc)
  where moderation_status = 'pending';

create or replace function public.ari_circle_owner_pending_profile_photos(
  requested_limit integer default 100
)
returns table(
  photo_id uuid,
  user_id uuid,
  "position" smallint,
  media_path text,
  submitted_at timestamptz,
  moderation_retry_count integer,
  moderation_next_retry_at timestamptz,
  moderation_last_error text,
  display_name text,
  handle text
)
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    p.id as photo_id,
    p.user_id,
    p.position,
    p.media_path,
    p.updated_at as submitted_at,
    p.moderation_retry_count,
    p.moderation_next_retry_at,
    p.moderation_last_error,
    cp.display_name,
    cp.handle::text
  from public.ari_circle_profile_photos p
  left join public.ari_circle_profiles cp
    on cp.user_id = p.user_id
  where p.moderation_status = 'pending'
  order by p.updated_at asc
  limit greatest(1, least(coalesce(requested_limit, 100), 250));
$$;

revoke all on function public.ari_circle_owner_pending_profile_photos(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_owner_pending_profile_photos(integer)
  to service_role;

create or replace function public.ari_circle_owner_review_profile_photo(
  requested_photo_id uuid,
  requested_owner_user_id uuid,
  requested_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  decision text := lower(btrim(coalesce(requested_decision, '')));
  current_row public.ari_circle_profile_photos%rowtype;
  queue_row record;
  final_status text;
  final_decision text;
begin
  if requested_photo_id is null or requested_owner_user_id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'INVALID_REQUEST'
    );
  end if;

  if decision not in ('approve', 'reject') then
    return jsonb_build_object(
      'success', false,
      'code', 'INVALID_DECISION'
    );
  end if;

  select p.* into current_row
  from public.ari_circle_profile_photos p
  where p.id = requested_photo_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'PHOTO_NOT_FOUND'
    );
  end if;

  if current_row.moderation_status <> 'pending' then
    return jsonb_build_object(
      'success', false,
      'code', 'PHOTO_ALREADY_RESOLVED',
      'moderation_status', current_row.moderation_status,
      'moderation_decision', current_row.moderation_decision
    );
  end if;

  final_status := case when decision = 'approve' then 'approved' else 'rejected' end;
  final_decision := case when decision = 'approve' then 'owner_approved' else 'owner_rejected' end;

  update public.ari_circle_profile_photos
  set moderation_status = final_status,
      moderation_decision = final_decision,
      moderation_source = 'owner',
      moderated_by_user_id = requested_owner_user_id,
      moderation_next_retry_at = null,
      moderation_last_error = null,
      moderated_at = now(),
      updated_at = now()
  where id = requested_photo_id
    and moderation_status = 'pending';

  -- Remove any still-queued copies immediately. If a worker already claimed a
  -- message, its existing pending-status guard prevents a second decision.
  for queue_row in
    select q.msg_id
    from pgmq.q_ari_circle_profile_moderation q
    where q.message->>'photo_id' = requested_photo_id::text
  loop
    perform pgmq.delete('ari_circle_profile_moderation', queue_row.msg_id);
  end loop;

  return jsonb_build_object(
    'success', true,
    'photo_id', requested_photo_id,
    'moderation_status', final_status,
    'moderation_decision', final_decision,
    'moderation_source', 'owner',
    'moderated_by_user_id', requested_owner_user_id
  );
end;
$$;

revoke all on function public.ari_circle_owner_review_profile_photo(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_owner_review_profile_photo(uuid,uuid,text)
  to service_role;

create or replace function public.ari_circle_profile_moderation_complete(
  requested_msg_id bigint,
  requested_photo_id uuid,
  requested_media_path text,
  requested_allowed boolean,
  requested_decision text,
  requested_policy_version text default null,
  requested_review_recommended boolean default false,
  requested_review_categories text[] default '{}'::text[],
  requested_blocked_categories text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  affected integer := 0;
  final_status text := case when requested_allowed then 'approved' else 'rejected' end;
begin
  update public.ari_circle_profile_photos
  set moderation_status = final_status,
      moderation_decision = left(btrim(coalesce(requested_decision, 'unknown')), 120),
      moderation_policy_version = nullif(left(btrim(coalesce(requested_policy_version, '')), 120), ''),
      moderation_review_recommended = coalesce(requested_review_recommended, false),
      moderation_review_categories = coalesce(requested_review_categories, '{}'::text[]),
      moderation_blocked_categories = coalesce(requested_blocked_categories, '{}'::text[]),
      moderation_next_retry_at = null,
      moderation_last_error = null,
      moderation_source = 'worker',
      moderated_by_user_id = null,
      moderated_at = now(),
      updated_at = now()
  where id = requested_photo_id
    and media_path = btrim(coalesce(requested_media_path, ''))
    and moderation_status = 'pending';

  get diagnostics affected = row_count;
  perform pgmq.delete('ari_circle_profile_moderation', requested_msg_id);

  return jsonb_build_object(
    'photo_id', requested_photo_id,
    'updated', affected = 1,
    'moderation_status', case when affected = 1 then final_status else null end,
    'moderation_source', case when affected = 1 then 'worker' else null end
  );
end;
$$;

revoke all on function public.ari_circle_profile_moderation_complete(bigint,uuid,text,boolean,text,text,boolean,text[],text[])
  from public, anon, authenticated;
grant execute on function public.ari_circle_profile_moderation_complete(bigint,uuid,text,boolean,text,text,boolean,text[],text[])
  to service_role;

commit;
