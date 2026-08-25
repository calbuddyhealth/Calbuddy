import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260825104500_ari_circle_action_network_match_v1.sql",
  "utf8"
);
const contract = fs.readFileSync("docs/ARI_CIRCLE_ACTION_NETWORK_V6.md", "utf8");

test("Match Engine V1 only matches from an active intent owned by the caller", () => {
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /where i\.id = requested_intent_id/i);
  assert.match(migration, /and i\.user_id = caller_id/i);
  assert.match(migration, /and i\.status = 'active'/i);
  assert.match(migration, /and i\.expires_at > now\(\)/i);
});

test("Match Engine V1 consumes the normalized Opportunity contract", () => {
  assert.match(migration, /public\.ari_circle_list_opportunities\(/i);
  assert.match(migration, /array\['meetup','mission'\]/i);
  assert.match(migration, /o\.viewer_state = 'available'/i);
  assert.match(migration, /o\.spots_remaining is null or o\.spots_remaining > 0/i);
});

test("Match Engine V1 requires real time overlap", () => {
  assert.match(migration, /o\.starts_at < intent\.time_window_end/i);
  assert.match(migration, /o\.ends_at > intent\.time_window_start/i);
  assert.match(migration, /Starts inside your available time window/i);
});

test("Match Engine V1 is deterministic and explainable", () => {
  assert.match(migration, /activity_score/i);
  assert.match(migration, /time_score/i);
  assert.match(migration, /area_score/i);
  assert.match(migration, /group_score/i);
  assert.match(migration, /match_reasons text\[\]/i);
  assert.match(migration, /action_match_v1/i);
  assert.match(contract, /V1 matching is deterministic and explainable/i);
});

test("Match Engine V1 does not use reward size, payment, popularity, or engagement to rank", () => {
  assert.match(migration, /Reward XP remains display metadata only/i);
  assert.match(migration, /excluded[\s\S]*from internal_match_score/i);
  assert.doesNotMatch(migration, /premium/i);
  assert.doesNotMatch(migration, /sponsor/i);
  assert.doesNotMatch(migration, /followers?/i);
  assert.doesNotMatch(migration, /likes?/i);
  assert.doesNotMatch(migration, /reaction/i);
  assert.match(contract, /Paid status is never a ranking signal/i);
});

test("Match Engine V1 is honest about signals it does not yet have", () => {
  assert.match(migration, /'distance_scored', false/i);
  assert.match(migration, /'experience_scored', false/i);
  assert.match(migration, /'intensity_scored', false/i);
  assert.match(contract, /Missing state is unknown/i);
});

test("raw match score remains an internal ordering signal while reasons are user-explainable", () => {
  assert.match(migration, /internal_match_score/i);
  assert.match(migration, /Matches the activity you want/i);
  assert.match(migration, /Matches your general area/i);
  assert.match(migration, /Fits your preferred group size/i);
  assert.match(contract, /not expose a fake precision score/i);
});
