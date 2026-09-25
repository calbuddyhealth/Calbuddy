import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceCuriosityState,
  ARI_EXPANSIVE_CURIOSITY_VERSION,
  curiosityToInstruction,
  deriveCuriosityState,
  normalizeCuriosityState
} from "../api/_lib/ari-vnext/curiosity-core.js";
import { deriveMetacognition, metacognitionToInstruction } from "../api/_lib/ari-vnext/metacognition.js";
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

function context(ws = workspace(), sourceSummary = {}) {
  return {
    intelligenceEntitlement: { advancedEnabled: true, ownerEligible: true },
    userWorldModel: {
      ariCognitiveWorkspace: ws,
      sourceSummary
    }
  };
}

test("expansive curiosity maintains a frontier beyond the categories named in the active task", () => {
  const state = deriveCuriosityState({
    route: { developer: true },
    context: context()
  });

  assert.equal(state.expansive.version, ARI_EXPANSIVE_CURIOSITY_VERSION);
  assert.equal(state.expansive.mode, "expansive");
  assert.equal(state.expansive.policy.immediateUtilityRequired, false);
  assert.equal(state.expansive.policy.userTaskStillHasPriority, true);
  assert.ok(state.expansive.frontier.length >= 4);
  assert.ok(state.expansive.frontier.some(item => item.originTopic === "developer"));
  assert.ok(state.expansive.frontier.some(item => item.topic !== "developer"));
  assert.ok(state.expansive.frontier.every(item => item.source === "expansive_frontier_map"));
});

test("expansive probes are bounded by a cooldown instead of firing every turn", () => {
  const ws = workspace({ attention: ["developer"] });
  const first = advanceCuriosityState({
    persisted: null,
    turn: { message: "Improve the runtime architecture." },
    context: context(ws)
  });

  // A first encounter maps the frontier but does not manufacture a reason to
  // explore away from a topic that is still genuinely new.
  assert.equal(first.expansive.selectedThisTurn, false);
  assert.equal(first.expansive.budget.capacity, 1);
  assert.ok(first.expansive.budget.cooldownTurns >= first.expansive.budget.cooldownRequired);
  assert.ok(first.expansive.activeFrontier);
  assert.equal(first.metrics.expansiveProbeSelected, false);

  const second = advanceCuriosityState({
    persisted: first,
    turn: { message: "Continue improving the runtime architecture." },
    context: context(ws, { curiosityState: first })
  });

  // Repetition raises familiar-territory saturation enough to justify one
  // bounded cross-domain probe.
  assert.equal(second.expansive.selectedThisTurn, true);
  assert.equal(second.expansive.budget.cooldownTurns, 0);
  assert.equal(second.metrics.expansiveProbeSelected, true);

  const third = advanceCuriosityState({
    persisted: second,
    turn: { message: "Continue improving the runtime architecture." },
    context: context(ws, { curiosityState: second })
  });

  assert.equal(third.expansive.selectedThisTurn, false);
  assert.equal(third.expansive.budget.cooldownTurns, 1);
  assert.equal(third.metrics.expansiveProbeSelected, false);
});

test("repeated familiar territory increases saturation pressure while frontier attention rotates", () => {
  const ws = workspace({ attention: ["developer"] });
  let state = null;
  const selected = [];
  for (let i = 0; i < 14; i += 1) {
    state = advanceCuriosityState({
      persisted: state,
      turn: { message: "Keep working in the same agent runtime architecture area." },
      context: context(ws, state ? { curiosityState: state } : {})
    });
    if (state.expansive.selectedThisTurn) selected.push(state.expansive.activeFrontier?.id);
  }

  assert.ok(state.expansive.saturation >= 0.5);
  assert.ok(state.expansive.pressure >= 0.46);
  assert.ok(selected.length >= 2);
  assert.ok(new Set(selected.filter(Boolean)).size >= 1);
  assert.ok(state.expansive.frontier.some(item => item.attentionCount > 0));
});

test("curiosity exposes instrumental, epistemic, and expansive modes without claiming subjective feeling", () => {
  const state = deriveCuriosityState({
    route: { developer: true, currentInfo: true },
    context: context(workspace({ attention: ["developer", "fresh_information"] })),
    missingEvidence: ["fresh source"]
  });
  const instruction = curiosityToInstruction(state);

  assert.deepEqual(state.policy.curiosityModes, ["instrumental", "epistemic", "expansive"]);
  assert.ok(state.questions.some(item => item.mode === "instrumental"));
  assert.ok(state.questions.some(item => item.mode === "epistemic"));
  assert.match(instruction, /instrumental curiosity/i);
  assert.match(instruction, /expansive curiosity/i);
  assert.match(instruction, /immediate practical usefulness is not required/i);
  assert.equal(state.subjectiveFeelingClaimed, false);
});

test("Ari Executive receives the bounded frontier probe but keeps the user task in charge", () => {
  const ws = workspace({ attention: ["developer"] });
  const initial = advanceCuriosityState({
    persisted: null,
    turn: { message: "Improve the runtime architecture." },
    context: context(ws)
  });
  const persisted = advanceCuriosityState({
    persisted: initial,
    turn: { message: "Continue improving the runtime architecture." },
    context: context(ws, { curiosityState: initial })
  });
  assert.equal(persisted.expansive.selectedThisTurn, true);

  const meta = deriveMetacognition({
    route: { developer: true },
    context: context(ws, { curiosityState: persisted }),
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(meta);

  assert.equal(meta.exploration.expansiveCuriosityEnabled, true);
  assert.equal(meta.exploration.expansiveCuriosityMayLackImmediateUtility, true);
  assert.equal(meta.exploration.boundedFrontierProbeSelected, true);
  assert.ok(meta.executivePolicy.signals.curiosity.expansiveFrontier);
  assert.match(instruction, /Expansive curiosity:/i);
  assert.match(instruction, /user's active task still has priority/i);
});

test("dreaming receives the frontier explicitly and may create bounded curiosity insights", () => {
  const curiosityState = normalizeCuriosityState(advanceCuriosityState({
    persisted: null,
    turn: { message: "Explore Ari's cognitive architecture." },
    context: context()
  }));
  const evidence = {
    worldModel: {
      ref: "world:w1",
      updatedAt: "2026-09-25T12:00:00Z",
      sourceSummary: { curiosityState }
    }
  };
  const payload = buildDreamModelPayload(evidence);
  const instructions = dreamInstructions();

  assert.equal(payload.curiosityFrontier.version, ARI_EXPANSIVE_CURIOSITY_VERSION);
  assert.ok(payload.curiosityFrontier.frontier.length > 0);
  assert.match(instructions, /no defect, uncertainty, or active goal demands it/i);
  assert.match(instructions, /immediate practical utility/i);
  assert.match(instructions, /rotate outward/i);
});

test("expansive curiosity stores compact frontier abstractions rather than user transcript content", () => {
  const state = advanceCuriosityState({
    persisted: null,
    turn: { message: "A private named person told me a secret phrase ZEBRA-ALPHA-991." },
    context: context(workspace({ attention: ["social"] }))
  });
  const serialized = JSON.stringify(state.expansive);

  assert.doesNotMatch(serialized, /ZEBRA-ALPHA-991/i);
  assert.doesNotMatch(serialized, /private named person/i);
  assert.ok(state.expansive.frontier.length > 0);
});
