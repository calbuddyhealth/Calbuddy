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

  assert.equal(ARI_DELIBERATION_HARNESS_VERSION, "1.0.0");
  assert.equal(state.tier, "direct");
  assert.equal(state.deliberation.candidatePasses, 1);
  assert.equal(state.deliberation.verificationGate, false);
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
  assert.match(instruction, /Do not expose hidden reasoning traces/i);
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
