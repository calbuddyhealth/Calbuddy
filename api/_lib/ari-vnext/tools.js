// ARI vNext — model-visible application capability facade.
// The mature nutrition/training/goals/Meetup/Mission registry remains unchanged
// in tools-core.js. This facade adds bounded capabilities that depend on newer
// trusted context contracts: Crew actions plus reference-bound app mutations.

import {
  TOOL_REGISTRY_VERSION as CORE_REGISTRY_VERSION,
  getAriTools as getCoreAriTools,
  validateToolCall as validateCoreToolCall,
  toolToApplicationAction as coreToolToApplicationAction
} from "./tools-core.js";

export const TOOL_REGISTRY_VERSION = "1.16.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

const CREW_TOOL_NAMES = new Set([
  "propose_create_circle_crew",
  "propose_accept_circle_crew_invite",
  "propose_decline_circle_crew_invite",
  "propose_leave_circle_crew",
  "propose_archive_circle_crew"
]);
const PLAN_REFERENCE_TOOL_NAMES = new Set([
  "propose_log_referenced_planned_meal",
  "propose_log_referenced_plan_components",
  "propose_discard_referenced_meal_plan",
  "propose_replace_referenced_meal_plan"
]);
const REFERENCE_TOOL_NAMES = new Set([
  "propose_undo_nutrition_mutation",
  "propose_update_nutrition_meal",
  ...PLAN_REFERENCE_TOOL_NAMES,
  "propose_update_activity_log",
  "propose_delete_activity_log",
  "propose_update_weight_log",
  "propose_delete_weight_log",
  "propose_edit_referenced_workout",
  "propose_delete_workout"
]);
const SINGLE_REFERENCE_TOOL_NAMES = new Set([
  "propose_undo_nutrition_mutation",
  "propose_update_nutrition_meal",
  "propose_log_referenced_planned_meal",
  "propose_discard_referenced_meal_plan",
  "propose_replace_referenced_meal_plan",
  "propose_update_activity_log",
  "propose_delete_activity_log",
  "propose_update_weight_log",
  "propose_delete_weight_log",
  "propose_edit_referenced_workout",
  "propose_delete_workout"
]);
const ACTIVITY_NUMERIC_FIELDS = new Map([
  ["duration_minutes", { min: 1, max: 1440 }],
  ["sets", { min: 1, max: 100 }],
  ["reps_per_set", { min: 1, max: 10000 }],
  ["calories_burned", { min: 1, max: 10000 }],
  ["average_heart_rate", { min: 30, max: 240 }]
]);
const ACTIVITY_TEXT_FIELDS = new Set([
  "activity_name",
  "intensity",
  "log_date",
  "notes"
]);
const ACTIVITY_INTENSITIES = new Set([
  "very_light",
  "light",
  "moderate",
  "vigorous",
  "near_maximal",
  "maximal"
]);
const MEAL_NUMERIC_FIELDS = new Map([
  ["calories", { min: 1, max: 10000 }],
  ["protein_g", { min: 0, max: 2000 }],
  ["carbs_g", { min: 0, max: 3000 }],
  ["fat_g", { min: 0, max: 2000 }],
  ["multiplier", { min: 0.01, max: 100 }]
]);
const MEAL_TEXT_FIELDS = new Set(["name", "category", "serving_size"]);
const PLAN_REFERENCE_ID = /^(?:ref_ctx_meal_plan_[a-z0-9]+|ref_action_[a-z0-9]+)$/i;
const PLAN_COMPONENT_REFERENCE_ID = /^ref_ctx_meal_component_[a-z0-9]+$/i;
const LIFECYCLE_REFERENCE_ID = /^ref_action_[a-z0-9]+$/i;

function functionTool(name, description, parameters) {
  return { type: "function", name, description, strict: true, parameters };
}

