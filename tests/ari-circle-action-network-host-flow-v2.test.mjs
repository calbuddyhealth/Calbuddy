import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const meetupHtml = await readFile(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const connectController = await readFile(new URL("../js/ari-circle/connect/connect-v1.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260826050000_ari_circle_host_flow_v2.sql", import.meta.url), "utf8");
const retirement = await readFile(new URL("../supabase/migrations/20260923121000_ari_circle_retire_xp_completion.sql", import.meta.url), "utf8");

test("simplified Connect controller remains valid browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(connectController));
  assert.match(connectController, /const VERSION = "1\.0\.0"/);
  assert.match(meetupHtml, /connect-v1\.js\?v=1\.0\.0/);
  assert.doesNotMatch(meetupHtml, /meetups-v5\.js/);
});

test("host request review remains capacity-aware", () => {
  assert.match(connectController, /function guestSpotsOpen/);
  assert.match(connectController, /const openSpots = guestSpotsOpen\(row\)/);
  assert.match(connectController, /canAccept = canReview && openSpots > 0/);
  assert.match(connectController, /data-permanent-disabled="true" disabled/);
  assert.match(connectController, /canAccept \? "Accept" : "Full"/);
});

test("accepting a request refreshes meetup state before rebuilding the queue", () => {
  assert.match(connectController, /await loadMeetups\(\);\s*state\.requestMeetup = state\.rows\.find[\s\S]*?await loadRequests\(\);/);
  assert.doesNotMatch(connectController, /Promise\.all\(\[loadRequests\(\), loadMeetups\(\)\]\)/);
});

test("legacy Host progression is no longer part of the active Connect controller", () => {
  assert.doesNotMatch(connectController, /ari_circle_my_host_summary/);
  assert.doesNotMatch(connectController, /verified_hosted_meetups/);
  assert.doesNotMatch(connectController, /leadership_tier/);
  assert.doesNotMatch(connectController, /\bXP\b/);
});

test("historical host-flow migration remains readable for compatibility only", () => {
  assert.match(migration, /ari_circle_my_host_summary\(\)/);
  assert.match(retirement, /revoke all on function public\.ari_circle_my_host_summary\(\)/i);
  assert.match(retirement, /ari_circle_award_xp_capped/i);
  assert.match(retirement, /select 0::integer/i);
});
