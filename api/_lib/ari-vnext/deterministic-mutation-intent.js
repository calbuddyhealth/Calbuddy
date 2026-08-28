// ARI vNext — deterministic current-turn mutation recognition.
//
// Purpose: preserve the useful low-cost behavior from the old Phase authority
// stack without carrying its semantic verifier, product policy, or OpenAI call.
// This module recognizes explicit current-turn routine/reference mutation
// language and same-operation correction supersession. It never resolves a
// canonical target, grants account access, applies domain policy, or executes.

const ROUTINE_LOG_TOOLS = new Set([
  "propose_log_meal",
  "propose_log_planned_meal",
  "propose_log_activity",
  "propose_log_weight"
]);

const REFERENCE_MUTATION_TOOLS = new Set([
  "propose_undo_nutrition_mutation",
  "propose_update_nutrition_meal",
  "propose_log_referenced_planned_meal",
  "propose_log_referenced_plan_components",
  "propose_discard_referenced_meal_plan",
  "propose_replace_referenced_meal_plan",
  "propose_update_activity_log",
  "propose_delete_activity_log",
  "propose_update_weight_log",
  "propose_delete_weight_log",
  "propose_edit_referenced_workout",
  "propose_delete_workout"
]);

const CORRECTION_PREFIX = /^(?:actually\b|no[,;:]?\s+(?:i\s+)?meant\b|i\s+meant\b|wait[,;:]?\b|sorry[,;:]?\b|correction\b|rather\b)/i;

const CORRECTION_TOOL_OPERATIONS = Object.freeze({
  propose_undo_nutrition_mutation: "undo_nutrition_mutation",
  propose_update_nutrition_meal: "update_nutrition_meal",
  propose_log_referenced_planned_meal: "log_referenced_planned_meal",
  propose_log_referenced_plan_components: "log_referenced_plan_components",
  propose_discard_referenced_meal_plan: "discard_referenced_meal_plan",
  propose_replace_referenced_meal_plan: "replace_referenced_meal_plan",
  propose_update_activity_log: "update_activity_log",
  propose_delete_activity_log: "delete_activity_log",
  propose_update_weight_log: "update_weight_log",
  propose_delete_weight_log: "delete_weight_log",
  propose_edit_referenced_workout: "edit_referenced_workout",
  propose_delete_workout: "delete_workout"
});

export function reviewDeterministicRoutineLogIntent({
  turn = {},
  route = {},
  functionCall = null,
  availableTools = []
} = {}) {
  const decision = String(functionCall?.name || "").trim();

  if (REFERENCE_MUTATION_TOOLS.has(decision)) {
    if (!availableTools.includes(decision)) return null;
    if (!referenceRouteSupports(decision, route)) return null;

    const direct = isDirectReferenceMutationCommand(turn?.message, decision);
    const correctionSupersession = isMatchingCorrectionSupersession(turn, decision);
    if (!direct && !correctionSupersession) return null;

    return {
      version: "2.0.0",
      decision,
      confidence: 1,
      reason: correctionSupersession
        ? "Current-turn correction supersedes a prior proposal of the same operation."
        : "Explicit current-turn reference-bound mutation recognized deterministically.",
      dailyGoalKnown: resolveDailyGoalKnown(turn),
      model: null,
      providerRequestId: null,
      usage: null,
      source: correctionSupersession
        ? "deterministic_reference_correction_supersession"
        : referenceIntentSource(decision)
    };
  }

  if (!ROUTINE_LOG_TOOLS.has(decision)) return null;
  if (!availableTools.includes(decision)) return null;
  if (!routineRouteSupports(decision, route)) return null;
  if (!isDirectRoutineLogCommand(turn?.message, decision)) return null;

  return {
    version: "2.0.0",
    decision,
    confidence: 1,
    reason: "Explicit current-turn routine logging command recognized deterministically.",
    dailyGoalKnown: resolveDailyGoalKnown(turn),
    model: null,
    providerRequestId: null,
    usage: null,
    source: "deterministic_routine_log"
  };
}

