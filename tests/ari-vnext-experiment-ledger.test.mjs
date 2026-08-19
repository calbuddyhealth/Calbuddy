import assert from "node:assert/strict";
import test from "node:test";

import { buildCurrentTurn } from "../api/_lib/ari-vnext/current-turn.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { evaluateExperimentSnapshot, summarizeExperimentLedger } from "../api/_lib/ari-vnext/experiment-ledger.js";
import { getAriTools, toolToApplicationAction, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

test("experiment language routes through fitness intelligence", () => {
  const route = routeContext(buildCurrentTurn({ message: "How is our experiment going?" }, "u1"));
  assert.equal(route.training, true);
});

test("fitness route exposes experiment lifecycle tools", () => {
  const names = getAriTools({ training: true, nutrition: false, goals: false }).map((tool) => tool.name);
  assert.equal(names.includes("propose_track_experiment"), true);
  assert.equal(names.includes("propose_complete_experiment"), true);
  assert.equal(names.includes("propose_cancel_experiment"), true);
  assert.equal(toolToApplicationAction("propose_track_experiment"), "track_experiment");
});

test("experiment tool validation requires explicit identifiers and valid outcome", () => {
  const route = { training: true };
  assert.equal(validateToolCall({ name: "propose_track_experiment", arguments: JSON.stringify({ hypothesisId: "" }) }, route).valid, false);
  assert.equal(validateToolCall({ name: "propose_complete_experiment", arguments: JSON.stringify({
    experimentId: "exp-1",
    outcomeDirection: "maybe",
    summary: "It sort of worked",
    confidenceAfter: 0.6
  }) }, route).valid, false);
  assert.equal(validateToolCall({ name: "propose_complete_experiment", arguments: JSON.stringify({
    experimentId: "exp-1",
    outcomeDirection: "positive",
    summary: "Performance improved",
    confidenceAfter: 0.7
  }) }, route).valid, true);
});

test("ledger summary separates active due and completed experiments", () => {
  const now = new Date("2026-08-18T12:00:00Z");
  const summary = summarizeExperimentLedger([
    { id: "a", status: "active", hypothesisId: "execution_gap", reviewAt: "2026-08-17T12:00:00Z" },
    { id: "b", status: "active", hypothesisId: "recovery_pressure", reviewAt: "2026-08-25T12:00:00Z" },
    { id: "c", status: "completed", hypothesisId: "energy_availability_pressure", completedAt: "2026-08-10T12:00:00Z" }
  ], now);
  assert.equal(summary.activeCount, 2);
  assert.equal(summary.dueCount, 1);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.due[0].id, "a");
});

test("execution experiment can become supportive when adherence improves", () => {
  const evaluation = evaluateExperimentSnapshot({
    id: "exp-1",
    status: "active",
    hypothesisId: "execution_gap",
    reviewAt: "2026-08-01T00:00:00Z",
    baseline: { adherenceRate: 0.45, progression: { up: 0, down: 2, plateaus: 1 } }
  }, {
    weight: { available: false },
    training: {
      adherence: { rate: 0.8 },
      progression: { upCount: 1, stableCount: 2, downCount: 0, plateauCandidateCount: 0 }
    }
  }, { evidence: { reported: {} } });

  assert.equal(evaluation.reviewDue, true);
  assert.equal(evaluation.suggestedOutcome, "positive");
  assert.ok(evaluation.confidence <= 0.7);
});

test("persistent performance pressure can weaken an energy availability hypothesis", () => {
  const evaluation = evaluateExperimentSnapshot({
    id: "exp-2",
    status: "active",
    hypothesisId: "energy_availability_pressure",
    baseline: { progression: { up: 0, down: 2, plateaus: 0 } }
  }, {
    weight: { available: true, velocityPerWeek: -0.8 },
    training: {
      adherence: { rate: 0.9 },
      progression: { upCount: 0, stableCount: 1, downCount: 3, plateauCandidateCount: 1 }
    }
  }, { evidence: { reported: {} } });

  assert.equal(evaluation.suggestedOutcome, "negative");
});
