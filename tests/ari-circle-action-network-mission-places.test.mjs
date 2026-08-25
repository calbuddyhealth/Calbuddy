import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825144500_ari_circle_mission_places_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Mission Places use one server-authoritative mapping table", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_mission_places/i);
  assert.match(migration, /primary key \(mission_id, place_id\)/i);
  assert.match(migration, /alter table public\.ari_circle_mission_places enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_mission_places from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_mission_places to service_role/i);
});

test("only the Mission creator can attach a curated active public Place", () => {
  const body = migration.split(/create or replace function public\.ari_circle_attach_mission_place\(/i)[1]
    ?.split(/create or replace function public\.ari_circle_detach_mission_place/i)[0] || "";
  assert.match(body, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(body, /q\.creator_user_id <> caller_id/i);
  assert.match(body, /q\.status <> 'active'/i);
  assert.match(body, /q\.objective_type = 'completion'/i);
  assert.match(body, /p\.safe_public_place is not true/i);
  assert.match(body, /p\.verification_state not in \('curated','partner_verified'\)/i);
  assert.doesNotMatch(body, /xp_reward|premium|subscription|sponsor|paid_rank/i);
});

test("Mission Place removal is also creator-owned", () => {
  const body = migration.split(/create or replace function public\.ari_circle_detach_mission_place\(/i)[1]
    ?.split(/create or replace function public\.ari_circle_list_mission_places/i)[0] || "";
  assert.match(body, /q\.creator_user_id <> caller_id/i);
  assert.match(body, /delete from public\.ari_circle_mission_places/i);
});

test("Mission Places are readable only through adult, block-aware Mission visibility", () => {
  const body = migration.split(/create or replace function public\.ari_circle_list_mission_places\(/i)[1]
    ?.split(/create or replace function public\.ari_circle_list_place_missions/i)[0] || "";
  assert.match(body, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(body, /public\.ari_circle_user_is_adult\(q\.creator_user_id\)/i);
  assert.match(body, /public\.ari_circle_social_pair_is_blocked\(caller_id, q\.creator_user_id\)/i);
  assert.match(body, /p\.safe_public_place = true/i);
  assert.match(body, /p\.verification_state in \('curated','partner_verified'\)/i);
});

test("Place Mission discovery includes only active measurable Missions and verified progress", () => {
  const body = migration.split(/create or replace function public\.ari_circle_list_place_missions\(/i)[1] || "";
  assert.match(body, /q\.status = 'active'/i);
  assert.match(body, /q\.ends_at > now\(\)/i);
  assert.match(body, /q\.objective_type <> 'completion'/i);
  assert.match(body, /c\.status = 'verified'/i);
  assert.match(body, /public\.ari_circle_user_is_adult\(q\.creator_user_id\)/i);
  assert.match(body, /not public\.ari_circle_social_pair_is_blocked\(caller_id, q\.creator_user_id\)/i);
});

test("Mission Place layer stores no live-user location, engagement, payment, or XP ranking", () => {
  assert.doesNotMatch(executable, /ari_circle_presence|currently_here|last_seen|live_user|user_location|approximate_latitude|approximate_longitude/i);
  assert.doesNotMatch(executable, /\b(likes|reactions|followers|views|popularity_score|premium|subscription|sponsor|paid_rank)\b/i);
  assert.doesNotMatch(executable, /award.*xp|xp.*award|ari_circle_xp_events/i);
});

test("public Place coordinates may be returned for destination mapping but never copied into Mission rows", () => {
  assert.match(migration, /p\.latitude/i);
  assert.match(migration, /p\.longitude/i);
  assert.doesNotMatch(migration, /insert into public\.ari_circle_quests[^;]*(latitude|longitude)/is);
  assert.doesNotMatch(migration, /update public\.ari_circle_quests[^;]*(latitude|longitude)/is);
});