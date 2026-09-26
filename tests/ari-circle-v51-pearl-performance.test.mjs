import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync("js/ari-circle/v5-real-world.js", "utf8");
const pearl = fs.readFileSync("assets/css/ari-circle-v5-pearl.css", "utf8");
const premium = fs.readFileSync("assets/css/ari-circle-v5-premium.css", "utf8");
const authority = fs.readFileSync("assets/css/ari-circle-v5-visual-authority.css", "utf8");
const connectCss = fs.readFileSync("assets/css/ari-circle-connect-v1.css", "utf8");
const feedCss = fs.readFileSync("assets/css/ari-circle-feed-next.css", "utf8");
const feed = fs.readFileSync("ari-circle-feed.html", "utf8");
const meetup = fs.readFileSync("ari-circle-meetup.html", "utf8");

test("current Circle presentation remains light and consolidated", () => {
  assert.match(pearl, /--circle51-surface:\s*#ffffff/);
  assert.match(premium, /--circle52-surface:\s*#ffffff/);
  assert.match(authority, /--circle521-surface:\s*#ffffff/);
  assert.match(authority, /color-scheme:\s*light\s*!important/);
  assert.doesNotMatch(feed, /ari-circle-xp\.css/);
  assert.doesNotMatch(meetup, /ari-circle-xp\.css/);
});

test("shared Circle header remains bounded and text-first", () => {
  assert.match(shell, /const VERSION = "5\.5\.1"/);
  assert.match(shell, /function normalizeSignatureHeader\(\)/);
  assert.match(shell, /circle-v51-wordmark/);
  assert.doesNotMatch(shell, /new MutationObserver/);
  assert.doesNotMatch(shell, /setInterval\s*\(/);
});

test("Connect and retained legacy Feed assets avoid nested blur-heavy cards", () => {
  assert.match(connectCss, /background:var\(--connect-card\)/);
  assert.match(feedCss, /feed-next-event-card/);
  assert.match(feedCss, /feed-quick-update__trigger/);
  assert.match(feedCss, /\.feed-toast\{[\s\S]*z-index:320!important/);
  assert.doesNotMatch(connectCss, /backdrop-filter:[^;]*blur\(3[0-9]px\)/);
  assert.doesNotMatch(feedCss, /backdrop-filter:[^;]*blur\(3[0-9]px\)/);
});

test("Connect has compact discovery identity", () => {
  assert.match(meetup, /class="circle-connect-actionbar"/);
  assert.match(meetup, /id="hostMeetupButton"[^>]*>Host<\/button>/);
  assert.match(meetup, /href="ari-circle-friends\.html">Find Friends/);
  assert.doesNotMatch(meetup, /Find something to do\./);
  assert.match(meetup, /Pick a vibe/);
  assert.match(meetup, /HAPPENING NOW/);
  assert.doesNotMatch(meetup, /REAL WORLD XP/);
});

test("legacy Feed route redirects to Connect", () => {
  assert.match(feed, /window\.location\.replace\("ari-circle-meetup\.html"\)/);
  assert.doesNotMatch(feed, /ari-circle-v4\.css/);
  assert.doesNotMatch(feed, /js\/ari-circle\/v4-ui\.js/);
});
