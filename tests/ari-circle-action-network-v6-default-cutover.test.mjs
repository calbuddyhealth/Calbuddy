import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeHtml = readFileSync("home.html", "utf8");
const v6Html = readFileSync("ari-circle-v6.html", "utf8");
const feedHtml = readFileSync("ari-circle-feed.html", "utf8");
const legacyProfileHtml = readFileSync("ari-circle.html", "utf8");
const socialBadges = readFileSync("js/ari-circle/social-badges.js", "utf8");
const ownerBeta = readFileSync("js/ari-circle/v6/ari-next-owner-beta-v1.js", "utf8");

test("public app entry is normalized to Feed while the existing home markup rolls forward safely", () => {
  assert.match(homeHtml, /class="ari-nav-link nav-circle"/);
  assert.match(socialBadges, /normalizePublicCircleEntry/);
  assert.match(socialBadges, /\.nav-circle\[href="ari-circle-v6\.html"\]/);
  assert.match(socialBadges, /link\.setAttribute\("href", "ari-circle-feed\.html"\)/);
  assert.match(socialBadges, /feed-connect-public/);
});

test("ARI Next is explicitly an owner beta instead of the public Circle default", () => {
  assert.match(v6Html, /<title>ARI Next Beta \| ARI Circle<\/title>/);
  assert.match(v6Html, />ARI NEXT · OWNER BETA<\/span>/);
  assert.match(v6Html, /ari-next-owner-beta-v1\.js\?v=1\.0\.0/);
  assert.match(ownerBeta, /\/api\/ari-github-read/);
  assert.match(ownerBeta, /window\.location\.replace\("ari-circle-feed\.html"\)/);
  assert.doesNotMatch(v6Html, /REAL-WORLD ACTION NETWORK · LAB/);
  assert.doesNotMatch(v6Html, /class="v6-mode-nav"/);
});

test("legacy Circle profile remains available as the rollback/profile surface", () => {
  assert.match(legacyProfileHtml, /<body class="ari-circle-page">/);
  assert.match(legacyProfileHtml, /id="circle-profile"/);
});

test("Moments stays inside Feed instead of becoming a duplicate primary destination", () => {
  assert.doesNotMatch(v6Html, /href="ari-circle-feed\.html">Moments<\/a>/);
  assert.doesNotMatch(v6Html, /v6MomentsBridge|v6-moments-bridge/i);
  assert.match(feedHtml, /id="momentsTitle">Moments/);
});
