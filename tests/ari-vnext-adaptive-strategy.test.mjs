import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptiveStrategyInstruction,
  buildStrategyAdoptionSignal,
  classifyStrategyFeedback,
  deriveAdaptiveStrategyState,
  evaluateStrategyOutcome,
  normalizeAdaptiveStrategyProposal,
  shouldRunAdaptiveStrategyReflection
} from "../api/_lib/ari-vnext/adaptive-strategy.js";

test("adaptive strategy state loads relevant adopted and testing strategies only", () => {
  const state = deriveAdaptiveStrategyState({
    route: { developer: true },
    strategies: [
      {
        id: "1",
        strategy_key: "compare_alternatives",
        title: "Compare alternatives",
        instruction: "Compare plausible alternatives before a consequential recommendation.",
        domains: ["general"],
        status: "adopted",
        confidence: 0.88,
        trials: 6,
        positive_outcomes: 3,
        negative_outcomes: 0
      },
      {
        id: "2",
        strategy_key: "verify_repo_state",
        title: "Verify repository state",
        instruction: "Check the current repository state before making implementation claims.",
        domains: ["developer"],
        status: "testing",
        confidence: 0.75
      },
      {
        id: "3",
        strategy_key: "nutrition_only",
        title: "Nutrition strategy",
        instruction: "Use nutrition-specific evidence.",
        domains: ["nutrition"],
        status: "adopted",
        confidence: 0.95
      },
      {
        id: "4",
        strategy_key: "retired_strategy",
        title: "Old strategy",
        instruction: "Do an old thing.",
        domains: ["general"],
        status: "retired",
        confidence: 0.99
      }
    ]
  });

  assert.equal(state.activeCount, 2);
  assert.equal(state.adoptedCount, 1);
  assert.equal(state.testingCount, 1);
  assert.equal(state.active.some((item) => item.strategyKey === "nutrition_only"), false);
  assert.equal(state.active.some((item) => item.strategyKey === "retired_strategy"), false);
  assert.match(adaptiveStrategyInstruction(state), /not facts, memories, values, permissions/i);
});

test("positive evidence can promote a testing strategy", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "1",
    strategyKey: "lead_with_recommendation",
    title: "Lead with recommendation",
    instruction: "Lead with the strongest recommendation before listing alternatives.",
    status: "testing",
    confidence: 0.74,
    trials: 2,
    positiveOutcomes: 1,
    negativeOutcomes: 0,
    neutralOutcomes: 1
  }, "positive", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.statusChanged, true);
  assert.equal(evaluated.nextStatus, "adopted");
  assert.equal(evaluated.strategy.trials, 3);
  assert.equal(evaluated.strategy.positiveOutcomes, 2);
  assert.ok(evaluated.strategy.adoptedAt);
});

test("repeated neutral survival can promote a high-confidence strategy without fake praise", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "2",
    strategyKey: "minimal_clarification",
    title: "Minimal clarification",
    instruction: "Ask one clarifying question only when ambiguity changes the decision.",
    status: "testing",
    confidence: 0.79,
    trials: 4,
    positiveOutcomes: 0,
    negativeOutcomes: 0,
    neutralOutcomes: 4
  }, "neutral", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.nextStatus, "adopted");
  assert.equal(evaluated.strategy.trials, 5);
  assert.equal(evaluated.strategy.neutralOutcomes, 5);
});

test("repeated negative outcomes retire a weak strategy", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "3",
    strategyKey: "too_many_options",
    title: "Many options",
    instruction: "Always give many options.",
    status: "testing",
    confidence: 0.68,
    trials: 3,
    positiveOutcomes: 0,
    negativeOutcomes: 1,
    neutralOutcomes: 2
  }, "negative", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.nextStatus, "retired");
  assert.equal(evaluated.strategy.negativeOutcomes, 2);
  assert.ok(evaluated.strategy.retiredAt);
});

test("strategy feedback uses explicit correction and approval signals", () => {
  assert.equal(classifyStrategyFeedback("That's wrong — you misunderstood me."), "negative");
  assert.equal(classifyStrategyFeedback("That's better. Exactly."), "positive");
  assert.equal(classifyStrategyFeedback("What about tomorrow?"), "neutral");
});

test("reflection is selective rather than running after every turn", () => {
  const normalResult = {
    success: true,
    reply: "Here is the answer.",
    action: null,
    metacognition: { confidence: "grounded", missingEvidence: [] },
    scientificIntelligence: { outcomeLearning: { applied: false } }
  };

  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "Thanks", result: normalResult, cognitiveTurnCount: 3 }), false);
  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "That's wrong.", result: normalResult, cognitiveTurnCount: 3 }), true);
  assert.equal(shouldRunAdaptiveStrategyReflection({ message: "Continue", result: normalResult, cognitiveTurnCount: 5 }), true);
});

test("proposal normalization rejects weak ideas and adoption creates an Ari Signal candidate", () => {
  const weak = normalizeAdaptiveStrategyProposal({
    shouldPropose: true,
    strategyKey: "weak",
    title: "Weak",
    instruction: "Do better somehow.",
    rationale: "",
    domains: ["general"],
    confidence: 0.4,
    replacesStrategyKey: "",
    userVisibleSummary: ""
  });
  assert.equal(weak, null);

  const strong = normalizeAdaptiveStrategyProposal({
    shouldPropose: true,
    strategyKey: "competing_hypotheses",
    title: "Competing hypotheses",
    instruction: "When evidence conflicts, compare multiple plausible explanations and let the strongest evidence decide the recommendation.",
    rationale: "This reduces premature commitment.",
    domains: ["decision", "evidence"],
    confidence: 0.84,
    replacesStrategyKey: "",
    userVisibleSummary: "I found a more reliable way to handle conflicting evidence, so I'm using it going forward."
  });
  assert.equal(strong.strategyKey, "competing_hypotheses");

  const signal = buildStrategyAdoptionSignal({ ...strong, id: "x", status: "adopted", trials: 5 });
  assert.equal(signal.reasonId, "adaptive_strategy_adopted");
  assert.match(signal.opener, /more reliable way/i);
});
