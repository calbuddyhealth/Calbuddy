-- ARI XP Nutrition reference mutation completion
-- Adds journaled meal edits and extends Undo so an edit can be reversed
-- without deleting the original meal.

create or replace function public.ari_update_nutrition_meal(
  p_mutation_id uuid,
  p_meal_id uuid,
  p_changes jsonb
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
  v_before jsonb;
  v_after jsonb;
  v_total numeric;
  v_previous_mutation_id uuid;
begin
  if v_user is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  if p_mutation_id is null or p_meal_id is null then
    raise exception 'Mutation ID and meal ID are required.' using errcode = '22023';
  end if;

  if p_changes is null or jsonb_typeof(p_changes) <> 'object' or p_changes = '{}'::jsonb then
    raise exception 'At least one meal change is required.' using errcode = '22023';
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

  select * into v_meal
  from public.meals
  where id = p_meal_id
    and user_id = v_user
  for update;

  if not found then
    raise exception 'That meal could not be found.' using errcode = 'P0002';
  end if;

  v_before := to_jsonb(v_meal);

  select id into v_previous_mutation_id
  from public.ari_nutrition_mutations
  where user_id = v_user
    and status = 'applied'
    and nullif(after_state->>'mealId', '')::uuid = p_meal_id
  order by created_at desc
  limit 1;

  update public.meals
  set name = case
        when p_changes ? 'name' then nullif(trim(p_changes->>'name'), '')
        else name
      end,
      calories = case
        when p_changes ? 'calories' then round((p_changes->>'calories')::numeric)
        else calories
      end,
      category = case
        when p_changes ? 'category' then coalesce(nullif(trim(p_changes->>'category'), ''), category)
        else category
      end,
      protein_g = case
        when p_changes ? 'protein_g' then greatest(0, (p_changes->>'protein_g')::numeric)
        else protein_g
      end,
      carbs_g = case
        when p_changes ? 'carbs_g' then greatest(0, (p_changes->>'carbs_g')::numeric)
        else carbs_g
      end,
      fat_g = case
        when p_changes ? 'fat_g' then greatest(0, (p_changes->>'fat_g')::numeric)
        else fat_g
      end,
      serving_size = case
        when p_changes ? 'serving_size' then coalesce(nullif(trim(p_changes->>'serving_size'), ''), serving_size)
        else serving_size
      end,
      multiplier = case
        when p_changes ? 'multiplier' then (p_changes->>'multiplier')::numeric
        else multiplier
      end
  where id = p_meal_id
    and user_id = v_user
  returning * into v_meal;

  if nullif(trim(v_meal.name), '') is null then
    raise exception 'Meal name is required.' using errcode = '22023';
  end if;

  if v_meal.calories <= 0 or v_meal.calories > 10000 then
    raise exception 'Meal calories are outside the supported range.' using errcode = '22023';
  end if;

  if coalesce(v_meal.multiplier, 0) <= 0 or v_meal.multiplier > 100 then
    raise exception 'Meal serving multiplier is outside the supported range.' using errcode = '22023';
  end if;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and nutrition_date = v_meal.nutrition_date;

  v_after := jsonb_build_object(
    'success', true,
    'actionType', 'update_meal',
    'mutationId', p_mutation_id,
    'previousMutationId', v_previous_mutation_id,
    'mealId', v_meal.id,
    'meal', to_jsonb(v_meal),
    'nutritionDate', v_meal.nutrition_date,
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
    'update_meal',
    null,
    v_before || jsonb_build_object('previousMutationId', v_previous_mutation_id),
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
  v_meal public.meals%rowtype;
  v_meal_id uuid;
  v_nutrition_date date;
  v_total numeric;
  v_previous_mutation_id uuid;
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
      'actionType', v_mutation.action_type,
      'status', 'undone',
      'idempotent', true,
      'undoAvailable', false
    );
  end if;

  v_meal_id := nullif(v_mutation.after_state->>'mealId', '')::uuid;
  v_nutrition_date := coalesce(
    nullif(v_mutation.after_state->>'nutritionDate', '')::date,
    nullif(v_mutation.before_state->>'nutrition_date', '')::date,
    nullif(v_mutation.before_state->>'plan_date', '')::date,
    current_date
  );
  v_previous_mutation_id := nullif(v_mutation.before_state->>'previousMutationId', '')::uuid;

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

  elsif v_mutation.action_type = 'update_meal' then
    v_before := v_mutation.before_state;

    update public.meals
    set name = coalesce(nullif(v_before->>'name', ''), name),
        calories = coalesce((v_before->>'calories')::numeric, calories),
        category = coalesce(nullif(v_before->>'category', ''), category),
        nutrition_date = coalesce(nullif(v_before->>'nutrition_date', '')::date, nutrition_date),
        protein_g = coalesce((v_before->>'protein_g')::numeric, protein_g),
        carbs_g = coalesce((v_before->>'carbs_g')::numeric, carbs_g),
        fat_g = coalesce((v_before->>'fat_g')::numeric, fat_g),
        serving_size = coalesce(nullif(v_before->>'serving_size', ''), serving_size),
        multiplier = coalesce((v_before->>'multiplier')::numeric, multiplier),
        is_favorite = coalesce((v_before->>'is_favorite')::boolean, is_favorite),
        created_at = coalesce(nullif(v_before->>'created_at', '')::timestamptz, created_at)
    where id = v_meal_id
      and user_id = v_user
    returning * into v_meal;

    if not found then
      raise exception 'That meal is no longer available to restore.' using errcode = 'P0002';
    end if;

    v_nutrition_date := v_meal.nutrition_date;
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
    'actionType', v_mutation.action_type,
    'previousMutationId', v_previous_mutation_id,
    'mealId', case when v_mutation.action_type = 'update_meal' then v_meal.id else v_meal_id end,
    'meal', case when v_mutation.action_type = 'update_meal' then to_jsonb(v_meal) else null end,
    'status', 'undone',
    'nutritionDate', v_nutrition_date,
    'todayCalories', round(v_total),
    'undoAvailable', false,
    'idempotent', false
  );
end;
$$;

revoke all on function public.ari_update_nutrition_meal(uuid, uuid, jsonb) from public, anon;
grant execute on function public.ari_update_nutrition_meal(uuid, uuid, jsonb) to authenticated;

revoke all on function public.ari_undo_nutrition_mutation(uuid) from public, anon;
grant execute on function public.ari_undo_nutrition_mutation(uuid) to authenticated;
