-- ARI Circle Build 5 — harden Teen Buddies and profile text safety
-- 2026-08-17

begin;

-- Expand meetup language covered by the deterministic Teen Circle firewall.
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

  if value ~* '(meet me|meet alone|meet up|meetup|let''s meet|lets meet|wanna meet|want to meet|come alone|just us|come over|come to my house|come over to my house|pick me up|i''ll pick you up|i will pick you up|where do you live|hang out in person|see you at|i''ll meet you|i will meet you)' then
    return jsonb_build_object('category','private_meetup','severity','high');
  end if;

  return null;
end;
$$;

-- Teen profile text cannot be used as a workaround for off-platform contact,
-- an exact address, or private meetup coordination. ARI's own handle field is
-- intentionally excluded because it is an in-product identifier.
drop trigger if exists ari_circle_profiles_teen_safety_guard on public.ari_circle_profiles;
create trigger ari_circle_profiles_teen_safety_guard
before insert or update of display_name, bio, location, goal, bucket_list,
  favorite_song, favorite_food, favorite_movie, favorite_hobby, icebreakers
on public.ari_circle_profiles
for each row execute function public.ari_circle_guard_teen_text_row(
  'user_id',
  'display_name',
  'bio',
  'location',
  'goal',
  'bucket_list',
  'favorite_song',
  'favorite_food',
  'favorite_movie',
  'favorite_hobby',
  'icebreakers'
);

-- Profile-wall text gets the same deterministic protection.
drop trigger if exists ari_circle_comments_teen_safety_guard on public.ari_circle_comments;
create trigger ari_circle_comments_teen_safety_guard
before insert or update of body on public.ari_circle_comments
for each row execute function public.ari_circle_guard_teen_text_row('author_user_id','body');

-- Teen Buddies is interest-based, not location-based. Even if an old client or
-- direct table write supplies a location, store only the non-geographic label.
create or replace function public.ari_circle_enforce_teen_partner_intent()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  band text;
begin
  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into band
  from public.ari_account_state s
  where s.user_id = new.user_id;

  if band = 'teen' then
    if new.mode not in ('group','accountability') then
      raise exception 'Teen Buddies supports group or accountability connections only';
    end if;
    if new.activity = 'drinks' then
      raise exception 'This activity is not available in Teen Buddies';
    end if;
    new.area := 'Teen Circle';
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_enforce_teen_partner_intent() from public, anon, authenticated;

drop trigger if exists ari_partner_intents_teen_scope_guard on public.ari_circle_partner_intents;
create trigger ari_partner_intents_teen_scope_guard
before insert or update of area, mode, activity on public.ari_circle_partner_intents
for each row execute function public.ari_circle_enforce_teen_partner_intent();

-- Remove previously stored teen-area data from Buddies listings.
update public.ari_circle_partner_intents i
set area = 'Teen Circle', updated_at = now()
where exists (
  select 1
  from public.ari_account_state s
  where s.user_id = i.user_id
    and public.ari_circle_age_band_for_date(s.date_of_birth) = 'teen'
)
and i.area is distinct from 'Teen Circle';

