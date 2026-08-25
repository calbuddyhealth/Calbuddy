import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825123000_ari_circle_action_network_graph_v1.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Action Graph V1 is a derived read model over verified completed meetups", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_action_relationships/i);
  assert.match(migration, /m\.status\s*=\s*'completed'/i);
  assert.match(migration, /mine\.completed_at is not null/i);
  assert.match(migration, /other\.completed_at is not null/i);
  assert.match(migration, /count\(distinct s\.meetup_id\)/i);
});

test("Action Graph V1 remains adult-gated, caller-derived, and block-aware", () => {
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /public\.ari_circle_user_is_adult\(other\.user_id\)/i);
  assert.match(migration, /public\.ari_circle_social_pair_is_blocked\(caller_id, other\.user_id\)/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
});

test("Action Graph V1 records repeated action facts instead of subjective human ratings", () => {
  for (const field of [
    "completed_together",
    "repeat_count",
    "first_completed_at",
    "last_completed_at",
    "hosted_by_me",
    "hosted_by_them",
    "unique_activities",
    "top_activity",
    "shared_activity_counts"
  ]) {
    assert.match(migration, new RegExp(`\\b${field}\\b`, "i"), field);
  }

  assert.doesNotMatch(executable, /\b(star_rating|user_rating|attractiveness|popularity_score|compatibility_score)\b/i);
});

test("Action Graph V1 never reads private room, message, location, or engagement surfaces", () => {
  assert.doesNotMatch(executable, /ari_circle_meetup_messages/i);
  assert.doesNotMatch(executable, /meeting_point/i);
  assert.doesNotMatch(executable, /\b(latitude|longitude|approx_lat|approx_lng)\b/i);
  assert.doesNotMatch(executable, /\b(likes|reactions|followers|views)\b/i);
});

test("Action Graph V1 cannot award XP or mutate Circle state", () => {
  assert.doesNotMatch(executable, /ari_circle_xp_events/i);
  assert.doesNotMatch(executable, /\binsert\s+into\b/i);
  assert.doesNotMatch(executable, /\bupdate\s+public\./i);
  assert.doesNotMatch(executable, /\bdelete\s+from\b/i);
});
