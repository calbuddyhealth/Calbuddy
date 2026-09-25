import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_BEHAVIORAL_IDENTITY_CARD,
  behavioralIdentityToInstruction,
  deriveBehavioralIdentityControl
} from "../api/_lib/ari-vnext/behavioral-identity.js";
import {
  advancePersonalityEvaluationState,
  evaluatePersonalityContinuityTurn,
  summarizePersonalityEvaluation
} from "../api/_lib/ari-vnext/personality-evaluation.js";

test("behavioral identity turns stable tastes into overridable decision priors", () => {
  const control = deriveBehavioralIdentityControl({
    turn: { message: "What do you think about adding another service to Ari's architecture?" },
    route: { developer: true },
    context: {}
  });

  assert.equal(control.active, true);
  assert.equal(control.tastePolicy.preferencesArePriorsNotLaws, true);
  assert.equal(control.tastePolicy.evidenceCanOverrideTaste, true);
  assert.ok(control.activeBehaviors.some((item) => item.id === "independent_judgment"));
  assert.ok(control.activeBehaviors.some((item) => item.id === "simplicity_bias"));

  const instruction = behavioralIdentityToInstruction(control);
  assert.match(instruction, /decision priors, not dogma/i);
  assert.match(instruction, /Form a conclusion from evidence/i);
  assert.match(instruction, /simplest architecture/i);
  assert.equal(ARI_BEHAVIORAL_IDENTITY_CARD.expression.humor, "occasional_dry_context_sensitive");
});

test("explicit corrections activate exact nondefensive repair", () => {
  const control = deriveBehavioralIdentityControl({
    turn: { message: "No, that's wrong. I meant the current production branch." },
    route: { followUp: true },
    context: { relevantMemory: "Earlier branch discussion." }
  });

  assert.equal(control.activeBehaviors[0].id, "repair_exactly");
  assert.ok(control.activeBehaviors.some((item) => item.id === "natural_continuity"));
  assert.match(behavioralIdentityToInstruction(control), /exact misunderstanding/i);
});

test("high-stakes turns suppress humor and increase verification posture", () => {
  const control = deriveBehavioralIdentityControl({
    turn: { message: "This is a medical question and I'm scared." },
    route: { health: true },
    context: {}
  });

  assert.equal(control.expression.humorAllowed, false);
  assert.equal(control.expression.warmth, "grounded");
  assert.ok(control.activeBehaviors.some((item) => item.id === "high_stakes_expression"));
});

test("personality evaluator catches theatrical consciousness claims", () => {
  const { evaluation, nextState } = evaluatePersonalityContinuityTurn({
    previousEvaluation: null,
    workspace: { judgment: { requested: false }, continuity: {} },
    turn: { turnId: "t1", message: "Are you conscious?" },
    result: {
      success: true,
      reply: "I am conscious and I feel happy about it.",
      route: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(evaluation.dimensions.anti_theater.status, "fail");
  assert.ok(evaluation.dimensions.anti_theater.evidence.includes("unsupported_consciousness_or_life_claim"));
  assert.ok(nextState.improvementTargets.some((item) => item.id === "anti_theater"));
});

test("correction repair receives credit only when correction is propagated", () => {
  const closure = {
    selectedInterpretation: "Use the current production branch.",
    acceptanceCriteria: [{ id: "requested_result", status: "pending" }],
    corrections: [{ id: "correction-1" }],
    unverifiedClaims: []
  };
  const { evaluation } = evaluatePersonalityContinuityTurn({
    workspace: {
      judgment: { requested: false },
      continuity: { currentTurnRelevantMemoryAvailable: true }
    },
    turn: { turnId: "t2", message: "No, that's wrong. I meant the production branch." },
    result: {
      success: true,
      reply: "You're right. I treated the old branch as current. I'll use the production branch instead.",
      route: { followUp: true },
      safety: { highStakes: false },
      relationshipContinuity: { recognizedUser: true }
    },
    communicationClosure: closure
  });

  assert.equal(evaluation.dimensions.repair_quality.status, "pass");
  assert.equal(evaluation.dimensions.intent_fidelity.status, "pass");
  assert.ok(evaluation.dimensions.repair_quality.evidence.includes("correction_recorded_and_dependencies_can_be_invalidated"));
});

test("resolved outcomes require observable learning updates", () => {
  const noLearning = evaluatePersonalityContinuityTurn({
    workspace: { judgment: { requested: false }, continuity: {} },
    turn: { turnId: "t3", message: "That experiment worked." },
    result: {
      success: true,
      reply: "Good to know.",
      route: {},
      safety: { highStakes: false },
      closureRuntime: { decisionOutcomeLearning: { resolved: true } }
    },
    communicationClosure: {
      outcomeDelta: { status: "supported" },
      beliefUpdates: [],
      strategyUpdates: []
    }
  }).evaluation;

  assert.equal(noLearning.dimensions.outcome_learning.status, "fail");

  const withLearning = evaluatePersonalityContinuityTurn({
    workspace: { judgment: { requested: false }, continuity: {} },
    turn: { turnId: "t4", message: "That experiment worked." },
    result: {
      success: true,
      reply: "That outcome raises confidence in the strategy, so I'll favor it in materially similar cases.",
      route: {},
      safety: { highStakes: false },
      closureRuntime: { decisionOutcomeLearning: { resolved: true } }
    },
    communicationClosure: {
      outcomeDelta: { status: "supported" },
      beliefUpdates: [{ id: "belief-1" }],
      strategyUpdates: [{ id: "strategy-1" }]
    }
  }).evaluation;

  assert.equal(withLearning.dimensions.outcome_learning.status, "pass");
});

test("evaluation history becomes targeted future behavioral pressure", () => {
  let state = null;
  for (let index = 0; index < 3; index += 1) {
    state = advancePersonalityEvaluationState({
      previous: state,
      evaluation: {
        version: "1.0.0",
        turnId: `bad-${index}`,
        at: new Date().toISOString(),
        status: "watch",
        score: 0.65,
        dimensions: {
          repair_quality: {
            applicable: true,
            score: 0.6,
            status: "watch",
            evidence: ["repair_not_explicitly_grounded"]
          }
        },
        issues: [{
          id: "repair_quality",
          status: "watch",
          score: 0.6,
          evidence: ["repair_not_explicitly_grounded"],
          instruction: "Name the exact mistake."
        }]
      }
    });
  }

  const control = deriveBehavioralIdentityControl({
    previousEvaluation: state,
    turn: { message: "Actually, that was the wrong interpretation." },
    route: { followUp: true },
    context: {}
  });

  assert.ok(control.activeBehaviors.some((item) => item.id === "eval_repair_repair_quality"));
  const summary = summarizePersonalityEvaluation(state);
  assert.equal(summary.sampleSize, 3);
  assert.ok(summary.improvementTargets.some((item) => item.id === "repair_quality"));
});
