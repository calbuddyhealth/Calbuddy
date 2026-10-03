import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup-room.html");
const css = await read("assets/css/ari-circle-meetup-room-header-v2.css");

test("meetup room header names the current surface instead of generic ARI Circle", () => {
  assert.match(html, /class="circle-v5-header feed-header meetup-room-header"/);
  assert.match(html, /class="meetup-room-brand" aria-label="Meeting Room"/);
  assert.match(html, /meetup-room-brand__meeting">MEETING</);
  assert.match(html, /meetup-room-brand__room">ROOM</);
  assert.doesNotMatch(html, /class="[^"]*(?:feed-brand|circle-v5-brand)[^"]*meetup-room-brand/);
  assert.doesNotMatch(html, /meetup-room-brand[^>]*>[\s\S]*ARI CIRCLE/);
  assert.match(html, /ari-circle-meetup-room-header-v2\.css\?v=2\.2\.0/);
});

test("meeting room opens slightly zoomed out on mobile while preserving user zoom", () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=0\.9, maximum-scale=5, user-scalable=yes, viewport-fit=cover"/);
});

test("room exit is a large purple arrow-only control that returns to Connect", () => {
  assert.match(html, /class="feed-icon-button meetup-room-back" href="ari-circle-meetup\.html" aria-label="Back to Connect"/);
  assert.match(html, /meetup-room-back__arrow" aria-hidden="true">←/);
  assert.doesNotMatch(html, /meetup-room-back__label/);
  assert.match(css, /\.meetup-room-back\s*\{[\s\S]*width:\s*76px\s*!important/);
  assert.match(css, /\.meetup-room-back\s*\{[\s\S]*height:\s*76px\s*!important/);
  assert.match(css, /linear-gradient\(145deg,#7446f5 0%,#8c52ff 55%,#a264ff 100%\)/);
  assert.match(css, /\.meetup-room-back__arrow\s*\{[\s\S]*2\.35rem/);
});

test("Meeting Room title fills the larger centered header", () => {
  assert.match(css, /\.meetup-room-header\s*\{[\s\S]*min-height:\s*94px\s*!important/);
  assert.match(css, /\.meetup-room-header\s*\{[\s\S]*grid-template-columns:\s*76px minmax\(0,1fr\) 76px\s*!important/);
  assert.match(css, /\.meetup-room-brand\s*\{[\s\S]*grid-column:\s*2/);
  assert.match(css, /\.meetup-room-brand\s*\{[\s\S]*justify-self:\s*stretch/);
  assert.match(css, /font:\s*800 clamp\(1\.18rem,5\.6vw,1\.72rem\)\/1 Orbitron/);
  assert.match(css, /\.meetup-room-brand::after\s*\{[\s\S]*left:\s*7%[\s\S]*right:\s*7%/);
});

test("global Messages action is removed from Meeting Room header", () => {
  assert.doesNotMatch(html, /class="circle-v4-message"/);
  assert.doesNotMatch(html, /href="ari-circle-messages\.html"/);
  assert.match(html, /class="meetup-room-header-spacer" aria-hidden="true"/);
  assert.match(css, /\.meetup-room-header-spacer\s*\{[\s\S]*width:\s*76px/);
});
