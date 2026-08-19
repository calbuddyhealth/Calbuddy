-- ARI XP activity logging expansion.
-- Keeps activity_logs as the single manual/Ari activity ledger.

alter table public.activity_logs
  add column if not exists sets integer,
  add column if not exists reps_per_set integer,
  add column if not exists total_reps integer,
  add column if not exists intensity text,
  add column if not exists average_heart_rate integer,
  add column if not exists calorie_source text,
  add column if not exists estimation_method text,
  add column if not exists source text,
  add column if not exists notes text;

create index if not exists activity_logs_user_log_date_idx
  on public.activity_logs (user_id, log_date desc);

-- Existing ownership RLS remains authoritative. These checks only constrain
-- the newly structured optional fields and do not broaden access.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_sets_range'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_sets_range
      check (sets is null or sets between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_reps_range'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_reps_range
      check (reps_per_set is null or reps_per_set between 1 and 10000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_total_reps_range'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_total_reps_range
      check (total_reps is null or total_reps between 1 and 1000000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_average_hr_range'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_average_hr_range
      check (average_heart_rate is null or average_heart_rate between 30 and 240);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_intensity_values'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_intensity_values
      check (intensity is null or intensity in ('very_light','light','moderate','vigorous','near_maximal','maximal'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'activity_logs_calorie_source_values'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_calorie_source_values
      check (calorie_source is null or calorie_source in ('user_reported','profile_estimate','legacy'));
  end if;
end $$;
