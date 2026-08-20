-- ARI XP Nutrition Trust Layer P0
-- Atomic planned-meal consumption, idempotency, verified totals, and undo.

create table if not exists public.ari_nutrition_mutations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  target_plan_id uuid null references public.nutrition_plan_items(id) on delete set null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  status text not null default 'applied' check (status in ('applied', 'undone')),
  created_at timestamptz not null default now(),
  undone_at timestamptz null
);

create index if not exists ari_nutrition_mutations_user_created_idx
  on public.ari_nutrition_mutations(user_id, created_at desc);

alter table public.ari_nutrition_mutations enable row level security;

drop policy if exists ari_nutrition_mutations_select_own on public.ari_nutrition_mutations;
create policy ari_nutrition_mutations_select_own
  on public.ari_nutrition_mutations
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.ari_nutrition_mutations to authenticated;

create or replace function public.ari_consume_nutrition_plan(
  p_plan_id uuid,
  p_mutation_id uuid,
  p_consumed jsonb,
  p_remaining jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.nutrition_plan_items%rowtype;
  v_existing public.ari_nutrition_mutations%rowtype;
  v_meal_id uuid;
  v_name text;
  v_calories numeric;
  v_protein numeric;
  v_carbs numeric;
  v_fat numeric;
  v_remaining_calories numeric;
  v_remaining_items jsonb;
  v_remaining_name text;
  v_total numeric;
  v_plan_status text;
  v_after jsonb;
begin
  if v_user is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  if p_plan_id is null or p_mutation_id is null then
    raise exception 'Plan ID and mutation ID are required.' using errcode = '22023';
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

  select * into v_plan
  from public.nutrition_plan_items
  where id = p_plan_id
    and user_id = v_user
  for update;

  if not found then
    raise exception 'That meal plan could not be found.' using errcode = 'P0002';
  end if;

  if v_plan.status <> 'planned' then
    raise exception 'That meal plan is no longer available to log.' using errcode = 'P0001';
  end if;

  v_name := nullif(trim(coalesce(p_consumed->>'name', '')), '');
  v_calories := coalesce((p_consumed->>'calories')::numeric, 0);
  v_protein := greatest(0, coalesce((p_consumed->>'protein_g')::numeric, 0));
  v_carbs := greatest(0, coalesce((p_consumed->>'carbs_g')::numeric, 0));
  v_fat := greatest(0, coalesce((p_consumed->>'fat_g')::numeric, 0));

  if v_name is null then
    raise exception 'Consumed meal name is required.' using errcode = '22023';
  end if;

  if v_calories <= 0 or v_calories > 10000 then
    raise exception 'Consumed calories are outside the supported range.' using errcode = '22023';
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
    coalesce(nullif(trim(p_consumed->>'category'), ''), initcap(v_plan.meal_slot), 'Meal'),
    v_plan.plan_date,
    v_protein,
    v_carbs,
    v_fat,
    coalesce(nullif(trim(p_consumed->>'serving_size'), ''), 'From today''s meal plan'),
    1,
    false,
    now()
  )
  returning id into v_meal_id;

  v_remaining_items := case
    when jsonb_typeof(p_remaining->'items') = 'array' then p_remaining->'items'
    else '[]'::jsonb
  end;
  v_remaining_calories := greatest(0, coalesce((p_remaining->>'calories')::numeric, 0));

  if p_remaining is null
     or jsonb_array_length(v_remaining_items) = 0
     or v_remaining_calories <= 0 then
    update public.nutrition_plan_items
    set status = 'eaten',
        consumed_meal_id = v_meal_id::text,
        updated_at = now()
    where id = v_plan.id
      and user_id = v_user;

    v_plan_status := 'eaten';
  else
    v_remaining_name := nullif(trim(coalesce(p_remaining->>'name', '')), '');
    if v_remaining_name is null then
      v_remaining_name := 'Remaining ' || lower(initcap(v_plan.meal_slot)) || ' items';
    end if;

    update public.nutrition_plan_items
    set name = v_remaining_name,
        calories = round(v_remaining_calories),
        protein_g = greatest(0, coalesce((p_remaining->>'protein_g')::numeric, 0)),
        carbs_g = greatest(0, coalesce((p_remaining->>'carbs_g')::numeric, 0)),
        fat_g = greatest(0, coalesce((p_remaining->>'fat_g')::numeric, 0)),
        serving_size = 'Remaining planned items',
        items = v_remaining_items,
        notes = case
          when trim(coalesce(v_plan.notes, '')) = '' then 'Partially eaten'
          when position('Partially eaten' in v_plan.notes) > 0 then v_plan.notes
          else v_plan.notes || ' | Partially eaten'
        end,
        status = 'planned',
        consumed_meal_id = null,
        updated_at = now()
    where id = v_plan.id
      and user_id = v_user;

    v_plan_status := 'planned';
  end if;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and nutrition_date = v_plan.plan_date;

  v_after := jsonb_build_object(
    'success', true,
    'mutationId', p_mutation_id,
    'mealId', v_meal_id,
    'planId', v_plan.id,
    'planStatus', v_plan_status,
    'todayCalories', round(v_total),
    'remainingCalories', case when v_plan_status = 'planned' then round(v_remaining_calories) else 0 end,
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
    'consume_plan',
    v_plan.id,
    to_jsonb(v_plan),
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
  v_plan_date date;
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

  if v_mutation.action_type <> 'consume_plan' then
    raise exception 'That nutrition change cannot be undone by this function.' using errcode = 'P0001';
  end if;

  v_before := v_mutation.before_state;
  v_meal_id := nullif(v_mutation.after_state->>'mealId', '')::uuid;
  v_plan_date := nullif(v_before->>'plan_date', '')::date;

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

  update public.ari_nutrition_mutations
  set status = 'undone',
      undone_at = now()
  where id = p_mutation_id
    and user_id = v_user;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and (v_plan_date is null or nutrition_date = v_plan_date);

  return jsonb_build_object(
    'success', true,
    'mutationId', p_mutation_id,
    'status', 'undone',
    'todayCalories', round(v_total),
    'undoAvailable', false,
    'idempotent', false
  );
end;
$$;

revoke all on function public.ari_consume_nutrition_plan(uuid, uuid, jsonb, jsonb) from public, anon;
revoke all on function public.ari_undo_nutrition_mutation(uuid) from public, anon;
grant execute on function public.ari_consume_nutrition_plan(uuid, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.ari_undo_nutrition_mutation(uuid) to authenticated;
