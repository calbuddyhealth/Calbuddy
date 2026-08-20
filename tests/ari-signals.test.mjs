import test from "node:test";
import assert from "node:assert/strict";

import { classifyInitiativeAsSignal } from "../api/_lib/ari-vnext/ari-signals.js";

test("high-priority initiative becomes an eligible Ari Signal push", () => {
  const signal = classifyInitiativeAsSignal({
    initiativeKey: "broad_performance_regression:abc",
    reasonId: "broad_performance_regression",
    priority: "high",
    opener: "I noticed several comparable lifts trending down.",
    followUpPrompt: "Review the competing explanations before changing the plan.",
    domain: "training"
  });

  assert.equal(signal.category, "change");
  assert.equal(signal.priority, "high");
  assert.equal(signal.pushEligible, true);
  assert.match(signal.body, /noticed/i);
  assert.equal(signal.context.initiativeKey, "broad_performance_regression:abc");
});

test("ordinary medium insight stays in-app instead of automatically buzzing the phone", () => {
  const signal = classifyInitiativeAsSignal({
    initiativeKey: "routine:abc",
    reasonId: "routine_observation",
    priority: "medium",
    opener: "I noticed a small pattern worth keeping in mind."
  });

  assert.equal(signal.category, "insight");
  assert.equal(signal.pushEligible, false);
});

test("experiment review is push-eligible unfinished business", () => {
  const signal = classifyInitiativeAsSignal({
    initiativeKey: "experiment_review_due:abc",
    reasonId: "experiment_review_due",
    priority: "high",
    opener: "Our experiment is ready for review."
  });

  assert.equal(signal.category, "experiment_result");
  assert.equal(signal.pushEligible, true);
  assert.match(signal.title, /result/i);
});
