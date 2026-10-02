import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCognitiveCausalTrace,
  normalizeCognitiveCausalTrace,
  normalizeCognitiveCausalTraceHistory,
  publicCognitiveCausalTrace,
  runCognitiveCausalAblations,
  summarizeCognitiveCausalTrace
} from "../api/_lib/ari-vnext/cognitive-causal-trace.js";
import { normalizePersistedPainState } from "../api/_lib/ari-vnext/functional-pain.js";
import { deriveNeuromodulationState } from "../api/_lib/ari-vnext/neuromodulation.js";
import { deriveAriExecutivePolicy } from "../api/_lib/ari-vnext/ari-executive.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";

function highPain() {
  return normalizePersistedPainState({
    updatedAt: "2026-10-02T20:00:00Z",
    intensity: 0.94,
    persistence: 0.86,
    source: "repeatedFailure",
    controllability: 0.18,
    integrityThreat: 0.56,
    detectors: {
      executionFailure: 0.9,
      repeatedFailure: 0.95,
      goalObstruction: 0.82
    }
  });
}

function baselineMeta({ pain = highPain(), signals = null } = {}) {
  const neuromodulation = deriveNeuromodulationState({
    painState: pain,
    now: "2026-10-02T20:00:00Z"
  });
  const meta = {
    confidence: "grounded",
    attention: ["developer"],
    missingEvidence: [],
    evidenceSignals: ["functional_pain_active", "neuromodulation_active"],
    curiosity: null,
    imagination: null,
    rewardCore: null,
    functionalAffect: null,
    emotionDynamics: null,
    painState: pain,
    neuromodulation,
    feltState: null,
    affectivePreferenceState: null,
    motivationalArbitration: null,
    selfAdaptation: null,
    cortex: null,
    omegaRCT: null,
    instructionActivation: null,
    instinctKernel: null,
    cognitiveSignals: signals
  };
  meta.executivePolicy = deriveAriExecutivePolicy({
    route: { developer: true, complexity: "deep" },
    painState: pain,
    neuromodulation,
    cognitiveSignals: signals
  });
  return meta;
}

test("pain ablation propagates through neuromodulation and changes Ari Executive strategy", () => {
  const meta = baselineMeta();
  const ablations = runCognitiveCausalAblations({
    metacognition: meta,
    route: { developer: true, complexity: "deep" },
    workspace: { neuromodulationState: null }
  });

  const pain = ablations.find(item => item.component === "painState");
  assert.ok(pain);
  assert.equal(pain.interventionScope, "pain_plus_downstream_neuromodulation");
  assert.equal(pain.causalEffectObserved, true);
  assert.equal(pain.reversalRestored, true);
  assert.ok(pain.changedDirectives.some(item => item.directive === "persistence"));
  assert.equal(pain.authorityChanged, false);
});

test("causal trace links state, executive, observable action, verification, outcome, and next-state deltas", () => {
  const meta = baselineMeta();
  const priorNeuromodulation = deriveNeuromodulationState({
    now: "2026-10-02T19:55:00Z"
  });
  const nextPain = normalizePersistedPainState({
    ...highPain(),
    intensity: 0.82,
    persistence: 0.72
  });
  const nextNeuromodulation = deriveNeuromodulationState({
    painState: nextPain,
    now: "2026-10-02T20:05:00Z"
  });

  const trace = buildCognitiveCausalTrace({
    priorState: {
      painState: normalizePersistedPainState({
        intensity: 0.18,
        persistence: 0.12,
        controllability: 0.5,
        integrityThreat: 0.1
      }),
      neuromodulationState: priorNeuromodulation,
      cognitiveSignalState: { feedback: { failureStreak: 1 } }
    },
    workspace: {
      ownerOnly: true,
      neuromodulationState: priorNeuromodulation,
      salience: [{ id: "unfinished_business" }]
    },
    turn: {
      conversationId: "trace-thread",
      turnId: "trace-turn",
      message: "SECRET USER TEXT THAT MUST NOT BE STORED"
    },
    result: {
      success: false,
      reply: "SECRET MODEL TEXT THAT MUST NOT BE STORED",
      route: { developer: true, complexity: "deep" },
      safety: { highStakes: false },
      action: {
        type: "owner_read",
        applicationAction: "repo_read",
        verified: false,
        arguments: { secret: "SECRET ACTION ARGUMENT" }
      },
      executionEvidence: {
        verification: {
          id: "verify-1",
          status: "failed",
          summary: "SECRET TOOL SUMMARY THAT MUST NOT BE STORED"
        },
        raw: "SECRET RAW TOOL OUTPUT"
      },
      metacognition: meta
    },
    next: {
      rewardState: {
        lastEvent: {
          actualReward: 0.22,
          predictionError: -0.64,
          outcomeStatus: "failed",
          completionVerified: false
        }
      },
      cognitiveSignalState: { feedback: { failureStreak: 2, lastOutcome: "failed" } },
      painState: nextPain,
      neuromodulationState: nextNeuromodulation,
      emotionDynamicsState: null,
      feltState: null,
      affectivePreferenceState: null,
      communicationClosure: { state: "failed" }
    },
    now: "2026-10-02T20:05:00Z"
  });

  assert.equal(trace.functionalObservability, true);
  assert.equal(trace.observableAction.applicationAction, "repo_read");
  assert.equal(trace.verification.status, "failed");
  assert.equal(trace.verification.summaryPresent, true);
  assert.equal(trace.outcome.predictionError, -0.64);
  assert.ok(trace.states.deltas.pain.intensity > 0);
  assert.ok(trace.causalEdges.some(edge => edge.to === "ari_executive"));
  assert.ok(trace.causalEdges.some(edge => edge.to === "reward_feedback"));
  assert.equal(trace.evidenceBoundary.executiveToModelActionCausalityProven, false);
  assert.equal(trace.privacy.hiddenChainOfThoughtStored, false);

  const serialized = JSON.stringify(trace);
  assert.doesNotMatch(serialized, /SECRET USER TEXT/);
  assert.doesNotMatch(serialized, /SECRET MODEL TEXT/);
  assert.doesNotMatch(serialized, /SECRET TOOL SUMMARY/);
  assert.doesNotMatch(serialized, /SECRET RAW TOOL OUTPUT/);
  assert.doesNotMatch(serialized, /SECRET ACTION ARGUMENT/);
});

