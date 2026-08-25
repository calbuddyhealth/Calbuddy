import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-explore.html", import.meta.url), "utf8");
const controller = await readFile(new URL("../js/ari-circle/explore/explore-v1.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-explore-v1.css", import.meta.url), "utf8");

test("Explore V1 is an Action Network surface centered on Opportunities and public Places", () => {
  assert.match(html, /<h1 id="exploreTitle">Explore<\/h1>/i);
  assert.match(html, /Find something worth doing—not people to scroll through/i);
  assert.match(html, /id="exploreOpportunityList"/i);
  assert.match(html, /id="explorePlaceList"/i);
  assert.match(html, /GO SOMEWHERE/i);
});

test("Explore controller is valid browser JavaScript and reads through guarded RPCs only", () => {
  assert.doesNotThrow(() => new Function(controller));
  for (const rpc of [
    "ari_circle_list_opportunities",
    "ari_circle_list_my_action_intents",
    "ari_circle_list_places",
    "ari_circle_list_places_for_intent"
  ]) {
    assert.match(controller, new RegExp(rpc));
  }
  assert.doesNotMatch(controller, /\.from\s*\(/);
  assert.doesNotMatch(controller, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Explore V1 never requests browser GPS or live user presence", () => {
  assert.doesNotMatch(controller, /navigator\.geolocation/i);
  assert.doesNotMatch(controller, /watchPosition|getCurrentPosition/i);
  assert.doesNotMatch(controller, /ari_circle_presence|currently_here|live users?/i);
  assert.doesNotMatch(html, /location permission|share your location/i);
});

test("nearby Place ranking reuses a private expiring Action Intent instead of exposing coordinates", () => {
  assert.match(controller, /activeIntent\(\)/);
  assert.match(controller, /ari_circle_list_places_for_intent/);
  assert.match(html, /privacy-safe nearby ranking/i);
  assert.doesNotMatch(controller, /approximate_latitude|approximate_longitude/);
});

test("manual area search sends no coordinates", () => {
  assert.match(controller, /requested_area: state\.area \|\| null/);
  assert.match(controller, /requested_latitude: null/);
  assert.match(controller, /requested_longitude: null/);
});

test("Explore does not expose engagement or popularity ranking", () => {
  assert.doesNotMatch(controller, /\b(likes|reactions|followers|views|popularity_score|sponsored_rank|premium_rank)\b/i);
  assert.doesNotMatch(html, /Most Popular|Trending People|Top Users/i);
});

test("Explore does not make ungrounded proximity claims without a distance result", () => {
  assert.match(controller, /Number\.isFinite\(distance\)/);
  assert.match(controller, /mi from your intent area/);
  assert.doesNotMatch(html, />Nearby</i);
});

test("Explore remains a lab route and does not replace current Circle navigation yet", () => {
  assert.match(html, /ari-circle-explore-v1\.css\?v=1\.0\.0/);
  assert.match(html, /explore-v1\.js\?v=1\.0\.0/);
  assert.match(css, /\.circle-explore-card/);
  assert.match(css, /\.circle-explore-place-card/);
});
