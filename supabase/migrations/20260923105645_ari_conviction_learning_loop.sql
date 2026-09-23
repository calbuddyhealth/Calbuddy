-- Ari Conviction and Learning Loop
-- Goals retain purpose while attempts and evidence evolve independently.
create table if not exists public.ari_vnext_project_goals (
  user_id uuid not null,
  id text not null,
  status text not null default 'candidate',
  revision integer not null default 0,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint ari_vnext_project_goals_status_check
    check (status in ('candidate', 'active', 'waiting', 'paused', 'achieved', 'retired')),
  constraint ari_vnext_project_goals_state_object_check
    check (jsonb_typeof(state) = 'object')
);

create index if not exists ari_vnext_project_goals_user_status_idx
  on public.ari_vnext_project_goals (user_id, status, updated_at desc);

create table if not exists public.ari_vnext_goal_events (
  user_id uuid not null,
  goal_id text not null,
  event_id text not null,
  event_type text not null,
  event jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id),
  constraint ari_vnext_goal_events_event_object_check
    check (jsonb_typeof(event) = 'object'),
  constraint ari_vnext_goal_events_goal_fk
    foreign key (user_id, goal_id)
    references public.ari_vnext_project_goals(user_id, id)
    on delete cascade
);

create index if not exists ari_vnext_goal_events_goal_time_idx
  on public.ari_vnext_goal_events (user_id, goal_id, created_at asc, event_id asc);

alter table public.ari_vnext_project_goals enable row level security;
alter table public.ari_vnext_goal_events enable row level security;
revoke all on table public.ari_vnext_project_goals from public, anon, authenticated;
revoke all on table public.ari_vnext_goal_events from public, anon, authenticated;
grant all on table public.ari_vnext_project_goals to service_role;
grant select, insert on table public.ari_vnext_goal_events to service_role;

comment on table public.ari_vnext_project_goals is
  'Owner-scoped durable purposes, approaches, attempts, and evidence for Ari Conviction and Learning Loop.';
comment on table public.ari_vnext_goal_events is
  'Append-only goal lifecycle events; state snapshots are updated transactionally by ari_append_goal_event.';

create or replace function public.ari_append_goal_event(
  p_user_id uuid,
  p_goal_id text,
  p_expected_revision integer,
  p_state jsonb,
  p_event jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_state jsonb;
  current_revision integer;
  event_key text;
  existing_goal_id text;
  inserted integer;
  saved_state jsonb;
begin
  if p_user_id is null or nullif(trim(p_goal_id), '') is null
     or jsonb_typeof(p_state) is distinct from 'object'
     or jsonb_typeof(p_event) is distinct from 'object'
     or p_state->>'id' is distinct from p_goal_id
     or p_state->>'revision' is distinct from (p_expected_revision + 1)::text
     or p_event->>'type' not in ('goal_created', 'attempt_started', 'outcome_observed', 'goal_review')
     or p_event->>'type' is null then
    return jsonb_build_object('stored', false, 'reason', 'invalid_goal_event');
  end if;

  event_key := nullif(trim(p_event->>'id'), '');
  if event_key is null then
    return jsonb_build_object('stored', false, 'reason', 'event_id_required');
  end if;

  select state, revision
    into current_state, current_revision
    from public.ari_vnext_project_goals
   where user_id = p_user_id and id = p_goal_id
   for update;

  if not found then
    return jsonb_build_object('stored', false, 'reason', 'goal_not_found');
  end if;

  select goal_id into existing_goal_id from public.ari_vnext_goal_events
   where user_id = p_user_id and event_id = event_key;
  if found then
    if existing_goal_id <> p_goal_id then
      return jsonb_build_object('stored', false, 'reason', 'event_id_conflict');
    end if;
    return jsonb_build_object('stored', true, 'duplicate', true, 'state', current_state);
  end if;

  if current_revision <> coalesce(p_expected_revision, -1) then
    return jsonb_build_object(
      'stored', false,
      'reason', 'revision_conflict',
      'current_revision', current_revision,
      'state', current_state
    );
  end if;

  insert into public.ari_vnext_goal_events (user_id, goal_id, event_id, event_type, event)
  values (p_user_id, p_goal_id, event_key, p_event->>'type', p_event)
  on conflict (user_id, event_id) do nothing;
  get diagnostics inserted = row_count;

  if inserted = 0 then
    select goal_id into existing_goal_id from public.ari_vnext_goal_events
     where user_id = p_user_id and event_id = event_key;
    if existing_goal_id <> p_goal_id then
      return jsonb_build_object('stored', false, 'reason', 'event_id_conflict');
    end if;
    return jsonb_build_object('stored', true, 'duplicate', true, 'state', current_state);
  end if;

  update public.ari_vnext_project_goals
     set status = coalesce(nullif(p_state->>'status', ''), status),
         revision = current_revision + 1,
         state = p_state,
         updated_at = now()
   where user_id = p_user_id and id = p_goal_id and revision = current_revision
  returning state into saved_state;

  if not found then
    return jsonb_build_object('stored', false, 'reason', 'revision_conflict');
  end if;

  return jsonb_build_object('stored', true, 'duplicate', false, 'state', saved_state);
end;
$$;

revoke all on function public.ari_append_goal_event(uuid, text, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ari_append_goal_event(uuid, text, integer, jsonb, jsonb) to service_role;
