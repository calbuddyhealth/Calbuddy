import test from "node:test";
import assert from "node:assert/strict";

import { formatDeterministicPendingReply } from "../api/_lib/ari-vnext/orchestrator.js";

test("log_meal confirmation is rendered deterministically from the pending payload", () => {
  const reply = formatDeterministicPendingReply("log_meal", {
    name: "High Noon Raspberry Vodka Seltzer",
    servingSize: "1 can",
    calories: 100,
    proteinG: 0,
    carbsG: 2.6,
    fatG: 0
  });

  assert.equal(
    reply,
    "Ready to log High Noon Raspberry Vodka Seltzer (1 can) — 100 calories. Confirm to save it."
  );
});

test("proven logging operations use deterministic confirmation while complex mutations retain the model path", () => {
  assert.equal(
    formatDeterministicPendingReply("log_weight", { value: 185, unit: "lb" }),
    "Ready to log your weight at 185 lb. Confirm to save it."
  );
  assert.equal(
    formatDeterministicPendingReply("log_activity", {
      activityName: "Walk",
      durationMinutes: 30,
      caloriesBurned: 140
    }),
    "Ready to log Walk (30 min) — 140 calories burned. Confirm to save it."
  );
  assert.equal(formatDeterministicPendingReply("edit_workout", { exercise: "Squat" }), "");
});
