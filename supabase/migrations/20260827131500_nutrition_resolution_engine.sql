-- ARI XP Nutrition Resolution Engine
-- Evidence-aware meal components, resolution provenance, personal food mappings,
-- and one atomic resolved-meal transaction compatible with existing Nutrition Undo.

create table if not exists public.nutrition_meal_components (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null check (position between 1 and 16),
  user_phrase text null,
  normalized_phrase text null,
  name text not null,
  food_id text null,
  quantity numeric null check (quantity is null or quantity > 0),
  unit text null,
  serving_label text null,
  grams numeric null check (grams is null or grams >= 0),
  milliliters numeric null check (milliliters is null or milliliters >= 0),
  calories numeric not null check (calories >= 0 and calories <= 10000),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  alcohol_g numeric not null default 0 check (alcohol_g >= 0),
  source_type text not null,
  source_id text null,
  source_label text null,
  nutrition_basis jsonb not null default '{}'::jsonb,
  identity_confidence numeric not null default 0 check (identity_confidence between 0 and 1),
  nutrition_confidence numeric not null default 0 check (nutrition_confidence between 0 and 1),
  portion_confidence numeric not null default 0 check (portion_confidence between 0 and 1),
  estimated boolean not null default false,
  estimate_low numeric null check (estimate_low is null or estimate_low >= 0),
  estimate_high numeric null check (estimate_high is null or estimate_high >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (meal_id, position)
);

create index if not exists nutrition_meal_components_user_meal_idx
  on public.nutrition_meal_components(user_id, meal_id, position);
create index if not exists nutrition_meal_components_phrase_idx
  on public.nutrition_meal_components(user_id, normalized_phrase)
  where normalized_phrase is not null;

alter table public.nutrition_meal_components enable row level security;
drop policy if exists nutrition_meal_components_select_own on public.nutrition_meal_components;
create policy nutrition_meal_components_select_own
  on public.nutrition_meal_components
  for select
  to authenticated
  using (auth.uid() = user_id);
grant select on public.nutrition_meal_components to authenticated;

create table if not exists public.nutrition_resolution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  mutation_id uuid not null,
  resolution_method text not null,
  estimated boolean not null default false,
  minimum_nutrition_confidence numeric null check (minimum_nutrition_confidence is null or minimum_nutrition_confidence between 0 and 1),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_resolution_events_user_created_idx
  on public.nutrition_resolution_events(user_id, created_at desc);
create index if not exists nutrition_resolution_events_mutation_idx
  on public.nutrition_resolution_events(mutation_id);

alter table public.nutrition_resolution_events enable row level security;
drop policy if exists nutrition_resolution_events_select_own on public.nutrition_resolution_events;
create policy nutrition_resolution_events_select_own
  on public.nutrition_resolution_events
  for select
  to authenticated
  using (auth.uid() = user_id);
grant select on public.nutrition_resolution_events to authenticated;

create table if not exists public.ari_user_food_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_phrase text not null,
  canonical_food_id text not null,
  food_display_name text not null,
  quantity numeric null check (quantity is null or quantity > 0),
  unit text null,
  measurement_state text null,
  confidence numeric not null default 0.9 check (confidence between 0 and 1),
  observation_count integer not null default 1 check (observation_count >= 1),
  last_confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_phrase)
);

create index if not exists ari_user_food_mappings_user_confirmed_idx
  on public.ari_user_food_mappings(user_id, last_confirmed_at desc);

alter table public.ari_user_food_mappings enable row level security;
drop policy if exists ari_user_food_mappings_select_own on public.ari_user_food_mappings;
create policy ari_user_food_mappings_select_own
  on public.ari_user_food_mappings
  for select
  to authenticated
  using (auth.uid() = user_id);
grant select on public.ari_user_food_mappings to authenticated;

