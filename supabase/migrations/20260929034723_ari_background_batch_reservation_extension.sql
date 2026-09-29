-- Extend a live background-AI budget reservation for long-running OpenAI Batch work.
-- Applied to production Supabase as migration 20260929034723.

create or replace function public.ari_extend_background_ai_budget_reservation(
  p_reservation_id uuid,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.ari_background_ai_budget_reservations%rowtype;
  v_target timestamptz;
begin
  if p_reservation_id is null or p_expires_at is null then
    return jsonb_build_object('extended', false, 'reason', 'invalid_extension_input');
  end if;

  v_target := least(p_expires_at, now() + interval '48 hours');
  if v_target <= now() + interval '15 minutes' then
    return jsonb_build_object('extended', false, 'reason', 'extension_too_short');
  end if;

  select * into v_row
  from public.ari_background_ai_budget_reservations
  where id = p_reservation_id
  for update;

  if not found then
    return jsonb_build_object('extended', false, 'reason', 'reservation_not_found');
  end if;

  if v_row.status <> 'reserved' then
    return jsonb_build_object(
      'extended', false,
      'reason', 'reservation_not_active',
      'status', v_row.status
    );
  end if;

  update public.ari_background_ai_budget_reservations
     set expires_at = greatest(expires_at, v_target),
         updated_at = now()
   where id = p_reservation_id;

  return jsonb_build_object(
    'extended', true,
    'reason', 'extended',
    'expiresAt', greatest(v_row.expires_at, v_target)
  );
end;
$$;

revoke execute on function public.ari_extend_background_ai_budget_reservation(uuid,timestamptz)
  from public, anon, authenticated;

grant execute on function public.ari_extend_background_ai_budget_reservation(uuid,timestamptz)
  to service_role;
