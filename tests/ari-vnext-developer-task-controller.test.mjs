import test from "node:test";
import assert from "node:assert/strict";

import {
  DEVELOPER_ABSOLUTE_STEP_LIMIT,
  developerTaskBudgetDecision,
  developerTaskControllerSummary,
  normalizeDeveloperTaskController,
  recordDeveloperTaskStep,
  startDeveloperTaskController
} from "../api/_lib/ari-vnext/developer-task-controller.js";

function response(input = 100, output = 20) {
  return { usage: { input_tokens: input, output_tokens: output } };
}

function evidence(id) {
  return { observations: [{ id, kind: "repository_read", summary: `Observed ${id}`, verified: true }], artifacts: [] };
}

test("adaptive controller does not stop at the former six-step boundary when evidence is progressing", () => {
  let state = startDeveloperTaskController(null, { now: "2026-10-03T20:00:00.000Z" });
  for (let i = 1; i <= 7; i += 1) {
    state = recordDeveloperTaskStep(state, { response: response(), evidence: evidence(`e${i}`), runtimeMs: 100 });
  }
  const decision = developerTaskBudgetDecision(state);
  assert.equal(state.window.steps, 7);
  assert.equal(decision.continue, true);
  assert.equal(decision.reason, "evidence_progressing");
  assert.equal(DEVELOPER_ABSOLUTE_STEP_LIMIT > 6, true);
});

test("adaptive controller pauses after evidence stalls beyond the minimum depth", () => {
  let state = startDeveloperTaskController();
  for (let i = 1; i <= 6; i += 1) {
    state = recordDeveloperTaskStep(state, { response: response(), evidence: evidence(`e${i}`) });
  }
  const unchanged = evidence("e6");
  state = recordDeveloperTaskStep(state, { response: response(), evidence: unchanged });
  state = recordDeveloperTaskStep(state, { response: response(), evidence: unchanged });
  state = recordDeveloperTaskStep(state, { response: response(), evidence: unchanged });
  const decision = developerTaskBudgetDecision(state);
  assert.equal(decision.continue, false);
  assert.equal(decision.hardStop, false);
  assert.equal(decision.reason, "evidence_stalled");
});

test("adaptive controller enforces hard token and step caps", () => {
  let tokenState = startDeveloperTaskController(null, { limits: { maxTokens: 2000 } });
  tokenState = recordDeveloperTaskStep(tokenState, { response: response(1900, 200), evidence: evidence("tokens") });
  assert.equal(developerTaskBudgetDecision(tokenState).reason, "token_cap");

  let stepState = startDeveloperTaskController(null, { limits: { minimumSteps: 1, maxSteps: 2, maxConsecutiveUnproductiveSteps: 8 } });
  stepState = recordDeveloperTaskStep(stepState, { evidence: evidence("a") });
  stepState = recordDeveloperTaskStep(stepState, { evidence: evidence("b") });
  assert.equal(developerTaskBudgetDecision(stepState).reason, "step_cap");
});

test("cost budget activates only when deployment estimate rates are configured", () => {
  const oldInput = process.env.ARI_DEVELOPER_EST_INPUT_USD_PER_MILLION;
  const oldOutput = process.env.ARI_DEVELOPER_EST_OUTPUT_USD_PER_MILLION;
  process.env.ARI_DEVELOPER_EST_INPUT_USD_PER_MILLION = "10";
  process.env.ARI_DEVELOPER_EST_OUTPUT_USD_PER_MILLION = "20";
  try {
    let state = startDeveloperTaskController(null, { limits: { maxWindowEstimatedCostUsd: 0.05 } });
    state = recordDeveloperTaskStep(state, { response: response(5000, 1000), evidence: evidence("cost") });
    const summary = developerTaskControllerSummary(state);
    assert.equal(summary.costEstimateConfigured, true);
    assert.equal(summary.estimatedCostUsd > 0.05, true);
    assert.equal(developerTaskBudgetDecision(state).reason, "window_cost_cap");
  } finally {
    if (oldInput === undefined) delete process.env.ARI_DEVELOPER_EST_INPUT_USD_PER_MILLION;
    else process.env.ARI_DEVELOPER_EST_INPUT_USD_PER_MILLION = oldInput;
    if (oldOutput === undefined) delete process.env.ARI_DEVELOPER_EST_OUTPUT_USD_PER_MILLION;
    else process.env.ARI_DEVELOPER_EST_OUTPUT_USD_PER_MILLION = oldOutput;
  }
});

test("controller normalization never persists hidden reasoning", () => {
  const state = startDeveloperTaskController();
  const normalized = normalizeDeveloperTaskController({ ...state, hiddenChainOfThoughtStored: true, chainOfThought: "secret" });
  assert.equal(normalized.hiddenChainOfThoughtStored, false);
  assert.equal(Object.hasOwn(normalized, "chainOfThought"), false);
});
