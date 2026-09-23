import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const meetup = fs.readFileSync("ari-circle-meetup.html", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");

test("Circle primary navigation is only Feed and Connect", () => {
  const navCalls = [...shell.matchAll(/navLink\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g)]
    .map((match) => match.slice(1));
  assert.deepEqual(navCalls, [
    ["feed", "ari-circle-feed.html", "Feed"],
    ["connect", "ari-circle-meetup.html", "Connect"]
  ]);
  assert.match(shell, /NAV_MODEL = "feed-connect-v1"/);
  assert.doesNotMatch(shell, /navLink\("arinext"/);
  assert.doesNotMatch(shell, />Missions<\/a>/);
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

test("Feed no longer exposes photo posting or Moments", () => {
  assert.match(feed, /Share an update/);
  assert.match(feed, /Friends only/);
  assert.doesNotMatch(feed, /Camera \/ Library/);
  assert.doesNotMatch(feed, /Make it a Moment/);
  assert.doesNotMatch(feed, /id="momentsTitle"/);
});

test("Connect is activity-first and keeps controls compact", () => {
  assert.match(meetup, /Find something to do\./);
  assert.match(meetup, /WHAT ARE YOU UP FOR\?/);
  assert.match(meetup, /HAPPENING NOW/);
  assert.match(meetup, /THIS WEEKEND/);
  assert.match(meetup, /data-ari-circle-search-location data-surface="meetup"/);
  assert.doesNotMatch(meetup, /REAL WORLD XP/);
  assert.doesNotMatch(meetup, /Complete Meetup/);
});

test("Profile remains secondary and returns to Feed", () => {
  assert.match(profileCompat, /removeLegacyProfileNav/);
  assert.match(profileCompat, /brand\.href = "ari-circle-feed\.html"/);
  assert.match(profileCompat, /circleV3ProfileTabs/);
  assert.match(profileCompat, /circleV3PostsPanel/);
});

test("drawer contains secondary controls, not competing primary tabs", () => {
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Discover Friends"/);
  assert.doesNotMatch(menu, /label: "Quests"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-v6\.html"/);
});

test("ARI CIRCLE wordmark returns to Feed", () => {
  assert.match(shell, /brand\.setAttribute\("href", "ari-circle-feed\.html"\)/);
  assert.match(shell, /brand\.setAttribute\("aria-label", "ARI Circle Feed"\)/);
});
