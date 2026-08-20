-- ARI XP Nutrition Trust Layer P0
-- Give every offline-first Meal Plan a stable synchronization identity and
-- prevent stale device snapshots from overwriting newer cloud state.

alter table public.nutrition_plan_items
  add column if not exists client_sync_key text;

create unique index if not exists nutrition_plan_items_user_date_sync_key_uidx
  on public.nutrition_plan_items (user_id, plan_date, client_sync_key)
  where client_sync_key is not null;

create or replace function public.ari_sync_nutrition_plans(
  p_plans jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_id uuid;
  v_requested_id uuid;
  v_local_id text;
  v_sync_key text;
  v_source_ref text;
  v_source_type text;
  v_slot text;
  v_status text;
  v_date date;
  v_client_updated_at timestamptz;
  v_existing_updated_at timestamptz;
  v_mappings jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_accepted integer := 0;
  v_stale integer := 0;
begin
  if v_user is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  if p_plans is null or jsonb_typeof(p_plans) <> 'array' then
    raise exception 'Meal Plans must be supplied as an array.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_plans) > 32 then
    raise exception 'Too many Meal Plan records were supplied.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_plans)
  loop
    v_local_id := nullif(trim(coalesce(v_item->>'localId', '')), '');
    v_sync_key := nullif(trim(coalesce(v_item->>'sync_key', '')), '');
    if v_sync_key is null and v_local_id is not null then
      v_sync_key := 'local:' || left(v_local_id, 180);
    end if;

    v_source_ref := nullif(trim(coalesce(v_item->>'source_ref', '')), '');

    begin
      v_requested_id := nullif(v_item->>'cloudId', '')::uuid;
    exception when others then
      v_requested_id := null;
    end;

    begin
      v_date := coalesce(nullif(v_item->>'plan_date', '')::date, current_date);
    exception when others then
      v_date := current_date;
    end;

    if v_date <> current_date then
      continue;
    end if;

    v_slot := lower(trim(coalesce(v_item->>'meal_slot', '')));
    if v_slot not in ('breakfast', 'lunch', 'dinner', 'snack') then
      continue;
    end if;

    v_status := lower(trim(coalesce(v_item->>'status', 'planned')));
    if v_status not in ('planned', 'eaten', 'skipped') then
      v_status := 'planned';
    end if;

    v_source_type := lower(trim(coalesce(v_item->>'source_type', 'ari')));
    if v_source_type not in ('manual', 'recent', 'saved_meal', 'recipe', 'ari') then
      v_source_type := 'ari';
    end if;

    begin
      v_client_updated_at := nullif(v_item->>'updated_at', '')::timestamptz;
    exception when others then
      v_client_updated_at := null;
    end;

    if v_client_updated_at is null or v_client_updated_at > now() + interval '5 minutes' then
      v_client_updated_at := now();
    end if;

    v_id := null;
    v_existing_updated_at := null;

    if v_requested_id is not null then
      select id, updated_at
        into v_id, v_existing_updated_at
      from public.nutrition_plan_items
      where id = v_requested_id
        and user_id = v_user
      limit 1;
    end if;

    if v_id is null and v_sync_key is not null then
      select id, updated_at
        into v_id, v_existing_updated_at
      from public.nutrition_plan_items
      where user_id = v_user
        and plan_date = v_date
        and client_sync_key = v_sync_key
      limit 1;
    end if;

    if v_id is null then
      insert into public.nutrition_plan_items (
        user_id,
        plan_date,
        meal_slot,
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        serving_size,
        multiplier,
        source_type,
        source_ref,
        client_sync_key,
        items,
        notes,
        status,
        consumed_meal_id,
        position,
        updated_at
      ) values (
        v_user,
        v_date,
        v_slot,
        coalesce(nullif(trim(v_item->>'name'), ''), 'Meal'),
        greatest(0, coalesce(nullif(v_item->>'calories', '')::numeric, 0)),
        greatest(0, coalesce(nullif(v_item->>'protein_g', '')::numeric, 0)),
        greatest(0, coalesce(nullif(v_item->>'carbs_g', '')::numeric, 0)),
        greatest(0, coalesce(nullif(v_item->>'fat_g', '')::numeric, 0)),
        coalesce(nullif(trim(v_item->>'serving_size'), ''), 'Meal Plan'),
        greatest(0.01, coalesce(nullif(v_item->>'multiplier', '')::numeric, 1)),
        v_source_type,
        v_source_ref,
        v_sync_key,
        case when jsonb_typeof(v_item->'items') = 'array' then v_item->'items' else '[]'::jsonb end,
        coalesce(v_item->>'notes', ''),
        v_status,
        nullif(v_item->>'consumed_meal_id', ''),
        greatest(0, coalesce(nullif(v_item->>'position', '')::integer, 0)),
        v_client_updated_at
      )
      returning id, updated_at into v_id, v_existing_updated_at;

      v_accepted := v_accepted + 1;
    elsif v_client_updated_at >= coalesce(v_existing_updated_at, '-infinity'::timestamptz) then
      update public.nutrition_plan_items
      set meal_slot = v_slot,
          name = coalesce(nullif(trim(v_item->>'name'), ''), name),
          calories = greatest(0, coalesce(nullif(v_item->>'calories', '')::numeric, calories)),
          protein_g = greatest(0, coalesce(nullif(v_item->>'protein_g', '')::numeric, protein_g)),
          carbs_g = greatest(0, coalesce(nullif(v_item->>'carbs_g', '')::numeric, carbs_g)),
          fat_g = greatest(0, coalesce(nullif(v_item->>'fat_g', '')::numeric, fat_g)),
          serving_size = coalesce(nullif(trim(v_item->>'serving_size'), ''), serving_size),
          multiplier = greatest(0.01, coalesce(nullif(v_item->>'multiplier', '')::numeric, multiplier)),
          source_type = v_source_type,
          source_ref = coalesce(v_source_ref, source_ref),
          client_sync_key = coalesce(v_sync_key, client_sync_key),
          items = case when jsonb_typeof(v_item->'items') = 'array' then v_item->'items' else items end,
          notes = coalesce(v_item->>'notes', notes),
          status = v_status,
          consumed_meal_id = nullif(v_item->>'consumed_meal_id', ''),
          position = greatest(0, coalesce(nullif(v_item->>'position', '')::integer, position)),
          updated_at = v_client_updated_at
      where id = v_id
        and user_id = v_user;

      v_accepted := v_accepted + 1;
    else
      v_stale := v_stale + 1;
    end if;

    v_count := v_count + 1;
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'localId', v_local_id,
      'cloudId', v_id,
      'syncKey', v_sync_key,
      'accepted', v_client_updated_at >= coalesce(v_existing_updated_at, '-infinity'::timestamptz)
    ));
  end loop;

  return jsonb_build_object(
    'success', true,
    'syncedCount', v_count,
    'acceptedCount', v_accepted,
    'staleCount', v_stale,
    'mappings', v_mappings
  );
end;
$$;

revoke all on function public.ari_sync_nutrition_plans(jsonb) from public, anon;
grant execute on function public.ari_sync_nutrition_plans(jsonb) to authenticated;
