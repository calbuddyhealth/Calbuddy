-- ARI XP Nutrition Trust Layer P0 expansion
-- Route ordinary meal logging through the same mutation journal.

create or replace function public.ari_log_nutrition_meal(
  p_mutation_id uuid,
  p_meal jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.ari_nutrition_mutations%rowtype;
  v_meal public.meals%rowtype;
  v_name text;
  v_calories numeric;
  v_nutrition_date date;
  v_created_at timestamptz;
  v_total numeric;
  v_after jsonb;
begin
  if v_user is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  if p_mutation_id is null then
    raise exception 'Mutation ID is required.' using errcode = '22023';
  end if;

  select * into v_existing
  from public.ari_nutrition_mutations
  where id = p_mutation_id
    and user_id = v_user;

  if found then
    return coalesce(v_existing.after_state, '{}'::jsonb)
      || jsonb_build_object(
        'mutationId', p_mutation_id,
        'idempotent', true,
        'status', v_existing.status
      );
  end if;

  v_name := nullif(trim(coalesce(p_meal->>'name', '')), '');
  v_calories := coalesce((p_meal->>'calories')::numeric, 0);
  v_nutrition_date := coalesce(
    nullif(p_meal->>'nutrition_date', '')::date,
    current_date
  );

  begin
    v_created_at := nullif(p_meal->>'created_at', '')::timestamptz;
  exception when others then
    v_created_at := null;
  end;
  v_created_at := coalesce(v_created_at, now());

  if v_name is null then
    raise exception 'Meal name is required.' using errcode = '22023';
  end if;

  if v_calories <= 0 or v_calories > 10000 then
    raise exception 'Meal calories are outside the supported range.' using errcode = '22023';
  end if;

  insert into public.meals (
    user_id,
    name,
    calories,
    category,
    nutrition_date,
    protein_g,
    carbs_g,
    fat_g,
    serving_size,
    multiplier,
    is_favorite,
    created_at
  ) values (
    v_user,
    v_name,
    round(v_calories),
    coalesce(nullif(trim(p_meal->>'category'), ''), 'Meal'),
    v_nutrition_date,
    greatest(0, coalesce((p_meal->>'protein_g')::numeric, 0)),
    greatest(0, coalesce((p_meal->>'carbs_g')::numeric, 0)),
    greatest(0, coalesce((p_meal->>'fat_g')::numeric, 0)),
    coalesce(nullif(trim(p_meal->>'serving_size'), ''), 'Added in ARI XP'),
    greatest(0.01, coalesce((p_meal->>'multiplier')::numeric, 1)),
    coalesce((p_meal->>'is_favorite')::boolean, false),
    v_created_at
  )
  returning * into v_meal;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and nutrition_date = v_nutrition_date;

  v_after := jsonb_build_object(
    'success', true,
    'mutationId', p_mutation_id,
    'mealId', v_meal.id,
    'meal', to_jsonb(v_meal),
    'nutritionDate', v_nutrition_date,
    'todayCalories', round(v_total),
    'undoAvailable', true,
    'idempotent', false
  );

  insert into public.ari_nutrition_mutations (
    id,
    user_id,
    action_type,
    target_plan_id,
    before_state,
    after_state,
    status
  ) values (
    p_mutation_id,
    v_user,
    'log_meal',
    null,
    '{}'::jsonb,
    v_after,
    'applied'
  );

  return v_after;
end;
$$;

create or replace function public.ari_undo_nutrition_mutation(
  p_mutation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_mutation public.ari_nutrition_mutations%rowtype;
  v_before jsonb;
  v_meal_id uuid;
  v_nutrition_date date;
  v_total numeric;
begin
  if v_user is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  select * into v_mutation
  from public.ari_nutrition_mutations
  where id = p_mutation_id
    and user_id = v_user
  for update;

  if not found then
    raise exception 'That nutrition change could not be found.' using errcode = 'P0002';
  end if;

  if v_mutation.status = 'undone' then
    return jsonb_build_object(
      'success', true,
      'mutationId', p_mutation_id,
      'status', 'undone',
      'idempotent', true,
      'undoAvailable', false
    );
  end if;

  v_meal_id := nullif(v_mutation.after_state->>'mealId', '')::uuid;
  v_nutrition_date := coalesce(
    nullif(v_mutation.after_state->>'nutritionDate', '')::date,
    nullif(v_mutation.before_state->>'plan_date', '')::date,
    current_date
  );

  if v_mutation.action_type = 'consume_plan' then
    v_before := v_mutation.before_state;

    if v_meal_id is not null then
      delete from public.meals
      where id = v_meal_id
        and user_id = v_user;
    end if;

    update public.nutrition_plan_items
    set plan_date = coalesce(nullif(v_before->>'plan_date', '')::date, plan_date),
        meal_slot = coalesce(nullif(v_before->>'meal_slot', ''), meal_slot),
        name = coalesce(nullif(v_before->>'name', ''), name),
        calories = coalesce((v_before->>'calories')::numeric, calories),
        protein_g = coalesce((v_before->>'protein_g')::numeric, protein_g),
        carbs_g = coalesce((v_before->>'carbs_g')::numeric, carbs_g),
        fat_g = coalesce((v_before->>'fat_g')::numeric, fat_g),
        serving_size = coalesce(nullif(v_before->>'serving_size', ''), serving_size),
        multiplier = coalesce((v_before->>'multiplier')::numeric, multiplier),
        source_type = coalesce(nullif(v_before->>'source_type', ''), source_type),
        source_ref = nullif(v_before->>'source_ref', ''),
        recipe_id = nullif(v_before->>'recipe_id', '')::uuid,
        items = coalesce(v_before->'items', items),
        notes = coalesce(v_before->>'notes', ''),
        status = coalesce(nullif(v_before->>'status', ''), 'planned'),
        consumed_meal_id = nullif(v_before->>'consumed_meal_id', ''),
        position = coalesce((v_before->>'position')::integer, position),
        updated_at = now()
    where id = v_mutation.target_plan_id
      and user_id = v_user;

  elsif v_mutation.action_type = 'log_meal' then
    if v_meal_id is not null then
      delete from public.meals
      where id = v_meal_id
        and user_id = v_user;
    end if;
  else
    raise exception 'That nutrition change cannot be undone by this function.' using errcode = 'P0001';
  end if;

  update public.ari_nutrition_mutations
  set status = 'undone',
      undone_at = now()
  where id = p_mutation_id
    and user_id = v_user;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and nutrition_date = v_nutrition_date;

  return jsonb_build_object(
    'success', true,
    'mutationId', p_mutation_id,
    'status', 'undone',
    'nutritionDate', v_nutrition_date,
    'todayCalories', round(v_total),
    'undoAvailable', false,
    'idempotent', false
  );
end;
$$;

revoke all on function public.ari_log_nutrition_meal(uuid, jsonb) from public, anon;
grant execute on function public.ari_log_nutrition_meal(uuid, jsonb) to authenticated;
