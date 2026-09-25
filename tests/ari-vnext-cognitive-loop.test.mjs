import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_JUDGMENT_CONSTITUTION_VERSION,
  advanceCognitiveState,
  cognitiveWorkspaceToInstruction,
  deriveCognitiveWorkspace,
  isOwnerCognitiveLoopEnabled,
  resolveOwnerCognitionMode,
  shouldPersistCognitiveState
} from "../api/_lib/ari-vnext/cognitive-loop.js";

test("owner Advanced Ari enables the cognitive loop while premium alone does not", () => {
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: true, ownerEligible: true }), true);
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: true, ownerEligible: false, premiumEligible: true }), false);
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: false, ownerEligible: true }), false);
});

test("owner cognition stays lightweight for casual turns and deep for meaningful turns", () => {
  const entitlement = { advancedEnabled: true, ownerEligible: true, cognitiveLoopEnabled: true };
  assert.equal(resolveOwnerCognitionMode({
    entitlement,
    route: { casualConversation: true, complexity: "fast" }
  }), "lightweight");
  assert.equal(resolveOwnerCognitionMode({
    entitlement,
    route: { casualConversation: false, complexity: "fast" }
  }), "deep");
  assert.equal(resolveOwnerCognitionMode({
    entitlement: { advancedEnabled: true, ownerEligible: false, cognitiveLoopEnabled: false },
    route: { casualConversation: true }
  }), "off");
});

test("lightweight cognition persists only meaningful state deltas", () => {
  const previous = {
    turnCount: 7,
    beliefSystem: { posture: { mode: "steady", earnedFaith: { eligible: false } }, activeGoal: null },
    affectState: {
      dominantState: { name: "neutral", intensity: 0.1 },
      dimensions: { valence: 0.5 }
    },
    motivationalLearning: { driveBias: 0.5, restraintBias: 0.5 },
    continuity: { familiarity: "familiar", persistentRecognition: true },
    lastOutcome: { motivationalSelectedSide: "balanced" },
    openLoops: [],
    judgments: []
  };
  const bookkeepingOnly = {
    ...previous,
    mode: "lightweight",
    turnCount: 8,
    updatedAt: "2026-09-23T16:00:00.000Z",
    lastTurnId: "greeting-1"
  };
  assert.equal(shouldPersistCognitiveState({
    previous,
    next: bookkeepingOnly,
    mode: "lightweight"
  }), false);

  const meaningful = {
    ...bookkeepingOnly,
    affectState: {
      dominantState: { name: "concerned", intensity: 0.7 },
      dimensions: { valence: 0.3 }
    }
  };
  assert.equal(shouldPersistCognitiveState({
    previous,
    next: meaningful,
    mode: "lightweight"
  }), true);
  assert.equal(shouldPersistCognitiveState({
    previous,
    next: bookkeepingOnly,
    mode: "deep"
  }), true);
});

test("cognitive workspace carries prior state without claiming consciousness", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: {
      turnCount: 3,
      openLoops: [{ id: "pending_action:test", type: "pending_action", label: "Confirm pending change", age: 0, priority: 1 }],
      lastOutcome: { selfMode: "natural_conversation", confidence: "grounded" }
    },
    turn: { message: "Actually, that's wrong." },
    route: { followUp: true },
    context: {}
  });

  assert.equal(workspace.recurrence.priorTurnCount, 3);
  assert.equal(workspace.subjectiveConsciousnessClaimed, false);
  assert.equal(workspace.attention[0], "user_correction");
  assert.equal(workspace.conscience.activeSignals.some((item) => item.principle === "correction"), true);
  assert.equal(workspace.behavioralIdentity.active, true);
  assert.equal(workspace.behavioralIdentity.activeBehaviors[0].id, "repair_exactly");

  const instruction = cognitiveWorkspaceToInstruction(workspace);
  assert.match(instruction, /not evidence or a claim that Ari has subjective consciousness/i);
  assert.match(instruction, /truth\/evidence/);
  assert.match(instruction, /user agency\/consent/);
  assert.match(instruction, /ARI BEHAVIORAL IDENTITY CONTROL/);
});

test("owner workspace activates independent judgment constitution for opinion questions", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: { turnCount: 2 },
    turn: { message: "What do you think about using several models to power Ari?" },
    route: { developer: true },
    context: {}
  });

  assert.equal(workspace.judgment.constitutionVersion, ARI_JUDGMENT_CONSTITUTION_VERSION);
  assert.equal(workspace.judgment.requested, true);
  assert.equal(workspace.judgment.independentFromUserPreference, true);
  assert.equal(workspace.attention.includes("independent_judgment"), true);
  assert.equal(workspace.operatingContract.some((item) => /truth rather than agreement/i.test(item)), true);

  const instruction = cognitiveWorkspaceToInstruction(workspace);
  assert.match(instruction, /independently evaluate the issue instead of optimizing for agreement/i);
  assert.match(instruction, /strongest credible countercase/i);
  assert.match(instruction, /possibility\/upside pass/i);
  assert.match(instruction, /keep that limitation local/i);
});