function referenceTools(route = {}) {
  const tools = [];

  if (route?.nutrition === true) {
    tools.push(functionTool(
      "propose_undo_nutrition_mutation",
      "Propose undoing one RECENT, JOURNALED meal mutation only when the CURRENT user explicitly asks Ari to undo, delete, or remove that recently logged or edited meal. Use only a verified persisted meal app_reference with a canonical mutationId and pass only its exact referenceId. The trusted Nutrition journal resolves and reverses the canonical mutation. Never invent a reference ID and never use conversation history as write permission.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));

    tools.push(functionTool(
      "propose_update_nutrition_meal",
      "Propose a precise edit to one RECENT, VERIFIED persisted meal only when the CURRENT user explicitly asks Ari to change, edit, correct, update, fix, or make a correction to that logged meal. Use only the exact referenceId from a verified persisted meal app_reference. Never pass or invent a meal database ID. Put only fields the user explicitly asked to change in changes. The trusted Nutrition adapter journals the edit and revalidates the signed-in user's canonical meal.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" },
          changes: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                field: {
                  type: "string",
                  enum: ["name", "calories", "protein_g", "carbs_g", "fat_g", "serving_size", "category", "multiplier"]
                },
                numberValue: { type: ["number", "null"] },
                textValue: { type: ["string", "null"] }
              },
              required: ["field", "numberValue", "textValue"]
            }
          }
        },
        required: ["referenceId", "changes"]
      }
    ));

    tools.push(functionTool(
      "propose_log_referenced_planned_meal",
      "Propose logging one specific CURRENT planned meal as eaten only when the CURRENT user explicitly asks Ari to log or record that referenced Meal Plan item. Use the exact meal_plan_item app_reference referenceId. The browser trust boundary re-reads today’s canonical plan and executes the existing atomic nutrition-plan transaction; never pass a plan database ID directly.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));

    tools.push(functionTool(
      "propose_log_referenced_plan_components",
      "Propose logging one or more specifically referenced CURRENT Meal Plan components as eaten only when the CURRENT user explicitly asks to log or record those items. Use only exact meal_plan_component referenceIds from the same current plan. The trusted transaction re-resolves every component, logs the selected food atomically, and preserves a truthful remaining plan. Never infer components that are not in the Reference Packet.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceIds: {
            type: "array",
            minItems: 1,
            maxItems: 16,
            items: { type: "string" }
          }
        },
        required: ["referenceIds"]
      }
    ));

    tools.push(functionTool(
      "propose_discard_referenced_meal_plan",
      "Propose removing one specific CURRENT planned meal from today’s Meal Plan only when the CURRENT user explicitly asks Ari to discard, remove, delete, or drop that planned meal. Use its exact meal_plan_item referenceId. This does NOT delete a consumed meal; the trusted Meal Plan sync marks only the current planned row skipped after confirmation.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));

    tools.push(functionTool(
      "propose_replace_referenced_meal_plan",
      "Propose replacing one specific CURRENT planned meal in place only when the CURRENT user explicitly asks Ari to replace, swap, or change that referenced Meal Plan item. Use the exact meal_plan_item referenceId; never pass a plan database ID. Supply a complete bounded nutrition estimate for the replacement. The trusted adapter preserves the canonical date and meal slot, re-checks the current plan, checks the saved remaining-calorie budget when available, and updates the same user-scoped plan row after confirmation.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" },
          name: { type: "string" },
          calories: { type: "number" },
          proteinG: { type: "number" },
          carbsG: { type: "number" },
          fatG: { type: "number" },
          servingSize: { type: "string" },
          notes: { type: "string" }
        },
        required: ["referenceId", "name", "calories", "proteinG", "carbsG", "fatG", "servingSize", "notes"]
      }
    ));
  }

  if (route?.training === true) {
    tools.push(functionTool(
      "propose_update_activity_log",
      "Propose a precise edit to one RECENT, VERIFIED manual activity log only when the CURRENT user explicitly asks Ari to change, edit, correct, update, or make a correction to that logged activity. Use only a verified persisted activity_log app_reference from the Reference Packet and pass its exact referenceId. Never pass or invent a database activity ID. Put only the fields the user explicitly asked to change in changes. The trusted Training adapter re-reads the canonical activity row for the signed-in user, merges only those requested fields, validates the result, and writes through the existing activity service.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" },
          changes: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                field: {
                  type: "string",
                  enum: [
                    "activity_name",
                    "duration_minutes",
                    "sets",
                    "reps_per_set",
                    "calories_burned",
                    "intensity",
                    "average_heart_rate",
                    "log_date",
                    "notes"
                  ]
                },
                numberValue: { type: ["number", "null"] },
                textValue: { type: ["string", "null"] }
              },
              required: ["field", "numberValue", "textValue"]
            }
          }
        },
        required: ["referenceId", "changes"]
      }
    ));

    tools.push(functionTool(
      "propose_delete_activity_log",
      "Propose deleting or undoing one RECENT, VERIFIED manual activity log only when the CURRENT user explicitly asks Ari to delete, remove, or undo that logged activity. Use only a verified persisted activity_log app_reference from the Reference Packet and pass its exact referenceId. Never pass or invent a database activity ID. The trusted Training adapter resolves the canonical ID and deletes only the signed-in user's matching row after confirmation.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));

    tools.push(functionTool(
      "propose_edit_referenced_workout",
      "Propose a precise edit to one RECENT, VERIFIED planned workout when the CURRENT user explicitly asks Ari to change that workout. Use the exact referenceId from a persisted workout app_reference. Do not supply or guess a date; the trusted reference layer supplies the canonical scheduled date. Preserve everything the user did not ask to change. Supported operations match Ari's trusted workout editor: add, remove, replace, move, or update an exercise, title, or duration.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" },
          operation: { type: "string", enum: ["add", "remove", "replace", "move", "update"] },
          exercise: { type: "string" },
          replacementExercise: { type: "string" },
          sets: { type: ["number", "null"] },
          reps: { type: ["number", "null"] },
          restSeconds: { type: ["number", "null"] },
          position: { type: ["number", "null"] },
          durationMinutes: { type: ["number", "null"] },
          title: { type: "string" },
          instruction: { type: "string" }
        },
        required: ["referenceId", "operation", "exercise", "replacementExercise", "sets", "reps", "restSeconds", "position", "durationMinutes", "title", "instruction"]
      }
    ));

    tools.push(functionTool(
      "propose_delete_workout",
      "Propose deleting one RECENT, VERIFIED planned workout only when the CURRENT user explicitly asks Ari to delete, remove, clear, or cancel that planned workout. Use only the exact referenceId from a persisted workout app_reference. The trusted Training controller resolves the canonical date and refuses to rewrite a completed workout.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));
  }

  if (route?.goals === true) {
    tools.push(functionTool(
      "propose_update_weight_log",
      "Propose correcting one RECENT, VERIFIED weight log only when the CURRENT user explicitly asks Ari to change, correct, edit, update, or make that weigh-in a different value. Use only the exact referenceId from a persisted weight_log app_reference. Never invent a date or database identity; the trusted weight adapter resolves the canonical log date.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" },
          value: { type: "number" },
          unit: { type: "string", enum: ["lb", "kg"] }
        },
        required: ["referenceId", "value", "unit"]
      }
    ));

    tools.push(functionTool(
      "propose_delete_weight_log",
      "Propose deleting one RECENT, VERIFIED weight log only when the CURRENT user explicitly asks Ari to delete, remove, or undo that weigh-in. Use only the exact referenceId from a persisted weight_log app_reference. The trusted adapter deletes only the signed-in user's canonical date row.",
      {
        type: "object",
        additionalProperties: false,
        properties: { referenceId: { type: "string" } },
        required: ["referenceId"]
      }
    ));
  }

  return tools;
}