create or replace function public.ari_log_resolved_nutrition_meal(
  p_mutation_id uuid,
  p_meal jsonb,
  p_components jsonb,
  p_resolution jsonb
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
  v_component jsonb;
  v_position integer := 0;
  v_component_name text;
  v_component_calories numeric;
  v_identity_confidence numeric;
  v_nutrition_confidence numeric;
  v_portion_confidence numeric;
  v_estimated boolean;
  v_phrase text;
  v_food_id text;
  v_food_display_name text;
  v_quantity numeric;
  v_unit text;
  v_measurement_state text;
  v_mapping_confidence numeric;
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

  if p_meal is null or jsonb_typeof(p_meal) <> 'object' then
    raise exception 'Resolved meal payload is required.' using errcode = '22023';
  end if;
  if p_components is null or jsonb_typeof(p_components) <> 'array' then
    raise exception 'Resolved meal components are required.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_components) < 1 or jsonb_array_length(p_components) > 16 then
    raise exception 'Resolved meals require between 1 and 16 components.' using errcode = '22023';
  end if;

  v_name := nullif(trim(coalesce(p_meal->>'name', '')), '');
  v_calories := coalesce((p_meal->>'calories')::numeric, 0);
  v_nutrition_date := coalesce(nullif(p_meal->>'nutrition_date', '')::date, current_date);

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

  -- Validate every component before writing the meal so one malformed item
  -- cannot leave a partially resolved log.
  for v_component in select value from jsonb_array_elements(p_components)
  loop
    if jsonb_typeof(v_component) <> 'object' then
      raise exception 'Every resolved component must be an object.' using errcode = '22023';
    end if;

    v_component_name := nullif(trim(coalesce(v_component->>'name', '')), '');
    v_component_calories := coalesce((v_component->>'calories')::numeric, -1);
    v_identity_confidence := coalesce((v_component->>'identity_confidence')::numeric, 0);
    v_nutrition_confidence := coalesce((v_component->>'nutrition_confidence')::numeric, 0);
    v_portion_confidence := coalesce((v_component->>'portion_confidence')::numeric, 0);

    if v_component_name is null then
      raise exception 'Every resolved component needs a name.' using errcode = '22023';
    end if;
    if v_component_calories < 0 or v_component_calories > 10000 then
      raise exception 'Resolved component calories are outside the supported range.' using errcode = '22023';
    end if;
    if v_identity_confidence < 0 or v_identity_confidence > 1
       or v_nutrition_confidence < 0 or v_nutrition_confidence > 1
       or v_portion_confidence < 0 or v_portion_confidence > 1 then
      raise exception 'Resolved component confidence is outside the supported range.' using errcode = '22023';
    end if;
  end loop;

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
    coalesce(nullif(trim(p_meal->>'serving_size'), ''), 'Resolved by Ari Nutrition'),
    greatest(0.01, coalesce((p_meal->>'multiplier')::numeric, 1)),
    coalesce((p_meal->>'is_favorite')::boolean, false),
    v_created_at
  )
  returning * into v_meal;

  for v_component in select value from jsonb_array_elements(p_components)
  loop
    v_position := v_position + 1;
    v_component_name := nullif(trim(coalesce(v_component->>'name', '')), '');
    v_component_calories := coalesce((v_component->>'calories')::numeric, 0);
    v_identity_confidence := coalesce((v_component->>'identity_confidence')::numeric, 0);
    v_nutrition_confidence := coalesce((v_component->>'nutrition_confidence')::numeric, 0);
    v_portion_confidence := coalesce((v_component->>'portion_confidence')::numeric, 0);
    v_estimated := coalesce((v_component->>'estimated')::boolean, false);

    insert into public.nutrition_meal_components (
      meal_id, user_id, position, user_phrase, normalized_phrase, name, food_id,
      quantity, unit, serving_label, grams, milliliters, calories, protein_g,
      carbs_g, fat_g, alcohol_g, source_type, source_id, source_label,
      nutrition_basis, identity_confidence, nutrition_confidence,
      portion_confidence, estimated, estimate_low, estimate_high, metadata
    ) values (
      v_meal.id,
      v_user,
      v_position,
      nullif(trim(coalesce(v_component->>'user_phrase', '')), ''),
      nullif(trim(lower(coalesce(v_component->>'normalized_phrase', ''))), ''),
      v_component_name,
      nullif(trim(coalesce(v_component->>'food_id', '')), ''),
      nullif(v_component->>'quantity', '')::numeric,
      nullif(trim(coalesce(v_component->>'unit', '')), ''),
      nullif(trim(coalesce(v_component->>'serving_label', '')), ''),
      nullif(v_component->>'grams', '')::numeric,
      nullif(v_component->>'milliliters', '')::numeric,
      v_component_calories,
      greatest(0, coalesce((v_component->>'protein_g')::numeric, 0)),
      greatest(0, coalesce((v_component->>'carbs_g')::numeric, 0)),
      greatest(0, coalesce((v_component->>'fat_g')::numeric, 0)),
      greatest(0, coalesce((v_component->>'alcohol_g')::numeric, 0)),
      coalesce(nullif(trim(v_component->>'source_type'), ''), 'unknown'),
      nullif(trim(coalesce(v_component->>'source_id', '')), ''),
      nullif(trim(coalesce(v_component->>'source_label', '')), ''),
      case when jsonb_typeof(v_component->'nutrition_basis') = 'object' then v_component->'nutrition_basis' else '{}'::jsonb end,
      v_identity_confidence,
      v_nutrition_confidence,
      v_portion_confidence,
      v_estimated,
      nullif(v_component->>'estimate_low', '')::numeric,
      nullif(v_component->>'estimate_high', '')::numeric,
      case when jsonb_typeof(v_component->'metadata') = 'object' then v_component->'metadata' else '{}'::jsonb end
    );

    -- Learn the user's phrase/portion mapping only from confirmed, non-estimated,
    -- high-confidence canonical evidence. Nutrition facts themselves are never
    -- learned from the user; only the phrase -> canonical food/portion mapping is.
    v_phrase := nullif(trim(lower(coalesce(v_component->>'normalized_phrase', ''))), '');
    v_food_id := nullif(trim(coalesce(v_component->>'food_id', '')), '');
    if v_estimated = false
       and v_phrase is not null
       and v_food_id is not null
       and v_identity_confidence >= 0.90
       and v_nutrition_confidence >= 0.90 then
      v_food_display_name := coalesce(v_component_name, v_food_id);
      v_quantity := nullif(v_component->>'quantity', '')::numeric;
      v_unit := nullif(trim(coalesce(v_component->>'unit', '')), '');
      v_measurement_state := nullif(trim(coalesce(v_component->'metadata'->>'state', '')), '');
      v_mapping_confidence := least(0.99, greatest(0.90, least(v_identity_confidence, v_nutrition_confidence)));

      insert into public.ari_user_food_mappings (
        user_id, normalized_phrase, canonical_food_id, food_display_name,
        quantity, unit, measurement_state, confidence, observation_count,
        last_confirmed_at, created_at, updated_at
      ) values (
        v_user, v_phrase, v_food_id, v_food_display_name,
        v_quantity, v_unit, v_measurement_state, v_mapping_confidence, 1,
        now(), now(), now()
      )
      on conflict (user_id, normalized_phrase) do update
      set canonical_food_id = excluded.canonical_food_id,
          food_display_name = excluded.food_display_name,
          quantity = excluded.quantity,
          unit = excluded.unit,
          measurement_state = excluded.measurement_state,
          confidence = excluded.confidence,
          observation_count = case
            when public.ari_user_food_mappings.canonical_food_id = excluded.canonical_food_id
              then public.ari_user_food_mappings.observation_count + 1
            else 1
          end,
          last_confirmed_at = now(),
          updated_at = now();
    end if;
  end loop;

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
    'idempotent', false,
    'resolution', coalesce(p_resolution, '{}'::jsonb)
  );

  insert into public.ari_nutrition_mutations (
    id, user_id, action_type, target_plan_id, before_state, after_state, status
  ) values (
    p_mutation_id,
    v_user,
    'log_meal',
    null,
    '{}'::jsonb,
    v_after,
    'applied'
  );

  insert into public.nutrition_resolution_events (
    user_id, meal_id, mutation_id, resolution_method, estimated,
    minimum_nutrition_confidence, payload
  ) values (
    v_user,
    v_meal.id,
    p_mutation_id,
    coalesce(nullif(trim(p_resolution->>'method'), ''), 'unknown'),
    coalesce((p_resolution->>'estimated')::boolean, false),
    nullif(p_resolution->>'minimum_nutrition_confidence', '')::numeric,
    coalesce(p_resolution, '{}'::jsonb)
  );

  return v_after;
end;
$$;

revoke all on function public.ari_log_resolved_nutrition_meal(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.ari_log_resolved_nutrition_meal(uuid, jsonb, jsonb, jsonb) to authenticated;
