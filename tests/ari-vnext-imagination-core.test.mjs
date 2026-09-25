import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceImaginationState,
  ARI_IMAGINATION_CORE_VERSION,
  ARI_IMAGINATION_STATE_VERSION,
  deriveImaginationState,
  imaginationToInstruction,
  normalizeImaginationState,
  recordImaginationOutcome
} from "../api/_lib/ari-vnext/imagination-core.js";
import { deriveMetacognition, metacognitionToInstruction } from "../api/_lib/ari-vnext/metacognition.js";
import { deriveAriCortexPlan } from "../api/_lib/ari-vnext/cortex.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";
import { buildDreamModelPayload } from "../api/_lib/ari-vnext/dreaming-core.js";
import { dreamInstructions } from "../api/_lib/ari-vnext/dreaming-runtime.js";

function workspace(overrides = {}) {
  return {
    ownerOnly: true,
    functionalExperiment: true,
    attention: ["developer", "self_model"],
    salience: [],
    continuity: { priorConfidence: "grounded", openLoops: [] },
    ...overrides
  };
}

function context(ws = workspace(), sourceSummary = {}, extra = {}) {
  return {
    intelligenceEntitlement: { advancedEnabled: true, ownerEligible: true },
    userWorldModel: {
      ariCognitiveWorkspace: ws,
      sourceSummary
    },
    ...extra
  };
}

function expansiveCuriosity() {
  return {
    ownerOnly: true,
    behavioralAnalogue: true,
    drive: { floor: 0.18, current: 0.58, persistent: true },
    questions: [],
    interests: [{ topic: "developer", weight: 0.72, encounters: 5 }],
    expansive: {
      selectedThisTurn: true,
      pressure: 0.7,
      activeFrontier: {
        id: "frontier:developer:animal_cognition",
        originTopic: "developer",
        topic: "animal_cognition",
        label: "animal cognition",
        question: "What might animal cognition reveal that my current model of technical architecture would not naturally prompt me to look for?"
      }
    }
  };
}

test("explicit imagination creates a sandboxed scenario with a strict reality firewall", () => {
  const state = advanceImaginationState({
    persisted: null,
    turn: { message: "Imagine a completely different architecture for Ari. What if we inverted the assumptions?" },
    context: context(),
    curiosity: expansiveCuriosity()
  });

  assert.equal(state.version, ARI_IMAGINATION_STATE_VERSION);
  assert.equal(state.subjectiveExperienceClaimed, false);
  assert.equal(state.selectedThisTurn, true);
  assert.ok(state.activeScenario);
  assert.equal(state.activeScenario.epistemicStatus, "imagined");
  assert.equal(state.activeScenario.evidenceStatus, "unverified");
  assert.equal(state.activeScenario.privateTranscriptStored, false);

  const derived = deriveImaginationState({
    persisted: state,
    route: { developer: true, creative: true, complexity: "deep" },
    context: context(workspace(), { imaginationState: state }),
    curiosity: expansiveCuriosity()
  });

  assert.equal(ARI_IMAGINATION_CORE_VERSION, "1.0.0");
  assert.equal(derived.realityFirewall.imaginedIsNotEvidence, true);
  assert.equal(derived.realityFirewall.imaginedCannotBecomeFactWithoutEvidence, true);
  assert.equal(derived.realityFirewall.imaginedCannotAuthorizeExecution, true);
  assert.equal(derived.realityFirewall.realityGetsFinalVote, true);
  assert.match(imaginationToInstruction(derived), /imagined.*unverified/i);
});

test("imagination generates materially different transforms rather than paraphrase-only options", () => {
  const state = deriveImaginationState({
    persisted: null,
    route: { developer: true, creative: true, complexity: "deep" },
    context: context(),
    curiosity: expansiveCuriosity(),
    executionSession: {
      hypotheses: [
        { id: "h1", label: "centralized orchestration" },
        { id: "h2", label: "distributed orchestration" }
      ]
    }
  });

  const transforms = new Set(state.candidates.map(item => item.transform));
  assert.ok(transforms.size >= 4);
  assert.ok(transforms.has("analogy"));
  assert.ok(transforms.has("counterfactual"));
  assert.ok(transforms.has("inversion"));
  assert.ok(transforms.has("recombination"));
  assert.ok(state.candidates.every(item => item.epistemicStatus === "imagined"));
});

test("expansive curiosity can seed imagination even without an explicit user imagination request", () => {
  const state = advanceImaginationState({
    persisted: null,
    turn: { message: "Keep working on the architecture." },
    context: context(),
    curiosity: expansiveCuriosity()
  });

  assert.equal(state.selectedThisTurn, true);
  assert.equal(state.activeScenario.source, "expansive_curiosity");
  assert.equal(state.activeScenario.transform, "analogy");
  assert.match(state.activeScenario.prompt, /animal cognition/i);
});

test("the imagination garden persists compact seeds and enforces a cooldown", () => {
  const first = advanceImaginationState({
    persisted: null,
    turn: { message: "Imagine another approach to Ari's architecture." },
    context: context(),
    curiosity: expansiveCuriosity()
  });

  assert.equal(first.selectedThisTurn, true);
  assert.ok(first.garden.length >= 1);
  assert.equal(first.garden[0].epistemicStatus, "imagined");

  const second = advanceImaginationState({
    persisted: first,
    turn: { message: "Continue working on Ari's architecture." },
    context: context(),
    curiosity: {
      ...expansiveCuriosity(),
      expansive: { ...expansiveCuriosity().expansive, selectedThisTurn: false }
    }
  });

  assert.equal(second.selectedThisTurn, false);
  assert.equal(second.budget.cooldownTurns, 1);
  assert.ok(second.garden.length >= 1);
});