create or replace function public.ari_circle_find_partners(
  requested_activity text default null,
  requested_area text default null,
  result_limit integer default 40
)
returns table(
  intent_id uuid,
  user_id uuid,
  display_name text,
  handle text,
  bio text,
  avatar_url text,
  activity text,
  mode text,
  experience_level text,
  area text,
  time_preferences text[],
  note text,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  caller_dob date;
  caller_band text;
  clean_activity text := lower(btrim(coalesce(requested_activity,'')));
  clean_area text := lower(btrim(coalesce(requested_area,'')));
  safe_limit integer := least(greatest(coalesce(result_limit,40),1),60);
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select date_of_birth into caller_dob
  from public.ari_account_state
  where user_id = caller_id;

  caller_band := public.ari_circle_age_band_for_date(caller_dob);
  if caller_band not in ('teen','adult') then
    raise exception 'Verify your age before using Buddies';
  end if;

  -- Teen discovery is deliberately non-local.
  if caller_band = 'teen' then clean_area := ''; end if;

  return query
  select
    i.id,
    i.user_id,
    p.display_name,
    p.handle::text,
    p.bio,
    p.avatar_url,
    i.activity,
    i.mode,
    i.experience_level,
    case when caller_band = 'teen' then 'Teen Circle'::text else i.area end,
    i.time_preferences,
    i.note,
    i.expires_at
  from public.ari_circle_partner_intents i
  join public.ari_circle_profiles p on p.user_id = i.user_id
  join public.ari_account_state s on s.user_id = i.user_id
  where i.user_id <> caller_id
    and i.status = 'looking'
    and i.expires_at > now()
    and public.ari_circle_age_band_for_date(s.date_of_birth) = caller_band
    and (caller_band <> 'teen' or i.mode in ('group','accountability'))
    and (caller_band <> 'teen' or i.activity <> 'drinks')
    and (clean_activity = '' or i.activity = clean_activity)
    and (clean_area = '' or lower(i.area) like '%' || clean_area || '%')
    and not public.ari_circle_social_pair_is_blocked(caller_id, i.user_id)
  order by
    case when clean_activity <> '' and i.activity = clean_activity then 0 else 1 end,
    i.updated_at desc
  limit safe_limit;
end;
$$;

create or replace function public.ari_circle_list_partner_invites(requested_direction text default 'received')
returns table(
  invite_id uuid,
  status text,
  starter_key text,
  starter_text text,
  activity text,
  mode text,
  area text,
  other_user_id uuid,
  other_display_name text,
  other_handle text,
  other_avatar_url text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  direction text := lower(btrim(coalesce(requested_direction,'received')));
  caller_band text;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if direction not in ('received','sent') then direction := 'received'; end if;

  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into caller_band
  from public.ari_account_state s
  where s.user_id = caller_id;

  return query
  select
    inv.id,
    inv.status,
    inv.starter_key,
    inv.starter_text,
    intent.activity,
    intent.mode,
    case when caller_band = 'teen' then 'Teen Circle'::text else intent.area end,
    other_profile.user_id,
    other_profile.display_name,
    other_profile.handle::text,
    other_profile.avatar_url,
    inv.created_at
  from public.ari_circle_partner_invites inv
  join public.ari_circle_partner_intents intent on intent.id = inv.intent_id
  join public.ari_circle_profiles other_profile
    on other_profile.user_id = case when direction = 'received' then inv.sender_user_id else inv.receiver_user_id end
  where (
    (direction = 'received' and inv.receiver_user_id = caller_id)
    or
    (direction = 'sent' and inv.sender_user_id = caller_id)
  )
    and public.ari_circle_same_verified_cohort(caller_id, other_profile.user_id)
  order by inv.created_at desc
  limit 50;
end;
$$;

create or replace function public.ari_circle_send_partner_invite(
  requested_intent_id uuid,
  requested_starter_key text default 'say_hey'
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  target_intent public.ari_circle_partner_intents%rowtype;
  caller_dob date;
  target_dob date;
  caller_band text;
  target_band text;
  clean_key text := lower(btrim(coalesce(requested_starter_key,'say_hey')));
  starter text;
  invite_id uuid;
  actor_profile public.ari_circle_profiles%rowtype;
  created_new boolean := false;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select * into target_intent
  from public.ari_circle_partner_intents
  where id = requested_intent_id
    and status = 'looking'
    and expires_at > now();

  if not found then raise exception 'This partner listing is no longer available'; end if;
  if target_intent.user_id = caller_id then raise exception 'You cannot invite yourself'; end if;

  select date_of_birth into caller_dob from public.ari_account_state where user_id = caller_id;
  select date_of_birth into target_dob from public.ari_account_state where user_id = target_intent.user_id;
  caller_band := public.ari_circle_age_band_for_date(caller_dob);
  target_band := public.ari_circle_age_band_for_date(target_dob);

  if caller_band not in ('teen','adult') or target_band not in ('teen','adult') or caller_band <> target_band then
    raise exception 'Partner invitations are only available within the same verified age group';
  end if;

  if caller_band = 'teen' and target_intent.mode not in ('group','accountability') then
    raise exception 'Teen Buddies supports group or accountability connections only';
  end if;

  if public.ari_circle_social_pair_is_blocked(caller_id,target_intent.user_id) then
    raise exception 'Partner invitations are unavailable for this profile';
  end if;

  if clean_key not in ('same_schedule','this_week','accountability','say_hey') then clean_key := 'say_hey'; end if;

  if caller_band = 'teen' then
    starter := case clean_key
      when 'same_schedule' then 'Looks like we are into the same thing. Want to connect here?'
      when 'this_week' then 'I am interested in this too. Want to connect in Teen Circle?'
      when 'accountability' then 'I am looking for accountability too. Want to connect here?'
      else 'Hey — I am interested in this too.'
    end;
  else
    starter := case clean_key
      when 'same_schedule' then 'Looks like our schedules match. Want to connect?'
      when 'this_week' then 'I am interested in doing this activity this week.'
      when 'accountability' then 'I am looking for accountability too. Want to connect?'
      else 'Hey — I am interested in this activity too.'
    end;
  end if;

  select id into invite_id
  from public.ari_circle_partner_invites
  where intent_id = requested_intent_id
    and sender_user_id = caller_id
    and receiver_user_id = target_intent.user_id
    and status = 'pending'
  limit 1;

  if invite_id is null then
    insert into public.ari_circle_partner_invites (
      intent_id,sender_user_id,receiver_user_id,starter_key,starter_text
    ) values (
      requested_intent_id,caller_id,target_intent.user_id,clean_key,starter
    ) returning id into invite_id;
    created_new := true;
  end if;

  if created_new then
    select * into actor_profile from public.ari_circle_profiles where user_id = caller_id;

    insert into public.ari_circle_notifications (
      user_id,type,title,body,actor_user_id,actor_display_name,actor_handle,
      actor_avatar_url,data
    ) values (
      target_intent.user_id,
      'partner_invite',
      case when caller_band='teen' then 'Someone wants to connect' else 'Someone wants to join you' end,
      starter,
      caller_id,
      actor_profile.display_name,
      actor_profile.handle::text,
      actor_profile.avatar_url,
      jsonb_build_object(
        'partner_invite_id',invite_id,
        'partner_intent_id',target_intent.id,
        'activity',target_intent.activity,
        'mode',target_intent.mode
      )
    );
  end if;

  return invite_id;
end;
$$;

create or replace function public.ari_circle_respond_partner_invite(
  requested_invite_id uuid,
  accept_invite boolean
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  inv public.ari_circle_partner_invites%rowtype;
  intent public.ari_circle_partner_intents%rowtype;
  sender_dob date;
  receiver_dob date;
  sender_band text;
  receiver_band text;
  conversation_id uuid;
  receiver_profile public.ari_circle_profiles%rowtype;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select * into inv
  from public.ari_circle_partner_invites
  where id = requested_invite_id
  for update;

  if not found or inv.receiver_user_id <> caller_id then raise exception 'Partner invitation not found'; end if;
  if inv.status <> 'pending' then raise exception 'This partner invitation has already been handled'; end if;

  select * into intent from public.ari_circle_partner_intents where id = inv.intent_id;

  if not accept_invite then
    update public.ari_circle_partner_invites
    set status='declined', responded_at=now(), updated_at=now()
    where id=inv.id;
    return jsonb_build_object('accepted',false,'conversation_id',null);
  end if;

  select date_of_birth into sender_dob from public.ari_account_state where user_id=inv.sender_user_id;
  select date_of_birth into receiver_dob from public.ari_account_state where user_id=inv.receiver_user_id;
  sender_band := public.ari_circle_age_band_for_date(sender_dob);
  receiver_band := public.ari_circle_age_band_for_date(receiver_dob);

  if sender_band not in ('teen','adult') or receiver_band not in ('teen','adult') or sender_band <> receiver_band then
    raise exception 'Partner connections are only available within the same verified age group';
  end if;

  if sender_band='teen' and intent.mode not in ('group','accountability') then
    raise exception 'Teen Buddies supports group or accountability connections only';
  end if;

  if public.ari_circle_social_pair_is_blocked(inv.sender_user_id,inv.receiver_user_id) then
    raise exception 'Partner connection is unavailable for this profile';
  end if;

  select c.id into conversation_id
  from public.ari_conversations c
  where c.type='direct'
    and ((c.direct_user_a=inv.sender_user_id and c.direct_user_b=inv.receiver_user_id)
      or (c.direct_user_a=inv.receiver_user_id and c.direct_user_b=inv.sender_user_id))
  limit 1;

  if conversation_id is null then
    begin
      insert into public.ari_conversations(type,created_by,direct_user_a,direct_user_b)
      values('direct',caller_id,inv.sender_user_id,inv.receiver_user_id)
      returning id into conversation_id;
    exception when unique_violation then
      select c.id into conversation_id
      from public.ari_conversations c
      where c.type='direct'
        and ((c.direct_user_a=inv.sender_user_id and c.direct_user_b=inv.receiver_user_id)
          or (c.direct_user_a=inv.receiver_user_id and c.direct_user_b=inv.sender_user_id))
      limit 1;
    end;
  end if;

  insert into public.ari_conversation_members(conversation_id,user_id)
  values(conversation_id,inv.sender_user_id),(conversation_id,inv.receiver_user_id)
  on conflict do nothing;

  update public.ari_circle_partner_invites
  set status='accepted', responded_at=now(), updated_at=now()
  where id=inv.id;

  select * into receiver_profile from public.ari_circle_profiles where user_id=caller_id;

  insert into public.ari_circle_notifications (
    user_id,type,title,body,actor_user_id,actor_display_name,actor_handle,
    actor_avatar_url,conversation_id,data
  ) values (
    inv.sender_user_id,
    'partner_invite_accepted',
    case when sender_band='teen' then 'You connected in Teen Circle' else 'You matched for an activity' end,
    case when sender_band='teen'
      then 'Your Teen Circle invite was accepted. Keep the conversation in ARI Circle and do not share exact locations or off-app contact details.'
      else 'Your partner invite was accepted. Say hey when you are ready.' end,
    caller_id,
    receiver_profile.display_name,
    receiver_profile.handle::text,
    receiver_profile.avatar_url,
    conversation_id,
    jsonb_build_object(
      'partner_invite_id',inv.id,
      'partner_intent_id',inv.intent_id,
      'activity',intent.activity,
      'mode',intent.mode
    )
  );

  return jsonb_build_object(
    'accepted',true,
    'conversation_id',conversation_id,
    'activity',intent.activity,
    'starter_suggestions',
      case when sender_band='teen' then jsonb_build_array(
        'What got you into this?',
        'What are you working on lately?',
        'Want to keep each other accountable here?'
      ) else jsonb_build_array(
        'What days work best for you?',
        'What does your usual session look like?',
        'Want to plan something this week?'
      ) end
  );
end;
$$;

commit;
