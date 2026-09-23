import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeHtml = readFileSync("home.html", "utf8");
const feedHtml = readFileSync("ari-circle-feed.html", "utf8");
const meetupHtml = readFileSync("ari-circle-meetup.html", "utf8");
const profileHtml = readFileSync("ari-circle.html", "utf8");

test("home navigation opens the simplified Circle Feed", () => {
  assert.match(homeHtml, /href="ari-circle-feed\.html"[^>]*class="ari-nav-link nav-circle"/);
  assert.doesNotMatch(homeHtml, /href="ari-circle-v6\.html"[^>]*class="ari-nav-link nav-circle"/);
});

test("member Circle is Feed plus Connect", () => {
  assert.match(feedHtml, /<title>Feed \| ARI Circle<\/title>/);
  assert.match(meetupHtml, /<title>Connect \| ARI Circle<\/title>/);
  assert.match(meetupHtml, /Find something to do\./);
});

test("Profile remains available as a secondary identity surface", () => {
  assert.match(profileHtml, /<body class="ari-circle-page">/);
  assert.match(profileHtml, /id="circle-profile"/);
});

test("Moments are not part of the simplified member Feed", () => {
  assert.doesNotMatch(feedHtml, /id="momentsTitle"/);
  assert.doesNotMatch(feedHtml, /Make it a Moment/);
});
