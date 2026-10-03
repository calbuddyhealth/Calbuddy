import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  ARI_DELIBERATION_HARNESS_VERSION,
  deliberationHarnessToInstruction,
  deriveDeliberationHarness
} from "../api/_lib/ari-vnext/deliberation-harness.js";

test("casual turns stay direct and do not manufacture deliberation", () => {
  const state = deriveDeliberationHarness({
    turn: { message: "Hey" },
    route: { casualConversation: true, complexity: "fast" },
    safety: { highStakes: false },
    modelPolicy: {
      reasoningDemand: { band: "low" },
      reasoningMode: "standard",
      reasoningEffort: "low",
      reasoningContext: "current_turn",
      persistReasoning: false
    }
  });

  assert.equal(ARI_DELIBERATION_HARNESS_VERSION, "1.2.0");
  assert.equal(state.tier, "direct");
  assert.equal(state.deliberation.candidatePasses, 1);
  assert.equal(state.deliberation.verificationGate, false);
  assert.equal(state.hypothesisCollapseProtocol.active, false);
  assert.equal(state.safeguards.noExtraModelCall, true);
});

test("critical technical work gets bounded alternatives, countercase, and verification", () => {
  const state = deriveDeliberationHarness({
    turn: {
      message: "Actually keep the existing memory layer, but change the routing. Also, what happens if the verifier fails?"
    },
    route: { developer: true, complexity: "deep", casualConversation: false },
    safety: { highStakes: false },
    modelPolicy: {
      reasoningDemand: { band: "critical" },
      reasoningMode: "pro",
      reasoningEffort: "xhigh",
      reasoningContext: "all_turns",
      persistReasoning: true
    },
    companionState: { repair: { active: false } },
    metacognition: {
      cortex: {
        needs: { hypotheses: true, countercase: true, verification: true }
      }
    },
    relationshipContinuity: { recognizedUser: true }
  });

  assert.equal(state.tier, "adversarial_verify");
  assert.equal(state.taskContract.requirementUpdateDetected, true);
  assert.equal(state.taskContract.sideQuestionDetected, true);
  assert.equal(state.deliberation.candidatePasses, 3);
  assert.equal(state.deliberation.countercase, true);
  assert.equal(state.deliberation.verificationGate, true);
  assert.equal(state.deliberation.failureModeReview, true);
  assert.equal(state.providerExecution.reasoningMode, "pro");

  const instruction = deliberationHarnessToInstruction(state);
  assert.match(instruction, /Maintain a compact task contract/i);
  assert.match(instruction, /strongest credible countercase/i);
  assert.match(instruction, /Verification gate/i);
  assert.match(instruction, /failing test is evidence that the assertion failed/i);
  assert.match(instruction, /Do not expose hidden reasoning traces/i);
});

test("two failed developer attempts trigger the hypothesis collapse protocol", () => {
  const state = deriveDeliberationHarness({
    turn: {
      message: "Keep fixing the GPS bug.",
      context: {
        userWorldModel: {
          ariCognitiveWorkspace: {
            executionWorkspace: {
              active: true,
              session: {
                id: "exec-pr392",
                status: "active",
                goal: "Fix the meetup GPS behavior.",
                failedAttempts: [
                  { id: "failure-1", summary: "First patch failed CI." },
                  { id: "failure-2", summary: "Second patch still missed the user-visible bug." }
                ]
              }
            }
          }
        }
      }
    },
    route: { developer: true, complexity: "deep", casualConversation: false },
    modelPolicy: {
      reasoningDemand: { band: "high" },
      reasoningMode: "standard",
      reasoningEffort: "high"
    }
  });

  assert.equal(state.hypothesisCollapseProtocol.active, true);
  assert.equal(state.hypothesisCollapseProtocol.failedAttemptCount, 2);
  assert.equal(state.hypothesisCollapseProtocol.auditAssumptionsVsFacts, true);
  assert.equal(state.hypothesisCollapseProtocol.identifyKnownGoodContracts, true);
  assert.equal(state.hypothesisCollapseProtocol.compareAgainstKnownGoodBaseline, true);
  assert.equal(state.hypothesisCollapseProtocol.separateConflatedStateOrApiConcepts, true);
  assert.equal(state.hypothesisCollapseProtocol.classifyTestFailuresByCausalRelevance, true);
  assert.equal(state.hypothesisCollapseProtocol.decideRepairVsRebuild, true);
  assert.equal(state.hypothesisCollapseProtocol.patchOnlyAfterReset, true);
  assert.equal(state.deliberation.changeMethodAfterRepeatedFailure, true);

  const instruction = deliberationHarnessToInstruction(state);
  assert.match(instruction, /HYPOTHESIS COLLAPSE PROTOCOL REQUIRED/i);
  assert.match(instruction, /original user-visible failure/i);
  assert.match(instruction, /facts-vs-assumptions audit/i);
  assert.match(instruction, /known-good contracts and invariants/i);
  assert.match(instruction, /clean main/i);
  assert.match(instruction, /conflated/i);
  assert.match(instruction, /causally relevant, stale, or verification noise/i);
  assert.match(instruction, /repair the current branch or rebuild from a known-good base/i);
});

test("one failed developer attempt changes method without forcing theory collapse", () => {
  const state = deriveDeliberationHarness({
    turn: {
      message: "Try a different way.",
      context: {
        userWorldModel: {
          ariCognitiveWorkspace: {
            executionWorkspace: {
              active: true,
              session: {
                id: "exec-one-failure",
                status: "active",
                failedAttempts: [{ id: "failure-1", summary: "The first check failed." }]
              }
            }
          }
        }
      }
    },
    route: { developer: true, complexity: "deep" },
    modelPolicy: {
      reasoningDemand: { band: "high", reasons: ["previous tool fail"] }
    }
  });

  assert.equal(state.hypothesisCollapseProtocol.active, false);
  assert.equal(state.hypothesisCollapseProtocol.failedAttemptCount, 1);
  assert.equal(state.deliberation.changeMethodAfterRepeatedFailure, true);

  const instruction = deliberationHarnessToInstruction(state);
  assert.doesNotMatch(instruction, /HYPOTHESIS COLLAPSE PROTOCOL REQUIRED/i);
  assert.match(instruction, /Change the method or discriminating test/i);
});

test("repair state makes the current correction authoritative without creating another model call", () => {
  const state = deriveDeliberationHarness({
    turn: { message: "No, I meant the API route, not the UI." },
    route: { developer: true, complexity: "standard" },
    modelPolicy: { reasoningDemand: { band: "medium" } },
    companionState: { repair: { active: true } }
  });

  assert.equal(state.taskContract.currentCorrectionWins, true);
  assert.equal(state.safeguards.noExtraModelCall, true);
});

test("deliberation harness is deterministic and wired into the live orchestrator", async () => {
  const harness = await readFile(
    new URL("../api/_lib/ari-vnext/deliberation-harness.js", import.meta.url),
    "utf8"
  );
  const orchestrator = await readFile(
    new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(harness, /fetch\s*\(/);
  assert.doesNotMatch(harness, /api\.openai\.com|OPENAI_API_KEY/);
  assert.match(orchestrator, /deriveDeliberationHarness\(\{/);
  assert.match(orchestrator, /deliberationHarnessToInstruction\(deliberationHarness\)/);
});
