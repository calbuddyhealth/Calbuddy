import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260825094500_ari_circle_action_network_opportunity_v1.sql",
  "utf8"
);
const missionProjection = fs.readFileSync(
  "supabase/migrations/20260825134500_ari_circle_mission_v2_opportunity_projection.sql",
  "utf8"
);
const contract = fs.readFileSync("docs/ARI_CIRCLE_ACTION_NETWORK_V6.md", "utf8");

test("Opportunity V1 unifies Meetups and Missions without replacing source authorities", () => {
  assert.match(migration, /create or replace function public\.ari_circle_list_opportunities/i);
  assert.match(migration, /public\.ari_circle_list_meetups\(/i);
  assert.match(migration, /public\.ari_circle_list_quests\(/i);
  assert.match(migration, /'meetup:' \|\| m\.meetup_id::text/i);
  assert.match(migration, /'mission:' \|\| listed\.quest_id::text/i);
  assert.match(contract, /An Opportunity is a read model/i);
  assert.match(contract, /Existing source tables remain authoritative for writes/i);
});

test("Opportunity V1 inherits adult and block safety from guarded source RPCs", () => {
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /public\.ari_circle_list_meetups\(/i);
  assert.match(migration, /public\.ari_circle_list_quests\(/i);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
  assert.match(migration, /grant execute[^;]+to authenticated, service_role/i);
});

test("Opportunity V1 never exposes the private meetup meeting point", () => {
  assert.doesNotMatch(migration, /meeting_point/i);
  assert.match(contract, /Exact meetup points remain accepted-room-only/i);
  assert.match(contract, /never expose a live map of individual users/i);
});

test("Opportunity V1 is read-only and cannot award XP or mutate social state", () => {
  assert.doesNotMatch(migration, /ari_circle_award_xp_capped/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.ari_circle_/i);
  assert.doesNotMatch(migration, /update\s+public\.ari_circle_/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.ari_circle_/i);
  assert.match(migration, /stable\s*\nsecurity definer/i);
});

test("Opportunity V1 has one normalized contract for future ranking", () => {
  for (const field of [
    "opportunity_key",
    "opportunity_type",
    "opportunity_id",
    "organizer_user_id",
    "participant_count",
    "spots_remaining",
    "viewer_state",
    "verification_mode",
    "join_mode",
    "reward_xp",
    "metadata"
  ]) {
    assert.match(migration, new RegExp(`\\b${field}\\b`));
  }
  assert.match(contract, /V1 is deliberately a normalized discovery contract, not a recommendation model/i);
});

test("Mission filtering cannot be starved by unrelated Quest categories", () => {
  assert.match(migration, /public\.ari_circle_list_quests\(50\)/i);
  assert.match(migration, /clean_activity is null or listed\.category = clean_activity/i);
});

test("Mission today and weekend windows use overlap semantics", () => {
  assert.match(
    migration,
    /source\.starts_at < date_trunc\('day', now\(\)\) \+ interval '1 day'[\s\S]*source\.ends_at > date_trunc\('day', now\(\)\)/i
  );
  assert.match(
    migration,
    /source\.starts_at < date_trunc\('week', now\(\)\) \+ interval '7 days'[\s\S]*source\.ends_at > date_trunc\('week', now\(\)\) \+ interval '5 days'/i
  );
});

test("Mission V2 replaces only the Mission projection and keeps Meetups on their existing authority", () => {
  assert.match(missionProjection, /create or replace function public\.ari_circle_list_opportunities/i);
  assert.match(missionProjection, /public\.ari_circle_list_meetups\(/i);
  assert.match(missionProjection, /public\.ari_circle_list_missions_v2\(50\)/i);
  assert.match(missionProjection, /'mission:' \|\| listed\.mission_id::text/i);
  assert.doesNotMatch(missionProjection, /public\.ari_circle_list_quests\(/i);
});

test("Mission V2 Opportunity metadata carries verified progress but not contribution evidence", () => {
  for (const field of [
    "objective_type",
    "progress_mode",
    "target_value",
    "unit",
    "verified_progress",
    "viewer_verified_progress",
    "viewer_pending_progress",
    "progress_percent",
    "objective_reached_at"
  ]) {
    assert.match(missionProjection, new RegExp(`'${field}'`));
  }
  assert.doesNotMatch(missionProjection, /proof_note/i);
  assert.doesNotMatch(missionProjection, /verified_by/i);
  assert.doesNotMatch(missionProjection, /ari_circle_mission_contributions/i);
  assert.doesNotMatch(missionProjection, /meeting_point/i);
});

test("Mission V2 Opportunity projection remains read-only and reward-neutral", () => {
  assert.doesNotMatch(missionProjection, /ari_circle_award_xp_capped/i);
  assert.doesNotMatch(missionProjection, /insert\s+into\s+public\.ari_circle_/i);
  assert.doesNotMatch(missionProjection, /update\s+public\.ari_circle_/i);
  assert.doesNotMatch(missionProjection, /delete\s+from\s+public\.ari_circle_/i);
  assert.match(missionProjection, /stable\s*\nsecurity definer/i);
});

test("Action Network contract forbids pay-to-rank social advantage", () => {
  assert.match(contract, /Paid status is never a ranking signal/i);
  assert.match(contract, /organic opportunity ranking cannot be purchased/i);
  assert.match(contract, /Sponsored content must be explicitly labeled/i);
});

test("Action Network measures real-world outcomes instead of engagement farming", () => {
  assert.match(contract, /Verified real-world actions completed per active Circle member/i);
  assert.match(contract, /Minutes in app, post volume, reaction volume, and notification opens are not north-star metrics/i);
  assert.match(contract, /Content documents life after it happens/i);
});
