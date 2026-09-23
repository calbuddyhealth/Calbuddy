import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { missingWorkoutDateClarification } from "../api/_lib/ari-vnext/orchestrator.js";
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

test("missing workout dates are clarified before a saveable proposal is generated", () => {
  assert.equal(
    missingWorkoutDateClarification({ message: "Create a chest workout" }, { training: true }),
    "What day do you want the chest workout for?"
  );
  assert.equal(
    missingWorkoutDateClarification({ message: "I need a leg workout" }, { training: true }),
    "What day do you want the leg workout for?"
  );
  assert.equal(
    missingWorkoutDateClarification({ message: "Create a chest workout for today" }, { training: true }),
    ""
  );
  assert.equal(
    missingWorkoutDateClarification({ message: "Create a chest workout next Tuesday" }, { training: true }),
    ""
  );
});

test("runtime cache-busts the durable action adapter", () => {
  assert.match(adapter, /const VERSION = "1\.5\.0"/);
  assert.match(runtime, /ari-vnext-action-adapter\.js\?v=1\.5\.0/);
});
