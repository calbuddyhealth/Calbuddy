import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const forYou = fs.readFileSync("ari-circle-v6.html", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const explore = fs.readFileSync("ari-circle-explore.html", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-experience.css", "utf8");

test("Circle has exactly one three-destination primary navigation contract", () => {
  const navCalls = [...shell.matchAll(/navLink\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g)]
    .map((match) => match.slice(1));
  assert.deepEqual(navCalls, [
    ["foryou", "ari-circle-v6.html", "For You"],
    ["meetup", "ari-circle-meetup.html", "Meet Up"],
    ["feed", "ari-circle-feed.html", "Feed"]
  ]);
});

test("For You does not recreate primary navigation or a Moments destination", () => {
  assert.doesNotMatch(forYou, /v6-mode-nav/);
  assert.doesNotMatch(forYou, /v6MomentsBridge|v6-moments-bridge/);
  assert.doesNotMatch(css, /v6-mode-nav|v6-moments-bridge/);
  assert.match(forYou, /Open Explore →/);
  assert.match(forYou, /id="crews"/);
});

test("Feed owns Moments without a second navigation row", () => {
  assert.doesNotMatch(feed, /class="feed-tabs"/);
  assert.match(feed, /id="momentsTitle">Moments/);
  assert.match(feed, /id="streamTitle">Your Feed/);
});

test("Profile removes its legacy primary links instead of duplicating the shell", () => {
  assert.match(profileCompat, /removeLegacyProfileNav/);
  assert.match(profileCompat, /\$\("circleV3Nav"\)\?\.remove\(\)/);
  assert.doesNotMatch(profileCompat, /nav\.innerHTML\s*=\s*`/);
});

test("secondary drawer does not duplicate For You, Meet Up, or Feed", () => {
  assert.match(menu, /label: "Profile"/);
  assert.match(menu, /label: "Quests"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-v6\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
});

test("ARI CIRCLE wordmark consistently returns to For You on updated surfaces", () => {
  assert.match(shell, /brand\.setAttribute\("href", "ari-circle-v6\.html"\)/);
  assert.match(feed, /href="ari-circle-v6\.html" aria-label="ARI Circle For You"/);
  assert.match(explore, /href="ari-circle-v6\.html" aria-label="ARI Circle For You"/);
  assert.match(profileCompat, /brand\.href = "ari-circle-v6\.html"/);
});