import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const meetup = fs.readFileSync("ari-circle-meetup.html", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");

test("Circle primary navigation is only Connect and Profile", () => {
  const navCalls = [...shell.matchAll(/navLink\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g)]
    .map((match) => match.slice(1));
  assert.deepEqual(navCalls, [
    ["connect", "ari-circle-meetup.html", "Connect"],
    ["profile", "ari-circle.html", "Profile"]
  ]);
  assert.match(shell, /NAV_MODEL = "connect-profile-v1"/);
  assert.doesNotMatch(shell, /navLink\("feed"/);
  assert.doesNotMatch(shell, /navLink\("arinext"/);
});

test("experimental owner routes still fail closed when opened directly", () => {
  assert.match(shell, /function isOwnerOnlyPath\(\)/);
  assert.match(shell, /ari-circle-v6\.html/);
  assert.match(shell, /ari-circle-explore/);
  assert.match(shell, /ari-circle-quest/);
  assert.match(shell, /fetch\("\/api\/ari-github-read"/);
  assert.match(shell, /payload\?\.isOwner === true/);
  assert.match(shell, /window\.location\.replace\(ownerRouteFallback\(\)\)/);
});

test("legacy Feed route redirects to Connect", () => {
  assert.match(feed, /window\.location\.replace\("ari-circle-meetup\.html"\)/);
  assert.match(feed, /Feed is retired as a member-facing surface/);
});

test("Connect is activity-first and keeps controls compact", () => {
  assert.match(meetup, /id="hostMeetupButton"[\s\S]*circle-connect-action__label">Host<\/span>/);
  assert.match(meetup, /href="ari-circle-friends\.html"[\s\S]*circle-connect-action__label">Find Friends<\/span>/);
  assert.doesNotMatch(meetup, /Find something to do\./);
  assert.match(meetup, /WHAT ARE YOU UP FOR\?/);
  assert.match(meetup, /HAPPENING NOW/);
  assert.match(meetup, /THIS WEEKEND/);
  assert.match(meetup, /data-ari-circle-search-location data-surface="meetup"/);
  assert.doesNotMatch(meetup, /REAL WORLD XP/);
});

test("Profile is first-class and its wordmark returns to Connect", () => {
  assert.match(profileCompat, /removeLegacyProfileNav/);
  assert.match(profileCompat, /brand\.href = "ari-circle-meetup\.html"/);
  assert.match(profileCompat, /circleV3ProfileTabs/);
  assert.match(profileCompat, /circleV3PostsPanel/);
});

test("drawer contains secondary controls, not competing primary tabs", () => {
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Discover Friends"/);
  assert.doesNotMatch(menu, /label: "Quests"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
});

test("ARI CIRCLE wordmark returns to Connect", () => {
  assert.match(shell, /brand\.setAttribute\("href", "ari-circle-meetup\.html"\)/);
  assert.match(shell, /brand\.setAttribute\("aria-label", "ARI Circle Connect"\)/);
});
