import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeHtml = readFileSync("home.html", "utf8");
const feedHtml = readFileSync("ari-circle-feed.html", "utf8");
const meetupHtml = readFileSync("ari-circle-meetup.html", "utf8");
const profileHtml = readFileSync("ari-circle.html", "utf8");

test("home navigation opens Circle Connect", () => {
  assert.match(homeHtml, /href="ari-circle-meetup\.html"[^>]*class="ari-nav-link nav-circle"/);
  assert.doesNotMatch(homeHtml, /href="ari-circle-v6\.html"[^>]*class="ari-nav-link nav-circle"/);
});

test("member Circle is Connect plus Profile", () => {
  assert.match(meetupHtml, /<title>Connect \| ARI Circle<\/title>/);
  assert.match(meetupHtml, /Find something to do\./);
  assert.match(profileHtml, /<body class="ari-circle-page">/);
  assert.match(profileHtml, /id="circle-profile"/);
});

test("legacy Feed route remains only as a redirect", () => {
  assert.match(feedHtml, /window\.location\.replace\("ari-circle-meetup\.html"\)/);
});
