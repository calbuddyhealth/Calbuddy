-- ARI XP
-- New users must never receive template/developer health values.
-- Keep account bootstrap rows minimal until users enter their own health data.

alter table public.profiles
  alter column goal drop default,
  alter column daily_calorie_goal drop default;

-- Clean only profiles that contain no user-entered health baseline and still
-- carry the two historical schema defaults. Configured profiles are untouched.
update public.profiles
set
  goal = null,
  daily_calorie_goal = null,
  updated_at = now()
where
  age is null
  and sex is null
  and weight_lbs is null
  and height_in is null
  and activity_level is null
  and target_weight_lbs is null
  and weekly_weight_change_goal is null
  and goal = 'Maintain Weight'
  and daily_calorie_goal = 2100;
