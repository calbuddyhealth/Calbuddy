import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("ari-circle-v6.html", "utf8");
const runtime = fs.readFileSync("js/ari-circle/v6/action-network-v6.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-experience.css", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260825101500_ari_circle_action_network_intent_v1.sql",
  "utf8"
);

test("V6 exposes the five server-supported search distances with 25 miles as default", () => {
  assert.match(html, /id="v6IntentRadius"/);
  for (const radius of [5, 10, 25, 50, 100]) {
    assert.match(html, new RegExp(`<option value="${radius}"`));
  }
  assert.match(html, /<option value="25" selected>25 mi<\/option>/);
  assert.match(migration, /radius_miles smallint not null default 25 check \(radius_miles in \(5,10,25,50,100\)\)/i);
});

test("the selected radius is validated and sent through the canonical Action Intent RPC", () => {
  assert.match(runtime, /ALLOWED_RADIUS_MILES = new Set\(\[5, 10, 25, 50, 100\]\)/);
  assert.match(runtime, /v6IntentRadius/);
  assert.match(runtime, /if \(!ALLOWED_RADIUS_MILES\.has\(radius\)\)/);
  assert.match(runtime, /requested_radius_miles:\s*radius/);
  assert.doesNotMatch(runtime, /requested_radius_miles:\s*25\s*[,}]/);
});

test("active intents show their saved distance and restore it in the composer", () => {
  assert.match(runtime, /preferredRadius = Number\(rows\[0\]\?\.radiusMiles\)/);
  assert.match(runtime, /radiusControl\.value = String\(preferredRadius\)/);
  assert.match(runtime, /within \$\{escapeHtml\(radiusLabel\)\}/);
});

test("distance remains a privacy-safe preference rather than an exact meetup location surface", () => {
  assert.match(html, /Distance guides nearby matching when an approximate location is available/i);
  assert.match(html, /No automatic GPS prompt/i);
  assert.match(html, /exact meetup points stay protected/i);
  assert.doesNotMatch(runtime, /navigator\.geolocation/i);
  assert.match(runtime, /requested_latitude:\s*null/);
  assert.match(runtime, /requested_longitude:\s*null/);
});

test("the extra control keeps the composer compact across desktop and mobile", () => {
  assert.match(css, /\.v6-intent-composer\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.v6-area-field\{grid-column:span 3\}/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.v6-intent-composer\{grid-template-columns:1fr 1fr/);
  assert.match(css, /@media\(max-width:430px\)[\s\S]*\.v6-intent-composer\{grid-template-columns:1fr\}/);
});
