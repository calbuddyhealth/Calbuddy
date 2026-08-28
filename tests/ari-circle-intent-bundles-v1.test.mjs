import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260826070000_ari_circle_intent_people_match_v1.sql",
  "utf8"
);
const html = fs.readFileSync("ari-circle-v6.html", "utf8");
const js = fs.readFileSync("js/ari-circle/v6/intent-bundles-v1.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-intent-bundles.css", "utf8");

test("people-match RPC is adult gated and owns the viewer intent", () => {
  assert.match(migration, /ari_circle_assert_adult_access\(\)/);
  assert.match(migration, /i\.user_id\s*=\s*caller_id/);
  assert.match(migration, /i\.status\s*=\s*'active'/);
  assert.match(migration, /i\.expires_at\s*>\s*now\(\)/);
});

test("people-match RPC protects social boundaries and private intent data", () => {
  assert.match(migration, /ari_circle_user_is_adult\(candidate\.user_id\)/);
  assert.match(migration, /not public\.ari_circle_social_pair_is_blocked\(caller_id, candidate\.user_id\)/);
  assert.match(migration, /candidate\.time_window_start\s*<\s*viewer_intent\.time_window_end/);
  assert.match(migration, /candidate\.time_window_end\s*>\s*viewer_intent\.time_window_start/);

  const returns = migration.match(/returns table\(([\s\S]*?)\)\nlanguage plpgsql/i)?.[1] || "";
  assert.doesNotMatch(returns, /time_window_start|time_window_end|approximate_latitude|approximate_longitude|note/);
});

test("people matching scores activity, experience, intensity, group fit, location and prior history", () => {
  for (const token of [
    "activity_score",
    "experience_score",
    "intensity_score",
    "group_score",
    "location_score",
    "history_score"
  ]) {
    assert.match(migration, new RegExp(token));
  }
  assert.match(migration, /internal_match_score\s*>=\s*55/);
});

test("people matching is read-only and authenticated-only", () => {
  assert.doesNotMatch(migration, /\binsert\s+into\b/i);
  assert.doesNotMatch(migration, /\bupdate\s+public\./i);
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
  assert.match(migration, /revoke all on function public\.ari_circle_match_people_for_intent\(uuid, integer\) from public/);
  assert.match(migration, /revoke all on function public\.ari_circle_match_people_for_intent\(uuid, integer\) from anon/);
  assert.match(migration, /grant execute on function public\.ari_circle_match_people_for_intent\(uuid, integer\) to authenticated/);
});

test("V6 bundles combine people, opportunity and place without auto-actions", () => {
  assert.match(js, /ari_circle_match_people_for_intent/);
  assert.match(js, /ari_circle_match_opportunities/);
  assert.match(js, /ari_circle_list_places_for_intent/);
  assert.match(js, /ari_circle_list_my_action_intents/);
  assert.match(js, /compatibility suggestions only/i);
  assert.match(js, /not invited, accepted, or assumed to be attending/i);

  for (const forbidden of [
    "ari_circle_apply_join_intent",
    "ari_circle_join_quest",
    "ari_circle_create_crew",
    "ari_circle_review_meetup_request"
  ]) {
    assert.doesNotMatch(js, new RegExp(forbidden));
  }
});

test("V6 surface loads the bundle presentation and keeps For You intact", () => {
  assert.match(html, /id="v6IntentBundles"/);
  assert.match(html, /id="v6IntentBundleList"/);
  assert.match(html, /PEOPLE \+ PLACE \+ TIME/);
  assert.match(html, /ari-circle-v6-intent-bundles\.css\?v=1\.0\.0/);
  assert.match(html, /intent-bundles-v1\.js\?v=1\.1\.0/);
  assert.match(html, /id="v6ForYouList"/);
  assert.match(html, /for-you-commit-v1\.js\?v=1\.1\.0/);
  assert.match(css, /\.v6-intent-bundle/);
});

test("people cards link to profiles by handle and refresh with Circle changes", () => {
  assert.match(js, /ari-circle\.html\?handle=/);
  assert.match(js, /ari:circleChanged/);
  assert.match(js, /AriCircleIntentBundlesV1/);
  assert.match(js, /const VERSION = "1\.1\.0"/);
});
