// ARI vNext — Crew-aware model-visible application capabilities.
// The mature nutrition/training/goals/Meetup/Mission registry remains unchanged
// in tools-core.js. This facade adds bounded Crew proposals and hardens any
// operation contracts that must agree with the trusted browser executor.

import {
  TOOL_REGISTRY_VERSION as CORE_REGISTRY_VERSION,
  getAriTools as getCoreAriTools,
  validateToolCall as validateCoreToolCall,
  toolToApplicationAction as coreToolToApplicationAction
} from "./tools-core.js";

export const TOOL_REGISTRY_VERSION = "1.12.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

// Core health mutations are semantic capabilities, not context-routing results.
// OpenAI should be able to understand natural requests like "log a High Noon"
// even when the lightweight context router does not recognize the noun. Context
// routing still decides what supporting data to preload; trusted validation and
// execution remain authoritative for whether a proposed mutation can proceed.
const SEMANTIC_HEALTH_TOOL_NAMES = new Set([
  "propose_log_meal",
  "propose_today_meal_plan",
  "propose_log_planned_meal",
  "propose_log_activity",
  "propose_workout_plan",
  "propose_edit_workout",
  "propose_log_weight",
  "propose_update_goal"
]);

const CREW_TOOL_NAMES = new Set([
  "propose_create_circle_crew",
  "propose_accept_circle_crew_invite",
  "propose_decline_circle_crew_invite",
  "propose_leave_circle_crew",
  "propose_archive_circle_crew"
]);

function functionTool(name, description, parameters) {
  return { type: "function", name, description, strict: true, parameters };
}

function semanticHealthCapabilityRoute(route = {}) {
  return {
    ...route,
    nutrition: true,
    training: true,
    goals: true
  };
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

function hardenCoreToolContract(tool = {}) {
  if (tool?.name !== "propose_log_meal") return tool;

  const parameters = tool?.parameters && typeof tool.parameters === "object"
    ? tool.parameters
    : {};
  const properties = parameters?.properties && typeof parameters.properties === "object"
    ? parameters.properties
    : {};

  return {
    ...tool,
    description:
      "Propose logging food or a meal only when the CURRENT user message explicitly asks to log, add, record, or save it. Do not use for nutrition questions or statements about eating. Resolve or estimate a complete nutrition payload before proposing the mutation; calories, protein, carbs, and fat must all be numeric because the trusted executor will not accept unresolved nutrition. Clearly mark estimates in notes.",
    parameters: {
      ...parameters,
      properties: {
        ...properties,
        calories: { type: "number" },
        proteinG: { type: "number" },
        carbsG: { type: "number" },
        fatG: { type: "number" }
      }
    }
  };
}

function parseArguments(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isMissing(value) {
  return value === null || value === undefined || value === "";
}

function validateResolvedMealArguments(args = {}) {
  if (!String(args?.name || "").trim()) return { valid: false, error: "meal_name_required" };

  if (isMissing(args?.calories)) return { valid: false, error: "meal_nutrition_required" };
  const calories = Number(args.calories);
  if (!Number.isFinite(calories) || calories <= 0 || calories > 10000) {
    return { valid: false, error: "meal_nutrition_required" };
  }

  for (const [key, max] of [["proteinG", 1000], ["carbsG", 1500], ["fatG", 1000]]) {
    if (isMissing(args?.[key])) return { valid: false, error: "meal_nutrition_required" };
    const value = Number(args[key]);
    if (!Number.isFinite(value) || value < 0 || value > max) {
      return { valid: false, error: "meal_nutrition_required" };
    }
  }

  return { valid: true };
}

export function getAriTools(route = {}) {
  const routedCoreTools = getCoreAriTools(route);
  const semanticHealthTools = getCoreAriTools(semanticHealthCapabilityRoute(route))
    .filter((tool) => SEMANTIC_HEALTH_TOOL_NAMES.has(String(tool?.name || "")));

  const coreByName = new Map();
  for (const tool of [...routedCoreTools, ...semanticHealthTools]) {
    if (tool?.name) coreByName.set(String(tool.name), tool);
  }

  const coreTools = [...coreByName.values()].map(hardenCoreToolContract);
  return [...coreTools, ...crewTools(route)];
}

export function validateToolCall(call = {}, route = {}) {
  const name = String(call?.name || "").trim();

  if (name === "propose_log_meal") {
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const nutritionValidation = validateResolvedMealArguments(args);
    if (!nutritionValidation.valid) return nutritionValidation;
  }

  if (!CREW_TOOL_NAMES.has(name)) {
    const validationRoute = SEMANTIC_HEALTH_TOOL_NAMES.has(name)
      ? semanticHealthCapabilityRoute(route)
      : route;
    return validateCoreToolCall(call, validationRoute);
  }

  if (!(route?.social && route?.circleAllowed === true && route?.teenMode !== true)) {
    return { valid: false, error: "tool_not_allowed_for_turn" };
  }

  const args = parseArguments(call?.arguments);
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

export function toolToApplicationAction(name = "") {
  const crewAction = ({
    propose_create_circle_crew: "create_circle_crew",
    propose_accept_circle_crew_invite: "accept_circle_crew_invite",
    propose_decline_circle_crew_invite: "decline_circle_crew_invite",
    propose_leave_circle_crew: "leave_circle_crew",
    propose_archive_circle_crew: "archive_circle_crew"
  })[name];
  return crewAction || coreToolToApplicationAction(name);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}
