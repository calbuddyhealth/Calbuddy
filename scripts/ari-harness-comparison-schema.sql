create table if not exists public.ari_harness_comparisons (
  user_id uuid not null references auth.users(id) on delete cascade,
  trial_id uuid not null,
  case_id text not null,
  created_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running','completed','failed')),
  result jsonb,
  preference text check (preference in ('A','B','tie','neither')),
  primary key (user_id, trial_id)
);
alter table public.ari_harness_comparisons enable row level security;
revoke all on public.ari_harness_comparisons from public, anon, authenticated;
grant select, insert, update on public.ari_harness_comparisons to service_role;

-- Serialized reservation prevents retries/concurrent requests from duplicating
-- paid calls and limits this manual pilot to 24 pairs per owner per UTC day.
create or replace function public.reserve_ari_harness_comparison(p_user uuid, p_trial uuid, p_case text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare existing_row public.ari_harness_comparisons; n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 8294));
  select * into existing_row from public.ari_harness_comparisons where user_id=p_user and trial_id=p_trial;
  if found then return jsonb_build_object('claimed',false,'row',to_jsonb(existing_row)); end if;
  select count(*) into n from public.ari_harness_comparisons where user_id=p_user and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if n >= 24 then return jsonb_build_object('claimed',false,'limit',true); end if;
  insert into public.ari_harness_comparisons(user_id,trial_id,case_id) values(p_user,p_trial,p_case);
  return jsonb_build_object('claimed',true);
end;
$$;
revoke all on function public.reserve_ari_harness_comparison(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_ari_harness_comparison(uuid,uuid,text) to service_role;
