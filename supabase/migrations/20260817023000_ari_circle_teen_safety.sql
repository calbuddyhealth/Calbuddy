-- ARI Circle Build 5 — teen safety firewall + owner review queue
-- 2026-08-17

begin;

create table if not exists public.ari_teen_safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  related_user_id uuid null references auth.users(id) on delete set null,
  surface text not null,
  category text not null,
  severity text not null default 'medium',
  action text not null default 'blocked',
  excerpt text null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  constraint ari_teen_safety_events_severity_check
    check (severity in ('low','medium','high')),
  constraint ari_teen_safety_events_action_check
    check (action in ('blocked','flagged')),
  constraint ari_teen_safety_events_status_check
    check (status in ('open','reviewed','escalated','dismissed'))
);

create index if not exists ari_teen_safety_events_status_created_idx
  on public.ari_teen_safety_events (status, created_at desc);
create index if not exists ari_teen_safety_events_user_created_idx
  on public.ari_teen_safety_events (user_id, created_at desc);
create index if not exists ari_teen_safety_events_severity_created_idx
  on public.ari_teen_safety_events (severity, created_at desc);

alter table public.ari_teen_safety_events enable row level security;

drop policy if exists "ARI admins read teen safety events" on public.ari_teen_safety_events;
create policy "ARI admins read teen safety events"
  on public.ari_teen_safety_events
  for select
  to authenticated
  using (public.is_ari_admin());

drop policy if exists "ARI admins update teen safety events" on public.ari_teen_safety_events;
create policy "ARI admins update teen safety events"
  on public.ari_teen_safety_events
  for update
  to authenticated
  using (public.is_ari_admin())
  with check (public.is_ari_admin());

revoke all on table public.ari_teen_safety_events from anon;
revoke insert, delete on table public.ari_teen_safety_events from authenticated;
grant select, update on table public.ari_teen_safety_events to authenticated;

create or replace function public.ari_circle_redact_teen_safety_excerpt(raw_text text)
returns text
language plpgsql
immutable
set search_path = 'pg_catalog'
as $$
declare
  value text := btrim(coalesce(raw_text, ''));
begin
  if value = '' then return null; end if;

  value := regexp_replace(
    value,
    '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}',
    '[redacted email]',
    'gi'
  );
  value := regexp_replace(
    value,
    '(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}',
    '[redacted phone]',
    'g'
  );
  value := regexp_replace(
    value,
    '(https?://[^[:space:]]+|www\.[^[:space:]]+|[[:alnum:]-]+\.(com|net|org|app|gg|io|me|co)(/[^[:space:]]*)?)',
    '[redacted link]',
    'gi'
  );
  value := regexp_replace(
    value,
    '@[[:alnum:]_.-]{2,}',
    '[redacted handle]',
    'g'
  );
  value := regexp_replace(
    value,
    '(^|[^0-9])([0-9]{1,6}[[:space:]]+[[:alnum:] .-]{2,40}[[:space:]]+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|ct|court|way|pl|place|pkwy|parkway))([^[:alnum:]]|$)',
    '\1[redacted location]\4',
    'gi'
  );

  return left(value, 240);
end;
$$;

create or replace function public.ari_circle_classify_teen_safety_text(raw_text text)
returns jsonb
language plpgsql
immutable
set search_path = 'pg_catalog'
as $$
declare
  value text := btrim(coalesce(raw_text, ''));
begin
  if value = '' then return null; end if;

  if value ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' then
    return jsonb_build_object('category','contact_email','severity','medium');
  end if;

  if value ~ '(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}' then
    return jsonb_build_object('category','contact_phone','severity','medium');
  end if;

  if value ~* '(https?://|www\.|[[:alnum:]-]+\.(com|net|org|app|gg|io|me|co)(/|[[:space:]]|$))' then
    return jsonb_build_object('category','external_link','severity','medium');
  end if;

  if value ~* '(^|[[:space:][:punct:]])@[[:alnum:]_.-]{2,}'
     or value ~* '(add me on|dm me on|message me on|find me on|my (snap|snapchat|instagram|insta|discord|whatsapp|telegram|kik|signal))' then
    return jsonb_build_object('category','external_social','severity','medium');
  end if;

  if value ~* '(text me|call me|facetime me|move (this|the)?[[:space:]]*(chat|conversation)|talk (on|over on) (snap|snapchat|instagram|insta|discord|whatsapp|telegram|kik|signal))' then
    return jsonb_build_object('category','off_platform_contact','severity','medium');
  end if;

  if value ~* '(^|[^0-9])([0-9]{1,6}[[:space:]]+[[:alnum:] .-]{2,40}[[:space:]]+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|ct|court|way|pl|place|pkwy|parkway))([^[:alnum:]]|$)'
     or value ~* '(what is|what''s|send|drop|share|give me)[[:space:]]+(your[[:space:]]+)?(exact[[:space:]]+)?(address|location)'
     or value ~* '(my|our)[[:space:]]+(address|house)[[:space:]]+(is|at)' then
    return jsonb_build_object('category','exact_location','severity','high');
  end if;

  if value ~* '(meet me|meet alone|come alone|just us|come to my house|come over to my house|pick me up|i''ll pick you up|i will pick you up|where do you live)' then
    return jsonb_build_object('category','private_meetup','severity','high');
  end if;

  return null;