test("general Ari judgments persist from visible conclusions and return as relevant prior stances", () => {
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: { turnCount: 0 },
    turn: { message: "What do you think about multi model orchestration for Ari?" },
    route: { developer: true },
    context: {}
  });

  const firstState = advanceCognitiveState({
    previous: { turnCount: 0 },
    workspace: firstWorkspace,
    turn: { turnId: "turn-opinion-1", surface: "home", message: "What do you think about multi model orchestration for Ari?" },
    result: {
      reply: "Multi-model orchestration is useful when Ari remains the decision layer instead of blindly averaging model outputs. It adds redundancy without giving up identity.",
      metacognition: { confidence: "grounded", missingEvidence: [], evidenceSignals: ["architecture_tradeoffs"] },
      selfModel: { current: { mode: "grounded_reasoning" } },
      relationshipContinuity: {},
      goalHierarchy: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(firstState.judgments.length, 1);
  assert.equal(firstState.judgments[0].source, "visible_reply");
  assert.match(firstState.judgments[0].position, /Multi-model orchestration is useful/i);
  assert.equal(firstState.lastOutcome.judgmentRecorded, true);

  const secondWorkspace = deriveCognitiveWorkspace({
    previous: firstState,
    turn: { message: "What's your opinion on Ari using model orchestration now?" },
    route: { developer: true },
    context: {}
  });

  assert.equal(secondWorkspace.judgment.priorStances.length, 1);
  assert.match(secondWorkspace.judgment.priorStances[0].position, /decision layer/i);
  assert.ok(secondWorkspace.judgment.priorStances[0].relevance > 0);
});

test("a materially similar later judgment revises the stored stance instead of creating duplicates", () => {
  const previous = {
    turnCount: 4,
    judgments: [{
      version: "1.0.0",
      topicKey: "multi_model_orchestration_ari",
      topicTerms: ["multi", "model", "orchestration", "ari"],
      position: "Use multiple models whenever possible.",
      confidence: 0.7,
      confidenceLabel: "grounded",
      evidenceSignals: [],
      revisionPolicy: "new_evidence_or_stronger_reasoning",
      source: "visible_reply",
      sourceTurnId: "old-turn",
      updatedAt: "2026-09-14T10:00:00.000Z",
      ageTurns: 2
    }]
  };
  const workspace = deriveCognitiveWorkspace({
    previous,
    turn: { message: "Do you think Ari should use multi model orchestration?" },
    route: { developer: true },
    context: {}
  });
  const next = advanceCognitiveState({
    previous,
    workspace,
    turn: { turnId: "turn-opinion-2", surface: "home", message: "Do you think Ari should use multi model orchestration?" },
    result: {
      reply: "Use multiple models selectively. Ari should consult peers when disagreement or uncertainty is worth the extra cost, not on every turn.",
      metacognition: { confidence: "grounded", missingEvidence: [], evidenceSignals: ["latency", "cost", "redundancy"] },
      selfModel: { current: {} },
      relationshipContinuity: {},
      goalHierarchy: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(next.judgments.length, 1);
  assert.equal(next.judgments[0].sourceTurnId, "turn-opinion-2");
  assert.match(next.judgments[0].position, /selectively/i);
});

test("personal decision answers are not copied into the persistent Ari judgment ledger", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: { turnCount: 5 },
    turn: { message: "What do you think I should do about my wife's concern?" },
    route: { followUp: true },
    context: {}
  });

  const next = advanceCognitiveState({
    previous: { turnCount: 5 },
    workspace,
    turn: { turnId: "private-turn", surface: "home", message: "What do you think I should do about my wife's concern?" },
    result: {
      reply: "Address the concern directly and agree on a concrete plan together.",
      metacognition: { confidence: "partial", missingEvidence: [], evidenceSignals: [] },
      selfModel: { current: {} },
      relationshipContinuity: {},
      goalHierarchy: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(next.judgments.length, 0);
  assert.equal(next.lastOutcome.judgmentRecorded, false);
});

test("filtered relevant memory enters only the current workspace and is not copied into persistent cognitive state", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: { turnCount: 4 },
    turn: { message: "What do you think I should do?" },
    route: {},
    context: { relevantMemory: "User prefers concise recommendations and previously chose option B." }
  });

  assert.equal(workspace.continuity.currentTurnRelevantMemoryAvailable, true);
  assert.match(workspace.continuity.currentTurnRelevantMemory, /previously chose option B/);
  assert.equal(workspace.continuity.currentTurnRelevantMemoryEphemeral, true);
  assert.equal(workspace.salience.some((item) => item.id === "relevant_durable_memory"), true);

  const next = advanceCognitiveState({
    previous: { turnCount: 4 },
    workspace,
    turn: { turnId: "turn-5", surface: "home", message: "What do you think I should do?" },
    result: {
      reply: "I would choose B again for the same reason.",
      metacognition: { confidence: "grounded", missingEvidence: [], evidenceSignals: [] },
      selfModel: { current: { familiarity: "familiar", persistentRecognition: true } },
      relationshipContinuity: { recognizedUser: true },
      goalHierarchy: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(next.continuity.persistentRecognition, true);
  assert.equal(Object.hasOwn(next.continuity, "currentTurnRelevantMemory"), false);
  assert.equal(JSON.stringify(next).includes("previously chose option B"), false);
});

test("cognitive state advances from metacognition, self-model, and unresolved work", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: { turnCount: 1 },
    turn: { message: "Help me decide." },
    route: {},
    context: {}
  });

  const next = advanceCognitiveState({
    previous: { turnCount: 1 },
    workspace,
    turn: { turnId: "turn-2", surface: "home" },
    result: {
      reply: "Here is my recommendation.",
      metacognition: {
        confidence: "partial",
        missingEvidence: ["memory"],
        evidenceSignals: ["longitudinal_signals"]
      },
      selfModel: { current: { mode: "grounded_reasoning", familiarity: "developing", persistentRecognition: true } },
      relationshipContinuity: { recognizedUser: true },
      goalHierarchy: { primary: { id: "goal-1" }, tradeoffs: [{ id: "tradeoff-1", summary: "Speed versus recovery" }] },
      pendingAction: { id: "pending-1", name: "update_training" },
      action: { type: "proposed_action", applicationAction: "update_training" },
      safety: { highStakes: false }
    }
  });

  assert.equal(next.turnCount, 2);
  assert.equal(next.epistemic.confidence, "partial");
  assert.equal(next.continuity.persistentRecognition, true);
  assert.equal(next.lastOutcome.primaryGoalId, "goal-1");
  assert.equal(next.openLoops.some((item) => item.type === "pending_action"), true);
  assert.equal(next.openLoops.some((item) => item.type === "goal_tradeoff"), true);
});


test("personality evaluation persists observable behavior and influences the next workspace", () => {
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: { turnCount: 0 },
    turn: { message: "What do you think about adding another orchestration layer?" },
    route: { developer: true },
    context: {}
  });

  const next = advanceCognitiveState({
    previous: { turnCount: 0 },
    workspace: firstWorkspace,
    turn: {
      turnId: "personality-eval-1",
      surface: "home",
      message: "What do you think about adding another orchestration layer?"
    },
    result: {
      success: true,
      reply: "I would not add it yet. The current architecture should stay simpler until a measurable failure shows that another layer buys us something.",
      route: { developer: true },
      metacognition: { confidence: "grounded", missingEvidence: [], evidenceSignals: ["current_architecture"] },
      selfModel: { current: {} },
      relationshipContinuity: {},
      goalHierarchy: {},
      safety: { highStakes: false }
    }
  });

  assert.equal(next.personalityEvaluation.sampleSize, 1);
  assert.equal(next.lastOutcome.personalityEvaluationStatus, "pass");
  assert.equal(next.personalityEvaluation.last.dimensions.intelligent_disagreement.applicable, true);
  assert.equal(next.personalityEvaluation.last.dimensions.intelligent_disagreement.status, "pass");

  const secondWorkspace = deriveCognitiveWorkspace({
    previous: {
      ...next,
      personalityEvaluation: {
        ...next.personalityEvaluation,
        improvementTargets: [{
          id: "repair_quality",
          priority: 0.9,
          rollingScore: 0.6,
          recentIssueCount: 2,
          instruction: "Name the exact mistake before correcting it."
        }]
      }
    },
    turn: { message: "Actually, you misunderstood what I meant." },
    route: { followUp: true },
    context: {}
  });

  assert.equal(secondWorkspace.behavioralIdentity.evaluationFeedbackApplied, true);
  assert.ok(secondWorkspace.behavioralIdentity.activeBehaviors.some((item) => item.id === "eval_repair_repair_quality"));
});
