import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup-room.html");
const css = await read("assets/css/ari-circle-meetup-room-header-v2.css");

test("meetup room header names the current surface instead of generic ARI Circle", () => {
  assert.match(html, /class="circle-v5-header feed-header meetup-room-header"/);
  assert.match(html, /meetup-room-brand__meeting">MEETING</);
  assert.match(html, /meetup-room-brand__room">ROOM</);
  assert.doesNotMatch(html, /meetup-room-brand[^>]*>[\s\S]*ARI CIRCLE/);
  assert.match(html, /ari-circle-meetup-room-header-v2\.css\?v=2\.0\.0/);
});

test("room exit is a larger explicit Back control that returns to Connect", () => {
  assert.match(html, /class="feed-icon-button meetup-room-back" href="ari-circle-meetup\.html" aria-label="Back to Connect"/);
  assert.match(html, /meetup-room-back__label">Back</);
  assert.match(css, /\.meetup-room-back\s*\{[\s\S]*min-width:\s*78px\s*!important/);
  assert.match(css, /\.meetup-room-back\s*\{[\s\S]*height:\s*58px\s*!important/);
  assert.match(css, /box-shadow:[\s\S]*rgba\(44,91,177,\.16\)/);
});

test("message action remains secondary to the room exit control", () => {
  assert.match(css, /\.meetup-room-header \.circle-v4-message\s*\{[\s\S]*width:\s*52px\s*!important/);
  assert.match(css, /\.meetup-room-header\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0,1fr\) 54px/);
});