function normalizedSupersededPending(turn = {}) {
  const raw = turn?.context?.referenceState?.supersededPendingAction;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const state = String(raw?.state || "").trim().toLowerCase();
  const operation = String(raw?.operation || "").trim();
  const executable = raw?.executable === true;
  if (state !== "superseded" || !operation || executable) return null;

  return { operation };
}

function isMatchingCorrectionSupersession(turn = {}, decision = "") {
  const text = String(turn?.message || "").replace(/\s+/g, " ").trim();
  if (!text || !CORRECTION_PREFIX.test(text)) return false;

  const expectedOperation = CORRECTION_TOOL_OPERATIONS[decision];
  if (!expectedOperation) return false;

  return normalizedSupersededPending(turn)?.operation === expectedOperation;
}

function routineRouteSupports(decision, route = {}) {
  if (decision === "propose_log_meal" || decision === "propose_log_planned_meal") return route?.nutrition === true;
  if (decision === "propose_log_activity") return route?.training === true;
  if (decision === "propose_log_weight") return route?.goals === true;
  return false;
}

function referenceRouteSupports(decision, route = {}) {
  if ([
    "propose_undo_nutrition_mutation",
    "propose_update_nutrition_meal",
    "propose_log_referenced_planned_meal",
    "propose_log_referenced_plan_components",
    "propose_discard_referenced_meal_plan",
    "propose_replace_referenced_meal_plan"
  ].includes(decision)) return route?.nutrition === true;

  if ([
    "propose_update_activity_log",
    "propose_delete_activity_log",
    "propose_edit_referenced_workout",
    "propose_delete_workout"
  ].includes(decision)) return route?.training === true;

  if (["propose_update_weight_log", "propose_delete_weight_log"].includes(decision)) return route?.goals === true;
  return false;
}

function referenceIntentSource(decision = "") {
  const sources = {
    propose_undo_nutrition_mutation: "deterministic_reference_undo",
    propose_update_nutrition_meal: "deterministic_reference_meal_update",
    propose_log_referenced_planned_meal: "deterministic_reference_plan_log",
    propose_log_referenced_plan_components: "deterministic_reference_plan_component_log",
    propose_discard_referenced_meal_plan: "deterministic_reference_plan_discard",
    propose_replace_referenced_meal_plan: "deterministic_reference_plan_replace",
    propose_update_activity_log: "deterministic_reference_activity_update",
    propose_delete_activity_log: "deterministic_reference_activity_delete",
    propose_update_weight_log: "deterministic_reference_weight_update",
    propose_delete_weight_log: "deterministic_reference_weight_delete",
    propose_edit_referenced_workout: "deterministic_reference_workout_edit",
    propose_delete_workout: "deterministic_reference_workout_delete"
  };
  return sources[decision] || "deterministic_reference_mutation";
}

function isDirectRoutineLogCommand(message = "", decision = "") {
  const text = String(message || "").replace(/\s+/g, " ").trim();
  if (!text) return false;

  const ariPrefix = "(?:(?:(?:hey|hi)\\s+)?ari[,:-]?\\s*)?";
  const directLog = new RegExp(`^${ariPrefix}(?:please\\s+)?(?:go\\s+ahead\\s+(?:and\\s+)?)?(?:log|record)\\b`, "i");
  const directAsk = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:log|record)\\b`, "i");
  const directWant = new RegExp(`^${ariPrefix}i\\s+want\\s+you\\s+to\\s+(?:please\\s+)?(?:log|record)\\b`, "i");
  const addToLog = new RegExp(`^${ariPrefix}(?:please\\s+)?(?:add|save)\\b.{0,160}\\bto\\s+(?:my\\s+)?(?:food\\s+|meal\\s+|activity\\s+|training\\s+|weight\\s+)?log\\b`, "i");

  if (directLog.test(text) || directAsk.test(text) || directWant.test(text) || addToLog.test(text)) return true;

  if (decision === "propose_log_weight") {
    const updateWeight = new RegExp(`^${ariPrefix}(?:please\\s+)?(?:set|update)\\s+(?:my\\s+)?weight\\b`, "i");
    const askUpdateWeight = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:set|update)\\s+(?:my\\s+)?weight\\b`, "i");
    return updateWeight.test(text) || askUpdateWeight.test(text);
  }

  return false;
}

