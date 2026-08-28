// ARI vNext — Phase 9C deterministic compound-action planner.
//
// A compound turn may produce multiple existing model-visible function calls.
// This module never executes data and never invents a target. It verifies each
// requested sub-action independently against the CURRENT user clause, gives
// every reference-bound call its own deterministic reference resolution, and
// returns one bounded batch only when every sub-action is independently safe to
// prepare. Existing tool validators and the Phase 8C operation registry remain
// authoritative.

import { reviewDeterministicRoutineLogIntent } from "./action-intent-verifier.js";
import { resolveReferenceTarget } from "./reference-context.js";
import { toolToApplicationAction, validateToolCall } from "./tools.js";

export const COMPOUND_ACTION_VERSION = "1.0.0";
export const MAX_COMPOUND_ACTIONS = 4;

const ACTION_VERB = "(?:log|record|save|add|change|update|edit|correct|fix|remove|delete|undo|discard|replace|swap|move|set|make|clear|cancel)";
const DESTRUCTIVE_ACTIONS = new Set([
  "undo_nutrition_mutation",
  "discard_referenced_meal_plan",
  "delete_activity_log",
  "delete_weight_log",
  "delete_workout"
]);

export function findFunctionCalls(output = []) {
  if (!Array.isArray(output)) return [];
  return output.filter((item) => item?.type === "function_call" && item?.name && item?.call_id);
}

export function splitCompoundActionClauses(message = "", expectedCount = 0) {
  const text = clean(message, 1800);
  if (!text) return [];

  let clauses = text
    .split(/\s*(?:;|,\s*(?:and\s+)?then\b|\band\s+then\b|\bthen\b)\s*/i)
    .map((part) => clean(part, 700))
    .filter(Boolean);

  if (expectedCount > 1 && clauses.length < expectedCount) {
    clauses = text
      .split(new RegExp(`\\s*(?:,|\\band\\b)\\s+(?=${ACTION_VERB}\\b)`, "i"))
      .map((part) => clean(part, 700))
      .filter(Boolean);
  }

  return clauses;
}

export function prepareCompoundActionBatch({
  turn = {},
  route = {},
  tools = [],
  functionCalls = []
} = {}) {
  const calls = Array.isArray(functionCalls) ? functionCalls.filter(Boolean) : [];
  if (calls.length < 2) return { valid: false, error: "compound_actions_required" };
  if (calls.length > MAX_COMPOUND_ACTIONS) return { valid: false, error: "compound_actions_too_many" };

  const callIds = calls.map((call) => clean(call?.call_id, 220));
  if (callIds.some((id) => !id) || new Set(callIds).size !== callIds.length) {
    return { valid: false, error: "compound_call_identity_invalid" };
  }

  const availableTools = (Array.isArray(tools) ? tools : [])
    .filter((tool) => tool?.type === "function" && typeof tool?.name === "string")
    .map((tool) => clean(tool.name, 140))
    .filter(Boolean);
  const clauses = splitCompoundActionClauses(turn?.message || "", calls.length);
  if (clauses.length !== calls.length) {
    return {
      valid: false,
      error: "compound_clause_count_mismatch",
      requiresClarification: true,
      clauseCount: clauses.length,
      actionCount: calls.length
    };
  }

  const actions = [];
  for (let index = 0; index < calls.length; index += 1) {
    const call = calls[index];
    const clause = clauses[index];
    const subTurn = { ...turn, message: clause };
    const subRoute = { ...route };
    subRoute.referenceResolution = resolveReferenceTarget({
      message: clause,
      referenceState: turn?.context?.referenceState || {},
      route: subRoute
    });

    const review = reviewDeterministicRoutineLogIntent({
      turn: subTurn,
      route: subRoute,
      functionCall: call,
      availableTools
    });
    const boundedExplicit = Boolean(review) || boundedCompoundClauseAuthorization(call?.name, clause);
    if (!boundedExplicit || (review && (review?.decision !== clean(call?.name, 140) || Number(review?.confidence || 0) < 0.99))) {
      return {
        valid: false,
        error: "compound_subaction_not_explicit",
        requiresClarification: true,
        failedIndex: index,
        clause
      };
    }

    const validation = validateToolCall(call, subRoute);
    if (!validation?.valid) {
      return {
        valid: false,
        error: validation?.error || "compound_subaction_invalid",
        requiresClarification: ["reference_target_ambiguous", "reference_target_unresolved", "reference_target_mismatch"].includes(validation?.error),
        failedIndex: index,
        clause,
        referenceResolution: subRoute.referenceResolution || null
      };
    }

    const applicationAction = toolToApplicationAction(validation.name);
    if (!applicationAction || applicationAction === "none") {
      return { valid: false, error: "compound_application_action_missing", failedIndex: index, clause };
    }

    actions.push({
      index,
      toolName: validation.name,
      name: applicationAction,
      arguments: validation.arguments,
      clause,
      referenceResolution: subRoute.referenceResolution || null
    });
  }

  const duplicateKeys = actions.map((action) => `${action.name}|${stableJson(action.arguments)}`);
  if (new Set(duplicateKeys).size !== duplicateKeys.length) {
    return { valid: false, error: "compound_duplicate_subaction", requiresClarification: true };
  }

  const conflict = destructiveConflict(actions);
  if (conflict) {
    return {
      valid: false,
      error: "compound_destructive_conflict",
      requiresClarification: true,
      conflict
    };
  }

  return {
    valid: true,
    version: COMPOUND_ACTION_VERSION,
    actions,
    clauses,
    policy: {
      allSubactionsIndependentlyAuthorized: true,
      allReferenceTargetsIndependentlyResolved: true,
      oneBatchConfirmationRequired: true,
      neverGuessMissingTarget: true,
      browserMustRevalidateBeforeExecution: true
    }
  };
}

function boundedCompoundClauseAuthorization(toolName = "", clause = "") {
  const name = clean(toolName, 160);
  const text = clean(clause, 700);
  if (name === "propose_edit_referenced_workout") {
    return /^(?:(?:(?:hey|hi)\s+)?ari[,:-]?\s*)?(?:please\s+)?(?:move|add|remove|replace|change|update|edit|correct|fix)\b/i.test(text);
  }
  return false;
}

function destructiveConflict(actions = []) {
  const byReference = new Map();
  for (const action of actions) {
    const referenceId = clean(action?.arguments?.referenceId, 180);
    if (!referenceId) continue;
    if (!byReference.has(referenceId)) byReference.set(referenceId, []);
    byReference.get(referenceId).push(action);
  }

  for (const [referenceId, group] of byReference.entries()) {
    if (group.length < 2) continue;
    const destructive = group.filter((action) => DESTRUCTIVE_ACTIONS.has(action.name));
    if (!destructive.length) continue;
    return {
      referenceId,
      actions: group.map((action) => action.name)
    };
  }
  return null;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
