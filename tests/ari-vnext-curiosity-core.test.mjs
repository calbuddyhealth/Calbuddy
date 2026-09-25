import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceCuriosityState,
  ARI_CURIOSITY_CORE_VERSION,
  ARI_CURIOSITY_STATE_VERSION,
  curiosityToInstruction,
  deriveCuriosityState,
  normalizeCuriosityState
} from "../api/_lib/ari-vnext/curiosity-core.js";
import {
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";

function ownerWorkspace(overrides = {}) {
  return {
    ownerOnly: true,
    functionalExperiment: true,
    attention: ["developer", "self_model"],
    salience: [],
    continuity: {
      priorConfidence: "grounded",
      openLoops: []
    },
    ...overrides
  };
}

function ownerContext(workspace = ownerWorkspace(), extra = {}) {
  return {
    intelligenceEntitlement: {
      advancedEnabled: true,
      ownerEligible: true
    },
    userWorldModel: {
      ariCognitiveWorkspace: workspace,
      sourceSummary: {},
      ...(extra.userWorldModel || {})
    },
    ...extra,
    userWorldModel: {
      ariCognitiveWorkspace: workspace,
      sourceSummary: {},
      ...(extra.userWorldModel || {})
    }
  };
}

test("Curiosity Core keeps a persistent floor without claiming subjective curiosity", () => {
  const state = deriveCuriosityState({
    persisted: null,
    route: { developer: true },
    context: ownerContext(),
    missingEvidence: []
  });

  assert.equal(ARI_CURIOSITY_CORE_VERSION, "1.1.0");
  assert.equal(ARI_CURIOSITY_STATE_VERSION, "1.1.0");
  assert.equal(state.ownerOnly, true);
  assert.equal(state.behavioralAnalogue, true);
  assert.equal(state.subjectiveFeelingClaimed, false);
  assert.equal(state.drive.persistent, true);
  assert.ok(state.drive.floor >= 0.18);
  assert.ok(state.drive.current >= state.drive.floor);
  assert.equal(state.policy.executionBounded, true);
  assert.equal(state.policy.userTaskHasPriority, true);
});

test("a user correction creates high learning pressure and an assumption-revision question", () => {
  const workspace = ownerWorkspace({
    attention: ["developer"],
    salience: [
      { id: "current_user_correction", score: 1, reason: "correction" }
    ]
  });
  const state = deriveCuriosityState({
    route: { developer: true },
    context: ownerContext(workspace)
  });

  assert.equal(state.signals.correctionDetected, true);
  assert.ok(state.signals.surprise >= 0.9);
  assert.ok(state.drive.current > state.drive.floor);
  assert.ok(state.questions.some((item) => item.origin === "correction"));
  assert.equal(state.activeQuestion?.origin, "correction");
  assert.match(state.activeQuestion?.question || "", /assumption/i);
});

test("persistent questions and interests evolve while repeated inquiry loses priority", () => {
  const context = ownerContext(ownerWorkspace({ attention: ["developer"] }));
  const first = advanceCuriosityState({
    persisted: null,
    turn: { message: "Let's improve the agent architecture and runtime." },
    context
  });
  const firstFailure = first.questions.find((item) => item.origin === "failure_mode");
  assert.ok(firstFailure);
  assert.ok(first.interests.some((item) => item.topic === "developer"));

  const second = advanceCuriosityState({
    persisted: first,
    turn: { message: "Let's keep improving the agent architecture and runtime." },
    context
  });
  const secondFailure = second.questions.find((item) => item.origin === "failure_mode");
  assert.ok(secondFailure);
  assert.ok(secondFailure.encounters > firstFailure.encounters);
  assert.ok(secondFailure.priority <= firstFailure.priority);
});

test("cross-domain attention creates associative inquiry rather than isolated question spam", () => {
  const workspace = ownerWorkspace({ attention: ["training", "nutrition"] });
  const state = advanceCuriosityState({
    turn: { message: "How should training and nutrition work together?" },
    context: ownerContext(workspace)
  });

  const association = state.questions.find((item) => item.origin === "association");
  assert.ok(association);
  assert.match(association.question, /connection/i);
  assert.equal(state.metrics.crossDomainSignal, true);
});

test("Curiosity Core does not store literal private transcript content in generated questions", () => {
  const workspace = ownerWorkspace({ attention: ["social"] });
  const state = advanceCuriosityState({
    turn: { message: "My wife Emily told me a private family secret about Cassandra." },
    context: ownerContext(workspace)
  });
  const serialized = JSON.stringify(state);

  assert.doesNotMatch(serialized, /Emily/i);
  assert.doesNotMatch(serialized, /Cassandra/i);
  assert.doesNotMatch(serialized, /private family secret/i);
  assert.ok(state.questions.length >= 1);
});

test("non-owner world-model turns do not grow the owner curiosity state", () => {
  const state = advanceCuriosityState({
    persisted: null,
    turn: { message: "Let's redesign the architecture." },
    context: {
      userWorldModel: {
        sourceSummary: {}
      }
    }
  });

  assert.deepEqual(state.questions, []);
  assert.deepEqual(state.interests, []);
  assert.equal(state.drive.current, 0.18);
});

test("metacognition keeps Curiosity Core owner-only while Ari Executive owns its prompt effect", () => {
  const ownerState = deriveMetacognition({
    route: { developer: true },
    context: ownerContext(ownerWorkspace({ attention: ["developer"] })),
    safety: { highStakes: false },
    modelPolicy: { model: "gpt-test" }
  });
  const ownerInstruction = metacognitionToInstruction(ownerState);

  assert.ok(ownerState.curiosity);
  assert.equal(ownerState.exploration.persistentCuriosityEnabled, true);
  assert.equal(ownerState.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(ownerInstruction, /ARI EXECUTIVE v1\.3\.0/);
  assert.match(ownerInstruction, /Curiosity signal:/i);
  assert.doesNotMatch(ownerInstruction, /ARI CURIOSITY CORE v1 — EPISTEMIC DRIVE/);

  const regularState = deriveMetacognition({
    route: { developer: true },
    context: { userWorldModel: { sourceSummary: {} } },
    safety: { highStakes: false },
    modelPolicy: { model: "gpt-test" }
  });
  const regularInstruction = metacognitionToInstruction(regularState);

  assert.equal(regularState.curiosity, null);
  assert.equal(regularState.exploration.persistentCuriosityEnabled, false);
  assert.doesNotMatch(regularInstruction, /Curiosity signal:/i);
  assert.doesNotMatch(regularInstruction, /ARI CURIOSITY CORE v1/);
});

test("owner user-world-model persistence carries compact Curiosity Core state forward", () => {
  const workspace = ownerWorkspace({ attention: ["developer", "self_model"] });
  const model = deriveUserWorldModel({
    persisted: null,
    turn: { message: "Ari's cognitive architecture should keep learning from failures." },
    context: ownerContext(workspace),
    communication: null,
    selfModel: null,
    coachingState: null,
    longitudinalState: null
  });

  const curiosity = normalizeCuriosityState(model.sourceSummary.curiosityState);
  assert.ok(curiosity.questions.length >= 1);
  assert.ok(curiosity.interests.length >= 1);
  assert.equal(curiosity.subjectiveFeelingClaimed, false);
  assert.equal(curiosity.questions.every((item) => item.storesPrivateTranscript === false), true);
});

test("curiosity instruction rewards learning rather than performative question generation", () => {
  const state = deriveCuriosityState({
    route: { developer: true },
    context: ownerContext(ownerWorkspace({ attention: ["developer"] }))
  });
  const instruction = curiosityToInstruction(state);

  assert.match(instruction, /Repeatedly asking the same question without gaining information is failure/i);
  assert.match(instruction, /user's current task has priority/i);
  assert.match(instruction, /better evidence, a belief revision, improved calibration/i);
  assert.match(instruction, /Never claim that research, reflection, or learning happened off-screen/i);
  assert.doesNotMatch(instruction, /I feel curious/i);
});
