import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("ari-circle-meetup.html", "utf8");
const js = fs.readFileSync("js/ari-circle/connect/host-window-v1.js", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-host-window-v1.css", "utf8");
const migration = fs.readFileSync("supabase/migrations/20261003054500_ari_circle_host_limit_v1.sql", "utf8");

test("host form tells users about the 60-day scheduling window", () => {
  assert.match(html, /id="meetupStartWindowNote"[^>]*>Events can be scheduled up to 60 days ahead\./i);
  assert.match(html, /id="meetupStartWindowError"[^>]*>Choose a date within the next 60 days\./i);
  assert.match(html, /aria-describedby="meetupStartWindowNote meetupStartWindowError"/i);
});

test("client sets a dynamic 60-day max and blocks out-of-window publication", () => {
  assert.match(js, /const MAX_DAYS_AHEAD = 60;/);
  assert.match(js, /input\.max = localDateTimeValue\(cutoff\)/);
  assert.match(js, /input\.setCustomValidity\(message\)/);
  assert.match(js, /event\.stopImmediatePropagation\(\)/);
  assert.match(js, /button\.disabled = true/);
  assert.match(js, /Latest:/);
});

test("visual error state is present and server remains the authority", () => {
  assert.match(css, /#meetupFormStarts\[aria-invalid="true"\]/);
  assert.match(css, /#createMeetupSubmit\[data-start-window-disabled="true"\]/);
  assert.match(migration, /requested_starts_at > now\(\) \+ interval '60 days'/i);
});
