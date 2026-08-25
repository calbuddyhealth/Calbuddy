import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825160000_ari_circle_domain_events_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Domain Events V1 is a short-lived server-authoritative ledger, not a client feed", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_domain_events/i);
  assert.match(migration, /alter table public\.ari_circle_domain_events enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_domain_events from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_domain_events to service_role/i);
  assert.doesNotMatch(migration, /grant\s+(?:select|insert|update|delete|all)[^;]+ari_circle_domain_events[^;]+to\s+authenticated/i);
  assert.match(migration, /expires_at timestamptz not null default \(now\(\) \+ interval '30 days'\)/i);
  assert.match(migration, /expires_at > occurred_at and expires_at <= occurred_at \+ interval '30 days'/i);
});

test("only the bounded event vocabulary can enter the ledger", () => {
  for (const eventType of [
    "meetup.created",
    "meetup.requested",
    "meetup.waitlisted",
    "meetup.declined",
    "meetup.withdrawn",
    "meetup.joined",
    "meetup.left",
    "meetup.spot_opened",
    "meetup.cancelled",
    "meetup.completed",
    "mission.created",
    "mission.joined",
    "mission.progress_submitted",
    "mission.progress_verified",
    "mission.progress_rejected",
    "mission.objective_reached"
  ]) {
    assert.match(migration, new RegExp(eventType.replace(".", "\\."), "i"));
  }
  assert.doesNotMatch(executable, /post\.liked|reaction\.added|profile\.viewed|feed\.viewed|engagement\.created/i);
});

test("event writes are idempotent and cannot be called by normal clients", () => {
  assert.match(migration, /source_key text not null unique/i);
  assert.match(migration, /on conflict \(source_key\) do nothing/i);
  assert.match(migration, /revoke all on function public\.ari_circle_record_domain_event\([\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.ari_circle_record_domain_event\([\s\S]*?to service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.ari_circle_record_domain_event\([^;]+to authenticated/i);
});

test("event metadata rejects private location, communication, reward, and commercial ranking keys", () => {
  for (const forbiddenKey of [
    "meeting_point",
    "latitude",
    "longitude",
    "approximate_latitude",
    "approximate_longitude",
    "message",
    "message_body",
    "proof_note",
    "email",
    "phone",
    "xp",
    "reward_xp",
    "payment",
    "premium",
    "subscription",
    "popularity",
    "engagement"
  ]) {
    assert.match(migration, new RegExp(`['\"]${forbiddenKey}['\"]`, "i"));
  }
  assert.match(migration, /Private or ranking data cannot enter Circle domain events/i);
});

test("Meetup events come from authoritative table transitions", () => {
  assert.match(migration, /after insert or update of status on public\.ari_circle_meetups/i);
  assert.match(migration, /after insert or update of status on public\.ari_circle_meetup_requests/i);
  assert.match(migration, /after insert or update of status on public\.ari_circle_meetup_participants/i);
  assert.match(migration, /if old\.status is distinct from new\.status/i);
  assert.match(migration, /when 'pending' then 'meetup\.requested'/i);
  assert.match(migration, /when 'waitlisted' then 'meetup\.waitlisted'/i);
  assert.match(migration, /when 'declined' then 'meetup\.declined'/i);
  assert.match(migration, /when 'withdrawn' then 'meetup\.withdrawn'/i);
});

test("spot-opened is emitted only when a real departure changes a full Meetup to one open spot", () => {
  assert.match(migration, /old\.status = 'joined' and new\.status = 'left'/i);
  assert.match(migration, /where p\.meetup_id = new\.meetup_id and p\.status = 'joined'/i);
  assert.match(migration, /spots_remaining := greatest\(0, m\.max_participants - joined_count\)/i);
  assert.match(migration, /if spots_remaining = 1 then[\s\S]*?'meetup\.spot_opened'/i);
  assert.match(migration, /m\.status = 'scheduled' and m\.starts_at > now\(\)/i);
});

test("Mission events stay on measurable Mission authority and never carry proof notes", () => {
  assert.match(migration, /if new\.objective_type = 'completion' then return new/i);
  assert.match(migration, /after insert or update of objective_reached_at on public\.ari_circle_quests/i);
  assert.match(migration, /after insert or update of status on public\.ari_circle_quest_members/i);
  assert.match(migration, /after insert or update of status on public\.ari_circle_mission_contributions/i);
  assert.match(migration, /when 'submitted' then 'mission\.progress_submitted'/i);
  assert.match(migration, /when 'verified' then 'mission\.progress_verified'/i);
  assert.match(migration, /when 'rejected' then 'mission\.progress_rejected'/i);
  assert.doesNotMatch(migration, /jsonb_build_object\([\s\S]*?'proof_note'/i);
});

test("safe event reads are adult-gated, bounded, current-state checked, and block-aware", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_domain_events\(/i);
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /now\(\) - interval '30 days'/i);
  assert.match(migration, /greatest\(1, least\(coalesce\(result_limit, 50\), 100\)\)/i);
  assert.match(migration, /e\.expires_at > now\(\)/i);
  assert.match(migration, /ari_circle_social_pair_is_blocked\(caller_id, e\.actor_user_id\)/i);
  assert.match(migration, /ari_circle_social_pair_is_blocked\(caller_id, e\.affected_user_id\)/i);
  assert.match(migration, /e\.event_type in \('meetup\.created','meetup\.spot_opened'\)/i);
  assert.match(migration, /m\.status = 'scheduled'/i);
  assert.match(migration, /e\.event_type = 'mission\.created'/i);
  assert.match(migration, /q\.status = 'active'/i);
  assert.match(migration, /grant execute on function public\.ari_circle_list_domain_events\(timestamptz,integer\)[\s\S]*?to authenticated, service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.ari_circle_list_domain_events\([^;]+to anon/i);
});

test("private coordination events are not globally public merely because an event row exists", () => {
  assert.match(migration, /e\.actor_user_id = caller_id/i);
  assert.match(migration, /e\.affected_user_id = caller_id/i);
  assert.doesNotMatch(executable, /where\s+true\s+or/i);
});

test("retention cleanup is service-only and expired rows are hidden even before cleanup", () => {
  assert.match(migration, /create or replace function public\.ari_circle_prune_domain_events\(\)/i);
  assert.match(migration, /delete from public\.ari_circle_domain_events\s+where expires_at <= now\(\)/i);
  assert.match(migration, /revoke all on function public\.ari_circle_prune_domain_events\(\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.ari_circle_prune_domain_events\(\) to service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.ari_circle_prune_domain_events\(\) to authenticated/i);
});