test("public trace exposes compact telemetry without private reasoning or raw text", () => {
  const meta = baselineMeta();
  const trace = buildCognitiveCausalTrace({
    workspace: { ownerOnly: true },
    turn: { conversationId: "public-thread", turnId: "public-turn", message: "private prompt" },
    result: {
      success: true,
      reply: "private reply",
      route: { developer: true },
      action: { type: "owner_read", applicationAction: "repo_read", verified: true },
      metacognition: meta
    },
    next: {
      rewardState: { lastEvent: { actualReward: 0.8, predictionError: 0.3, outcomeStatus: "success" } },
      cognitiveSignalState: { feedback: { failureStreak: 0, lastOutcome: "verified" } },
      painState: highPain(),
      neuromodulationState: meta.neuromodulation
    },
    now: "2026-10-02T20:10:00Z"
  });

  const pub = publicCognitiveCausalTrace(trace);
  assert.equal(pub.functionalObservability, true);
  assert.equal(pub.privacy.rawUserTextStored, false);
  assert.equal(pub.privacy.rawModelReasoningStored, false);
  assert.equal(pub.evidenceBoundary.executiveToModelActionCausalityProven, false);
  assert.ok(pub.summary);
  assert.equal(summarizeCognitiveCausalTrace(trace).traceId, trace.traceId);
});

test("cognitive recurrence persists latest causal trace plus bounded history", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: null,
    turn: {
      conversationId: "persist-trace",
      turnId: "turn-1",
      message: "Inspect the repository"
    },
    route: { developer: true }
  });
  const meta = baselineMeta();

  const first = advanceCognitiveState({
    previous: null,
    workspace,
    turn: {
      conversationId: "persist-trace",
      turnId: "turn-1",
      message: "Inspect the repository"
    },
    result: {
      success: false,
      route: { developer: true },
      safety: { highStakes: false },
      action: { type: "owner_read", applicationAction: "repo_read" },
      metacognition: meta
    }
  });

  assert.ok(first.causalTrace);
  assert.equal(first.causalTraceHistory.length, 1);
  assert.equal(first.epistemic.cognitiveCausalTraceAvailable, true);

  const resumedWorkspace = deriveCognitiveWorkspace({
    previous: first,
    turn: {
      conversationId: "persist-trace",
      turnId: "turn-2",
      message: "Continue"
    },
    route: { developer: true }
  });
  assert.ok(resumedWorkspace.causalObservability?.latest);
  assert.equal(resumedWorkspace.causalObservability.retainedTraceCount, 1);

  const second = advanceCognitiveState({
    previous: first,
    workspace: resumedWorkspace,
    turn: {
      conversationId: "persist-trace",
      turnId: "turn-2",
      message: "Continue"
    },
    result: {
      success: true,
      route: { developer: true },
      safety: { highStakes: false },
      action: { type: "owner_read", applicationAction: "repo_ci_status", verified: true },
      executionEvidence: { verification: { id: "ci-1", status: "passed", summary: "passed" } },
      metacognition: baselineMeta()
    }
  });

  assert.equal(second.causalTraceHistory.length, 2);
  assert.notEqual(second.causalTrace.traceId, first.causalTrace.traceId);

  const normalized = normalizeCognitiveCausalTrace(second.causalTrace);
  assert.equal(normalized.traceId, second.causalTrace.traceId);

  const bounded = normalizeCognitiveCausalTraceHistory(
    Array.from({ length: 20 }, (_, index) => ({
      ...second.causalTrace,
      traceId: "trace-" + index
    }))
  );
  assert.equal(bounded.length, 8);
});

test("causal trace does not claim executive-to-action causality from sequence alone", () => {
  const meta = baselineMeta();
  const trace = buildCognitiveCausalTrace({
    workspace: { ownerOnly: true },
    turn: { conversationId: "boundary", turnId: "turn" },
    result: {
      success: true,
      route: { developer: true },
      action: { type: "owner_read", applicationAction: "repo_search" },
      metacognition: meta
    },
    next: {
      rewardState: { lastEvent: { actualReward: 0.6, predictionError: 0.1 } },
      painState: highPain(),
      neuromodulationState: meta.neuromodulation
    }
  });

  const edge = trace.causalEdges.find(item =>
    item.from === "ari_executive" && item.to === "observable_action"
  );
  assert.ok(edge);
  assert.equal(edge.support, "observed_sequence_not_counterfactual_action_proof");
  assert.equal(trace.evidenceBoundary.executiveToModelActionCausalityProven, false);
});