function crewTools(route = {}) {
  if (!(route?.social && route?.circleAllowed === true && route?.teenMode !== true)) return [];

  return [
    functionTool(
      "propose_create_circle_crew",
      "Propose creating one private ARI Circle Crew only when the CURRENT user explicitly asks Ari to create or make a Crew from an evidence-backed Crew candidate already present in Action Network context. Use only the opaque candidateKey supplied by trusted context; never choose, add, remove, or invent founding members. The trusted server revalidates repeated completed Meetup evidence and blocking before creation. Other founding members are invited and must explicitly accept.",
      {
        type: "object",
        additionalProperties: false,
        properties: { candidateKey: { type: "string" }, name: { type: "string" } },
        required: ["candidateKey", "name"]
      }
    ),
    functionTool(
      "propose_accept_circle_crew_invite",
      "Propose accepting one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to accept or join that Crew. Use the exact Crew UUID from private Circle context. This cannot invite anyone else or alter Crew membership beyond the signed-in user's own invitation.",
      { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }
    ),
    functionTool(
      "propose_decline_circle_crew_invite",
      "Propose declining one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to decline, reject, or pass on that invitation. Use the exact Crew UUID from private Circle context.",
      { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }
    ),
    functionTool(
      "propose_leave_circle_crew",
      "Propose leaving one specific ARI Circle Crew only when the CURRENT user explicitly asks to leave or exit a Crew they are an active member of. Use the exact Crew UUID from private Circle context. Do not use this for an owner who asks to close the entire Crew; owners archive instead.",
      { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }
    ),
    functionTool(
      "propose_archive_circle_crew",
      "Propose archiving one specific ARI Circle Crew only when the CURRENT user explicitly asks to archive, close, or end a Crew they own. This changes the Crew for all members, so never infer it from a member asking to leave. Use the exact Crew UUID from private Circle context.",
      { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }
    )
  ];
}

