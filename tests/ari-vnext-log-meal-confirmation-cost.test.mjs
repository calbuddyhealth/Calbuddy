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

test("non-meal operations still use the existing model-confirmation path during this cutover", () => {
  assert.equal(formatDeterministicPendingReply("log_weight", { value: 185 }), "");
  assert.equal(formatDeterministicPendingReply("log_activity", { activityName: "Walk" }), "");
  assert.equal(formatDeterministicPendingReply("edit_workout", { exercise: "Squat" }), "");
});
