-- ARI Circle Build 5 — Challenge entry cover media
-- Makes a Challenge visual as soon as its first media entry is submitted.
-- If that entry is later deleted, the cover moves to the next available entry.

begin;

create or replace function public.ari_circle_sync_challenge_cover_from_entry()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if new.media_path is null or new.media_type not in ('image','video') then
    return new;
  end if;

  update public.ari_circle_challenges
  set
    cover_media_path = new.media_path,
    cover_media_type = new.media_type,
    updated_at = now()
  where id = new.challenge_id
    and cover_media_path is null;

  return new;
end;
$$;

revoke all on function public.ari_circle_sync_challenge_cover_from_entry() from public, anon, authenticated;

drop trigger if exists ari_circle_challenge_entry_cover_insert on public.ari_circle_challenge_entries;
create trigger ari_circle_challenge_entry_cover_insert
after insert on public.ari_circle_challenge_entries
for each row execute function public.ari_circle_sync_challenge_cover_from_entry();

create or replace function public.ari_circle_repair_challenge_cover_after_entry_delete()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  replacement_path text;
  replacement_type text;
begin
  if old.media_path is null then
    return old;
  end if;

  select e.media_path, e.media_type
    into replacement_path, replacement_type
  from public.ari_circle_challenge_entries e
  where e.challenge_id = old.challenge_id
    and e.media_path is not null
    and e.media_type in ('image','video')
  order by e.created_at asc, e.id asc
  limit 1;

  update public.ari_circle_challenges
  set
    cover_media_path = replacement_path,
    cover_media_type = replacement_type,
    updated_at = now()
  where id = old.challenge_id
    and cover_media_path = old.media_path;

  return old;
end;
$$;

revoke all on function public.ari_circle_repair_challenge_cover_after_entry_delete() from public, anon, authenticated;

drop trigger if exists ari_circle_challenge_entry_cover_delete on public.ari_circle_challenge_entries;
create trigger ari_circle_challenge_entry_cover_delete
after delete on public.ari_circle_challenge_entries
for each row execute function public.ari_circle_repair_challenge_cover_after_entry_delete();

commit;
