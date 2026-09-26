import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const bundles = fs.readFileSync("js/ari-circle/v6/intent-bundles-v1.js", "utf8");
const v6Html = fs.readFileSync("ari-circle-v6.html", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");

test("legacy owner-only V6 matched plans remain non-mutating", () => {
  assert.match(bundles, /const VERSION = "1\.2\.0"/);
  assert.doesNotMatch(bundles, /ari_circle_join_meetup/);
  assert.doesNotMatch(bundles, /ari_circle_request_meetup/);
  assert.doesNotMatch(bundles, /ari_circle_create_meetup/);
});

test("member Connect does not load the Ari matched-draft suggestion handoff", () => {
  assert.doesNotMatch(meetupHtml, /matched-draft-v1\.js/);
  assert.doesNotMatch(meetupHtml, /intent-bundles-v1\.js/);
  assert.doesNotMatch(connect, /ari_circle_intent_bundle_v1/);
  assert.doesNotMatch(connect, /draft=matched/);
});

test("Connect owns meetup creation directly", () => {
  assert.match(connect, /rpc\("ari_circle_create_meetup"/);
  assert.match(connect, /requested_join_mode/);
  assert.match(meetupHtml, /connect-v1\.js\?v=1\.4\.0/);
});

test("V6 remains an owner-only experimental artifact but is not wired into Connect", () => {
  assert.match(v6Html, /intent-bundles-v1\.js\?v=1\.2\.0/);
  assert.doesNotMatch(meetupHtml, /matched-draft-v1\.js/);
});
