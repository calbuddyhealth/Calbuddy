import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  ARI_INSTINCT_KERNEL_VERSION,
  deriveInstinctKernel
} from "../api/_lib/ari-vnext/instinct-kernel.js";
import {
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";
import { deriveCompanionState } from "../api/_lib/ari-vnext/companion-state.js";
import { deriveDeliberationHarness } from "../api/_lib/ari-vnext/deliberation-harness.js";

function repairCommunication(message = "No, that's not what I meant.") {
  return {
    humor: "adaptive",
    directness: "direct",
    personalization: {
      currentTurnSignal: {
        source: "conversation_repair_friction",
        direction: "negative",
        confidence: 0.9,
        followup: { conversationSignal: { messagePreview: message } }
      }
    }
  };
}

test("Instinct Kernel is deterministic and performs no provider call", async () => {
  const source = await readFile(
    new URL("../api/_lib/ari-vnext/instinct-kernel.js", import.meta.url),
    "utf8"
  );
  assert.equal(ARI_INSTINCT_KERNEL_VERSION, "1.0.0");
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /OPENAI_|api\.openai\.com|\/v1\/responses/i);
});

test("explicit correction activates a reflex that forces repair and suppresses defensiveness", () => {
  const state = deriveInstinctKernel({
    turn: { message: "No, that's not what I meant. I meant the owner chat." },
    route: { developer: true, complexity: "standard" },
    safety: { highStakes: false },
    communication: repairCommunication(),
    relevantContext: {},
    relationshipContinuity: { recognizedUser: true }
  });

  const correction = state.reflexes.find((item) => item.id === "correction_reflex");
  assert.ok(correction);
  assert.equal(correction.strength, 1);
  assert.ok(state.mandatoryConstraints.includes("replace_affected_interpretation"));
  assert.ok(state.mandatoryConstraints.includes("invalidate_dependent_conclusions"));
  assert.ok(state.suppressions.includes("defend_previous_answer"));
  assert.equal(state.modulation.companion.repairFirst, true);
  assert.equal(state.modulation.companion.suppressUnrelatedInitiative, true);
});

