import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("ari-circle-v6.html", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const runtime = fs.readFileSync("js/ari-circle/v6/action-network-v6.js", "utf8");
const locationRuntime = fs.readFileSync("js/ari-circle/location/search-location-v1.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-experience.css", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260825101500_ari_circle_action_network_intent_v1.sql",
  "utf8"
);

test("Connect owns the visible distance control while ARI Next consumes the shared preference silently", () => {
  assert.match(meetupHtml, /data-ari-circle-search-location data-surface="meetup"/);
  assert.match(html, /data-ari-circle-search-location data-surface="ari-next" hidden aria-hidden="true"/);
  assert.match(html, /type="hidden" id="v6IntentRadius" value=""/);
  assert.match(html, /type="hidden" id="v6IntentArea" value=""/);
  assert.doesNotMatch(html, /<label><span>Distance<\/span>/i);
  assert.doesNotMatch(html, /<option value="(?:5|10|25|50|100)"[^>]*>\d+ mi<\/option>/i);
  assert.match(html, /Search controls live in Connect → Meetups/i);
});

test("the shared preference restores ARI Next area and distance before Action Intent submission", () => {
  assert.match(locationRuntime, /const ALLOWED_RADII = new Set\(\[5, 10, 25, 50, 100\]\)/);
  assert.match(locationRuntime, /const v6Radius = document\.getElementById\("v6IntentRadius"\)/);
  assert.match(locationRuntime, /v6Radius\.value = String\(pref\.radiusMiles\)/);
  assert.match(locationRuntime, /const v6Area = document\.getElementById\("v6IntentArea"\)/);
  assert.match(locationRuntime, /v6Area\.value = pref\.areaLabel/);
  assert.match(runtime, /requested_area:\s*area/);
  assert.match(runtime, /requested_radius_miles:\s*radius/);
  assert.doesNotMatch(runtime, /navigator\.geolocation|getCurrentPosition|watchPosition/i);
});

test("the server remains authoritative about supported Action Intent radii", () => {
  assert.match(runtime, /ALLOWED_RADIUS_MILES = new Set\(\[5, 10, 25, 50, 100\]\)/);
  assert.match(runtime, /if \(!ALLOWED_RADIUS_MILES\.has\(radius\)\)/);
  assert.match(migration, /radius_miles smallint not null default 25 check \(radius_miles in \(5,10,25,50,100\)\)/i);
});

test("location permission exists only in the shared explicit-action control and exact meetup points stay protected", () => {
  assert.match(locationRuntime, /data-circle-use-current/);
  assert.match(locationRuntime, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(locationRuntime, /Current location is requested only after you tap the button/i);
  assert.match(html, /Exact meetup points stay protected/i);
  assert.doesNotMatch(runtime, /meeting_point|exact meetup point/i);
});

test("the simplified ARI Next composer remains compact across desktop and mobile", () => {
  assert.match(css, /\.v6-intent-composer\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.v6-intent-composer\{grid-template-columns:1fr 1fr/);
  assert.match(css, /@media\(max-width:430px\)[\s\S]*\.v6-intent-composer\{grid-template-columns:1fr\}/);
});