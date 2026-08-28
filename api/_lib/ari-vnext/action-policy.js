// ARI vNext — simple action authority policy.
//
// This is intentionally small. It does not re-interpret the user's language,
// resolve references, enforce product rules, validate domain payloads, or write
// data. Those responsibilities belong to the primary Ari model, ReferenceService,
// domain policy/services, and repositories.
//
// The policy answers only one question: after a capability is canonicalized and
// scoped to the signed-in user, should it execute now or remain reviewable?

export const ARI_ACTION_POLICY_VERSION = "2.0.0";

export const ACTION_POLICY_DECISIONS = Object.freeze({
  EXECUTE: "execute",
  EXECUTE_WITH_UNDO: "execute_with_undo",
  CONFIRM: "confirm",
  BLOCK: "block"
});

const PERSONAL_OPERATIONS = new Set([
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

// These operations change shared/social state, represent several writes at once,
// or manage experiments. They stay reviewable because the consequence extends
// beyond a simple personal record mutation.
const REVIEW_OPERATIONS = new Set([
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

export function resolveActionPolicy({ operation = "", pendingAction = null, turn = null } = {}) {
  const name = clean(operation || pendingAction?.name, 120);
  if (!name) return policy(ACTION_POLICY_DECISIONS.BLOCK, true, false, "missing_operation");

  if (REVIEW_OPERATIONS.has(name)) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, true, false, "shared_or_multi_action_change");
  }

  if (!PERSONAL_OPERATIONS.has(name)) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, true, false, "unknown_operation_review_required");
  }

  // Current-turn ownership is the only generic execution gate for personal
  // actions. Language semantics were already handled by Ari; target identity and
  // ownership are handled by canonicalization/reference/account layers.
  const sourceTurnId = clean(pendingAction?.sourceTurnId, 220);
  const currentTurnId = clean(turn?.turnId, 220);
  if (!sourceTurnId || !currentTurnId || sourceTurnId !== currentTurnId) {
    return policy(ACTION_POLICY_DECISIONS.CONFIRM, true, false, "not_current_turn_authorized");
  }

  const undoCapable = UNDO_CAPABLE_OPERATIONS.has(name);
  return policy(
    undoCapable ? ACTION_POLICY_DECISIONS.EXECUTE_WITH_UNDO : ACTION_POLICY_DECISIONS.EXECUTE,
    false,
    true,
    undoCapable ? "current_turn_personal_change_with_undo" : "current_turn_personal_change"
  );
}

export function applyActionPolicyToResult({ turn = null, result = null } = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return result;

  const pending = result?.pendingAction;
  if (!pending || typeof pending !== "object" || !pending?.id || !pending?.name) return result;

  const userId = clean(turn?.userId, 220);
  const claimedOwner = clean(pending?.ownerUserId || pending?.owner_user_id || pending?.user_id, 220);

  // This remains a hard invariant: never execute another account's action.
  if (claimedOwner && userId && claimedOwner !== userId) {
    return {
      ...result,
      success: true,
      ready: true,
      reply: "I blocked that change because it belongs to a different signed-in account.",
      pendingAction: null,
      action: null,
      actionPolicy: publicPolicy(policy(ACTION_POLICY_DECISIONS.BLOCK, true, false, "pending_action_account_mismatch")),
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
    turn
  });

  if (actionPolicy.executeImmediately === true && userId) {
    const readyPending = {
      ...scopedPending,
      status: "ready",
      confirmationRequired: false
    };

    return {
      ...result,
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

function policy(decision, requiresConfirmation, executeImmediately, reason) {
  return {
    version: ARI_ACTION_POLICY_VERSION,
    decision,
    requiresConfirmation: requiresConfirmation === true,
    executeImmediately: executeImmediately === true,
    reason: clean(reason, 160)
  };
}

function publicPolicy(value = {}) {
  return {
    version: ARI_ACTION_POLICY_VERSION,
    decision: clean(value?.decision, 80),
    requiresConfirmation: value?.requiresConfirmation === true,
    executeImmediately: value?.executeImmediately === true,
    reason: clean(value?.reason, 160)
  };
}

function clean(value = "", max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
