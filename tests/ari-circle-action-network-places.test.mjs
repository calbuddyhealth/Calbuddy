import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825143000_ari_circle_places_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Places V1 models public destinations rather than live user positions", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_places/i);
  assert.match(migration, /safe_public_place boolean not null default true/i);
  assert.match(migration, /verification_state text not null default 'curated'/i);
  assert.doesNotMatch(executable, /presence|last_seen|currently_here|live_user|user_location/i);
  assert.doesNotMatch(executable, /ari_circle_presence/i);
});

test("direct Place writes remain server-authoritative", () => {
  assert.match(migration, /alter table public\.ari_circle_places enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_places from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_places to service_role/i);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete)[^;]+authenticated/i);
});

test("Explore only returns curated safe public places", () => {
  assert.match(migration, /p\.status = 'active'/i);
  assert.match(migration, /p\.safe_public_place = true/i);
  assert.match(migration, /p\.verification_state in \('curated','partner_verified'\)/i);
  assert.doesNotMatch(migration, /verification_state in \([^)]*candidate/i);
});

test("Place discovery can use distance without enabling a new geospatial extension", () => {
  assert.match(migration, /3958\.7613 \* 2 \* asin/i);
  assert.match(migration, /requested_radius_miles/i);
  assert.match(migration, /safe_radius not in \(5,10,25,50,100\)/i);
  assert.doesNotMatch(executable, /postgis|st_distance|geography\s*\(/i);
});

test("caller location is a transient read parameter and is never persisted by Explore", () => {
  const listPlaces = migration.split(/create or replace function public\.ari_circle_list_places\(/i)[1]?.split(/create or replace function public\.ari_circle_list_places_for_intent/i)[0] || "";
  assert.match(listPlaces, /requested_latitude numeric/i);
  assert.match(listPlaces, /requested_longitude numeric/i);
  assert.doesNotMatch(listPlaces, /insert\s+into/i);
  assert.doesNotMatch(listPlaces, /update\s+public\./i);
  assert.doesNotMatch(listPlaces, /delete\s+from/i);
});

test("private Action Intent can resolve nearby Places only for its owner", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_places_for_intent/i);
  assert.match(migration, /ai\.user_id = caller_id/i);
  assert.match(migration, /ai\.status = 'active'/i);
  assert.match(migration, /ai\.expires_at > now\(\)/i);
  assert.match(migration, /requested_latitude => intent\.approximate_latitude/i);
  assert.match(migration, /requested_longitude => intent\.approximate_longitude/i);
});

test("Places V1 remains adult-gated and anonymous callers receive no Explore RPC", () => {
  const guards = migration.match(/perform public\.ari_circle_assert_adult_access\(\)/gi) || [];
  assert.ok(guards.length >= 2, `expected adult guards on both reads, got ${guards.length}`);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
  assert.match(migration, /grant execute[^;]+to authenticated, service_role/i);
});

test("Places contain activity affordances but no engagement or paid-ranking fields", () => {
  assert.match(migration, /activity_tags text\[\]/i);
  assert.doesNotMatch(executable, /\b(likes|reactions|followers|views|popularity_score|premium|subscription|sponsor|paid_rank)\b/i);
});

test("Explore result ordering is distance then deterministic name/id, not hidden engagement", () => {
  assert.match(migration, /c\.distance_value asc nulls last/i);
  assert.match(migration, /lower\(c\.name\) asc/i);
  assert.match(migration, /c\.id asc/i);
});