export function getAriTools(route = {}) {
  return [...getCoreAriTools(route), ...referenceTools(route), ...crewTools(route)];
}

export function validateToolCall(call = {}, route = {}) {
  const name = String(call?.name || "").trim();
  if (REFERENCE_TOOL_NAMES.has(name)) return validateReferenceTool(call, route);
  if (!CREW_TOOL_NAMES.has(name)) return validateCoreToolCall(call, route);

  if (!(route?.social && route?.circleAllowed === true && route?.teenMode !== true)) {
    return { valid: false, error: "tool_not_allowed_for_turn" };
  }

  const args = parseArguments(call);
  if (!args) return { valid: false, error: "invalid_tool_arguments" };

  if (name === "propose_create_circle_crew") {
    const candidateKey = String(args?.candidateKey || "").trim().toLowerCase();
    const crewName = String(args?.name || "").trim();
    if (!/^[0-9a-f]{32}$/.test(candidateKey)) return { valid: false, error: "circle_crew_candidate_invalid" };
    if (crewName.length < 3 || crewName.length > 60) return { valid: false, error: "circle_crew_name_invalid" };
    return { valid: true, name, arguments: { candidateKey, name: crewName } };
  }

  if (!isUuid(args?.crewId)) return { valid: false, error: "circle_crew_id_invalid" };
  return { valid: true, name, arguments: { crewId: String(args.crewId).trim() } };
}

