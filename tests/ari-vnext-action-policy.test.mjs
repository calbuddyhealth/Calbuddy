import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_POLICY_DECISIONS,
  applyActionPolicyToResult,
  resolveActionPolicy
} from "../api/_lib/ari-vnext/action-policy.js";

function proposedResult(name, overrides = {}) {
  return {
    success: true,
    ready: true,
    reply: "Please confirm.",
    semanticActionReview: { decision: name, confidence: 0.95 },
    pendingAction: {
      id: `action_${name}`,
      name,
      arguments: { referenceId: "ref_1" },
      sourceTurnId: "turn_1",
      sourceMessage: "do it",
      status: "pending_confirmation",
      confirmationRequired: true,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    },
    action: {
      type: "proposed_action",
      applicationAction: name,
      pendingActionId: `action_${name}`,
      arguments: { referenceId: "ref_1" }
    },
    ...overrides
  };
}

test("clear personal log executes in the current turn", () => {
  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: proposedResult("log_meal")
  });

  assert.equal(result.action.type, "execute_pending_action");
  assert.equal(result.pendingAction.confirmationRequired, false);
  assert.equal(result.pendingAction.status, "ready");
  assert.equal(result.pendingAction.ownerUserId, "user_1");
  assert.equal(result.actionPolicy.decision, ACTION_POLICY_DECISIONS.EXECUTE_WITH_UNDO);
  assert.equal(result.reply, "");
});

test("clear single-record delete executes without a second confirmation turn", () => {
  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: proposedResult("delete_workout")
  });

  assert.equal(result.action.type, "execute_pending_action");
  assert.equal(result.actionPolicy.decision, ACTION_POLICY_DECISIONS.EXECUTE);
  assert.equal(result.actionPolicy.risk, "medium");
});

test("Circle mutations remain confirmation gated", () => {
  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: proposedResult("create_circle_meetup")
  });

  assert.equal(result.action.type, "proposed_action");
  assert.equal(result.pendingAction.confirmationRequired, true);
  assert.equal(result.pendingAction.ownerUserId, "user_1");
  assert.equal(result.actionPolicy.decision, ACTION_POLICY_DECISIONS.CONFIRM);
});

test("compound batches keep one confirmation", () => {
  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: proposedResult("compound_action_batch")
  });

  assert.equal(result.action.type, "proposed_action");
  assert.equal(result.actionPolicy.decision, ACTION_POLICY_DECISIONS.CONFIRM);
});

test("stale or cross-turn personal proposals do not auto execute", () => {
  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_2", userId: "user_1" },
    result: proposedResult("update_nutrition_meal")
  });

  assert.equal(result.action.type, "proposed_action");
  assert.equal(result.actionPolicy.reason, "not_current_turn_authorized");
});

test("low-confidence semantic intent stays confirmation gated", () => {
  const candidate = proposedResult("log_activity");
  candidate.semanticActionReview.confidence = 0.6;

  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: candidate
  });

  assert.equal(result.action.type, "proposed_action");
  assert.equal(result.actionPolicy.reason, "semantic_intent_below_auto_execute_threshold");
});

test("pending action account mismatch is blocked before browser execution", () => {
  const candidate = proposedResult("log_weight");
  candidate.pendingAction.ownerUserId = "user_2";

  const result = applyActionPolicyToResult({
    turn: { turnId: "turn_1", userId: "user_1" },
    result: candidate
  });

  assert.equal(result.action, null);
  assert.equal(result.pendingAction, null);
  assert.equal(result.actionPolicy.decision, ACTION_POLICY_DECISIONS.BLOCK);
  assert.match(result.reply, /different signed-in account/i);
});

test("unclassified operations fail closed to confirmation", () => {
  const actionPolicy = resolveActionPolicy({
    operation: "future_unknown_mutation",
    pendingAction: { sourceTurnId: "turn_1" },
    turn: { turnId: "turn_1" }
  });

  assert.equal(actionPolicy.decision, ACTION_POLICY_DECISIONS.CONFIRM);
  assert.equal(actionPolicy.executeImmediately, false);
});
