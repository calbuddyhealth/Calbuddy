import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup-room.html");
const css = await read("assets/css/ari-circle-meetup-room-point-disclosure-v1.css");
const disclosure = await read("js/ari-circle/meetups/meeting-point-disclosure-v1.js");
const room = await read("js/ari-circle/meetups/meetup-room-v1.js");

test("meeting point is rebuilt as one native disclosure card", () => {
  assert.match(html, /<details class="meetup-room-point-disclosure" id="meetingPointDisclosure">/);
  assert.match(html, /<summary class="meetup-room-point-summary" id="meetingPointSummary">/);
  assert.doesNotMatch(html, /<h2 id="meetingPointTitle">/);
  assert.doesNotMatch(html, />Exact meeting point</);
  assert.match(html, /ari-circle-meetup-room-point-disclosure-v1\.css\?v=2\.0\.0/);
  assert.match(html, /meeting-point-disclosure-v1\.js\?v=2\.0\.0/);
});

test("collapsed card shows the saved value and host edit affordance only", () => {
  assert.match(html, /<strong id="meetingPointValue">Add meeting point<\/strong>/);
  assert.match(html, /id="editMeetingPoint"[^>]*hidden>Set<\/button>/);
  assert.match(html, /id="meetingPointPrivacy"[^>]*>Attendees only<\/span>/);
  assert.match(css, /\.meetup-room-point-summary\s*\{[\s\S]*min-height:\s*78px/);
  assert.match(css, /#copyMeetingPoint\s*\{\s*display:\s*none\s*!important/);
});

test("host row opens and closes the existing editor through the native disclosure", () => {
  assert.match(disclosure, /if \(form\.hidden\) edit\.click\(\);\s*else cancel\.click\(\);/);
  assert.match(disclosure, /disclosure\.classList\.toggle\("is-host", hostCanEdit\)/);
  assert.match(disclosure, /if \(disclosure\.open !== expanded\) disclosure\.open = expanded/);
  assert.match(disclosure, /summary\.setAttribute\("aria-expanded", String\(expanded\)\)/);
  assert.match(room, /edit\.hidden = !room\.viewer_is_host/);
  assert.match(room, /form\.hidden = !\(room\.viewer_is_host && state\.pointEditorOpen\)/);
});

test("hidden editor cannot be forced visible by the legacy display grid rule", () => {
  assert.match(css, /\.meetup-room-point-form\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.meetup-room-point-form\s*\{[\s\S]*display:\s*grid/);
});

test("attendees cannot expand the host-only editor", () => {
  assert.match(disclosure, /if \(!hostCanEdit\) \{\s*event\.preventDefault\(\)/);
  assert.match(disclosure, /summary\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(disclosure, /if \(edit\.hidden && disclosure\.open\) disclosure\.open = false/);
});

test("saving or cancelling returns the meeting point to its compact state", () => {
  assert.match(room, /state\.pointEditorOpen = false;\s*await loadRoom\(\{ silent: true \}\)/);
  assert.match(room, /\$\("cancelMeetingPoint"\)\?\.addEventListener\("click", \(\) => toggleMeetingPointEditor\(false\)\)/);
  assert.match(css, /@keyframes meetup-point-native-reveal/);
});
