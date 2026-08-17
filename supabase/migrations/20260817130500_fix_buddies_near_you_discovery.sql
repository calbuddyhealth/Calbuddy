create or replace function public.ari_circle_find_partners(
  requested_activity text default null::text,
  requested_area text default null::text,
  result_limit integer default 40
)
returns table(
  intent_id uuid,
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  bio text,
  activity text,
  mode text,
  experience_level text,
  area text,
  time_preferences text[],
  note text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_dob date;
  caller_band text;
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity,''))), '');
  clean_area text := nullif(lower(btrim(coalesce(requested_area,''))), '');
  safe_limit integer := least(greatest(coalesce(result_limit,40),1),60);
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select account_state.date_of_birth
  into caller_dob
  from public.ari_account_state as account_state
  where account_state.user_id = caller_id;

  caller_band := public.ari_circle_age_band_for_date(caller_dob);
  if caller_band not in ('teen','adult') then
    raise exception 'Verify your age before using Buddies';
  end if;

  if caller_band = 'teen' then
    clean_area := null;
  end if;

  return query
  select
    i.id,
    i.user_id,
    p.display_name,
    p.handle::text,
    p.avatar_url,
    p.bio,
    i.activity,
    i.mode,
    i.experience_level,
    case when caller_band='teen' then 'Teen Circle'::text else i.area end,
    i.time_preferences,
    i.note,
    i.updated_at
  from public.ari_circle_partner_intents i
  join public.ari_circle_profiles p on p.user_id=i.user_id
  join public.ari_account_state s on s.user_id=i.user_id
  where i.user_id<>caller_id
    and i.status='looking'
    and i.expires_at>now()
    and public.ari_circle_age_band_for_date(s.date_of_birth)=caller_band
    and (caller_band<>'teen' or i.mode in ('group','accountability'))
    and (caller_band<>'teen' or i.activity<>'drinks')
    and (clean_activity is null or i.activity=clean_activity)
    and (clean_area is null or lower(i.area) like '%'||clean_area||'%')
    and not public.ari_circle_social_pair_is_blocked(caller_id,i.user_id)
  order by
    case when clean_activity is not null and i.activity=clean_activity then 0 else 1 end,
    i.updated_at desc
  limit safe_limit;
end;
$function$;
