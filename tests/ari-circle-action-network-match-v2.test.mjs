import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260825153000_ari_circle_action_network_match_v2.sql", import.meta.url),
  "utf8"
);

function stripSqlComments(sql = "") {
  return String(sql)
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const executable = stripSqlComments(migration);

test("Match Engine V2 preserves the private active-intent trust boundary", () => {
  assert.match(migration, /perform public\.ari_circle_assert_adult_access\(\)/i);
  assert.match(migration, /where i\.id = requested_intent_id/i);
  assert.match(migration, /and i\.user_id = caller_id/i);
  assert.match(migration, /and i\.status = 'active'/i);
  assert.match(migration, /and i\.expires_at > now\(\)/i);
});

test("Match Engine V2 still ranks normalized Opportunities with real time overlap", () => {
  assert.match(migration, /public\.ari_circle_list_opportunities\(/i);
  assert.match(migration, /array\['meetup','mission'\]/i);
  assert.match(migration, /o\.viewer_state = 'available'/i);
  assert.match(migration, /o\.starts_at < intent\.time_window_end/i);
  assert.match(migration, /o\.ends_at > intent\.time_window_start/i);
  assert.match(migration, /o\.spots_remaining is null or o\.spots_remaining > 0/i);
});

test("distance scoring comes only from curated public Mission Places", () => {
  assert.match(migration, /public\.ari_circle_list_places\(/i);
  assert.match(migration, /public\.ari_circle_mission_places/i);
  assert.match(migration, /on o\.opportunity_type = 'mission'/i);
  assert.match(migration, /md\.mission_id = o\.opportunity_id/i);
  assert.match(migration, /when o\.opportunity_type <> 'mission' or md\.distance_miles is null then 0/i);
  assert.match(migration, /requested_latitude => intent\.approximate_latitude/i);
  assert.match(migration, /requested_longitude => intent\.approximate_longitude/i);
  assert.match(migration, /'public_place_distance_miles', r\.distance_miles/i);

  // Match output can expose a distance to a public destination, but never the
  // caller's approximate coordinates or a Meetup/private meeting point.
  assert.doesNotMatch(migration, /jsonb_build_object\([\s\S]*?'(?:latitude|longitude|approximate_latitude|approximate_longitude)'/i);
  assert.doesNotMatch(executable, /meeting_point/i);
  assert.doesNotMatch(executable, /ari_circle_meetup_messages/i);
});

test("verified Action Graph history is a bounded organizer tie-breaker, not compatibility", () => {
  assert.match(migration, /public\.ari_circle_list_action_relationships\(100\)/i);
  assert.match(migration, /oh\.other_user_id = o\.organizer_user_id/i);
  assert.match(migration, /when coalesce\(oh\.completed_together, 0\) >= 3 then 8/i);
  assert.match(migration, /when coalesce\(oh\.completed_together, 0\) = 2 then 6/i);
  assert.match(migration, /when coalesce\(oh\.completed_together, 0\) = 1 then 4/i);
  assert.match(migration, /else 0\s+end as organizer_history_score/i);
  assert.doesNotMatch(executable, /compatibility_score|star_rating|attractiveness|personality_match/i);
});

test("missing Place and organizer-history signals are neutral rather than penalties", () => {
  assert.match(migration, /md\.distance_miles is null then 0/i);
  assert.match(migration, /coalesce\(oh\.completed_together, 0\)/i);
  assert.match(migration, /A user[\s\S]*with no history is not penalized/i);
  assert.match(migration, /'distance_scored', r\.distance_miles is not null/i);
  assert.match(migration, /'experience_scored', r\.organizer_completed_together is not null/i);
});

test("activity and time remain dominant over distance and prior familiarity", () => {
  assert.match(migration, /when o\.activity = intent\.activity then 45/i);
  assert.match(migration, /then 30\s+else 24\s+end as time_score/i);
  assert.match(migration, /when md\.distance_miles <= 2 then 12/i);
  assert.match(migration, /when coalesce\(oh\.completed_together, 0\) >= 3 then 8/i);
  assert.match(migration, /s\.activity_score[\s\S]*\+ s\.time_score[\s\S]*\+ s\.distance_score[\s\S]*\+ s\.organizer_history_score/i);
});

test("Match Engine V2 explains grounded signals without showing a fake compatibility percentage", () => {
  assert.match(migration, /At a public Place within about 2 miles of your search area/i);
  assert.match(migration, /At a public Place inside your selected search radius/i);
  assert.match(migration, /You have repeatedly completed activities with this organizer/i);
  assert.match(migration, /You have completed an activity with this organizer before/i);
  assert.match(migration, /'match_version', 'action_match_v2'/i);
  assert.match(migration, /raw match_score is retained only for backward-compatible ordering/i);
});

test("Match Engine V2 cannot buy ranking with XP, payment, popularity, or engagement", () => {
  assert.match(migration, /Reward XP remains display metadata only/i);
  assert.match(migration, /excluded[\s\S]*from internal_match_score/i);

  for (const forbidden of [
    /\bpremium\b/i,
    /\bsubscription\b/i,
    /\bsponsor(?:ed|ship)?\b/i,
    /\bfollowers?\b/i,
    /\blikes\b/i,
    /\breactions?\b/i,
    /\bpopularity(?:_score)?\b/i,
    /\bengagement_(?:score|count|rate)\b/i,
    /\bpaid_rank\b/i
  ]) {
    assert.doesNotMatch(executable, forbidden);
  }
});

test("Match Engine V2 preserves deterministic ordering and the stable RPC signature", () => {
  assert.match(migration, /create or replace function public\.ari_circle_match_opportunities\(/i);
  assert.match(migration, /match_score integer/i);
  assert.match(migration, /match_reasons text\[\]/i);
  assert.match(migration, /r\.internal_match_score desc/i);
  assert.match(migration, /r\.starts_at asc/i);
  assert.match(migration, /r\.opportunity_key asc/i);
  assert.match(migration, /grant execute on function public\.ari_circle_match_opportunities\(uuid,integer\) to authenticated, service_role/i);
  assert.doesNotMatch(migration, /grant execute[^;]+to anon/i);
});
