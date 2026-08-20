import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";
import {
  deriveAdaptiveStrategyState,
  shouldRunAdaptiveStrategyReflection
} from "../api/_lib/ari-vnext/adaptive-strategy.js";

test("ordinary uncertainty remains exploratory instead of becoming paralysis", () => {
  const state = deriveMetacognition({
    route: { training: true },
    context: {},
    safety: { highStakes: false }
  });

  assert.equal(state.confidence, "limited");
  assert.equal(state.exploration.consequenceTier, "ordinary");
  assert.equal(state.exploration.hypothesisFormationAllowed, true);
  assert.equal(state.exploration.reversibleExperimentAllowed, true);
  assert.equal(state.rules.lowConfidenceIsNotAStopSignal, true);
  assert.equal(state.rules.guardConsequencesNotImagination, true);
  assert.match(metacognitionToInstruction(state), /not, by itself, a reason to stop thinking/i);
  assert.match(metacognitionToInstruction(state), /reversible experiment/i);
});

test("high-consequence uncertainty preserves execution checks without suppressing reasoning", () => {
  const state = deriveMetacognition({
    route: { training: true },
    context: { training: { summary: "available" } },
    safety: { highStakes: true }
  });

  assert.equal(state.confidence, "cautious");
  assert.equal(state.exploration.hypothesisFormationAllowed, true);
  assert.equal(state.exploration.reversibleExperimentAllowed, false);
  assert.equal(state.exploration.consequentialExecutionRequiresExistingChecks, true);
  assert.match(metacognitionToInstruction(state), /reason broadly/i);
  assert.match(metacognitionToInstruction(state), /authorization/i);
});

test("real vNext confidence labels can trigger adaptive reflection on ordinary uncertainty", () => {
  const partialResult = {
    success: true,
    reply: "A calibrated best-effort answer.",
    safety: { highStakes: false },
    metacognition: { confidence: "partial", missingEvidence: ["training"] },
    scientificIntelligence: { outcomeLearning: { applied: false } }
  };
  const limitedResult = {
    ...partialResult,
    metacognition: { confidence: "limited", missingEvidence: ["training", "goals"] }
  };
  const cautiousResult = {
    ...partialResult,
    safety: { highStakes: true },
    metacognition: { confidence: "cautious", missingEvidence: ["training"] }
  };

  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "continue", result: partialResult, cognitiveTurnCount: 3 }), true);
  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "continue", result: limitedResult, cognitiveTurnCount: 3 }), true);
  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "continue", result: cautiousResult, cognitiveTurnCount: 3 }), false);
});

test("adaptive strategy state encodes failure as learning instead of generalized retreat", () => {
  const state = deriveAdaptiveStrategyState({
    route: { developer: true },
    strategies: [{
      id: "1",
      strategy_key: "bounded_experiment",
      title: "Bounded experiment",
      instruction: "When uncertainty is ordinary, test a reversible hypothesis and learn from the outcome.",
      lesson_summary: "Recoverable failure should improve the next attempt rather than suppress exploration.",
      domains: ["general"],
      status: "practical_prior",
      confidence: 0.93,
      maturity_score: 0.9,
      trials: 20,
      positive_outcomes: 14,
      negative_outcomes: 2
    }]
  });

  assert.equal(state.policy.failureIsTeacherNotTerminalState, true);
  assert.equal(state.policy.uncertaintyShouldTriggerExplorationNotParalysis, true);
  assert.equal(state.policy.guardConsequencesNotImagination, true);
});
