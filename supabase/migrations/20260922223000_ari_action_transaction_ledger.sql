-- ARI durable action transaction ledger.
-- Existing domain tables remain authoritative for meals, workouts, activity, weight, and goals.
-- This table owns proposal/confirmation/execution state only.

alter table public.ai_app_actions
  add column if not exists source_turn_id text,
  add column if not exists vnext_action_id text,
  add column if not exists vnext_pending_action jsonb,
  add column if not exists expires_at timestamptz,
  add column if not exists execution_started_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists result jsonb not null default '{}'::jsonb,
  add column if not exists error_code text,
  add column if not exists error_message text,
  add column if not exists confirmation_turn_id text,
  add column if not exists attempt_count integer not null default 0;

update public.ai_app_actions
set status = coalesce(nullif(status, ''), 'pending'),
    updated_at = coalesce(updated_at, created_at, now())
where status is null
   or status = ''
   or updated_at is null;

alter table public.ai_app_actions
  alter column status set not null,
  alter column status set default 'pending';

alter table public.ai_app_actions
  drop constraint if exists ai_app_actions_status_check;

alter table public.ai_app_actions
  add constraint ai_app_actions_status_check
  check (status in ('proposed','pending','executing','completed','failed','cancelled','expired'));

create unique index if not exists ai_app_actions_user_vnext_action_uidx
  on public.ai_app_actions(user_id, vnext_action_id);

create index if not exists ai_app_actions_user_status_created_idx
  on public.ai_app_actions(user_id, status, created_at desc);

create index if not exists ai_app_actions_user_source_turn_idx
  on public.ai_app_actions(user_id, source_turn_id)
  where source_turn_id is not null;

alter table public.ai_app_actions enable row level security;

drop policy if exists "Users can update own app actions" on public.ai_app_actions;
create policy "Users can update own app actions"
  on public.ai_app_actions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Supabase Data API grants are separate from RLS. Keep this ledger private from
-- anonymous callers while allowing signed-in users to manage only their own
-- rows through RLS and allowing trusted server code to persist proposals.
grant select, insert, update on table public.ai_app_actions to authenticated;
grant select, insert, update, delete on table public.ai_app_actions to service_role;
revoke all on table public.ai_app_actions from anon;
