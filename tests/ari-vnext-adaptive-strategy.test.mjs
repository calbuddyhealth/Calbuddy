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

test("adaptive strategy state prioritizes practical priors while preserving challengers", () => {
  const state = deriveAdaptiveStrategyState({
    route: { developer: true },
    strategies: [
      {
        id: "p1",
        strategy_key: "verify_current_state",
        title: "Verify current state",
        instruction: "Verify current external state before making implementation claims.",
        lesson_summary: "Changing systems should be checked before relying on remembered state.",
        domains: ["general"],
        status: "practical_prior",
        confidence: 0.94,
        maturity_score: 0.91,
        trials: 22,
        positive_outcomes: 15,
        negative_outcomes: 1
      },
      {
        id: "a1",
        strategy_key: "compare_alternatives",
        title: "Compare alternatives",
        instruction: "Compare plausible alternatives before a consequential recommendation.",
        domains: ["general"],
        status: "adopted",
        confidence: 0.88,
        trials: 8,
        positive_outcomes: 5,
        negative_outcomes: 0
      },
      {
        id: "t1",
        strategy_key: "verify_repo_state_v2",
        title: "Verify repository state v2",
        instruction: "Check repository state and deployment state before implementation claims.",
        domains: ["developer"],
        status: "testing",
        confidence: 0.78,
        replaces_strategy_key: "verify_current_state"
      },
      {
        id: "r1",
        strategy_key: "retired_strategy",
        title: "Old strategy",
        instruction: "Do an old thing.",
        domains: ["general"],
        status: "retired",
        confidence: 0.99
      }
    ]
  });

  assert.equal(state.nonRegressiveEvolution, true);
  assert.equal(state.practicalPriorMaturation, true);
  assert.equal(state.policy.practicalPriorsAreDefaultsNotDogma, true);
  assert.equal(state.activeCount, 3);
  assert.equal(state.practicalPriorCount, 1);
  assert.equal(state.adoptedCount, 1);
  assert.equal(state.testingCount, 1);
  assert.equal(state.active[0].strategyKey, "verify_current_state");
  assert.equal(state.active.some((item) => item.strategyKey === "retired_strategy"), false);
  assert.match(adaptiveStrategyInstruction(state), /practical_prior is accumulated practical judgment/i);
  assert.match(adaptiveStrategyInstruction(state), /current evidence and explicit current user correction outrank it/i);
});

test("positive evidence can promote a new testing strategy without displacing an incumbent", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "1",
    strategyKey: "lead_with_recommendation",
    title: "Lead with recommendation",
    instruction: "Lead with the strongest recommendation before listing alternatives.",
    status: "testing",
    confidence: 0.78,
    trials: 3,
    positiveOutcomes: 2,
    negativeOutcomes: 0,
    neutralOutcomes: 1
  }, "positive", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.statusChanged, true);
  assert.equal(evaluated.nextStatus, "adopted");
  assert.equal(evaluated.strategy.trials, 4);
  assert.equal(evaluated.strategy.positiveOutcomes, 3);
  assert.ok(evaluated.strategy.adoptedAt);
});

test("an adopted strategy matures into a practical prior only after deep repeated evidence", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "m1",
    strategyKey: "conflicting_evidence",
    title: "Resolve conflicting evidence",
    instruction: "Compare plausible explanations before committing when evidence conflicts.",
    lessonSummary: "Conflicting evidence should be reconciled before commitment.",
    status: "adopted",
    confidence: 0.92,
    trials: 17,
    positiveOutcomes: 12,
    negativeOutcomes: 1,
    neutralOutcomes: 4,
    adoptedAt: "2026-08-10T07:00:00Z"
  }, "positive", new Date("2026-08-20T07:00:00Z"), {
    distinctContextCount: 1,
    resolvedUseCount: 18,
    recentResolvedCount: 6,
    recentNegativeCount: 0
  });

  assert.equal(evaluated.nextStatus, "practical_prior");
  assert.equal(evaluated.statusChanged, true);
  assert.ok(evaluated.strategy.maturedAt);
  assert.ok(evaluated.maturityScore >= 0.86);
});

test("an adopted strategy does not mature early just because confidence is high", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "m2",
    strategyKey: "young_strategy",
    title: "Young strategy",
    instruction: "Use a promising method that still lacks enough real-world trials.",
    status: "adopted",
    confidence: 0.95,
    trials: 7,
    positiveOutcomes: 6,
    negativeOutcomes: 0,
    neutralOutcomes: 1
  }, "positive", new Date("2026-08-20T07:00:00Z"), {
    distinctContextCount: 3,
    resolvedUseCount: 8,
    recentResolvedCount: 6,
    recentNegativeCount: 0
  });

  assert.equal(evaluated.nextStatus, "adopted");
});

