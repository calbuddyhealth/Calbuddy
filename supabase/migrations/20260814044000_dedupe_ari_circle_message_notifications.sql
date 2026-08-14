-- ARI XP — one notification per direct message.
--
-- ari_messages already has an AFTER INSERT notification trigger. The newer
-- ari_circle_messages_send RPC also inserted a second notification manually,
-- so recipients received two notifications for one message. Keep the trigger
-- as the single notification path because it also protects any valid direct
-- insert path.

create or replace function public.ari_circle_messages_send(
  requested_conversation_id uuid,
  requested_body text
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  clean_body text := btrim(coalesce(requested_body,''));
  new_id uuid;
  recipient_id uuid;
  recipient_visibility text;
  connected boolean := false;
  recipient_has_replied boolean := false;
  caller_message_count integer := 0;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if length(clean_body)<1 then raise exception 'Write a message first'; end if;
  if length(clean_body)>4000 then raise exception 'Message is too long'; end if;

  if not exists(
    select 1
    from public.ari_conversation_members cm
    where cm.conversation_id=requested_conversation_id
      and cm.user_id=caller_id
  ) then
    raise exception 'Conversation unavailable';
  end if;

  select cm.user_id into recipient_id
  from public.ari_conversation_members cm
  where cm.conversation_id=requested_conversation_id
    and cm.user_id<>caller_id
  limit 1;

  if recipient_id is null
     or public.ari_circle_social_pair_is_blocked(caller_id,recipient_id) then
    raise exception 'Conversation unavailable';
  end if;

  select p.messaging_visibility into recipient_visibility
  from public.ari_circle_profiles p
  where p.user_id=recipient_id;

  select exists(
    select 1
    from public.ari_circle_connections rel
    where rel.status='accepted'
      and (
        (rel.requester_user_id=caller_id and rel.addressee_user_id=recipient_id)
        or
        (rel.requester_user_id=recipient_id and rel.addressee_user_id=caller_id)
      )
  ) into connected;

  if recipient_visibility='nobody' then
    raise exception 'This user is not accepting messages';
  end if;

  if recipient_visibility='circle_only' and not connected then
    raise exception 'This user only accepts messages from their Circle';
  end if;

  if recipient_visibility='request' and not connected then
    select exists(
      select 1
      from public.ari_messages m
      where m.conversation_id=requested_conversation_id
        and m.sender_user_id=recipient_id
    ) into recipient_has_replied;

    select count(*)::int into caller_message_count
    from public.ari_messages m
    where m.conversation_id=requested_conversation_id
      and m.sender_user_id=caller_id;

    if not recipient_has_replied and caller_message_count>=1 then
      raise exception 'Your introduction was sent. You can send more after they reply.';
    end if;
  end if;

  insert into public.ari_messages(
    conversation_id,
    sender_user_id,
    body,
    created_at
  ) values (
    requested_conversation_id,
    caller_id,
    clean_body,
    now()
  ) returning id into new_id;

  -- Conversation timestamps and recipient notification are handled by the
  -- existing AFTER INSERT triggers on ari_messages.
  return new_id;
end;
$function$;
