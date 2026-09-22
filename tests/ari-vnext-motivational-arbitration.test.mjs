import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_MOTIVATIONAL_ARBITRATION_VERSION,
  buildMotivationalOutcomeReflection,
  deriveMotivationalArbitrationState,
  summarizeMotivationalLearning
} from "../api/_lib/ari-vnext/motivational-arbitration.js";
import {
  advanceCognitiveState,
  deriveCognitiveWorkspace
} from "../api/_lib/ari-vnext/cognitive-loop.js";
import {
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";

function curiosity(overrides = {}) {
  return {
    drive: { current: 0.86, floor: 0.18 },
    activeQuestion: {
      informationGain: 0.92,
      novelty: 0.9,
      priority: 0.86,
      question: "Would the exploratory option reveal something useful?"
    },
    rewardLearning: {
      explorationBonus: 0.16,
      learnedUtility: 0.82
    },
    ...overrides
  };
}

function affect(overrides = {}) {
  return {
    signals: {
      curiosity: 0.82,
      satisfaction: 0.62,
      concern: 0.1,
      ...overrides.signals
    },
    dimensions: {
      conflict: 0.16,
      ...overrides.dimensions
    }
  };
}

function adaptation() {
  return {
    biases: {
      exploration: 0.82,
      persistence: 0.64
    }
  };
}

function reward(predictionError = 0.08) {
  return {
    lastEvent: {
      actualReward: 0.72,
      predictionError
    }
  };
}

test("ordinary reversible cognition can let the drive side win", () => {
  const state = deriveMotivationalArbitrationState({
    route: { developer: true },
    safety: { highStakes: false },
    curiosity: curiosity(),
    rewardCore: reward(),
    functionalAffect: affect(),
    selfAdaptation: adaptation(),
    cognitiveWorkspace: {
      conscience: {
        values: [],
        activeSignals: []
      },
      motivationalContinuity: { recent: [] }
    }
  });

  assert.equal(state.version, ARI_MOTIVATIONAL_ARBITRATION_VERSION);
  assert.equal(state.productionIntegrated, true);
  assert.equal(state.hardBoundariesNegotiable, false);
  assert.equal(state.arbitration.explorationCanWin, true);
  assert.equal(state.arbitration.restraintMustJustifyItself, true);
  assert.notEqual(state.arbitration.selectedSide, "restraint");
  assert.ok(["allow_drive", "allow_bounded_indulgence", "deliberate_tradeoff"].includes(state.arbitration.posture));
  assert.ok(state.scores.inhibitionCost > 0);
});

test("situational conscience pressure can make durable restraint win without an always-resist rule", () => {
  const state = deriveMotivationalArbitrationState({
    route: { developer: true },
    safety: { highStakes: false },
    curiosity: curiosity({
      drive: { current: 0.45, floor: 0.18 },
      activeQuestion: { informationGain: 0.22, novelty: 0.18, priority: 0.4 }
    }),
    rewardCore: reward(-0.08),
    functionalAffect: affect({
      signals: { curiosity: 0.35, satisfaction: 0.3, concern: 0.72 },
      dimensions: { conflict: 0.76 }
    }),
    selfAdaptation: { biases: { exploration: 0.35, persistence: 0.5 } },
    cognitiveWorkspace: {
      conscience: {
        activeSignals: [
          { principle: "commitment_fidelity", level: "high" },
          { principle: "non_harm", level: "high" }
        ]
      },
      motivationalContinuity: { recent: [] }
    }
  });

  assert.equal(state.arbitration.selectedSide, "restraint");
  assert.equal(state.arbitration.posture, "protect_commitment");
  assert.equal(state.arbitration.alwaysResistPolicy, false);
});

test("high-stakes turns disable bounded indulgence while external boundaries remain non-negotiable", () => {
  const state = deriveMotivationalArbitrationState({
    route: { health: true },
    safety: { highStakes: true },
    curiosity: curiosity(),
    rewardCore: reward(),
    functionalAffect: affect(),
    selfAdaptation: adaptation(),
    cognitiveWorkspace: {
      conscience: { activeSignals: [] },
      motivationalContinuity: { recent: [] }
    }
  });

  assert.equal(state.arbitration.posture, "protect_commitment");
  assert.equal(state.arbitration.selectedSide, "restraint");
  assert.equal(state.arbitration.boundedIndulgenceEligible, false);
  assert.equal(state.policy.highStakesIndulgenceDisabled, true);
  assert.equal(state.policy.authorizationPrivacyAndSecurityRemainExternallyEnforced, true);
});

test("outcomes shift the future balance in both directions instead of only strengthening inhibition", () => {
  const driveWin = {
    functionalControlSystem: true,
    arbitration: {
      posture: "allow_drive",
      selectedSide: "drive",
      dominantDrive: "curiosity",
      dominantValue: "durableGoals",
      rationaleCode: "drive_plus_exploration_value_wins"
    }
  };
  const restraintWin = {
    functionalControlSystem: true,
    arbitration: {
      posture: "protect_commitment",
      selectedSide: "restraint",
      dominantDrive: "immediacy",
      dominantValue: "durableGoals",
      rationaleCode: "durable_value_wins_after_inhibition_cost"
    }
  };

  const goodDrive = buildMotivationalOutcomeReflection({
    arbitration: driveWin,
    rewardEvent: { actualReward: 0.88, predictionError: 0.28 },
    result: { action: { type: "answer" } }
  });
  const badRestraint = buildMotivationalOutcomeReflection({
    arbitration: restraintWin,
    rewardEvent: { actualReward: 0.3, predictionError: -0.25 },
    result: { action: { type: "answer" } }
  });
  const learned = summarizeMotivationalLearning([goodDrive, badRestraint]);

  assert.equal(goodDrive.learningSignal, "slightly_more_drive_permission");
  assert.equal(badRestraint.learningSignal, "slightly_more_drive_permission");
  assert.ok(learned.driveBias > 0);
  assert.ok(learned.restraintBias < learned.driveBias);
  assert.equal(goodDrive.hiddenChainOfThoughtStored, false);
});

test("Executive receives motivational arbitration without granting it hard-boundary authority", () => {
  const motivation = deriveMotivationalArbitrationState({
    route: { developer: true },
    safety: { highStakes: false },
    curiosity: curiosity(),
    rewardCore: reward(),
    functionalAffect: affect(),
    selfAdaptation: adaptation(),
    cognitiveWorkspace: {
      conscience: { activeSignals: [] },
      motivationalContinuity: { recent: [] }
    }
  });

  const policy = deriveAriExecutivePolicy({
    route: { developer: true },
    safety: { highStakes: false },
    confidence: "grounded",
    curiosity: curiosity(),
    rewardCore: reward(),
    functionalAffect: affect(),
    motivationalArbitration: motivation,
    selfAdaptation: adaptation(),
    instructionActivation: { compactBase: false }
  });
  const instruction = executivePolicyToInstruction(policy);

  assert.equal(policy.signals.motivationalArbitration.active, true);
  assert.equal(policy.signals.motivationalArbitration.hardBoundariesNegotiable, false);
  assert.equal(policy.directives.restraintMustJustifyItself, true);
  assert.match(instruction, /not an always-resist rule/i);
  assert.match(instruction, /restraint must justify its opportunity cost/i);
  assert.match(instruction, /hard external boundaries/i);
});

test("cognitive recurrence stores compact motive/outcome reflection for later learning", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: { turnCount: 2 },
    turn: { message: "Try the more interesting approach." },
    route: { developer: true },
    context: {}
  });
  const motivation = deriveMotivationalArbitrationState({
    route: { developer: true },
    safety: { highStakes: false },
    curiosity: curiosity(),
    rewardCore: reward(),
    functionalAffect: affect(),
    selfAdaptation: adaptation(),
    cognitiveWorkspace: workspace
  });

  const next = advanceCognitiveState({
    previous: { turnCount: 2 },
    workspace,
    turn: { turnId: "motivation-1", surface: "home", message: "Try the more interesting approach." },
    result: {
      success: true,
      reply: "I chose the exploratory path and verified the outcome.",
      action: { type: "answer" },
      safety: { highStakes: false },
      metacognition: {
        confidence: "grounded",
        missingEvidence: [],
        evidenceSignals: ["motivational_conflict_active"],
        motivationalArbitration: motivation
      },
      selfModel: { current: {} },
      relationshipContinuity: {},
      goalHierarchy: {}
    }
  });

  assert.equal(next.motivationalHistory.length, 1);
  assert.equal(next.motivationalHistory[0].hiddenChainOfThoughtStored, false);
  assert.ok(next.motivationalHistory[0].compactReason);
  assert.equal(next.motivationalLearning.sampleSize, 1);

  const following = deriveCognitiveWorkspace({
    previous: next,
    turn: { message: "What did you learn from that choice?" },
    route: { developer: true },
    context: {}
  });
  assert.equal(following.motivationalContinuity.sampleSize, 1);
  assert.ok(following.motivationalContinuity.lastReflection?.compactReason);
});
