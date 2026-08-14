-- ARI XP daily-boundary alignment
-- Nutrition, Goals, and Training all use the local calendar day.

alter table public.profiles
  alter column reset_hour set default 12,
  alter column reset_minute set default 0,
  alter column reset_ampm set default 'AM';

update public.profiles
set
  reset_hour = 12,
  reset_minute = 0,
  reset_ampm = 'AM',
  updated_at = now()
where
  reset_hour is distinct from 12
  or reset_minute is distinct from 0
  or upper(coalesce(reset_ampm, '')) is distinct from 'AM';
