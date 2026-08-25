import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const core = await readFile(
  new URL("../supabase/migrations/20260825133000_ari_circle_mission_v2.sql", import.meta.url),
  "utf8"
);
const hardening = await readFile(
  new URL("../supabase/migrations/20260825133500_ari_circle_mission_v2_hardening.sql", import.meta.url),
  "utf8"
);
const legacyBoundary = await readFile(
  new URL("../supabase/migrations/20260825134000_ari_circle_mission_v2_legacy_boundary.sql", import.meta.url),
  "utf8"
);
const missionEngine = `${core}\n${hardening}`;
const migration = `${missionEngine}\n${legacyBoundary}`;

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);
const metricExecutable = stripSqlComments(missionEngine);

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
  assert.match(missionEngine, /ari_circle_quests_metric_xp_check/i);
  assert.match(missionEngine, /objective_type = 'completion' or xp_reward = 0/i);
  assert.match(missionEngine, /ari_circle_create_mission_v2/i);
  assert.match(missionEngine, /verification_mode,[\s\S]*xp_reward,[\s\S]*ends_at/i);
  assert.match(missionEngine, /clean_verification,[\s\S]*0,[\s\S]*end_time/i);
  assert.doesNotMatch(metricExecutable, /ari_circle_award_xp_capped/i);
});

test("Mission contributions are private, server-authoritative, and retry-idempotent", () => {
  assert.match(missionEngine, /create table if not exists public\.ari_circle_mission_contributions/i);
  assert.match(missionEngine, /client_event_id uuid not null/i);
  assert.match(missionEngine, /unique \(quest_id, user_id, client_event_id\)/i);
  assert.match(missionEngine, /on conflict \(quest_id,user_id,client_event_id\) do nothing/i);
  assert.match(missionEngine, /enable row level security/i);
  assert.match(missionEngine, /revoke all on table public\.ari_circle_mission_contributions from public, anon, authenticated/i);
  assert.doesNotMatch(missionEngine, /grant (?:select|insert|update|delete)[^;]+authenticated/i);
});

test("only verified contributions advance individual or collective progress", () => {
  assert.match(missionEngine, /c\.status = 'verified'/i);
  assert.match(missionEngine, /global_verified_total/i);
  assert.match(missionEngine, /user_verified_total/i);
  assert.match(missionEngine, /global_total >= q\.target_value/i);
  assert.match(missionEngine, /user_total >= q\.target_value/i);
  assert.match(missionEngine, /objective_reached_at = coalesce\(objective_reached_at, now\(\)\)/i);
});

test("self verification is allowed only because metric Missions cannot award XP", () => {
  assert.match(missionEngine, /contribution_status := case when q\.verification_mode = 'self' then 'verified' else 'submitted' end/i);
  assert.match(missionEngine, /q\.xp_reward <> 0/i);
  assert.match(missionEngine, /ari_circle_quests_metric_xp_check/i);
});

test("Mission writes and review remain adult, member, and block aware", () => {
  const accessChecks = missionEngine.match(/perform public\.ari_circle_assert_adult_access\(\)/gi) || [];
  assert.ok(accessChecks.length >= 5, `expected repeated adult guards, got ${accessChecks.length}`);
  assert.match(missionEngine, /Join the Mission before contributing/i);
  assert.match(missionEngine, /ari_circle_social_pair_is_blocked\(caller_id, q\.creator_user_id\)/i);
  assert.match(missionEngine, /ari_circle_social_pair_is_blocked\(caller_id, c\.user_id\)/i);
  assert.match(missionEngine, /You cannot verify your own Mission contribution/i);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
});

test("organizer and peer verification are deterministic roles rather than popularity privileges", () => {
  assert.match(missionEngine, /q\.verification_mode = 'organizer'/i);
  assert.match(missionEngine, /q\.verification_mode = 'peer'/i);
  assert.match(missionEngine, /reviewer_is_member/i);
  assert.doesNotMatch(executable, /\b(premium|subscription|sponsor|paid|followers|likes|reactions|popularity_score)\b/i);
});

test("Mission list exposes verified progress without exposing proof notes to ordinary discovery", () => {
  assert.match(core, /create or replace function public\.ari_circle_list_missions_v2/i);
  assert.match(core, /verified_progress numeric/i);
  assert.match(core, /viewer_verified_progress numeric/i);
  assert.match(core, /viewer_pending_progress numeric/i);
  assert.match(core, /progress_percent numeric/i);
  const listFunction = core.split(/create or replace function public\.ari_circle_list_missions_v2/i)[1] || "";
  assert.doesNotMatch(listFunction, /proof_note/i);
});

test("Mission V2 stores no location, messaging, or engagement data", () => {
  assert.doesNotMatch(executable, /meeting_point/i);
  assert.doesNotMatch(executable, /\b(latitude|longitude|approx_lat|approx_lng)\b/i);
  assert.doesNotMatch(executable, /ari_circle_meetup_messages/i);
  assert.doesNotMatch(executable, /\b(likes|reactions|followers|views)\b/i);
});

test("count Missions use whole-number target and contribution semantics", () => {
  assert.match(hardening, /objective_type <> 'count' or target_value = trunc\(target_value\)/i);
  assert.match(hardening, /q\.objective_type = 'count' and new\.amount <> trunc\(new\.amount\)/i);
  assert.match(hardening, /before insert or update of quest_id, amount/i);
});

test("organizer verification has a non-self path for the organizer's own contribution", () => {
  assert.match(hardening, /c\.user_id = q\.creator_user_id/i);
  assert.match(hardening, /reviewer_is_leader := public\.ari_circle_can_create_xp_quest\(caller_id\)/i);
  assert.match(hardening, /A joined Community Leader must verify the organizer contribution/i);
});

test("Mission review is bounded to the active mission plus a short settlement window", () => {
  assert.match(hardening, /q\.status <> 'active'/i);
  assert.match(hardening, /q\.ends_at \+ interval '48 hours'/i);
});

test("legacy Quest discovery cannot render metric Missions with the old Complete Quest UI", () => {
  assert.match(legacyBoundary, /create or replace function public\.ari_circle_list_quests/i);
  assert.match(legacyBoundary, /q\.objective_type = 'completion'/i);
});

test("legacy Quest completion and verification cannot bypass metric Mission progress", () => {
  assert.match(legacyBoundary, /ari_circle_submit_quest_completion/i);
  assert.match(legacyBoundary, /q\.objective_type <> 'completion'/i);
  assert.match(legacyBoundary, /Quest completion is unavailable for this Mission/i);
  assert.match(legacyBoundary, /ari_circle_verify_quest_completion/i);
  assert.match(legacyBoundary, /Quest verification is unavailable for this Mission/i);
  assert.match(legacyBoundary, /ari_circle_quest_submissions/i);
  assert.match(legacyBoundary, /Quest review is unavailable for this Mission/i);
});
