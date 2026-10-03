import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup-room.html");
const css = await read("assets/css/ari-circle-meetup-room-point-disclosure-v1.css");
const disclosure = await read("js/ari-circle/meetups/meeting-point-disclosure-v1.js");
const room = await read("js/ari-circle/meetups/meetup-room-v1.js");

test("meeting point is compact by default and hides duplicate chrome", () => {
  assert.match(html, /ari-circle-meetup-room-point-disclosure-v1\.css\?v=1\.0\.0/);
  assert.match(css, /\.meetup-room-point > \.meetup-room-section-head\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /\.meetup-room-point-copy span,[\s\S]*\.meetup-room-copy\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /\.meetup-room-point-summary\s*\{[\s\S]*min-height:\s*74px/);
});

test("host can expand or collapse the meeting point editor from the compact row", () => {
  assert.match(html, /meeting-point-disclosure-v1\.js\?v=1\.0\.0/);
  assert.match(disclosure, /if \(form\.hidden\) edit\.click\(\);\s*else cancel\.click\(\);/);
  assert.match(disclosure, /summary\.addEventListener\("click", toggleFromSummary\)/);
  assert.match(disclosure, /summary\.setAttribute\("aria-expanded", String\(expanded\)\)/);
  assert.match(disclosure, /section\.classList\.toggle\("is-host", hostCanEdit\)/);
});

test("only hosts receive expandable meeting point affordances", () => {
  assert.match(disclosure, /if \(edit\.hidden\) return/);
  assert.match(disclosure, /if \(hostCanEdit\) \{[\s\S]*summary\.setAttribute\("role", "button"\)/);
  assert.match(room, /edit\.hidden = !room\.viewer_is_host/);
  assert.match(room, /form\.hidden = !\(room\.viewer_is_host && state\.pointEditorOpen\)/);
});

test("saving or cancelling returns the meeting point to its compact state", () => {
  assert.match(room, /state\.pointEditorOpen = false;\s*await loadRoom\(\{ silent: true \}\)/);
  assert.match(room, /\$\("cancelMeetingPoint"\)\?\.addEventListener\("click", \(\) => toggleMeetingPointEditor\(false\)\)/);
  assert.match(css, /@keyframes meetup-point-reveal/);
});
