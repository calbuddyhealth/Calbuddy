// ARI vNext — model-visible application capability facade.
// The mature nutrition/training/goals/Meetup/Mission registry remains unchanged
// in tools-core.js. This facade adds bounded capabilities that depend on newer
// trusted context contracts: Crew actions and reference-bound nutrition Undo.

import {
  TOOL_REGISTRY_VERSION as CORE_REGISTRY_VERSION,
  getAriTools as getCoreAriTools,
  validateToolCall as validateCoreToolCall,
  toolToApplicationAction as coreToolToApplicationAction
} from "./tools-core.js";

export const TOOL_REGISTRY_VERSION = "1.13.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

const CREW_TOOL_NAMES = new Set([
  "propose_create_circle_crew",
  "propose_accept_circle_crew_invite",
  "propose_decline_circle_crew_invite",
  "propose_leave_circle_crew",
  "propose_archive_circle_crew"
]);
const REFERENCE_TOOL_NAMES = new Set([
  "propose_undo_nutrition_mutation"
]);

function functionTool(name, description, parameters) {
  return { type: "function", name, description, strict: true, parameters };
}

function referenceTools(route = {}) {
  if (route?.nutrition !== true) return [];

  return [
    functionTool(
      "propose_undo_nutrition_mutation",
      "Propose undoing one RECENT, JOURNALED meal mutation only when the CURRENT user explicitly asks Ari to undo, delete, or remove that recently logged meal. Use this only when the Reference Packet contains one verified persisted meal app_reference with an exact canonical mutationId. Copy mutationId and referenceId from that same app_reference and use its label. Never invent an ID, never use conversation text alone as mutation authority, and never use this tool for a meal that lacks a trusted mutationId.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          mutationId: { type: "string" },
          referenceId: { type: "string" },
          label: { type: "string" }
        },
        required: ["mutationId", "referenceId", "label"]
      }
    )
  ];
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
  if (route?.nutrition !== true) return { valid: false, error: "tool_not_allowed_for_turn" };
  const args = parseArguments(call);
  if (!args) return { valid: false, error: "invalid_tool_arguments" };

  const mutationId = String(args?.mutationId || "").trim();
  const referenceId = String(args?.referenceId || "").trim();
  const label = String(args?.label || "").replace(/\s+/g, " ").trim();

  if (!isUuid(mutationId)) return { valid: false, error: "nutrition_mutation_id_invalid" };
  if (!/^ref_action_[a-z0-9]+$/i.test(referenceId)) return { valid: false, error: "nutrition_reference_id_invalid" };
  if (!label || label.length > 220) return { valid: false, error: "nutrition_reference_label_invalid" };

  return {
    valid: true,
    name: "propose_undo_nutrition_mutation",
    arguments: { mutationId, referenceId, label }
  };
}

export function toolToApplicationAction(name = "") {
  const referenceAction = ({
    propose_undo_nutrition_mutation: "undo_nutrition_mutation"
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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(String(value || "").trim()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}