function validateReferenceTool(call = {}, route = {}) {
  const name = String(call?.name || "").trim();
  const planTool = PLAN_REFERENCE_TOOL_NAMES.has(name);
  const nutritionTool = planTool || name === "propose_undo_nutrition_mutation" || name === "propose_update_nutrition_meal";
  const activityTool = name === "propose_update_activity_log" || name === "propose_delete_activity_log";
  const workoutTool = name === "propose_edit_referenced_workout" || name === "propose_delete_workout";
  const weightTool = name === "propose_update_weight_log" || name === "propose_delete_weight_log";

  if (nutritionTool && route?.nutrition !== true) return { valid: false, error: "tool_not_allowed_for_turn" };
  if ((activityTool || workoutTool) && route?.training !== true) return { valid: false, error: "tool_not_allowed_for_turn" };
  if (weightTool && route?.goals !== true) return { valid: false, error: "tool_not_allowed_for_turn" };

  const args = parseArguments(call);
  if (!args) return { valid: false, error: "invalid_tool_arguments" };

  const referenceGate = validateDeterministicReferenceGate(name, args, route);
  if (referenceGate) return referenceGate;

  if (planTool) return validatePlanReferenceTool(name, args);

  const referenceId = String(args?.referenceId || "").trim();
  if (!validReferenceIdForTool({ referenceId, nutritionTool, activityTool, workoutTool, weightTool })) {
    return {
      valid: false,
      error: nutritionTool
        ? "nutrition_reference_id_invalid"
        : weightTool
          ? "weight_reference_id_invalid"
          : "training_reference_id_invalid"
    };
  }

  if (name === "propose_undo_nutrition_mutation" || name === "propose_delete_activity_log" || name === "propose_delete_weight_log" || name === "propose_delete_workout") {
    return { valid: true, name, arguments: { referenceId } };
  }

  if (name === "propose_update_nutrition_meal") {
    const changes = validateMealChanges(args?.changes);
    if (!changes.valid) return changes;
    return { valid: true, name, arguments: { referenceId, changes: changes.changes } };
  }

  if (name === "propose_update_activity_log") {
    const changes = validateActivityChanges(args?.changes);
    if (!changes.valid) return changes;
    return { valid: true, name, arguments: { referenceId, changes: changes.changes } };
  }

  if (name === "propose_update_weight_log") {
    const value = Number(args?.value);
    const unit = String(args?.unit || "").trim().toLowerCase();
    if (!["lb", "kg"].includes(unit)) return { valid: false, error: "weight_reference_unit_invalid" };
    const pounds = unit === "kg" ? value * 2.2046226218 : value;
    if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 1500) return { valid: false, error: "weight_reference_value_invalid" };
    return { valid: true, name, arguments: { referenceId, value, unit } };
  }

  if (name === "propose_edit_referenced_workout") {
    const operation = String(args?.operation || "").trim().toLowerCase();
    if (!["add", "remove", "replace", "move", "update"].includes(operation)) return { valid: false, error: "unsupported_workout_edit" };
    const exercise = String(args?.exercise || "").trim();
    const replacementExercise = String(args?.replacementExercise || "").trim();
    if (["remove", "replace", "move"].includes(operation) && !exercise) return { valid: false, error: "workout_edit_target_required" };
    if (operation === "add" && !exercise && !replacementExercise) return { valid: false, error: "workout_edit_add_exercise_required" };
    if (operation === "replace" && !replacementExercise) return { valid: false, error: "workout_edit_replacement_required" };
    if (args?.sets !== null && args?.sets !== undefined && !validRange(args.sets, 1, 12)) return { valid: false, error: "workout_edit_sets_out_of_range" };
    if (args?.reps !== null && args?.reps !== undefined && !validRange(args.reps, 1, 100)) return { valid: false, error: "workout_edit_reps_out_of_range" };
    if (args?.restSeconds !== null && args?.restSeconds !== undefined && !validRange(args.restSeconds, 0, 900)) return { valid: false, error: "workout_edit_rest_out_of_range" };
    if (args?.position !== null && args?.position !== undefined && !validRange(args.position, 1, 20)) return { valid: false, error: "workout_edit_position_out_of_range" };
    if (args?.durationMinutes !== null && args?.durationMinutes !== undefined && !validRange(args.durationMinutes, 10, 240)) return { valid: false, error: "workout_edit_duration_out_of_range" };
    if (operation === "update") {
      const hasExerciseUpdate = Boolean(exercise) && [args?.sets, args?.reps, args?.restSeconds].some((value) => value !== null && value !== undefined);
      const hasWorkoutUpdate = Boolean(String(args?.title || "").trim()) || (args?.durationMinutes !== null && args?.durationMinutes !== undefined);
      if (!hasExerciseUpdate && !hasWorkoutUpdate) return { valid: false, error: "workout_edit_update_fields_required" };
    }
    return {
      valid: true,
      name,
      arguments: {
        referenceId,
        operation,
        exercise,
        replacementExercise,
        sets: nullableNumber(args?.sets),
        reps: nullableNumber(args?.reps),
        restSeconds: nullableNumber(args?.restSeconds),
        position: nullableNumber(args?.position),
        durationMinutes: nullableNumber(args?.durationMinutes),
        title: String(args?.title || "").trim().slice(0, 160),
        instruction: String(args?.instruction || "").trim().slice(0, 500)
      }
    };
  }

  return { valid: false, error: "reference_tool_not_supported" };
}

function validateDeterministicReferenceGate(name = "", args = {}, route = {}) {
  if (!SINGLE_REFERENCE_TOOL_NAMES.has(name)) return null;
  if (!Object.prototype.hasOwnProperty.call(route || {}, "referenceResolution")) return null;

  const resolution = route?.referenceResolution || {};
  if (resolution?.status !== "resolved" || !String(resolution?.selectedReferenceId || "").trim()) {
    return {
      valid: false,
      error: resolution?.status === "ambiguous"
        ? "reference_target_ambiguous"
        : "reference_target_unresolved"
    };
  }

  const requestedReferenceId = String(args?.referenceId || "").trim();
  const selectedReferenceId = String(resolution.selectedReferenceId || "").trim();
  if (!requestedReferenceId || requestedReferenceId !== selectedReferenceId) {
    return { valid: false, error: "reference_target_mismatch" };
  }

  return null;
}

