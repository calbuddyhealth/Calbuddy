// ARI vNext — centralized mutation strictness policy.
//
// This module decides whether a trusted, already-canonicalized application
// mutation should execute in the current turn or remain confirmation-gated.
// It does not resolve references, validate domain payloads, authorize accounts,
// or write application data.

export const ARI_ACTION_POLICY_VERSION = "1.0.0";

export const ACTION_POLICY_DECISIONS = Object.freeze({
  EXECUTE: "execute",
  EXECUTE_WITH_UNDO: "execute_with_undo",
  CONFIRM: "confirm",
  CLARIFY: "clarify",
  BLOCK: "block"
});

const IMMEDIATE_PERSONAL_OPERATIONS = new Set([
  "log_meal",
  "log_activity",
  "log_weight",
  "update_goal",
  "plan_meal",
  "log_planned_meal",
  "plan_workout",
  "edit_workout",
  "update_nutrition_meal",
  "undo_nutrition_mutation",
  "update_weight_log",
  "delete_weight_log",
  "update_activity_log",
  "delete_activity_log",
  "edit_referenced_workout",
  "delete_workout",
  "log_referenced_planned_meal",
  "log_referenced_plan_components",
  "discard_referenced_meal_plan",
  "replace_referenced_meal_plan"
]);

const UNDO_CAPABLE_OPERATIONS = new Set([
  "log_meal",
  "update_nutrition_meal"
]);

const MEDIUM_RISK_PERSONAL_OPERATIONS = new Set([
  "undo_nutrition_mutation",
  "delete_weight_log",
  "delete_activity_log",
  "delete_workout",
  "discard_referenced_meal_plan",
  "replace_referenced_meal_plan"
]);

const CONFIRM_REQUIRED_OPERATIONS = new Set([
  "compound_action_batch",
  "track_experiment",
  "complete_experiment",
  "cancel_experiment",
  "create_circle_meetup",
  "join_circle_meetup",
  "leave_circle_meetup",
  "cancel_circle_meetup",
  "create_circle_mission",
  "join_circle_mission",
  "submit_circle_mission_progress",
  "create_circle_crew",
  "accept_circle_crew_invite",
  "decline_circle_crew_invite",
  "leave_circle_crew",
  "archive_circle_crew"
]);

export function resolveActionPolicy({ operation = "", pendingAction = null, turn = null, result = null } = {}) {
  const name = clean(operation || pendingAction?.name, 120);
  if (!name) {
    return policy(ACTION_POLICY_DECISIONS.BLOCK, "high", true, false, "missing_operation");
  }

  if (CONFIRM_REQUIRED_OPERATIONS.has(name)) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, "high", true, false, "external_or_multi_action_change");
  }

  if (!IMMEDIATE_PERSONAL_OPERATIONS.has(name)) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, "medium", true, false, "unclassified_operation_defaults_to_confirmation");
  }

  const sourceTurnId = clean(pendingAction?.sourceTurnId, 220);
  const currentTurnId = clean(turn?.turnId, 220);
  if (!sourceTurnId || !currentTurnId || sourceTurnId !== currentTurnId) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, "medium", true, false, "not_current_turn_authorized");
  }

  const confidence = Number(result?.semanticActionReview?.confidence);
  if (Number.isFinite(confidence) && confidence > 0 && confidence < 0.78) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, "medium", true, false, "semantic_intent_below_auto_execute_threshold");
  }

  const undoCapable = UNDO_CAPABLE_OPERATIONS.has(name);
  return policy(
    undoCapable ? ACTION_POLICY_DECISIONS.EXECUTE_WITH_UNDO : ACTION_POLICY_DECISIONS.EXECUTE,
    MEDIUM_RISK_PERSONAL_OPERATIONS.has(name) ? "medium" : "low",
    false,
    true,
    undoCapable ? "clear_current_turn_personal_change_with_undo" : "clear_current_turn_personal_change"
  );
}

export function applyActionPolicyToResult({ turn = null, result = null } = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return result;

  const pending = result?.pendingAction;
  if (!pending || typeof pending !== "object" || !pending?.id || !pending?.name) return result;

  const userId = clean(turn?.userId, 220);
  const claimedOwner = clean(pending?.ownerUserId || pending?.owner_user_id || pending?.user_id, 220);

  if (claimedOwner && userId && claimedOwner !== userId) {
    return {
      ...result,
      success: true,
      ready: true,
      reply: "I blocked that change because the pending action belongs to a different signed-in account.",
      pendingAction: null,
      action: null,
      actionPolicy: publicPolicy(policy(ACTION_POLICY_DECISIONS.BLOCK, "high", true, false, "pending_action_account_mismatch")),
      source: "ari_vnext_action_policy_blocked"
    };
  }

  const scopedPending = {
    ...pending,
    ...(userId ? { ownerUserId: userId } : {})
  };

  const actionType = clean(result?.action?.type, 80);
  if (actionType !== "proposed_action") {
    return {
      ...result,
      pendingAction: scopedPending,
      actionPolicy: result?.actionPolicy || {
        version: ARI_ACTION_POLICY_VERSION,
        decision: actionType === "execute_pending_action" ? "execute_confirmed" : "unchanged",
        requiresConfirmation: scopedPending?.confirmationRequired === true
      }
    };
  }

  const actionPolicy = resolveActionPolicy({
    operation: result?.action?.applicationAction || scopedPending?.name,
    pendingAction: scopedPending,
    turn,
    result
  });

  if (actionPolicy.executeImmediately === true && userId) {
    const readyPending = {
      ...scopedPending,
      status: "ready",
      confirmationRequired: false
    };

    return {
      ...result,
      // Avoid leaving a stale "confirm" sentence visible after the runtime
      // executes the action in this same turn. The trusted executor supplies the
      // final mutation reply. Keep the original source so performance and routing
      // observability continue to classify the underlying request correctly.
      reply: "",
      pendingAction: readyPending,
      action: {
        ...result.action,
        type: "execute_pending_action",
        pendingActionId: readyPending.id,
        arguments: readyPending.arguments || {}
      },
      actionPolicy: publicPolicy(actionPolicy)
    };
  }

  const confirmationPending = {
    ...scopedPending,
    status: "pending_confirmation",
    confirmationRequired: true
  };

  return {
    ...result,
    pendingAction: confirmationPending,
    action: {
      ...result.action,
      type: "proposed_action",
      pendingActionId: confirmationPending.id,
      arguments: confirmationPending.arguments || {}
    },
    actionPolicy: publicPolicy(actionPolicy)
  };
}

function policy(decision, risk, requiresConfirmation, executeImmediately, reason) {
  return {
    version: ARI_ACTION_POLICY_VERSION,
    decision,
    risk,
    requiresConfirmation: requiresConfirmation === true,
    executeImmediately: executeImmediately === true,
    reason: clean(reason, 160)
  };
}

function publicPolicy(value = {}) {
  return {
    version: ARI_ACTION_POLICY_VERSION,
    decision: clean(value?.decision, 80),
    risk: clean(value?.risk, 40),
    requiresConfirmation: value?.requiresConfirmation === true,
    executeImmediately: value?.executeImmediately === true,
    reason: clean(value?.reason, 160)
  };
}

function clean(value = "", max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
