import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const bundles = fs.readFileSync("js/ari-circle/v6/intent-bundles-v1.js", "utf8");
const draft = fs.readFileSync("js/ari-circle/meetups/matched-draft-v1.js", "utf8");
const v6Html = fs.readFileSync("ari-circle-v6.html", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const meetups = fs.readFileSync("js/ari-circle/meetups/meetups-v5.js", "utf8");

test("V6 matched plans expose Make this happen without auto-mutating membership", () => {
  assert.match(bundles, /const VERSION = "1\.2\.0"/);
  assert.match(bundles, /Make this happen/);
  assert.match(bundles, /Host a new one/);
  assert.match(bundles, /Open existing meetup/);
  assert.match(bundles, /window\.location\.assign\("ari-circle-meetup\.html\?draft=matched"\)/);
  assert.doesNotMatch(bundles, /ari_circle_join_meetup/);
  assert.doesNotMatch(bundles, /ari_circle_request_meetup/);
  assert.doesNotMatch(bundles, /ari_circle_create_meetup/);
});

test("matched-plan draft is bounded, approval-first, and does not carry coordinates", () => {
  assert.match(bundles, /source: "ari_circle_intent_bundle_v1"/);
  assert.match(bundles, /joinMode: "approval"/);
  assert.match(bundles, /guestSpots: Math\.max\(1, maxGroup - 1\)/);
  assert.match(bundles, /people: draftPeople\(bundle\?\.people\)/);
  assert.doesNotMatch(bundles, /latitude/i);
  assert.doesNotMatch(bundles, /longitude/i);
});

test("Meet Up consumes only a recent one-time same-session matched draft", () => {
  assert.match(draft, /const STORAGE_KEY = "ariCircleMatchedMeetupDraftV1"/);
  assert.match(draft, /const MAX_AGE_MS = 15 \* 60 \* 1000/);
  assert.match(draft, /get\("draft"\) !== "matched"/);
  assert.match(draft, /sessionStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(draft, /draft\.source !== "ari_circle_intent_bundle_v1"/);
  assert.match(draft, /isUuid\(draft\.intentId\)/);
});

test("matched draft only prefills the canonical host form and never publishes itself", () => {
  for (const id of [
    "meetupFormTitle",
    "meetupFormStarts",
    "meetupFormArea",
    "meetupFormGuestSpots",
    "meetupFormDuration",
    "meetupFormJoinMode",
    "meetupFormActivity"
  ]) {
    assert.match(draft, new RegExp(id));
  }
  assert.match(draft, /setValue\("meetupFormJoinMode", "approval"\)/);
  assert.match(draft, /Nobody has been invited or added automatically/);
  assert.match(draft, /window\.AriCircleMeetupsV5/);
  assert.doesNotMatch(draft, /\.rpc\(/);
  assert.doesNotMatch(draft, /ari_circle_create_meetup/);
});

test("canonical Meet Up remains the only meetup creation mutation", () => {
  assert.match(meetups, /rpc\("ari_circle_create_meetup"/);
  assert.match(meetups, /requested_join_mode/);
  const canonicalIndex = meetupHtml.indexOf("meetups-v5.js?v=5.3.0");
  const draftIndex = meetupHtml.indexOf("matched-draft-v1.js?v=1.0.0");
  assert.ok(canonicalIndex >= 0 && draftIndex > canonicalIndex, "draft helper must load after canonical Meet Up");
});

test("V6 loads the updated intent-bundle handoff", () => {
  assert.match(v6Html, /intent-bundles-v1\.js\?v=1\.2\.0/);
  assert.match(meetupHtml, /matched-draft-v1\.js\?v=1\.0\.0/);
});
