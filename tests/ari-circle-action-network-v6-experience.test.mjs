import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const controller = await readFile(new URL("../js/ari-circle/v6/action-network-v6.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-circle-v6-experience.css", import.meta.url), "utf8");
const productionMenu = await readFile(new URL("../js/ari-circle/circle-menu-v5.js", import.meta.url), "utf8");
const shell = await readFile(new URL("../js/ari-circle/v5-real-world.js", import.meta.url), "utf8");
const homeHtml = await readFile(new URL("../home.html", import.meta.url), "utf8");
const legacyProfileHtml = await readFile(new URL("../ari-circle.html", import.meta.url), "utf8");

test("ARI Next is one integrated Action Network intelligence surface rather than another feed or manual browser", () => {
  assert.match(html, /<title>ARI Next \| ARI Circle<\/title>/i);
  assert.match(html, /What are you up for\?/i);
  assert.match(html, /id="v6ForYouTitle"[^>]*>Best next</i);
  assert.match(html, /href="ari-circle-explore\.html"/i);
  assert.match(html, /id="crews"/i);
  assert.match(html, /BEST NEXT ACTIONS/i);
  assert.match(html, /GO SOMEWHERE/i);
  assert.match(html, /PEOPLE YOU ACTUALLY DO THINGS WITH/i);
  assert.match(controller, /activity first, content second/i);
  assert.doesNotMatch(html, /class="v6-mode-nav"/i);
  assert.doesNotMatch(html, /v6MomentsBridge|v6-moments-bridge/i);
  assert.doesNotMatch(html, /Trending People|Top Users|Most Popular/i);
});