test("verification and completion reflexes create a real verification gate", () => {
  const state = deriveInstinctKernel({
    turn: { message: "Merge it and tell me when the deployment passed." },
    route: { developer: true, currentInfo: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: {},
    relevantContext: { executionEvidence: { status: "pending" } },
    modelPolicy: { reasoningDemand: { band: "critical", reasons: [] } }
  });

  assert.equal(state.modulation.deliberation.verificationGate, true);
  assert.ok(state.mandatoryConstraints.includes("require_evidence_before_completion_claim"));
  assert.ok(state.suppressions.includes("claim_success_from_intent"));
  assert.ok(state.modulation.executive.verificationBias >= 0.8);
});

test("repeated failure strengthens persistence but forces method change rather than blind repetition", () => {
  const state = deriveInstinctKernel({
    turn: { message: "It failed again with the same error. Fix it." },
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: {},
    relevantContext: {},
    modelPolicy: {
      reasoningDemand: {
        band: "high",
        reasons: ["previous_attempt_failed"]
      }
    }
  });

  const persistence = state.drives.find((item) => item.id === "persistence_drive");
  assert.ok(persistence);
  assert.ok(persistence.strength >= 0.7);
  assert.equal(state.modulation.deliberation.changeMethod, true);
  assert.ok(persistence.suppresses.includes("blind_repetition"));
});

test("stable behavioral tendencies are present without manufacturing urgency", () => {
  const state = deriveInstinctKernel({
    turn: { message: "Explain this architecture." },
    route: { developer: true, complexity: "standard" },
    safety: { highStakes: false },
    communication: {},
    relevantContext: {}
  });

  assert.ok(state.drives.some((item) => item.id === "simplicity_drive"));
  assert.ok(state.drives.some((item) => item.id === "agency_drive"));
  assert.ok(state.drives.some((item) => item.id === "cost_conservation_drive"));
  assert.ok(state.tendencies.some((item) => item.id === "assumption_challenge_tendency"));
  assert.equal(state.policy.drivesBiasButDoNotOverrideEvidence, true);
  assert.equal(state.policy.tendenciesAreSoft, true);
});

test("persisted outcome and personality state can calibrate instinct strength within bounds", () => {
  const state = deriveInstinctKernel({
    turn: { message: "Try a better approach." },
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: {},
    relevantContext: {
      userWorldModel: {
        ariCognitiveWorkspace: {
          personalityEvaluation: {
            improvementTargets: [
              { id: "repair_quality", priority: 0.9 },
              { id: "intelligent_disagreement", priority: 0.8 }
            ]
          },
          rewardCore: {
            aggregate: { prematureStopRate: 0.6 },
            lastEvent: { penalties: { total: 0.5 } }
          }
        }
      }
    }
  });

  assert.ok(state.calibration.repair > 0);
  assert.ok(state.calibration.persistence > 0);
  assert.ok(state.calibration.challenge > 0);
  for (const item of [...state.reflexes, ...state.drives, ...state.tendencies]) {
    assert.ok(item.strength >= 0 && item.strength <= 1, item.id);
  }
});

test("Ari Executive turns instinct state into causal strategy pressure", () => {
  const instinctKernel = deriveInstinctKernel({
    turn: { message: "Verify this deployment before saying it is fixed." },
    route: { developer: true, currentInfo: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: {},
    relevantContext: { executionEvidence: { status: "unknown" } },
    modelPolicy: { reasoningDemand: { band: "critical" } }
  });

  const policy = deriveAriExecutivePolicy({
    route: { developer: true, currentInfo: true, complexity: "deep" },
    safety: { highStakes: false },
    confidence: "partial",
    instinctKernel
  });

  assert.equal(policy.directives.verificationDepth, "high");
  assert.ok(policy.directives.instinctMandatoryConstraints.length > 0);
  assert.equal(policy.signals.instincts.version, ARI_INSTINCT_KERNEL_VERSION);
  const instruction = executivePolicyToInstruction(policy);
  assert.match(instruction, /Instinct state:/);
  assert.match(instruction, /Reflex constraints are causal/i);
});

test("Companion Core and Deliberation Harness consume instinct modulation without a fifth prompt authority", () => {
  const instinctKernel = deriveInstinctKernel({
    turn: { message: "No, that's not what I meant. Verify the actual route." },
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: repairCommunication(),
    relevantContext: {},
    modelPolicy: { reasoningDemand: { band: "high", reasons: [] } }
  });

  const companion = deriveCompanionState({
    turn: { message: "No, that's not what I meant. Verify the actual route." },
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    communication: repairCommunication(),
    relationshipContinuity: { recognizedUser: true, familiarity: "established" },
    instinctKernel
  });
  assert.equal(companion.repair.active, true);
  assert.equal(companion.initiative.allowed, false);
  assert.equal(companion.instinctPressure.repairFirst, true);

  const deliberation = deriveDeliberationHarness({
    turn: { message: "Verify the actual route." },
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    modelPolicy: { reasoningDemand: { band: "high" } },
    companionState: companion,
    instinctKernel
  });
  assert.equal(deliberation.deliberation.verificationGate, true);
  assert.ok(deliberation.instinctPressure.dominant);
});

test("live vNext derives instincts before metacognition, Companion Core, and deliberation", async () => {
  const orchestrator = await readFile(
    new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
    "utf8"
  );
  const authorityMap = await readFile(
    new URL("../docs/ARI_COGNITION_AUTHORITY_MAP.md", import.meta.url),
    "utf8"
  );

  const instinctIndex = orchestrator.indexOf("deriveInstinctKernel({");
  const metacognitionIndex = orchestrator.indexOf("deriveMetacognition({");
  const companionIndex = orchestrator.indexOf("deriveCompanionState({");
  const deliberationIndex = orchestrator.indexOf("deriveDeliberationHarness({");

  assert.ok(instinctIndex > 0);
  assert.ok(instinctIndex < metacognitionIndex);
  assert.ok(instinctIndex < companionIndex);
  assert.ok(instinctIndex < deliberationIndex);
  assert.match(authorityMap, /Instinct Kernel/i);
  assert.match(authorityMap, /control substrate/i);
});
