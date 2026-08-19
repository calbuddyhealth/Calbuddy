-- Keep completed activity out of the nutrition meal ledger.
-- Legacy activity-shaped meal rows are moved to activity_logs, then future
-- stale clients are redirected at the database boundary.

insert into public.activity_logs (
  user_id,
  activity_name,
  calories_burned,
  duration_minutes,
  calorie_source,
  estimation_method,
  source,
  notes,
  log_date,
  created_at
)
select
  m.user_id,
  coalesce(nullif(trim(m.name), ''), 'Activity'),
  coalesce(m.calories, 0),
  case
    when coalesce(m.serving_size, '') ~ '[0-9]'
      then nullif(regexp_replace(m.serving_size, '[^0-9.]', '', 'g'), '')::numeric
    else null
  end,
  'legacy',
  'legacy_meal_migration',
  'legacy_meal_migration',
  'Migrated from meals because the record was categorized as activity.',
  coalesce(m.nutrition_date, m.created_at::date, current_date),
  coalesce(m.created_at, now())
from public.meals m
where lower(trim(coalesce(m.category, ''))) in ('exercise', 'activity', 'workout', 'training')
  and not exists (
    select 1
    from public.activity_logs a
    where a.user_id = m.user_id
      and a.created_at = m.created_at
      and lower(trim(coalesce(a.activity_name, ''))) = lower(trim(coalesce(m.name, '')))
      and coalesce(a.calories_burned, 0) = coalesce(m.calories, 0)
  );

delete from public.meals
where lower(trim(coalesce(category, ''))) in ('exercise', 'activity', 'workout', 'training');

create or replace function public.redirect_activity_shaped_meal()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if lower(trim(coalesce(new.category, ''))) in ('exercise', 'activity', 'workout', 'training') then
    insert into public.activity_logs (
      user_id,
      activity_name,
      calories_burned,
      duration_minutes,
      calorie_source,
      estimation_method,
      source,
      notes,
      log_date,
      created_at
    ) values (
      new.user_id,
      coalesce(nullif(trim(new.name), ''), 'Activity'),
      coalesce(new.calories, 0),
      case
        when coalesce(new.serving_size, '') ~ '[0-9]'
          then nullif(regexp_replace(new.serving_size, '[^0-9.]', '', 'g'), '')::numeric
        else null
      end,
      'legacy',
      'legacy_meal_redirect',
      'legacy_meal_redirect',
      'Redirected from meals because the record was categorized as activity.',
      coalesce(new.nutrition_date, new.created_at::date, current_date),
      coalesce(new.created_at, now())
    );

    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists meals_redirect_activity_shaped_rows on public.meals;
create trigger meals_redirect_activity_shaped_rows
before insert on public.meals
for each row
execute function public.redirect_activity_shaped_meal();
