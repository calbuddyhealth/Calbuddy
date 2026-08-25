import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260825101500_ari_circle_action_network_intent_v1.sql",
  "utf8"
);
const contract = fs.readFileSync("docs/ARI_CIRCLE_ACTION_NETWORK_V6.md", "utf8");

test("Action Intent V1 is a private server-authoritative matching input", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_action_intents/i);
  assert.match(migration, /alter table public\.ari_circle_action_intents enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_action_intents from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_action_intents to service_role/i);
  assert.match(contract, /Intent is not a public dating-style profile/i);
});

test("all Action Intent RPCs require current adult Circle entitlement", () => {
  const guardCount = (migration.match(/perform public\.ari_circle_assert_adult_access\(\)/gi) || []).length;
  assert.ok(guardCount >= 3);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
});

test("Action Intent location is deliberately coarse and coordinates are paired", () => {
  assert.match(migration, /approximate_latitude numeric\(6,2\)/i);
  assert.match(migration, /approximate_longitude numeric\(7,2\)/i);
  assert.match(migration, /round\(requested_latitude, 2\)/i);
  assert.match(migration, /round\(requested_longitude, 2\)/i);
  assert.match(migration, /check \(\(approximate_latitude is null\) = \(approximate_longitude is null\)\)/i);
  assert.match(contract, /Exact meetup points remain accepted-room-only/i);
});

test("Action Intents expire and cannot become permanent public availability profiles", () => {
  assert.match(migration, /time_window_start timestamptz not null/i);
  assert.match(migration, /time_window_end timestamptz not null/i);
  assert.match(migration, /expires_at timestamptz not null/i);
  assert.match(migration, /requested_time_window_start > now\(\) \+ interval '30 days'/i);
  assert.match(migration, /requested_time_window_end > requested_time_window_start \+ interval '30 days'/i);
  assert.match(migration, /when i\.status = 'active' and i\.expires_at <= now\(\) then 'expired'/i);
});

test("Action Intent write authority is limited to the signed-in owner", () => {
  assert.match(migration, /user_id[\s\S]*caller_id/i);
  assert.match(migration, /where i\.id = requested_intent_id[\s\S]*and i\.user_id = caller_id/i);
  assert.match(migration, /ari_circle_cancel_action_intent/i);
});

test("Action Intents do not award XP or create social relationships", () => {
  assert.doesNotMatch(migration, /ari_circle_award_xp_capped/i);
  assert.doesNotMatch(migration, /ari_circle_connections/i);
  assert.doesNotMatch(migration, /ari_conversations/i);
  assert.match(contract, /Real-world reputation comes from verified participation and contribution/i);
});

test("Action Intent V1 captures practical matching constraints without exposing exact location", () => {
  for (const field of [
    "activity",
    "experience_level",
    "intensity",
    "desired_group_min",
    "desired_group_max",
    "radius_miles",
    "time_window_start",
    "time_window_end"
  ]) {
    assert.match(migration, new RegExp(`\\b${field}\\b`));
  }
  assert.doesNotMatch(migration, /meeting_point/i);
  assert.doesNotMatch(migration, /exact_location/i);
});