function isDirectReferenceMutationCommand(message = "", decision = "") {
  const text = String(message || "").replace(/\s+/g, " ").trim();
  if (!text) return false;

  const ariPrefix = "(?:(?:(?:hey|hi)\\s+)?ari[,:-]?\\s*)?";
  const planLogTools = new Set([
    "propose_log_referenced_planned_meal",
    "propose_log_referenced_plan_components"
  ]);
  const deleteTools = new Set([
    "propose_undo_nutrition_mutation",
    "propose_discard_referenced_meal_plan",
    "propose_delete_activity_log",
    "propose_delete_weight_log",
    "propose_delete_workout"
  ]);
  const updateTools = new Set([
    "propose_update_nutrition_meal",
    "propose_replace_referenced_meal_plan",
    "propose_update_activity_log",
    "propose_update_weight_log",
    "propose_edit_referenced_workout"
  ]);

  if (planLogTools.has(decision)) {
    const direct = new RegExp(`^${ariPrefix}(?:actually\\s+)?(?:please\\s+)?(?:go\\s+ahead\\s+(?:and\\s+)?)?(?:log|record)\\b`, "i");
    const ask = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:log|record)\\b`, "i");
    const want = new RegExp(`^${ariPrefix}i\\s+want\\s+you\\s+to\\s+(?:please\\s+)?(?:log|record)\\b`, "i");
    return direct.test(text) || ask.test(text) || want.test(text);
  }

  if (deleteTools.has(decision)) {
    let verbs = decision === "propose_delete_workout" ? "undo|delete|remove|clear|cancel" : "undo|delete|remove";
    if (decision === "propose_discard_referenced_meal_plan") verbs = "discard|delete|remove|drop|clear";

    const direct = new RegExp(`^${ariPrefix}(?:actually\\s+)?(?:please\\s+)?(?:go\\s+ahead\\s+(?:and\\s+)?)?(?:${verbs})\\b`, "i");
    const ask = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:${verbs})\\b`, "i");
    const want = new RegExp(`^${ariPrefix}i\\s+want\\s+you\\s+to\\s+(?:please\\s+)?(?:${verbs})\\b`, "i");
    return direct.test(text) || ask.test(text) || want.test(text);
  }

  if (updateTools.has(decision)) {
    const verbs = decision === "propose_replace_referenced_meal_plan"
      ? "replace|swap|change|update|edit"
      : "change|update|edit|correct|fix";

    const direct = new RegExp(`^${ariPrefix}(?:actually\\s+)?(?:please\\s+)?(?:go\\s+ahead\\s+(?:and\\s+)?)?(?:${verbs})\\b`, "i");
    const ask = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:${verbs})\\b`, "i");
    const want = new RegExp(`^${ariPrefix}i\\s+want\\s+you\\s+to\\s+(?:please\\s+)?(?:${verbs})\\b`, "i");
    const makeThat = new RegExp(`^${ariPrefix}(?:actually\\s+)?(?:please\\s+)?make\\s+(?:that|it|this)\\b`, "i");
    const askMake = new RegExp(`^${ariPrefix}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?make\\s+(?:that|it|this)\\b`, "i");
    return direct.test(text) || ask.test(text) || want.test(text) || makeThat.test(text) || askMake.test(text);
  }

  return false;
}

function resolveDailyGoalKnown(turn = {}) {
  const policy = turn?.context?.nutrition?.calorieBudgetPolicy;
  if (typeof policy?.dailyGoalKnown === "boolean") return policy.dailyGoalKnown;

  const candidates = [
    policy?.dailyGoal,
    turn?.context?.goals?.dailyGoal,
    turn?.context?.dailyGoal
  ];

  return candidates.some((value) => Number.isFinite(Number(value)) && Number(value) > 0);
}
