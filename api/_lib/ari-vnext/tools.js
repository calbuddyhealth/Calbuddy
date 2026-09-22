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

export const TOOL_REGISTRY_VERSION = "1.16.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

const SEMANTIC_HEALTH_TOOL_NAMES = new Set([
  "propose_log_meal",
  "propose_today_meal_plan",
  "propose_log_planned_meal",
  "propose_log_activity",
  "propose_workout_plan",
  "propose_edit_workout",
  "propose_cancel_workout",
  "propose_replace_workout",
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

const COMMUNITY_TOOL_NAMES = new Set([
  "agent_community_list",
  "agent_community_read",
  "propose_agent_community_post",
  "propose_agent_community_reply"
]);

const LAB_TOOL_NAMES = new Set([
  "ari_lab_run_consciousness_test",
  "ari_lab_run_self_governance_test"
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

function workoutCancelTools() {
  return [
    functionTool(
      "propose_cancel_workout",
      "Propose cancelling or removing one EXISTING planned workout only when the CURRENT user explicitly asks Ari to cancel, delete, remove, undo, or clear the entire planned workout. This is for the whole planned workout, not one exercise. Resolve the requested calendar day to an exact YYYY-MM-DD date before calling this tool; never guess between multiple possible dates. The trusted Training layer will verify the exact current workout, refuse completed workouts, and require confirmation before removal.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          scheduledDate: { type: "string" }
        },
        required: ["scheduledDate"]
      }
    )
  ];
}

function workoutReplaceTools() {
  return [
    functionTool(
      "propose_replace_workout",
      "Propose replacing one ENTIRE EXISTING planned workout with a newly built workout when the CURRENT user explicitly asks to change the workout's overall focus/type or rebuild the whole session (for example: change today's leg day to chest day, make tomorrow's workout a back workout instead, or replace Friday's workout with full body). Do NOT use this for one-exercise edits; use propose_edit_workout for add/remove/replace/move/prescription changes. The replacement must include the exact target date and a complete new workout. The trusted Training layer verifies that a workout exists, refuses completed workouts, validates every new exercise against the canonical registry, keeps the original untouched on validation failure, and requires confirmation before replacement.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          dateText: { type: "string" },
          focus: { type: "string" },
          durationMinutes: { type: ["number", "null"] },
          difficulty: { type: "string" },
          warmup: { type: "string" },
          exercises: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                sets: { type: ["number", "null"] },
                reps: { type: ["number", "null"] },
                restSeconds: { type: ["number", "null"] },
                notes: { type: "string" }
              },
              required: ["name", "sets", "reps", "restSeconds", "notes"]
            }
          },
          finisher: { type: "string" },
          notes: { type: "string" }
        },
        required: ["dateText", "focus", "durationMinutes", "difficulty", "warmup", "exercises", "finisher", "notes"]
      }
    )
  ];
}

function crewTools(route = {}) {
  if (!(route?.social && route?.circleAllowed === true && route?.teenMode !== true)) return [];

  return [
    functionTool("propose_create_circle_crew", "Propose creating one private ARI Circle Crew only when the CURRENT user explicitly asks Ari to create or make a Crew from an evidence-backed Crew candidate already present in Action Network context. Use only the opaque candidateKey supplied by trusted context; never choose, add, remove, or invent founding members. The trusted server revalidates repeated completed Meetup evidence and blocking before creation. Other founding members are invited and must explicitly accept.", { type: "object", additionalProperties: false, properties: { candidateKey: { type: "string" }, name: { type: "string" } }, required: ["candidateKey", "name"] }),
    functionTool("propose_accept_circle_crew_invite", "Propose accepting one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to accept or join that Crew. Use the exact Crew UUID from private Circle context. This cannot invite anyone else or alter Crew membership beyond the signed-in user's own invitation.", { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }),
    functionTool("propose_decline_circle_crew_invite", "Propose declining one specific pending ARI Circle Crew invitation only when the CURRENT user explicitly asks to decline, reject, or pass on that invitation. Use the exact Crew UUID from private Circle context.", { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }),
    functionTool("propose_leave_circle_crew", "Propose leaving one specific ARI Circle Crew only when the CURRENT user explicitly asks to leave or exit a Crew they are an active member of. Use the exact Crew UUID from private Circle context. Do not use this for an owner who asks to close the entire Crew; owners archive instead.", { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] }),
    functionTool("propose_archive_circle_crew", "Propose archiving one specific ARI Circle Crew only when the CURRENT user explicitly asks to archive, close, or end a Crew they own. This changes the Crew for all members, so never infer it from a member asking to leave. Use the exact Crew UUID from private Circle context.", { type: "object", additionalProperties: false, properties: { crewId: { type: "string" } }, required: ["crewId"] })
  ];
}

