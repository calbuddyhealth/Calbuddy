import test from "node:test";
import assert from "node:assert/strict";

import { deriveMetacognition, metacognitionToInstruction } from "../api/_lib/ari-vnext/metacognition.js";

test("missing training evidence is represented as uncertainty rather than failure", () => {
  const state = deriveMetacognition({
    route: { training: true },
    context: {},
    safety: {}
  });
  const instruction = metacognitionToInstruction(state);

  assert.equal(state.coverage.training, false);
  assert.equal(state.confidence, "limited");
  assert.ok(state.missingEvidence.includes("training"));
  assert.equal(state.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(instruction, /Missing evidence: training/i);
  assert.match(instruction, /not automatically a stop signal/i);
});

test("actual training and goal context produces grounded evidence state", () => {
  const state = deriveMetacognition({
    route: { training: true, goals: true },
    context: {
      training: { summary: "3 completed sessions" },
      goals: { goalType: "lose", currentWeight: 185 }
    },
    safety: {}
  });

  assert.equal(state.coverage.training, true);
  assert.equal(state.coverage.goals, true);
  assert.equal(state.confidence, "grounded");
});

test("high stakes turns remain cautious even with complete evidence", () => {
  const state = deriveMetacognition({
    route: { training: true },
    context: { training: { summary: "available" } },
    safety: { highStakes: true }
  });

  assert.equal(state.confidence, "cautious");
  assert.equal(state.executivePolicy.directives.verificationDepth, "high");
});
