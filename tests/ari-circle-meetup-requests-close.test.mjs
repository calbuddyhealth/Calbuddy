import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup.html");
const connect = await read("js/ari-circle/connect/connect-v1.js");

test("join requests close button targets its own dialog", () => {
  assert.match(
    html,
    /id="meetupRequestsDialog"[\s\S]*?data-close="meetupRequestsDialog"/,
  );
  assert.doesNotMatch(
    html,
    /id="meetupRequestsDialog"[\s\S]*?data-close="hostMeetupDialog"/,
  );
});

test("Connect binds data-close buttons to dialog.close", () => {
  assert.match(connect, /querySelectorAll\("\[data-close\]"\)/);
  assert.match(connect, /button\.dataset\.close/);
  assert.match(connect, /\.close\(\)/);
});