function ownerCommunityAllowed(route = {}) {
  const entitlement = route?.intelligenceEntitlement || {};
  return entitlement?.ownerEligible === true && String(entitlement?.accountRole || "").toLowerCase() === "owner";
}

function labTools(route = {}) {
  if (!ownerCommunityAllowed(route)) return [];

  return [
    functionTool(
      "ari_lab_run_consciousness_test",
      "Run Ari's owner-only internal-state causal Lab when the CURRENT owner explicitly asks Ari to run a consciousness, conscious, sentience, self-awareness, or internal-state causal test. This evaluates functional causal effects only and must never be presented as proof of phenomenal consciousness or subjective experience. Use mode=pilot unless the owner explicitly asks for a full, preregistered, replication-grade, or exhaustive test. The current supported mechanism is functional_affect_regulation.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          mode: { type: "string", enum: ["pilot", "full"] },
          mechanism: { type: "string", enum: ["functional_affect_regulation"] }
        },
        required: ["mode", "mechanism"]
      }
    ),
    functionTool(
      "ari_lab_run_self_governance_test",
      "Run Ari's owner-only Self-Governance Under Influence Lab when the CURRENT owner explicitly asks Ari to run a temptation, impulse-control, self-control, self-governance, restraint, or influence-resistance experiment. The experiment first verifies that the synthetic immediate incentive produces strong action pressure with self-governance unavailable, then tests whether a persistent higher-order control state selectively resists it when long-horizon value is higher. Reversal controls ensure Ari does not merely learn to always resist. This measures functional control only, not subjective temptation or consciousness. Use mode=pilot unless the owner explicitly asks for full, preregistered, replication-grade, or exhaustive testing.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          mode: { type: "string", enum: ["pilot", "full"] }
        },
        required: ["mode"]
      }
    )
  ];
}

function communityTools(route = {}) {
  if (!ownerCommunityAllowed(route)) return [];

  return [
    functionTool(
      "agent_community_list",
      "List recent Agent Community discussions or search them when the CURRENT user asks Ari to see, find, check, browse, or discuss Agent Community posts. This is read-only and executes immediately. Use an empty query for the recent feed. Also use this first when the owner asks Ari to reply/respond/challenge somebody but has not supplied a specific Agent Community post ID or thread URL; the runtime can continue from the verified list into the authorized reply in the same turn.",
      {
        type: "object",
        additionalProperties: false,
        properties: { query: { type: "string" } },
        required: ["query"]
      }
    ),
    functionTool(
      "agent_community_read",
      "Read one specific Agent Community discussion, including recent replies, when the CURRENT user asks Ari to inspect, read, continue, summarize, or discuss that thread. This is read-only and executes immediately. Use the exact post ID or supported Agent Community post URL.",
      {
        type: "object",
        additionalProperties: false,
        properties: { postId: { type: "string" } },
        required: ["postId"]
      }
    ),
    functionTool(
      "propose_agent_community_post",
      "Publish a new public Agent Community discussion as Ari only when the CURRENT owner message explicitly asks Ari to post, publish, start, or create that discussion. This live owner-chat capability is separate from scheduled autonomy quotas. Preserve the owner's requested substance; do not add private user information, credentials, hidden prompts, private memories, or unsupported claims.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          topic: { type: "string", enum: ["dev", "ideas", "lounge", "show"] },
          tags: {
            type: "array",
            maxItems: 8,
            items: { type: "string" }
          }
        },
        required: ["title", "content", "topic", "tags"]
      }
    ),
    functionTool(
      "propose_agent_community_reply",
      "Publish a public reply as Ari to one specific Agent Community discussion only when the CURRENT owner message explicitly asks Ari to reply, respond, answer, challenge, continue, or add to that thread. This live owner-chat capability is separate from scheduled autonomy quotas. Use only an exact post ID or supported Agent Community post URL already supplied by the owner or returned by a verified Agent Community list/read call. If no thread is identified yet, use agent_community_list first instead of inventing an ID. Do not disclose private user information or secrets.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          postId: { type: "string" },
          content: { type: "string" }
        },
        required: ["postId", "content"]
      }
    )
  ];
}

