-- ARI XP Nutrition Resolution Engine correction consistency
--
-- A resolved meal can later be manually corrected through the existing trusted
-- reference-mutation RPC. Aggregate nutrition edits must never leave the old
-- component breakdown looking current. Preserve the evidence for audit/Undo,
-- but hide it from normal authenticated reads until the correction is undone.

alter table public.nutrition_meal_components
  add column if not exists invalidated_at timestamptz null,
  add column if not exists invalidated_by_mutation_id uuid null;

alter table public.nutrition_resolution_events
  add column if not exists invalidated_at timestamptz null,
  add column if not exists invalidated_by_mutation_id uuid null,
  add column if not exists invalidation_reason text null;

create index if not exists nutrition_meal_components_current_idx
  on public.nutrition_meal_components(user_id, meal_id, position)
  where invalidated_at is null;

create index if not exists nutrition_resolution_events_current_idx
  on public.nutrition_resolution_events(user_id, meal_id, created_at desc)
  where invalidated_at is null;

-- Authenticated app reads see only evidence that still describes the current
-- canonical meal. Security-definer mutation/Undo functions can retain and
-- restore historical rows without exposing stale provenance to the client.
drop policy if exists nutrition_meal_components_select_own on public.nutrition_meal_components;
create policy nutrition_meal_components_select_own
  on public.nutrition_meal_components
  for select
  to authenticated
  using (auth.uid() = user_id and invalidated_at is null);

drop policy if exists nutrition_resolution_events_select_own on public.nutrition_resolution_events;
create policy nutrition_resolution_events_select_own
  on public.nutrition_resolution_events
  for select
  to authenticated
  using (auth.uid() = user_id and invalidated_at is null);

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
  v_resolution_material_change boolean := false;
  v_components_invalidated integer := 0;
  v_resolution_events_invalidated integer := 0;
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
  v_resolution_material_change := p_changes ?| array[
    'calories',
    'protein_g',
    'carbs_g',
    'fat_g',
    'serving_size',
    'multiplier'
  ];

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

  if v_resolution_material_change then
    update public.nutrition_meal_components
    set invalidated_at = now(),
        invalidated_by_mutation_id = p_mutation_id
    where meal_id = p_meal_id
      and user_id = v_user
      and invalidated_at is null;
    get diagnostics v_components_invalidated = row_count;

    update public.nutrition_resolution_events
    set invalidated_at = now(),
        invalidated_by_mutation_id = p_mutation_id,
        invalidation_reason = 'meal_nutrition_manually_corrected'
    where meal_id = p_meal_id
      and user_id = v_user
      and invalidated_at is null;
    get diagnostics v_resolution_events_invalidated = row_count;
  end if;

  select coalesce(sum(calories), 0)
  into v_total
  from public.meals
  where user_id = v_user
    and nutrition_date = v_meal.nutrition_date;

  v_before := v_before || jsonb_build_object(
    'previousMutationId', v_previous_mutation_id,
    'resolutionMaterialChange', v_resolution_material_change,
    'componentsInvalidated', v_components_invalidated,
    'resolutionEventsInvalidated', v_resolution_events_invalidated
  );

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
    'idempotent', false,
    'resolutionMaterialChange', v_resolution_material_change,
    'resolutionInvalidated', (v_components_invalidated > 0 or v_resolution_events_invalidated > 0),
    'componentsInvalidated', v_components_invalidated,
    'resolutionEventsInvalidated', v_resolution_events_invalidated
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
    v_before,
    v_after,
    'applied'
  );

  return v_after;
end;
$$;

-- Existing ari_undo_nutrition_mutation changes the mutation status from applied
-- to undone after restoring the aggregate meal. This trigger restores only the
-- evidence invalidated by that exact correction. A later still-applied material
-- correction keeps the old evidence invalidated.
create or replace function public.ari_restore_nutrition_resolution_after_undo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meal_id uuid;
  v_has_later_material_correction boolean := false;
begin
  if old.status = 'applied'
     and new.status = 'undone'
     and new.action_type = 'update_meal' then
    v_meal_id := nullif(new.after_state->>'mealId', '')::uuid;

    if v_meal_id is not null then
      select exists (
        select 1
        from public.ari_nutrition_mutations later
        where later.user_id = new.user_id
          and later.action_type = 'update_meal'
          and later.status = 'applied'
          and later.id <> new.id
          and nullif(later.after_state->>'mealId', '')::uuid = v_meal_id
          and coalesce((later.after_state->>'resolutionMaterialChange')::boolean, false) = true
          and later.created_at >= new.created_at
      ) into v_has_later_material_correction;

      if not v_has_later_material_correction then
        update public.nutrition_meal_components
        set invalidated_at = null,
            invalidated_by_mutation_id = null
        where meal_id = v_meal_id
          and user_id = new.user_id
          and invalidated_by_mutation_id = new.id;

        update public.nutrition_resolution_events
        set invalidated_at = null,
            invalidated_by_mutation_id = null,
            invalidation_reason = null
        where meal_id = v_meal_id
          and user_id = new.user_id
          and invalidated_by_mutation_id = new.id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ari_restore_nutrition_resolution_after_undo
  on public.ari_nutrition_mutations;
create trigger ari_restore_nutrition_resolution_after_undo
  after update of status on public.ari_nutrition_mutations
  for each row
  execute function public.ari_restore_nutrition_resolution_after_undo();

revoke all on function public.ari_update_nutrition_meal(uuid, uuid, jsonb) from public, anon;
grant execute on function public.ari_update_nutrition_meal(uuid, uuid, jsonb) to authenticated;

revoke all on function public.ari_restore_nutrition_resolution_after_undo() from public, anon, authenticated;