import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825133000_ari_circle_mission_v2.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Mission V2 evolves legacy Quests in place instead of creating a second mission authority", () => {
  assert.match(migration, /alter table public\.ari_circle_quests/i);
  assert.match(migration, /objective_type text not null default 'completion'/i);
  assert.match(migration, /progress_mode text not null default 'individual'/i);
  assert.match(migration, /target_value numeric\(12,2\)/i);
  assert.match(migration, /objective_reached_at timestamptz/i);
  assert.doesNotMatch(migration, /create table if not exists public\.ari_circle_missions\b/i);
});

test("legacy completion Quests remain valid while measurable Missions are explicitly shaped", () => {
  assert.match(migration, /objective_type in \('completion','count','distance','duration'\)/i);
  assert.match(migration, /progress_mode in \('individual','collective'\)/i);
  assert.match(migration, /objective_type = 'completion'[\s\S]*progress_mode = 'individual'[\s\S]*target_value is null[\s\S]*unit is null/i);
  assert.match(migration, /objective_type <> 'completion'[\s\S]*target_value is not null[\s\S]*target_value > 0/i);
  assert.match(migration, /not \(progress_mode = 'collective' and scope = 'personal'\)/i);
});

test("metric Missions are deliberately zero-XP in V2 phase one", () => {
  assert.match(migration, /ari_circle_quests_metric_xp_check/i);
  assert.match(migration, /objective_type = 'completion' or xp_reward = 0/i);
  assert.match(migration, /ari_circle_create_mission_v2/i);
  assert.match(migration, /verification_mode,[\s\S]*xp_reward,[\s\S]*ends_at/i);
  assert.match(migration, /clean_verification,[\s\S]*0,[\s\S]*end_time/i);
  assert.doesNotMatch(executable, /ari_circle_award_xp_capped/i);
});

test("Mission contributions are private, server-authoritative, and retry-idempotent", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_mission_contributions/i);
  assert.match(migration, /client_event_id uuid not null/i);
  assert.match(migration, /unique \(quest_id, user_id, client_event_id\)/i);
  assert.match(migration, /on conflict \(quest_id,user_id,client_event_id\) do nothing/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_mission_contributions from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant (?:select|insert|update|delete)[^;]+authenticated/i);
});

test("only verified contributions advance individual or collective progress", () => {
  assert.match(migration, /c\.status = 'verified'/i);
  assert.match(migration, /global_verified_total/i);
  assert.match(migration, /user_verified_total/i);
  assert.match(migration, /global_total >= q\.target_value/i);
  assert.match(migration, /user_total >= q\.target_value/i);
  assert.match(migration, /objective_reached_at = coalesce\(objective_reached_at, now\(\)\)/i);
});

test("self verification is allowed only because metric Missions cannot award XP", () => {
  assert.match(migration, /contribution_status := case when q\.verification_mode = 'self' then 'verified' else 'submitted' end/i);
  assert.match(migration, /q\.xp_reward <> 0/i);
  assert.match(migration, /ari_circle_quests_metric_xp_check/i);
});

test("Mission writes and review remain adult, member, and block aware", () => {
  const accessChecks = migration.match(/perform public\.ari_circle_assert_adult_access\(\)/gi) || [];
  assert.ok(accessChecks.length >= 5, `expected repeated adult guards, got ${accessChecks.length}`);
  assert.match(migration, /Join the Mission before contributing/i);
  assert.match(migration, /ari_circle_social_pair_is_blocked\(caller_id, q\.creator_user_id\)/i);
  assert.match(migration, /ari_circle_social_pair_is_blocked\(caller_id, c\.user_id\)/i);
  assert.match(migration, /You cannot verify your own Mission contribution/i);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
});

test("organizer and peer verification are deterministic roles rather than popularity privileges", () => {
  assert.match(migration, /q\.verification_mode = 'organizer'/i);
  assert.match(migration, /q\.verification_mode = 'peer'/i);
  assert.match(migration, /reviewer_is_member/i);
  assert.doesNotMatch(executable, /\b(premium|subscription|sponsor|paid|followers|likes|reactions|popularity_score)\b/i);
});

test("Mission list exposes verified progress without exposing proof notes to ordinary discovery", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_missions_v2/i);
  assert.match(migration, /verified_progress numeric/i);
  assert.match(migration, /viewer_verified_progress numeric/i);
  assert.match(migration, /viewer_pending_progress numeric/i);
  assert.match(migration, /progress_percent numeric/i);
  const listFunction = migration.split(/create or replace function public\.ari_circle_list_missions_v2/i)[1] || "";
  assert.doesNotMatch(listFunction, /proof_note/i);
});

test("Mission V2 stores no location, messaging, or engagement data", () => {
  assert.doesNotMatch(executable, /meeting_point/i);
  assert.doesNotMatch(executable, /\b(latitude|longitude|approx_lat|approx_lng)\b/i);
  assert.doesNotMatch(executable, /ari_circle_meetup_messages/i);
  assert.doesNotMatch(executable, /\b(likes|reactions|followers|views)\b/i);
});

test("count Missions reserve whole-number semantics", () => {
  assert.match(migration, /clean_objective = 'count'/i);
  assert.match(migration, /trunc\(/i);
});

test("organizer verification has a non-self path for the organizer's own contribution", () => {
  assert.match(migration, /c\.user_id = q\.creator_user_id/i);
  assert.match(migration, /ari_circle_can_create_xp_quest\(caller_id\)/i);
});