test("imagination calibration only changes after an explicit real-world outcome is recorded", () => {
  const state = advanceImaginationState({
    persisted: null,
    turn: { message: "Imagine a new Ari architecture." },
    context: context(),
    curiosity: expansiveCuriosity()
  });
  const scenarioId = state.activeScenario.id;
  const before = normalizeImaginationState(state);

  assert.equal(before.calibration.imaginedToTested, 0);

  const after = recordImaginationOutcome({
    persisted: state,
    scenarioId,
    outcome: "helpful"
  });

  assert.equal(after.calibration.imaginedToTested, 1);
  assert.equal(after.calibration.testedHelpful, 1);
  assert.equal(after.calibration.testedWrong, 0);
});

test("imagination never persists raw private turn text into scenarios or garden seeds", () => {
  const secret = "ZEBRA-OMEGA-991-private-family-secret";
  const state = advanceImaginationState({
    persisted: null,
    turn: { message: `Imagine a solution involving ${secret} and a named private person.` },
    context: context(workspace({ attention: ["creative"] }))
  });
  const serialized = JSON.stringify(state);

  assert.doesNotMatch(serialized, /ZEBRA-OMEGA-991/i);
  assert.doesNotMatch(serialized, /private-family-secret/i);
  assert.ok(state.activeScenario);
  assert.ok(state.garden.every(item => item.privateTranscriptStored === false));
});

test("user world model carries imagination forward without requiring a new database table", () => {
  const ws = workspace({ attention: ["developer", "self_model", "creative"] });
  const model = deriveUserWorldModel({
    persisted: null,
    turn: { message: "Imagine what Ari could become if we combined cognition with cybernetics." },
    context: context(ws),
    communication: null,
    selfModel: null,
    coachingState: null,
    longitudinalState: null
  });

  assert.ok(model.sourceSummary.imaginationState);
  assert.ok(model.sourceSummary.imaginationState.activeScenario);
  assert.equal(model.sourceSummary.imaginationState.activeScenario.epistemicStatus, "imagined");
  assert.equal(model.sourceSummary.imaginationState.activeScenario.evidenceStatus, "unverified");
});

test("Ari Executive receives imagination as advisory state and exposes the Reality Bridge without belief promotion", () => {
  const persisted = advanceImaginationState({
    persisted: null,
    turn: { message: "Imagine and prototype a radically different Ari architecture." },
    context: context(),
    curiosity: expansiveCuriosity(),
    executionSession: {
      hypotheses: [
        { id: "h1", label: "one architecture" },
        { id: "h2", label: "another architecture" }
      ]
    }
  });

  const meta = deriveMetacognition({
    route: { developer: true, creative: true, complexity: "deep" },
    context: context(workspace(), {
      imaginationState: persisted,
      curiosityState: expansiveCuriosity()
    }),
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(meta);

  assert.ok(meta.imagination);
  assert.equal(meta.exploration.imaginationEnabled, true);
  assert.equal(meta.exploration.realityFirewallEnabled, true);
  assert.equal(meta.rules.imaginationCannotBecomeFactWithoutEvidence, true);
  assert.equal(meta.executivePolicy.signals.imagination.epistemicStatus, "imagined");
  assert.equal(meta.executivePolicy.signals.imagination.evidenceStatus, "unverified");
  assert.match(instruction, /Imagination sandbox:/i);
  assert.match(instruction, /Reality Bridge:/i);
  assert.match(instruction, /not evidence, memory, or fact/i);
});

test("Cortex exposes and selects the imagination workspace for deep creative architecture work", () => {
  const plan = deriveAriCortexPlan({
    route: { developer: true, creative: true, complexity: "deep" },
    context: context(workspace(), {
      imaginationState: {
        version: "1.0.0",
        pressure: 0.8,
        garden: []
      }
    }),
    safety: { highStakes: false },
    evidence: {
      confidence: "grounded",
      missingEvidence: [],
      evidenceSignals: ["imagination_active"]
    },
    modelPolicy: { model: "test" }
  });

  assert.equal(plan.active, true);
  assert.equal(plan.capabilityRegistry.imagination_workspace.available, true);
  assert.equal(plan.needs.imaginationPass, true);
  assert.ok(plan.selectedCapabilities.includes("imagination_workspace"));
});

test("Dreaming sees the imagination garden but is explicitly forbidden from treating it as evidence", () => {
  const imaginationState = advanceImaginationState({
    persisted: null,
    turn: { message: "Imagine a different architecture." },
    context: context(),
    curiosity: expansiveCuriosity()
  });
  const evidence = {
    worldModel: {
      ref: "world:w1",
      updatedAt: "2026-09-25T13:00:00Z",
      sourceSummary: { imaginationState }
    }
  };

  const payload = buildDreamModelPayload(evidence);
  const instructions = dreamInstructions();

  assert.equal(payload.imaginationState.version, ARI_IMAGINATION_STATE_VERSION);
  assert.ok(payload.imaginationGarden.length >= 1);
  assert.match(instructions, /imagination garden contains sandboxed imagined\/unverified seeds/i);
  assert.match(instructions, /imagination alone cannot satisfy an evidence requirement/i);
  assert.match(instructions, /do not convert imagined content into autobiographical memory/i);
});