function validReferenceIdForTool({ referenceId = "", nutritionTool = false, activityTool = false, workoutTool = false, weightTool = false } = {}) {
  if (LIFECYCLE_REFERENCE_ID.test(referenceId)) return true;
  if (nutritionTool) return /^ref_live_meal_[a-z0-9]+$/i.test(referenceId);
  if (activityTool) return /^ref_live_activity_log_[a-z0-9]+$/i.test(referenceId);
  if (workoutTool) return /^ref_live_workout_[a-z0-9]+$/i.test(referenceId);
  if (weightTool) return /^ref_live_weight_log_[a-z0-9]+$/i.test(referenceId);
  return false;
}

function validatePlanReferenceTool(name, args = {}) {
  if (name === "propose_log_referenced_plan_components") {
    const referenceIds = Array.isArray(args?.referenceIds)
      ? Array.from(new Set(args.referenceIds.map((value) => String(value || "").trim()).filter(Boolean)))
      : [];
    if (referenceIds.length < 1 || referenceIds.length > 16) return { valid: false, error: "meal_plan_component_references_invalid" };
    if (referenceIds.some((referenceId) => !PLAN_COMPONENT_REFERENCE_ID.test(referenceId))) {
      return { valid: false, error: "meal_plan_component_reference_id_invalid" };
    }
    return { valid: true, name, arguments: { referenceIds } };
  }

  const referenceId = String(args?.referenceId || "").trim();
  if (!PLAN_REFERENCE_ID.test(referenceId)) return { valid: false, error: "meal_plan_reference_id_invalid" };

  if (name === "propose_log_referenced_planned_meal" || name === "propose_discard_referenced_meal_plan") {
    return { valid: true, name, arguments: { referenceId } };
  }

  if (name === "propose_replace_referenced_meal_plan") {
    const replacement = validatePlanReplacement(args);
    if (!replacement.valid) return replacement;
    return { valid: true, name, arguments: { referenceId, ...replacement.arguments } };
  }

  return { valid: false, error: "meal_plan_reference_tool_not_supported" };
}

function validatePlanReplacement(args = {}) {
  const name = String(args?.name || "").trim();
  const servingSize = String(args?.servingSize || "").trim();
  const notes = String(args?.notes || "").trim();
  const calories = Number(args?.calories);
  const proteinG = Number(args?.proteinG);
  const carbsG = Number(args?.carbsG);
  const fatG = Number(args?.fatG);

  if (!name || name.length > 180) return { valid: false, error: "meal_plan_replacement_name_invalid" };
  if (!servingSize || servingSize.length > 220) return { valid: false, error: "meal_plan_replacement_serving_invalid" };
  if (notes.length > 500) return { valid: false, error: "meal_plan_replacement_notes_invalid" };
  if (!Number.isFinite(calories) || calories <= 0 || calories > 5000) return { valid: false, error: "meal_plan_replacement_calories_invalid" };
  if (![proteinG, carbsG, fatG].every((value) => Number.isFinite(value) && value >= 0 && value <= 2000)) {
    return { valid: false, error: "meal_plan_replacement_macros_invalid" };
  }

  return {
    valid: true,
    arguments: {
      name,
      calories: Math.round(calories),
      proteinG: Math.round(proteinG * 10) / 10,
      carbsG: Math.round(carbsG * 10) / 10,
      fatG: Math.round(fatG * 10) / 10,
      servingSize,
      notes
    }
  };
}

