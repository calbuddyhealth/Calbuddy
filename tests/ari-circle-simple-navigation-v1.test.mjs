import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const ariNext = fs.readFileSync("ari-circle-v6.html", "utf8");
const ownerBeta = fs.readFileSync("js/ari-circle/v6/ari-next-owner-beta-v1.js", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const profileCompat = fs.readFileSync("js/ari-circle/v4-ui.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-v6-experience.css", "utf8");

test("Circle public navigation is Feed + Connect and ARI Next is conditional owner beta", () => {
  assert.match(shell, /navLink\("feed", "ari-circle-feed\.html", "Feed"\)/);
  assert.match(shell, /navLink\("connect", "ari-circle-meetup\.html", "Connect"\)/);
  assert.match(shell, /if \(ownerBetaAccess\) links\.push\(navLink\("arinext", "ari-circle-v6\.html", "ARI Next"\)\)/);
  assert.match(shell, /feed-connect-public/);
  assert.match(shell, /feed-connect-ari-next-owner-beta/);
  assert.match(shell, /ownerBetaAccess \? 3 : 2/);
  assert.match(shell, /\/api\/ari-github-read/);
});

test("ARI Next is an owner-only beta route and still keeps the recommendation surface intact", () => {
  assert.match(ariNext, /<title>ARI Next Beta \| ARI Circle<\/title>/);
  assert.match(ariNext, />ARI NEXT · OWNER BETA<\/span>/);
  assert.match(ariNext, /ari-next-owner-beta-v1\.js\?v=1\.0\.0/);
  assert.doesNotMatch(ariNext, /<script src="js\/ari-circle\/v6\/action-network-v6\.js/);
  assert.match(ownerBeta, /\/api\/ari-github-read/);
  assert.match(ownerBeta, /window\.location\.replace\("ari-circle-feed\.html"\)/);
  assert.match(ownerBeta, /action-network-v6\.js\?v=0\.3\.0/);
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

test("ARI CIRCLE wordmark returns to the public Feed instead of exposing the beta", () => {
  assert.match(shell, /brand\.setAttribute\("href", "ari-circle-feed\.html"\)/);
  assert.match(shell, /brand\.setAttribute\("aria-label", "ARI Circle Feed"\)/);
  assert.match(ariNext, /href="ari-circle-feed\.html" aria-label="ARI Circle Feed"/);
});
