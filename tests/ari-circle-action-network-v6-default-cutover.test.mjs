import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeHtml = readFileSync("home.html", "utf8");
const v6Html = readFileSync("ari-circle-v6.html", "utf8");
const feedHtml = readFileSync("ari-circle-feed.html", "utf8");
const legacyProfileHtml = readFileSync("ari-circle.html", "utf8");

test("home navigation makes ARI Circle V6 the default entry", () => {
  assert.match(homeHtml, /href="ari-circle-v6\.html"[^>]*class="ari-nav-link nav-circle"/);
  assert.doesNotMatch(homeHtml, /href="ari-circle-feed\.html"[^>]*class="ari-nav-link nav-circle"/);
});

test("default V6 surface is ARI Next and no longer presents itself as a lab", () => {
  assert.match(v6Html, /<title>ARI Next \| ARI Circle<\/title>/);
  assert.match(v6Html, />ARI NEXT<\/span>/);
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