function validateMealChanges(rawChanges) {
  if (!Array.isArray(rawChanges) || rawChanges.length < 1 || rawChanges.length > 8) {
    return { valid: false, error: "nutrition_reference_changes_invalid" };
  }

  const seen = new Set();
  const changes = [];
  for (const raw of rawChanges) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { valid: false, error: "nutrition_reference_change_invalid" };
    const field = String(raw.field || "").trim().toLowerCase();
    if (seen.has(field)) return { valid: false, error: "nutrition_reference_change_duplicate" };
    seen.add(field);

    if (MEAL_NUMERIC_FIELDS.has(field)) {
      const value = Number(raw.numberValue);
      const range = MEAL_NUMERIC_FIELDS.get(field);
      if (!Number.isFinite(value) || value < range.min || value > range.max) return { valid: false, error: `nutrition_reference_${field}_invalid` };
      if (raw.textValue !== null && raw.textValue !== undefined && String(raw.textValue).trim() !== "") return { valid: false, error: "nutrition_reference_change_value_type_invalid" };
      changes.push({ field, numberValue: value, textValue: null });
      continue;
    }

    if (!MEAL_TEXT_FIELDS.has(field)) return { valid: false, error: "nutrition_reference_field_invalid" };
    const textValue = raw.textValue === null || raw.textValue === undefined ? "" : String(raw.textValue).trim();
    if (raw.numberValue !== null && raw.numberValue !== undefined) return { valid: false, error: "nutrition_reference_change_value_type_invalid" };
    if (!textValue) return { valid: false, error: `nutrition_reference_${field}_invalid` };
    if (field === "name" && textValue.length > 180) return { valid: false, error: "nutrition_reference_name_invalid" };
    if (textValue.length > 220) return { valid: false, error: `nutrition_reference_${field}_invalid` };
    changes.push({ field, numberValue: null, textValue });
  }

  return { valid: true, changes };
}

function validateActivityChanges(rawChanges) {
  if (!Array.isArray(rawChanges) || rawChanges.length < 1 || rawChanges.length > 8) {
    return { valid: false, error: "activity_reference_changes_invalid" };
  }

  const seen = new Set();
  const changes = [];

  for (const raw of rawChanges) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { valid: false, error: "activity_reference_change_invalid" };
    }

    const field = String(raw.field || "").trim().toLowerCase();
    if (seen.has(field)) return { valid: false, error: "activity_reference_change_duplicate" };
    seen.add(field);

    if (ACTIVITY_NUMERIC_FIELDS.has(field)) {
      const value = Number(raw.numberValue);
      const range = ACTIVITY_NUMERIC_FIELDS.get(field);
      if (!Number.isFinite(value) || value < range.min || value > range.max) {
        return { valid: false, error: `activity_reference_${field}_invalid` };
      }
      if (raw.textValue !== null && raw.textValue !== undefined && String(raw.textValue).trim() !== "") {
        return { valid: false, error: "activity_reference_change_value_type_invalid" };
      }
      changes.push({ field, numberValue: value, textValue: null });
      continue;
    }

    if (!ACTIVITY_TEXT_FIELDS.has(field)) return { valid: false, error: "activity_reference_field_invalid" };

    const textValue = raw.textValue === null || raw.textValue === undefined ? "" : String(raw.textValue).trim();
    if (raw.numberValue !== null && raw.numberValue !== undefined) return { valid: false, error: "activity_reference_change_value_type_invalid" };
    if (field !== "notes" && !textValue) return { valid: false, error: `activity_reference_${field}_invalid` };
    if (field === "activity_name" && textValue.length > 180) return { valid: false, error: "activity_reference_activity_name_invalid" };
    if (field === "intensity" && !ACTIVITY_INTENSITIES.has(textValue.toLowerCase().replace(/[\s-]+/g, "_"))) return { valid: false, error: "activity_reference_intensity_invalid" };
    if (field === "log_date" && textValue.length > 40) return { valid: false, error: "activity_reference_log_date_invalid" };
    if (field === "notes" && textValue.length > 500) return { valid: false, error: "activity_reference_notes_invalid" };

    changes.push({
      field,
      numberValue: null,
      textValue: field === "intensity" ? textValue.toLowerCase().replace(/[\s-]+/g, "_") : textValue
    });
  }

  return { valid: true, changes };
}

export function toolToApplicationAction(name = "") {
  const referenceAction = ({
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
  })[name];
  if (referenceAction) return referenceAction;

  const crewAction = ({
    propose_create_circle_crew: "create_circle_crew",
    propose_accept_circle_crew_invite: "accept_circle_crew_invite",
    propose_decline_circle_crew_invite: "decline_circle_crew_invite",
    propose_leave_circle_crew: "leave_circle_crew",
    propose_archive_circle_crew: "archive_circle_crew"
  })[name];
  return crewAction || coreToolToApplicationAction(name);
}

function parseArguments(call = {}) {
  try {
    const args = typeof call?.arguments === "string" ? JSON.parse(call.arguments) : call?.arguments;
    return args && typeof args === "object" && !Array.isArray(args) ? args : null;
  } catch {
    return null;
  }
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validRange(value, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}
