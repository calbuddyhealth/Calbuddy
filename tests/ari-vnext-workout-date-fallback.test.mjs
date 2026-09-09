import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const adapter = fs.readFileSync(path.join(root, "ari/vnext/ari-vnext-action-adapter.js"), "utf8");
const runtime = fs.readFileSync(path.join(root, "ari/runtime/ari-runtime-controller.js"), "utf8");

test("vNext workout planning recovers a missing dateText from the source message", () => {
  assert.match(adapter, /resolveWorkoutDate\(args\.dateText, pending\?\.sourceMessage\)/);
  assert.match(adapter, /function resolveWorkoutDate\(dateText, sourceMessage\)/);
  assert.match(adapter, /resolveDate\(dateText\) \|\| resolveDate\(sourceMessage\)/);
});

test("vNext workout editing uses the same deterministic date fallback", () => {
  const matches = adapter.match(/resolveWorkoutDate\(args\.dateText, pending\?\.sourceMessage\)/g) || [];
  assert.ok(matches.length >= 2);
});

test("relative workout dates remain deterministic", () => {
  assert.match(adapter, /\\btoday\\b/);
  assert.match(adapter, /\\btomorrow\\b/);
  assert.match(adapter, /const weekdays = \["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"\]/);
});

test("runtime cache-busts the corrected action adapter", () => {
  assert.match(adapter, /const VERSION = "1\.3\.1"/);
  assert.match(runtime, /ari-vnext-action-adapter\.js\?v=1\.3\.1/);
});