test("V6 controller is valid browser JavaScript and reads sanitized server Action Network context", () => {
  assert.doesNotThrow(() => new Function(controller));
  assert.match(controller, /fetch\("\/api\/ari-vnext-circle-context"/);
  assert.match(controller, /Authorization: `Bearer \$\{token\}`/);
  assert.match(controller, /data\?\.available !== true/);
  assert.doesNotMatch(controller, /\.from\s*\(/);
  assert.doesNotMatch(controller, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("What are you up for creates only private expiring Action Intents without browser GPS", () => {
  assert.match(controller, /ari_circle_create_action_intent/);
  assert.match(controller, /ari_circle_cancel_action_intent/);
  assert.match(controller, /requested_latitude: null/);
  assert.match(controller, /requested_longitude: null/);
  assert.match(controller, /requested_area: area/);
  assert.match(controller, /requested_radius_miles: radius/);
  assert.match(controller, /requested_time_window_start/);
  assert.match(controller, /requested_time_window_end/);
  assert.doesNotMatch(controller, /navigator\.geolocation|getCurrentPosition|watchPosition/i);
  assert.doesNotMatch(controller, /ari_circle_presence|currently_here|live users?/i);
  assert.match(html, /type="hidden" id="v6IntentRadius" value="25"/);
  assert.match(html, /type="hidden" id="v6IntentArea" value=""/);
  assert.doesNotMatch(html, /<label><span>Distance<\/span>/);
  assert.doesNotMatch(html, /class="v6-area-field"/);
});

test("V6 renders multiple active intents truthfully instead of silently choosing one", () => {
  assert.match(controller, /renderActiveIntents\(context\.activeIntents \|\| \[\]\)/);
  assert.match(controller, /intents\.slice\(0, 3\)/);
  assert.match(controller, /Clear \$\{activityLabel\(activity\)\} intent/);
  assert.match(html, /automatically uses your saved Circle search area and distance/i);
  assert.match(html, /Exact meetup points stay protected/i);
});

test("ARI Next exposes reasons and outcomes without exposing the internal Match Engine score", () => {
  assert.match(controller, /item\?\.matchReasons/);
  assert.match(controller, /BEST FIT/);
  assert.doesNotMatch(controller, /\bmatchScore\b|\bmatch_score\b/);
  assert.doesNotMatch(html, /compatibility\s*[:=]|match score|% compatible/i);
  assert.doesNotMatch(controller, /\b(likes|followers|views|popularity_score|sponsored_rank|premium_rank)\b/i);
});

test("Needs attention surfaces meaningful state changes without becoming a generic notification feed", () => {
  assert.match(html, /id="v6Attention"/);
  assert.match(html, /Needs attention/i);
  for (const eventType of ["meetup.accepted","meetup.cancelled","meetup.waitlisted","meetup.declined","meetup.requested","mission.progress_submitted","mission.progress_verified","mission.progress_rejected","mission.objective_reached","meetup.spot_opened","crew.invited"]) {
    assert.match(controller, new RegExp(eventType.replace(".", "\\.")));
  }
  assert.match(controller, /unique\.length >= 5/);
});

test("Crew actions use only guarded Crew RPCs and never accept arbitrary member identities", () => {
  for (const rpc of ["ari_circle_create_crew","ari_circle_respond_crew_invite","ari_circle_leave_crew","ari_circle_archive_crew"]) assert.match(controller, new RegExp(rpc));
  assert.match(controller, /requested_candidate_key: candidateKey/);
  assert.match(controller, /requested_operation_id: operationId/);
  assert.doesNotMatch(controller, /requested_member_ids|member_ids\s*:|add_member|remove_member|invite_user/i);
  assert.doesNotMatch(controller, /\.from\s*\(/);
});

test("Crew creation preserves one retry identity and founding consent remains explicit", () => {
  assert.match(controller, /crewCreateOperationIds: new Map\(\)/);
  assert.match(controller, /function crewOperationId/);
  assert.match(controller, /if \(state\.crewCreateOperationIds\.has\(candidateKey\)\)/);
  assert.match(controller, /state\.crewCreateOperationIds\.delete\(candidateKey\)/);
  assert.match(controller, /Creating a Crew sends invitations; nobody is silently added/i);
  assert.match(controller, /Crew created\. The other founding members were invited/i);
});

test("destructive Crew decisions require an explicit confirmation in the direct UI path", () => {
  assert.match(controller, /window\.confirm\("Decline this Crew invitation\?"\)/);
  assert.match(controller, /window\.confirm\(`Leave \$\{clean\(name, 60\)/);
  assert.match(controller, /window\.confirm\(`Archive \$\{clean\(name, 60\)/);
  assert.match(controller, /crew\?\.viewerRole === "owner"/);
});

test("Circle mutations invalidate Ari Circle context instead of leaving stale shared state", () => {
  assert.match(controller, /new CustomEvent\("ari:circleChanged"/);
  assert.match(controller, /source: "circle_v6_experience"/);
  assert.match(controller, /source: "circle_v6_intent"/);
  assert.match(controller, /await loadContext\(\);\s*render\(\);/);
});

test("ARI Next stays mobile and Safari-safe without a second sticky navigation bar", () => {
  assert.match(css, /env\(safe-area-inset-bottom,0px\)/);
  assert.match(css, /\.v6-primary-link\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(max-width:430px\)/);
  assert.match(css, /\.v6-opportunity-grid,\.v6-place-grid,\.v6-crew-grid\{grid-template-columns:1fr\}/);
  assert.match(css, /\.v6-crew-create\{grid-template-columns:1fr\}/);
  assert.doesNotMatch(css, /v6-mode-nav|v6-moments-bridge/);
});

test("Feed Connect ARI Next is the primary model while deeper features remain reachable", () => {
  assert.doesNotMatch(html, /REAL-WORLD ACTION NETWORK · LAB/i);
  assert.match(html, /ari-circle-v6-experience\.css\?v=0\.3\.1/);
  assert.match(html, /action-network-v6\.js\?v=0\.3\.0/);
  assert.match(html, /circle-menu-v5\.js\?v=2\.5\.0/);
  assert.match(html, /v5-real-world\.js\?v=5\.3\.0/);
  assert.match(homeHtml, /href="ari-circle-v6\.html"[^>]*class="ari-nav-link nav-circle"/i);
  assert.match(legacyProfileHtml, /id="circle-profile"/i);
  assert.match(shell, /navLink\("feed", "ari-circle-feed\.html", "Feed"\)/);
  assert.match(shell, /navLink\("connect", "ari-circle-meetup\.html", "Connect"\)/);
  assert.match(shell, /navLink\("arinext", "ari-circle-v6\.html", "ARI Next"\)/);
  assert.match(shell, /ensureConnectModeNav/);
  assert.match(shell, />Meetups<\/a>/);
  assert.match(shell, />Missions<\/a>/);
  assert.match(productionMenu, /ari-circle\.html\?panel=notifications/i);
  assert.match(shell, /removeRedundantQuestDrawerLink/);
  assert.doesNotMatch(productionMenu, /item\(\{ href: "ari-circle-meetup\.html"/i);
});