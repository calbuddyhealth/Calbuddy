create or replace function public.claim_nutrition_label_scan(
  p_user_id uuid,
  p_nutrition_day date,
  p_limit integer default 3
)
returns table(allowed boolean, used_count integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  if p_user_id is null or p_nutrition_day is null or p_limit < 1 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.ari_nutrition_vision_usage(user_id, nutrition_day, used_count, updated_at)
  values (p_user_id, p_nutrition_day, 1, now())
  on conflict (user_id, nutrition_day) do nothing;

  get diagnostics v_used = row_count;
  if v_used = 1 then
    return query select true, 1, greatest(p_limit - 1, 0);
    return;
  end if;

  update public.ari_nutrition_vision_usage as u
  set used_count = u.used_count + 1,
      updated_at = now()
  where u.user_id = p_user_id
    and u.nutrition_day = p_nutrition_day
    and u.used_count < p_limit
  returning u.used_count into v_used;

  if found then
    return query select true, v_used, greatest(p_limit - v_used, 0);
    return;
  end if;

  select u.used_count
  into v_used
  from public.ari_nutrition_vision_usage as u
  where u.user_id = p_user_id
    and u.nutrition_day = p_nutrition_day;

  return query select false, coalesce(v_used, p_limit), 0;
end;
$$;

revoke all on function public.claim_nutrition_label_scan(uuid, date, integer) from public;
grant execute on function public.claim_nutrition_label_scan(uuid, date, integer) to service_role;
