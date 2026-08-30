import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatDeterministicPendingReply } from "../api/_lib/ari-vnext/orchestrator.js";

const orchestrator = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

test("primary log_activity proposals share the proven low-risk fast path", () => {
  assert.match(orchestrator, /"propose_log_activity"/);
  assert.match(orchestrator, /!LOW_RISK_PRIMARY_FAST_PATHS\.has\(primaryFunctionName\)/);
});

test("activity confirmation is deterministic from the pending payload", () => {
  assert.equal(
    formatDeterministicPendingReply("log_activity", {
      activityName: "Run",
      durationMinutes: 30,
      caloriesBurned: 280
    }),
    "Ready to log Run (30 min) — 280 calories burned. Confirm to save it."
  );
});

test("activity confirmation still works when calories are estimated later", () => {
  assert.equal(
    formatDeterministicPendingReply("log_activity", {
      activityName: "Walk",
      durationMinutes: 45,
      caloriesBurned: null
    }),
    "Ready to log Walk (45 min). Confirm to save it."
  );
});

test("workout planning remains outside the logging fast path", () => {
  assert.doesNotMatch(orchestrator, /LOW_RISK_PRIMARY_FAST_PATHS = new Set\([\s\S]*?propose_workout_plan/);
  assert.equal(formatDeterministicPendingReply("workout_plan", { focus: "Chest" }), "");
});
