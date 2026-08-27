// ARI vNext — model-visible application capability facade.
// The mature nutrition/training/goals/Meetup/Mission registry remains unchanged
// in tools-core.js. This facade adds bounded capabilities that depend on newer
// trusted context contracts: Crew actions plus reference-bound Nutrition and
// Training mutations.

import {
  TOOL_REGISTRY_VERSION as CORE_REGISTRY_VERSION,
  getAriTools as getCoreAriTools,
  validateToolCall as validateCoreToolCall,
  toolToApplicationAction as coreToolToApplicationAction
} from "./tools-core.js";

export const TOOL_REGISTRY_VERSION = "1.14.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

const CREW_TOOL_NAMES = new Set([
  "propose_create_circle_crew",
  "propose_accept_circle_crew_invite",
  "propose_decline_circle_crew_invite",
  "propose_leave_circle_crew",
  "propose_archive_circle_crew"
]);
const REFERENCE_TOOL_NAMES = new Set([
  "propose_undo_nutrition_mutation",
  "propose_update_activity_log",
  "propose_delete_activity_log"
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

function functionTool(name, description, parameters) {
  return { type: "function", name, description, strict: true, parameters };
}

function referenceTools(route = {}) {
  const tools = [];

  if (route?.nutrition === true) {
    tools.push(functionTool(
      "propose_undo_nutrition_mutation",
      "Propose undoing one RECENT, JOURNALED meal mutation only when the CURRENT user explicitly asks Ari to undo, delete, or remove that recently logged meal. Use this only when the Reference Packet contains one verified persisted meal app_reference with a canonical mutationId. Pass only the exact referenceId from that app_reference. The trusted browser reference lifecycle resolves the canonical mutationId itself. Never invent a reference ID, never use conversation text alone as mutation authority, and never use this tool for a meal that lacks a trusted journaled mutation.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceId: { type: "string" }
        },
        required: ["referenceId"]
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
        properties: {
          referenceId: { type: "string" }
        },
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
        properties: {
          candidateKey: { type: "string" },
          name: { type: "string" }
        },
        required: ["candidateKey", "name"]
      }
    ),
    functionTool(
      "propose_accept_circle_crew_invite",
      "Propose accepting one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to accept or join that Crew. Use the exact Crew UUID from private Circle context. This cannot invite anyone else or alter Crew membership beyond the signed-in user's own invitation.",
      {
        type: "object",
        additionalProperties: false,
        properties: { crewId: { type: "string" } },
        required: ["crewId"]
      }
    ),
    functionTool(
      "propose_decline_circle_crew_invite",
      "Propose declining one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to decline, reject, or pass on that invitation. Use the exact Crew UUID from private Circle context.",
      {
        type: "object",
        additionalProperties: false,
        properties: { crewId: { type: "string" } },
        required: ["crewId"]
      }
    ),
    functionTool(
      "propose_leave_circle_crew",
      "Propose leaving one specific ARI Circle Crew only when the CURRENT user explicitly asks to leave or exit a Crew they are an active member of. Use the exact Crew UUID from private Circle context. Do not use this for an owner who asks to close the entire Crew; owners archive instead.",
      {
        type: "object",
        additionalProperties: false,
        properties: { crewId: { type: "string" } },
        required: ["crewId"]
      }
    ),
    functionTool(
      "propose_archive_circle_crew",
      "Propose archiving one specific ARI Circle Crew only when the CURRENT user explicitly asks to archive, close, or end a Crew they own. This changes the Crew for all members, so never infer it from a member asking to leave. Use the exact Crew UUID from private Circle context.",
      {
        type: "object",
        additionalProperties: false,
        properties: { crewId: { type: "string" } },
        required: ["crewId"]
      }
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
  const nutritionTool = name === "propose_undo_nutrition_mutation";
  const activityTool = name === "propose_update_activity_log" || name === "propose_delete_activity_log";

  if (nutritionTool && route?.nutrition !== true) return { valid: false, error: "tool_not_allowed_for_turn" };
  if (activityTool && route?.training !== true) return { valid: false, error: "tool_not_allowed_for_turn" };

  const args = parseArguments(call);
  if (!args) return { valid: false, error: "invalid_tool_arguments" };

  const referenceId = String(args?.referenceId || "").trim();
  if (!/^ref_action_[a-z0-9]+$/i.test(referenceId)) {
    return {
      valid: false,
      error: nutritionTool ? "nutrition_reference_id_invalid" : "training_reference_id_invalid"
    };
  }

  if (nutritionTool) {
    return {
      valid: true,
      name,
      arguments: { referenceId }
    };
  }

  if (name === "propose_delete_activity_log") {
    return {
      valid: true,
      name,
      arguments: { referenceId }
    };
  }

  const changes = validateActivityChanges(args?.changes);
  if (!changes.valid) return changes;

  return {
    valid: true,
    name,
    arguments: { referenceId, changes: changes.changes }
  };
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

    if (!ACTIVITY_TEXT_FIELDS.has(field)) {
      return { valid: false, error: "activity_reference_field_invalid" };
    }

    const textValue = raw.textValue === null || raw.textValue === undefined
      ? ""
      : String(raw.textValue).trim();
    if (raw.numberValue !== null && raw.numberValue !== undefined) {
      return { valid: false, error: "activity_reference_change_value_type_invalid" };
    }
    if (field !== "notes" && !textValue) {
      return { valid: false, error: `activity_reference_${field}_invalid` };
    }
    if (field === "activity_name" && textValue.length > 180) {
      return { valid: false, error: "activity_reference_activity_name_invalid" };
    }
    if (field === "intensity" && !ACTIVITY_INTENSITIES.has(textValue.toLowerCase().replace(/[\s-]+/g, "_"))) {
      return { valid: false, error: "activity_reference_intensity_invalid" };
    }
    if (field === "log_date" && textValue.length > 40) {
      return { valid: false, error: "activity_reference_log_date_invalid" };
    }
    if (field === "notes" && textValue.length > 500) {
      return { valid: false, error: "activity_reference_notes_invalid" };
    }

    changes.push({
      field,
      numberValue: null,
      textValue: field === "intensity"
        ? textValue.toLowerCase().replace(/[\s-]+/g, "_")
        : textValue
    });
  }

  return { valid: true, changes };
}

export function toolToApplicationAction(name = "") {
  const referenceAction = ({
    propose_undo_nutrition_mutation: "undo_nutrition_mutation",
    propose_update_activity_log: "update_activity_log",
    propose_delete_activity_log: "delete_activity_log"
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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}