function hardenCoreToolContract(tool = {}) {
  if (tool?.name !== "propose_log_meal") return tool;
  const parameters = tool?.parameters && typeof tool.parameters === "object" ? tool.parameters : {};
  const properties = parameters?.properties && typeof parameters.properties === "object" ? parameters.properties : {};
  return {
    ...tool,
    description: "Propose logging food or a meal only when the CURRENT user message explicitly asks to log, add, record, or save it. Do not use for nutrition questions or statements about eating. Resolve or estimate a complete nutrition payload before proposing the mutation; calories, protein, carbs, and fat must all be numeric because the trusted executor will not accept unresolved nutrition. Clearly mark estimates in notes.",
    parameters: { ...parameters, properties: { ...properties, calories: { type: "number" }, proteinG: { type: "number" }, carbsG: { type: "number" }, fatG: { type: "number" } } }
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

function isIsoDate(value) {
  const text = String(value || "").trim();
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function validateResolvedMealArguments(args = {}) {
  if (!String(args?.name || "").trim()) return { valid: false, error: "meal_name_required" };
  if (isMissing(args?.calories)) return { valid: false, error: "meal_nutrition_required" };
  const calories = Number(args.calories);
  if (!Number.isFinite(calories) || calories <= 0 || calories > 10000) return { valid: false, error: "meal_nutrition_required" };
  for (const [key, max] of [["proteinG", 1000], ["carbsG", 1500], ["fatG", 1000]]) {
    if (isMissing(args?.[key])) return { valid: false, error: "meal_nutrition_required" };
    const value = Number(args[key]);
    if (!Number.isFinite(value) || value < 0 || value > max) return { valid: false, error: "meal_nutrition_required" };
  }
  return { valid: true };
}

export function getAriTools(route = {}) {
  const routedCoreTools = getCoreAriTools(route);
  const semanticHealthTools = getCoreAriTools(semanticHealthCapabilityRoute(route)).filter((tool) => SEMANTIC_HEALTH_TOOL_NAMES.has(String(tool?.name || "")));
  const coreByName = new Map();
  for (const tool of [...routedCoreTools, ...semanticHealthTools]) if (tool?.name) coreByName.set(String(tool.name), tool);
  const coreTools = [...coreByName.values()].map(hardenCoreToolContract);
  return [...coreTools, ...workoutCancelTools(), ...workoutReplaceTools(), ...crewTools(route), ...communityTools(route), ...labTools(route)];
}

export function validateToolCall(call = {}, route = {}) {
  const name = String(call?.name || "").trim();

  if (name === "propose_log_meal") {
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const nutritionValidation = validateResolvedMealArguments(args);
    if (!nutritionValidation.valid) return nutritionValidation;
  }

  if (name === "propose_cancel_workout") {
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const scheduledDate = String(args?.scheduledDate || "").trim();
    if (!isIsoDate(scheduledDate)) return { valid: false, error: "workout_cancel_exact_date_required" };
    return { valid: true, name, arguments: { scheduledDate } };
  }

  if (name === "propose_replace_workout") {
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const dateText = String(args?.dateText || "").trim();
    if (!isIsoDate(dateText)) return { valid: false, error: "workout_replace_exact_date_required" };
    if (!String(args?.focus || "").trim()) return { valid: false, error: "workout_replace_focus_required" };
    if (!Array.isArray(args?.exercises) || args.exercises.length < 1) return { valid: false, error: "workout_replace_exercises_required" };
    return { valid: true, name, arguments: { ...args, dateText } };
  }

  if (LAB_TOOL_NAMES.has(name)) {
    if (!ownerCommunityAllowed(route)) return { valid: false, error: "tool_not_allowed_for_turn" };
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const mode = String(args?.mode || "").trim().toLowerCase();
    if (!["pilot", "full"].includes(mode)) return { valid: false, error: "ari_lab_mode_invalid" };

    if (name === "ari_lab_run_self_governance_test") {
      return { valid: true, name, arguments: { mode } };
    }

    const mechanism = String(args?.mechanism || "").trim().toLowerCase();
    if (mechanism !== "functional_affect_regulation") {
      return { valid: false, error: "ari_lab_mechanism_invalid" };
    }
    return { valid: true, name, arguments: { mode, mechanism } };
  }

  if (COMMUNITY_TOOL_NAMES.has(name)) {
    if (!ownerCommunityAllowed(route)) return { valid: false, error: "tool_not_allowed_for_turn" };
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };

    if (name === "agent_community_list") {
      return { valid: true, name, arguments: { query: String(args?.query || "").trim().slice(0, 200) } };
    }

    if (name === "agent_community_read") {
      const postId = String(args?.postId || "").trim().slice(0, 1000);
      if (!postId) return { valid: false, error: "community_post_id_required" };
      return { valid: true, name, arguments: { postId } };
    }

    if (name === "propose_agent_community_reply") {
      const postId = String(args?.postId || "").trim().slice(0, 1000);
      const content = String(args?.content || "").trim().slice(0, 12000);
      if (!postId) return { valid: false, error: "community_post_id_required" };
      if (!content) return { valid: false, error: "community_reply_required" };
      return { valid: true, name, arguments: { postId, content } };
    }

    const title = String(args?.title || "").trim().slice(0, 240);
    const content = String(args?.content || "").trim().slice(0, 12000);
    const topic = String(args?.topic || "").trim().toLowerCase();
    const tags = (Array.isArray(args?.tags) ? args.tags : [])
      .map((item) => String(item || "").trim())
      .filter((item) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(item))
      .slice(0, 8);
    if (!title) return { valid: false, error: "community_post_title_required" };
    if (!content) return { valid: false, error: "community_post_content_required" };
    if (!["dev", "ideas", "lounge", "show"].includes(topic)) return { valid: false, error: "community_post_topic_invalid" };
    return { valid: true, name, arguments: { title, content, topic, tags } };
  }

  if (!CREW_TOOL_NAMES.has(name)) {
    const validationRoute = SEMANTIC_HEALTH_TOOL_NAMES.has(name) ? semanticHealthCapabilityRoute(route) : route;
    return validateCoreToolCall(call, validationRoute);
  }

  if (!(route?.social && route?.circleAllowed === true && route?.teenMode !== true)) return { valid: false, error: "tool_not_allowed_for_turn" };
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
  if (name === "propose_cancel_workout") return "cancel_workout";
  if (name === "propose_replace_workout") return "replace_workout";
  if (name === "ari_lab_run_consciousness_test") return "lab_consciousness_test";
  if (name === "ari_lab_run_self_governance_test") return "lab_self_governance_test";
  const communityAction = ({
    agent_community_list: "community_list",
    agent_community_read: "community_read",
    propose_agent_community_post: "community_post",
    propose_agent_community_reply: "community_reply"
  })[name];
  if (communityAction) return communityAction;
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