test("a practical prior keeps the lesson after a mistake and recommends a challenger when recent evidence degrades", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "p2",
    strategyKey: "practical_default",
    title: "Practical default",
    instruction: "Use the mature default unless current evidence contradicts it.",
    lessonSummary: "A mature default remains useful until a better explanation is demonstrated.",
    status: "practical_prior",
    confidence: 0.91,
    maturityScore: 0.9,
    trials: 24,
    positiveOutcomes: 15,
    negativeOutcomes: 3,
    neutralOutcomes: 6,
    maturedAt: "2026-08-15T07:00:00Z"
  }, "negative", new Date("2026-08-20T07:00:00Z"), {
    distinctContextCount: 3,
    resolvedUseCount: 25,
    recentResolvedCount: 6,
    recentNegativeCount: 3
  });

  assert.equal(evaluated.nextStatus, "practical_prior");
  assert.equal(evaluated.statusChanged, false);
  assert.equal(evaluated.strategy.retiredAt, null);
  assert.equal(evaluated.replacementRecommended, true);
  assert.match(evaluated.strategy.lessonSummary, /mature default remains useful/i);
});

test("replacing a practical prior requires stronger evidence than replacing an ordinary adopted method", () => {
  const notReady = evaluateStrategyOutcome({
    id: "rp1",
    strategyKey: "decision_method_v3",
    title: "Decision method v3",
    instruction: "Test a better decision method while preserving the mature incumbent.",
    status: "testing",
    confidence: 0.9,
    trials: 9,
    positiveOutcomes: 7,
    negativeOutcomes: 0,
    neutralOutcomes: 2,
    replacesStrategyKey: "decision_common_sense"
  }, "positive", new Date("2026-08-20T07:00:00Z"), {
    distinctContextCount: 3,
    resolvedUseCount: 10,
    recentResolvedCount: 6,
    recentNegativeCount: 0,
    replacementTargetStatus: "practical_prior"
  });

  assert.equal(notReady.nextStatus, "testing");

  const proven = evaluateStrategyOutcome({
    id: "rp2",
    strategyKey: "decision_method_v3",
    title: "Decision method v3",
    instruction: "Test a better decision method while preserving the mature incumbent.",
    status: "testing",
    confidence: 0.91,
    trials: 11,
    positiveOutcomes: 8,
    negativeOutcomes: 1,
    neutralOutcomes: 2,
    replacesStrategyKey: "decision_common_sense"
  }, "positive", new Date("2026-08-20T08:00:00Z"), {
    distinctContextCount: 3,
    resolvedUseCount: 12,
    recentResolvedCount: 6,
    recentNegativeCount: 0,
    replacementTargetStatus: "practical_prior"
  });

  assert.equal(proven.nextStatus, "practical_prior");
  assert.ok(proven.strategy.maturedAt);
});

test("repeated negative outcomes can retire only an unproven testing strategy", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "3",
    strategyKey: "too_many_options",
    title: "Many options",
    instruction: "Always give many options.",
    status: "testing",
    confidence: 0.68,
    trials: 4,
    positiveOutcomes: 0,
    negativeOutcomes: 2,
    neutralOutcomes: 2
  }, "negative", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.nextStatus, "retired");
  assert.equal(evaluated.strategy.negativeOutcomes, 3);
  assert.ok(evaluated.strategy.retiredAt);
});

test("an adopted strategy never disappears just because outcomes turn negative", () => {
  const evaluated = evaluateStrategyOutcome({
    id: "4",
    strategyKey: "incumbent_method",
    title: "Incumbent method",
    instruction: "Use the current best-known method while evidence still supports it.",
    status: "adopted",
    confidence: 0.8,
    trials: 8,
    positiveOutcomes: 1,
    negativeOutcomes: 3,
    neutralOutcomes: 4,
    adoptedAt: "2026-08-19T07:00:00Z"
  }, "negative", new Date("2026-08-20T07:00:00Z"));

  assert.equal(evaluated.nextStatus, "adopted");
  assert.equal(evaluated.statusChanged, false);
  assert.equal(evaluated.strategy.retiredAt, null);
  assert.equal(evaluated.replacementRecommended, true);
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

test("proposal normalization retains a compact lesson and practical-prior maturation creates an Ari Signal", () => {
  const strong = normalizeAdaptiveStrategyProposal({
    shouldPropose: true,
    strategyKey: "competing_hypotheses",
    title: "Competing hypotheses",
    instruction: "When evidence conflicts, compare multiple plausible explanations and let the strongest evidence decide the recommendation.",
    rationale: "This reduces premature commitment.",
    lessonSummary: "Conflicting evidence should be reconciled before commitment.",
    domains: ["decision", "evidence"],
    confidence: 0.84,
    replacesStrategyKey: "",
    userVisibleSummary: "I found a more reliable way to handle conflicting evidence."
  });
  assert.equal(strong.strategyKey, "competing_hypotheses");
  assert.match(strong.lessonSummary, /reconciled before commitment/i);

  const signal = buildStrategyAdoptionSignal({
    ...strong,
    id: "x",
    status: "practical_prior",
    trials: 20,
    maturityScore: 0.91,
    maturedAt: "2026-08-20T08:00:00Z"
  });
  assert.equal(signal.reasonId, "adaptive_practical_prior_matured");
  assert.match(signal.context, /maturity=practical_prior/);
});