end;
$$;

create or replace function public.ari_circle_record_teen_safety_event(
  subject_user_id uuid,
  requested_surface text,
  requested_category text,
  requested_severity text,
  requested_action text,
  requested_excerpt text default null,
  requested_related_user_id uuid default null,
  requested_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  subject_band text;
  result_id uuid;
  clean_surface text := left(lower(btrim(coalesce(requested_surface, 'ari_circle'))), 80);
  clean_category text := left(lower(btrim(coalesce(requested_category, 'safety'))), 80);
  clean_severity text := lower(btrim(coalesce(requested_severity, 'medium')));
  clean_action text := lower(btrim(coalesce(requested_action, 'blocked')));
begin
  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into subject_band
  from public.ari_account_state s
  where s.user_id = subject_user_id;

  if subject_band <> 'teen' then return null; end if;
  if clean_severity not in ('low','medium','high') then clean_severity := 'medium'; end if;
  if clean_action not in ('blocked','flagged') then clean_action := 'blocked'; end if;

  insert into public.ari_teen_safety_events (
    user_id, related_user_id, surface, category, severity, action, excerpt, metadata
  ) values (
    subject_user_id,
    requested_related_user_id,
    coalesce(nullif(clean_surface,''), 'ari_circle'),
    coalesce(nullif(clean_category,''), 'safety'),
    clean_severity,
    clean_action,
    public.ari_circle_redact_teen_safety_excerpt(requested_excerpt),
    coalesce(requested_metadata, '{}'::jsonb)
  )
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.ari_circle_record_teen_safety_event(uuid,text,text,text,text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.ari_circle_screen_my_teen_text(
  requested_surface text,
  requested_text text,
  requested_related_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  caller_band text;
  finding jsonb;
  category text;
  severity text;
  prior_count integer := 0;
  event_id uuid;
  user_message text;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into caller_band
  from public.ari_account_state s
  where s.user_id = caller_id;

  if caller_band <> 'teen' then
    return jsonb_build_object('allowed', true, 'teen', false);
  end if;

  finding := public.ari_circle_classify_teen_safety_text(requested_text);
  if finding is null then
    return jsonb_build_object('allowed', true, 'teen', true);
  end if;

  category := finding->>'category';
  severity := finding->>'severity';

  select count(*)::integer into prior_count
  from public.ari_teen_safety_events e
  where e.user_id = caller_id
    and e.created_at >= now() - interval '24 hours';

  if prior_count >= 2 then severity := 'high'; end if;

  event_id := public.ari_circle_record_teen_safety_event(
    caller_id,
    requested_surface,
    category,
    severity,
    'blocked',
    requested_text,
    requested_related_user_id,
    jsonb_build_object('source','teen_text_firewall','prior_24h',prior_count)
  );

  user_message := case
    when category in ('exact_location','private_meetup')
      then 'For safety, Teen Circle does not allow private meetup coordination or exact locations.'
    else 'Teen accounts cannot share phone numbers, email addresses, links, or off-app contact details.'
  end;

  return jsonb_build_object(
    'allowed', false,
    'teen', true,
    'category', category,
    'severity', severity,
    'event_id', event_id,
    'message', user_message
  );
end;
$$;

revoke all on function public.ari_circle_screen_my_teen_text(text,text,uuid) from public, anon;
grant execute on function public.ari_circle_screen_my_teen_text(text,text,uuid) to authenticated;

create or replace function public.ari_circle_log_my_teen_moderation_event(
  requested_surface text,
  requested_categories text[],
  requested_excerpt text default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  caller_band text;
  safe_categories text[] := coalesce(requested_categories, '{}'::text[]);
  severity text := 'medium';
  recent_count integer := 0;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into caller_band
  from public.ari_account_state s
  where s.user_id = caller_id;

  if caller_band <> 'teen' then return null; end if;

  select count(*)::integer into recent_count
  from public.ari_teen_safety_events e
  where e.user_id = caller_id
    and e.created_at >= now() - interval '1 hour';

  if recent_count >= 40 then return null; end if;

  if exists (
    select 1 from unnest(safe_categories) c
    where c in ('sexual/minors','sexual','self-harm/instructions','violence/graphic')
  ) or recent_count >= 2 then
    severity := 'high';
  end if;

  return public.ari_circle_record_teen_safety_event(
    caller_id,
    requested_surface,
    'ai_moderation',
    severity,
    'blocked',
    requested_excerpt,
    null,
    jsonb_build_object(
      'source','prepublication_ai_moderation',
      'blocked_categories',to_jsonb(safe_categories)
    )
  );
end;
$$;

revoke all on function public.ari_circle_log_my_teen_moderation_event(text,text[],text) from public, anon;
grant execute on function public.ari_circle_log_my_teen_moderation_event(text,text[],text) to authenticated;

create or replace function public.ari_circle_guard_teen_text_row()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  row_data jsonb := to_jsonb(new);
  subject_id uuid;
  combined_text text := '';
  caller_band text;
  finding jsonb;
  i integer;
  category text;
begin
  subject_id := nullif(row_data->>tg_argv[0], '')::uuid;
  if subject_id is null then return new; end if;

  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into caller_band
  from public.ari_account_state s
  where s.user_id = subject_id;

  if caller_band <> 'teen' then return new; end if;

  if tg_nargs > 1 then
    for i in 1..(tg_nargs - 1) loop
      combined_text := concat_ws(E'\n', combined_text, coalesce(row_data->>tg_argv[i], ''));
    end loop;
  end if;

  finding := public.ari_circle_classify_teen_safety_text(combined_text);
  if finding is null then return new; end if;

  category := finding->>'category';
  if category in ('exact_location','private_meetup') then
    raise exception 'For safety, Teen Circle does not allow private meetup coordination or exact locations.';
  end if;
  raise exception 'Teen accounts cannot share phone numbers, email addresses, links, or off-app contact details.';
end;
$$;

revoke all on function public.ari_circle_guard_teen_text_row() from public, anon, authenticated;

create or replace function public.ari_circle_guard_message_safety_row()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  recipient_id uuid;
  sender_band text;
  finding jsonb;
  category text;
begin
  select cm.user_id into recipient_id
  from public.ari_conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_user_id
  limit 1;

  if recipient_id is not null
     and not public.ari_circle_same_verified_cohort(new.sender_user_id, recipient_id) then
    raise exception 'Direct messages are only available within the same verified age group';
  end if;

  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into sender_band
  from public.ari_account_state s
  where s.user_id = new.sender_user_id;

  if sender_band <> 'teen' then return new; end if;

  finding := public.ari_circle_classify_teen_safety_text(new.body);
  if finding is null then return new; end if;

  category := finding->>'category';
  if category in ('exact_location','private_meetup') then
    raise exception 'For safety, Teen Circle does not allow private meetup coordination or exact locations.';
  end if;
  raise exception 'Teen accounts cannot share phone numbers, email addresses, links, or off-app contact details.';
end;
$$;

revoke all on function public.ari_circle_guard_message_safety_row() from public, anon, authenticated;

drop trigger if exists ari_messages_teen_safety_guard on public.ari_messages;
create trigger ari_messages_teen_safety_guard
before insert or update of body on public.ari_messages
for each row execute function public.ari_circle_guard_message_safety_row();

drop trigger if exists ari_feed_posts_teen_safety_guard on public.ari_circle_feed_posts;
create trigger ari_feed_posts_teen_safety_guard
before insert or update of body on public.ari_circle_feed_posts
for each row execute function public.ari_circle_guard_teen_text_row('author_user_id','body');

drop trigger if exists ari_feed_comments_teen_safety_guard on public.ari_circle_feed_comments;
create trigger ari_feed_comments_teen_safety_guard
before insert or update of body on public.ari_circle_feed_comments
for each row execute function public.ari_circle_guard_teen_text_row('author_user_id','body');

drop trigger if exists ari_moments_teen_safety_guard on public.ari_circle_moments;
create trigger ari_moments_teen_safety_guard
before insert or update of caption on public.ari_circle_moments
for each row execute function public.ari_circle_guard_teen_text_row('author_user_id','caption');

drop trigger if exists ari_challenges_teen_safety_guard on public.ari_circle_challenges;
create trigger ari_challenges_teen_safety_guard
before insert or update of title, description on public.ari_circle_challenges
for each row execute function public.ari_circle_guard_teen_text_row('creator_user_id','title','description');

drop trigger if exists ari_challenge_entries_teen_safety_guard on public.ari_circle_challenge_entries;
create trigger ari_challenge_entries_teen_safety_guard
before insert or update of caption on public.ari_circle_challenge_entries
for each row execute function public.ari_circle_guard_teen_text_row('user_id','caption');

drop trigger if exists ari_partner_intents_teen_safety_guard on public.ari_circle_partner_intents;
create trigger ari_partner_intents_teen_safety_guard
before insert or update of area, note on public.ari_circle_partner_intents
for each row execute function public.ari_circle_guard_teen_text_row('user_id','area','note');

create or replace function public.ari_admin_teen_safety_events(
  requested_status text default 'open',
  result_limit integer default 100
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  handle text,
  surface text,
  category text,
  severity text,
  action text,
  excerpt text,
  metadata jsonb,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  prior_event_count bigint
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  clean_status text := lower(btrim(coalesce(requested_status, 'open')));
  safe_limit integer := least(greatest(coalesce(result_limit, 100), 1), 250);
begin
  if not public.is_ari_admin() then raise exception 'Owner access required'; end if;
  if clean_status not in ('open','reviewed','escalated','dismissed','all') then clean_status := 'open'; end if;

  return query
  select
    e.id,
    e.user_id,
    p.display_name,
    p.handle::text,
    e.surface,
    e.category,
    e.severity,
    e.action,
    e.excerpt,
    e.metadata,
    e.status,
    e.created_at,
    e.reviewed_at,
    e.reviewed_by,
    (
      select count(*)
      from public.ari_teen_safety_events prior
      where prior.user_id = e.user_id
        and prior.created_at < e.created_at
    ) as prior_event_count
  from public.ari_teen_safety_events e
  left join public.ari_circle_profiles p on p.user_id = e.user_id
  where clean_status = 'all' or e.status = clean_status
  order by
    case e.severity when 'high' then 0 when 'medium' then 1 else 2 end,
    e.created_at desc
  limit safe_limit;
end;
$$;

revoke all on function public.ari_admin_teen_safety_events(text,integer) from public, anon;
grant execute on function public.ari_admin_teen_safety_events(text,integer) to authenticated;

create or replace function public.ari_admin_teen_safety_summary()
returns jsonb
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select case
    when not public.is_ari_admin() then jsonb_build_object('authorized',false)
    else jsonb_build_object(
      'authorized', true,
      'open', count(*) filter (where status='open'),
      'high_priority', count(*) filter (where status='open' and severity='high'),
      'last_24h', count(*) filter (where created_at >= now() - interval '24 hours'),
      'unique_teens_30d', count(distinct user_id) filter (where created_at >= now() - interval '30 days')
    )
  end
  from public.ari_teen_safety_events;
$$;

revoke all on function public.ari_admin_teen_safety_summary() from public, anon;
grant execute on function public.ari_admin_teen_safety_summary() to authenticated;

create or replace function public.ari_admin_review_teen_safety_event(
  requested_event_id uuid,
  requested_status text
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_status text := lower(btrim(coalesce(requested_status, 'reviewed')));
begin
  if not public.is_ari_admin() then raise exception 'Owner access required'; end if;
  if clean_status not in ('open','reviewed','escalated','dismissed') then
    raise exception 'Unsupported review status';
  end if;

  update public.ari_teen_safety_events
  set status = clean_status,
      reviewed_at = case when clean_status='open' then null else now() end,
      reviewed_by = case when clean_status='open' then null else caller_id end
  where id = requested_event_id;

  return found;
end;
$$;

revoke all on function public.ari_admin_review_teen_safety_event(uuid,text) from public, anon;
grant execute on function public.ari_admin_review_teen_safety_event(uuid,text) to authenticated;

commit;
