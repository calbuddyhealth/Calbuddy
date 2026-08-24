import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const navJs = fs.readFileSync("js/ari-circle/primary-nav.js", "utf8");
const v5Shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const v5Css = fs.readFileSync("assets/css/ari-circle-v5-real-world.css", "utf8");
const v4Ui = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");

test("ARI Circle V5 primary navigation is Feed, Meet Up, Quests", () => {
  assert.match(navJs, /const ORDER = \["Feed", "Meet Up", "Quests"\]/);
  assert.match(v5Shell, /ari-circle-feed\.html[\s\S]*Feed/);
  assert.match(v5Shell, /ari-circle-meetup\.html[\s\S]*Meet Up/);
  assert.match(v5Shell, /ari-circle-quests\.html[\s\S]*Quests/);
  assert.doesNotMatch(navJs, /const ORDER = \["Feed", "Buddies"/);
});

test("Profile is intentionally outside the three-tab primary navigation", () => {
  assert.match(v4Ui, /ari-circle-feed\.html">Feed<\/a><a href="ari-circle-meetup\.html">Meet Up<\/a><a href="ari-circle-quests\.html">Quests<\/a>/);
  assert.doesNotMatch(v4Ui, /ari-circle-quests\.html">Quests<\/a><a[^>]+ari-circle\.html[^>]*>Profile/);
});

test("ARI Circle V5 uses a native-safe premium bottom dock", () => {
  assert.match(v5Css, /\.circle-v5-bottom-nav\s*\{/);
  assert.match(v5Css, /env\(safe-area-inset-bottom\)/);
  assert.match(v5Css, /grid-template-columns:\s*repeat\(3/);
  assert.match(v5Css, /backdrop-filter:\s*blur\(30px\) saturate\(160%\)/);
});

test("legacy Buddies and Challenges routes redirect into the new product", () => {
  assert.match(v5Shell, /ari-circle-partners\.html/);
  assert.match(v5Shell, /location\.replace\(`ari-circle-meetup\.html/);
  assert.match(v5Shell, /ari-circle-challenges\.html/);
  assert.match(v5Shell, /location\.replace\(`ari-circle-quests\.html/);
});
