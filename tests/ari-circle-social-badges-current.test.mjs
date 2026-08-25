import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const badges = fs.readFileSync("js/ari-circle/social-badges.js", "utf8");

test("Circle request badges target Discover Friends instead of retired Buddies routes", () => {
  assert.match(badges, /const VERSION = "1\.2\.0"/);
  assert.match(badges, /panel=discover-friends/);
  assert.match(badges, /getRequestCount/);
  assert.match(badges, /counts: \{ activity: 0, messages: 0, requests: 0 \}/);
  assert.doesNotMatch(badges, /ari-circle-partners\.html/);
  assert.doesNotMatch(badges, /getBuddyCount/);
  assert.doesNotMatch(badges, /Buddies tab/);
});

test("badge cache reads the old buddies key only as a migration fallback", () => {
  assert.match(badges, /parsed\.requests \?\? parsed\.buddies/);
  assert.doesNotMatch(badges, /state\.counts\.buddies/);
});