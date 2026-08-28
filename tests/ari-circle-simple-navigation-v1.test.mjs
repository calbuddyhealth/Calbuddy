import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const ariNext = fs.readFileSync("ari-circle-v6.html", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-experience.css", "utf8");

test("Circle primary navigation keeps ARI Next behind verified owner access", () => {
  const navCalls = [...shell.matchAll(/navLink\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g)]
    .map((match) => match.slice(1));
  assert.deepEqual(navCalls, [
    ["feed", "ari-circle-feed.html", "Feed"],
    ["connect", "ari-circle-meetup.html", "Connect"],
    ["arinext", "ari-circle-v6.html", "ARI Next"]
  ]);
  assert.match(shell, /NAV_MODEL = "feed-connect-owner-ari-next"/);
  assert.match(shell, /ownerAccess \? navLink\("arinext", "ari-circle-v6\.html", "ARI Next"\) : ""/);
  assert.match(shell, /fetch\("\/api\/ari-github-read"/);
  assert.match(shell, /payload\?\.isOwner === true/);
});

test("ARI Next and Explore fail closed for non-owner direct navigation", () => {
  assert.match(shell, /function isOwnerOnlyPath\(\)/);
  assert.match(shell, /ari-circle-v6\.html/);
  assert.match(shell, /ari-circle-explore/);
  assert.match(shell, /document\.documentElement\.style\.visibility = "hidden"/);
  assert.match(shell, /window\.location\.replace\(OWNER_ROUTE_FALLBACK\)/);
  assert.match(shell, /OWNER_ROUTE_FALLBACK = "ari-circle-feed\.html"/);
});

test("ARI Next is the Ari-driven recommendation surface without duplicate location questions", () => {
  assert.match(ariNext, /<title>ARI Next \| ARI Circle<\/title>/);
  assert.match(ariNext, />ARI NEXT<\/span>/);
  assert.match(ariNext, /What are you up for\?/);
  assert.match(ariNext, /id="v6ForYouTitle">Best next<\/h2>/);
  assert.match(ariNext, /type="hidden" id="v6IntentRadius"/);
  assert.match(ariNext, /type="hidden" id="v6IntentArea"/);
  assert.doesNotMatch(ariNext, /<label><span>Distance<\/span>/);
  assert.doesNotMatch(ariNext, /class="v6-area-field"/);
  assert.match(ariNext, /automatically uses your saved Circle search area and distance/i);
  assert.doesNotMatch(ariNext, /v6-mode-nav/);
  assert.doesNotMatch(ariNext, /v6MomentsBridge|v6-moments-bridge/);
  assert.doesNotMatch(css, /v6-mode-nav|v6-moments-bridge/);
});

test("Connect owns Meetups and Missions as peer modes instead of separate primary tabs", () => {
  assert.match(shell, /function ensureConnectModeNav\(\)/);
  assert.match(shell, /aria-label", "Connect sections"/);
  assert.match(shell, /href="ari-circle-meetup\.html"/);
  assert.match(shell, />Meetups<\/a>/);
  assert.match(shell, /href="ari-circle-quests\.html"/);
  assert.match(shell, />Missions<\/a>/);
  assert.match(shell, /ari-circle-meetup.*return "connect"/s);
  assert.match(shell, /ari-circle-quest.*return "connect"/s);
  assert.doesNotMatch(shell, /navLink\("quests"|navLink\("missions"|navLink\("meetup"/);
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

test("secondary drawer does not become another Connect navigation surface", () => {
  assert.match(menu, /label: "Profile"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-meetup\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-feed\.html"/);
  assert.doesNotMatch(menu, /item\(\{ href: "ari-circle-v6\.html"/);
  assert.match(shell, /function removeRedundantQuestDrawerLink\(\)/);
  assert.match(shell, /a\[href="ari-circle-quests\.html"\]/);
});

test("ARI CIRCLE wordmark returns members to Feed and owners to ARI Next", () => {
  assert.match(shell, /brand\.setAttribute\("href", ownerAccess \? "ari-circle-v6\.html" : "ari-circle-feed\.html"\)/);
  assert.match(shell, /brand\.setAttribute\("aria-label", ownerAccess \? "ARI Circle ARI Next" : "ARI Circle Feed"\)/);
});