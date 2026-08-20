import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceCognitiveState,
  cognitiveWorkspaceToInstruction,
  deriveCognitiveWorkspace,
  isOwnerCognitiveLoopEnabled
} from "../api/_lib/ari-vnext/cognitive-loop.js";

test("owner Advanced Ari enables the cognitive loop while premium alone does not", () => {
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: true, ownerEligible: true }), true);
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: true, ownerEligible: false, premiumEligible: true }), false);
  assert.equal(isOwnerCognitiveLoopEnabled({ advancedEnabled: false, ownerEligible: true }), false);
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

  const instruction = cognitiveWorkspaceToInstruction(workspace);
  assert.match(instruction, /not evidence or a claim that Ari has subjective consciousness/i);
  assert.match(instruction, /truth\/evidence/);
  assert.match(instruction, /user agency\/consent/);
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
    turn: { turnId: "turn-5", surface: "home" },
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
