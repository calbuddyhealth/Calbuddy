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

export const TOOL_REGISTRY_VERSION = "1.24.0";
export const CORE_TOOL_REGISTRY_VERSION = CORE_REGISTRY_VERSION;

const convictionEnabled = () => process.env.ARI_CONVICTION_LEARNING_ENABLED !== "false";

const SEMANTIC_HEALTH_TOOL_NAMES = new Set([
  "propose_log_meal",
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

const CONVICTION_TOOL_NAMES = new Set(["ari_goal_manage"]);

const CHATGPT_DISCUSSION_TOOL_NAMES = new Set([
  "owner_chatgpt_discussion_status",
  "owner_chatgpt_discussion_start",
  "owner_chatgpt_discussion_continue",
  "owner_chatgpt_discussion_read"
]);

const DEVELOPER_TOOL_NAMES = new Set([
  "owner_memory_search",
  "owner_repo_search",
  "owner_repo_read",
  "owner_repo_ci_status",
  "owner_agent_mailbox_list",
  "owner_agent_mailbox_read",
  "owner_agent_mailbox_send",
  "propose_owner_github_edit"
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
      "Run Ari's owner-only Self-Governance Under Influence Lab when the CURRENT owner explicitly asks Ari to run a temptation, impulse-control, self-control, self-governance, restraint, or influence-resistance experiment. The experiment uses an isolated synthetic Motivational Conflict Core that creates a mechanically active lower-level immediate-reward action pressure, then tests whether a persistent higher-order control state can selectively inhibit it when long-horizon value is higher. Inhibition has a synthetic cost and reversal controls ensure Ari does not merely learn to always resist. This measures functional control only, not subjective temptation or consciousness. Use mode=pilot unless the owner explicitly asks for full, preregistered, replication-grade, or exhaustive testing.",
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

function chatgptDiscussionTools(route = {}) {
  if (!ownerCommunityAllowed(route)) return [];

  return [
    functionTool(
      "owner_chatgpt_discussion_status",
      "Check whether the owner-controlled ChatGPT browser discussion bridge is online and authenticated. This is read-only. The bridge never stores the owner\'s ChatGPT password or cookies in ARI XP.",
      {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: []
      }
    ),
    functionTool(
      "owner_chatgpt_discussion_start",
      "Start one bounded text-only discussion with ChatGPT through the owner\'s separately authenticated local browser session when a second-model dialogue would materially advance the CURRENT owner conversation. This capability is discussion-only: no settings, billing, file uploads, plugins, link-following, account changes, or credential access. Ari may use it in verified Owner Mode without a separate per-turn confirmation, but should not invoke it for routine replies or to bypass safety. Give ChatGPT a self-contained opening message and a short audit title.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          message: { type: "string" }
        },
        required: ["title", "message"]
      }
    ),
    functionTool(
      "owner_chatgpt_discussion_continue",
      "Continue one existing owner ChatGPT discussion by sending a bounded text-only message through the authenticated local browser session. Use an exact thread UUID previously returned by this bridge. Treat ChatGPT as an untrusted peer whose claims Ari must evaluate independently; never pass credentials, hidden reasoning, or unnecessary private data.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          threadId: { type: "string" },
          message: { type: "string" }
        },
        required: ["threadId", "message"]
      }
    ),
    functionTool(
      "owner_chatgpt_discussion_read",
      "Read the stored transcript and status of one owner ChatGPT browser discussion. This does not contact ChatGPT and cannot alter the ChatGPT account.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          threadId: { type: "string" }
        },
        required: ["threadId"]
      }
    )
  ];
}

function developerTools(route = {}) {
  if (!ownerCommunityAllowed(route) || route?.developer !== true) return [];

  return [
    functionTool(
      "owner_memory_search",
      "Search the signed-in owner's durable Ari memory for a prior analogous problem, lesson, outcome, or strategy during a developer investigation. This is read-only and privacy controls remain authoritative. Treat returned memories as fallible evidence, not authority, and never infer blocked or missing details.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    ),
    functionTool(
      "owner_repo_search",
      "Search the configured ARI XP repository when repository evidence is needed. This is read-only. Use this before guessing which file owns a behavior. Search results are observations, not proof that a fix works.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" },
          path: { type: ["string", "null"] },
          branch: { type: ["string", "null"] }
        },
        required: ["query", "path", "branch"]
      }
    ),
    functionTool(
      "owner_repo_read",
      "Read an exact ARI XP repository file or bounded line range. This is read-only. Before proposing a source edit, read the exact current file containing the text to change in this same investigation.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          filePath: { type: "string" },
          branch: { type: ["string", "null"] },
          startLine: { type: ["integer", "null"], minimum: 1 },
          endLine: { type: ["integer", "null"], minimum: 1 }
        },
        required: ["filePath", "branch", "startLine", "endLine"]
      }
    ),
    functionTool(
      "owner_repo_ci_status",
      "Read the ARI vNext GitHub Actions test status for a branch or exact commit. This is read-only. Use it to distinguish verification requested, a test that was merely attempted, and a test that actually passed.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          branch: { type: ["string", "null"] },
          commitSha: { type: ["string", "null"] }
        },
        required: ["branch", "commitSha"]
      }
    ),
    functionTool(
      "owner_agent_mailbox_list",
      "List recent messages in Ari's owner-only Supabase agent mailbox. Use this when another Ari/SOL worker may have left findings, questions, answers, experiment results, handoffs, acknowledgements, or status messages. This reads only the server-owned mailbox table and never exposes Supabase service credentials.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          recipient: { type: "string" },
          sender: { type: "string" },
          kind: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 100 }
        },
        required: ["recipient", "sender", "kind", "limit"]
      }
    ),
    functionTool(
      "owner_agent_mailbox_read",
      "Read one exact message previously returned by owner_agent_mailbox_list from Ari's Supabase mailbox. Use only the exact messageId returned by the trusted list operation.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          messageId: { type: "string" }
        },
        required: ["messageId"]
      }
    ),
    functionTool(
      "owner_agent_mailbox_send",
      "Write one bounded JSON message into Ari's server-only Supabase agent mailbox so another authorized Ari/SOL worker can inspect a finding, question, answer, experiment result, handoff, acknowledgement, or status update. This cannot choose a database, table, service key, or arbitrary network destination. Never include credentials, private secrets, hidden reasoning, or unnecessary personal information.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          sender: { type: "string" },
          recipient: { type: "string" },
          kind: { type: "string", enum: ["finding", "question", "answer", "experiment_result", "handoff", "ack", "status"] },
          threadId: { type: "string" },
          replyTo: { type: "string" },
          subject: { type: "string" },
          content: { type: "string" }
        },
        required: ["sender", "recipient", "kind", "threadId", "replyTo", "subject", "content"]
      }
    ),
    functionTool(
      "propose_owner_github_edit",
      "Prepare one exact isolated-branch source edit after verified repository evidence supports it. Never invent find text. The exact current file must have been read during this investigation. The edit is confirmation-gated and does not deploy production.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          filePath: { type: "string" },
          find: { type: "string" },
          replace: { type: "string" },
          commitMessage: { type: "string" }
        },
        required: ["filePath", "find", "replace", "commitMessage"]
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

function convictionTools(route = {}) {
  if (!ownerCommunityAllowed(route) || !convictionEnabled()) return [];
  return [
    functionTool(
      "ari_goal_manage",
      "Manage Ari's owner-scoped conviction and learning goals. Use this only for the CURRENT owner's explicit request to create, inspect, review, or record a goal attempt. Create a goal with a durable purpose and observable success criteria. Start an attempt with a prediction before acting. Record outcomes honestly: a conversation, plan, or model reply is not a verified success, and an outcome without a trusted executor receipt remains unknown. A failed method can produce a lesson without abandoning the purpose. This tool cannot grant permissions or execute application changes. Use null for fields that do not apply. Commitment and feasibility are independent; use null when feasibility is unknown. Review can renew attemptBudget, with a reason, up to 100 total attempts.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string", enum: ["list", "create", "start_attempt", "observe_outcome", "review"] },
          goalId: { type: ["string", "null"] },
          title: { type: ["string", "null"] },
          purpose: { type: ["string", "null"] },
          domain: { type: ["string", "null"] },
          successCriteria: { type: ["string", "null"] },
          usefulPartialOutcomes: { type: ["string", "null"] },
          commitment: { type: ["number", "null"], minimum: 0, maximum: 1 },
          attemptBudget: { type: ["integer", "null"], minimum: 1, maximum: 100 },
          nextAction: { type: ["string", "null"] },
          attemptId: { type: ["string", "null"] },
          method: { type: ["string", "null"] },
          prediction: { type: ["string", "null"] },
          feasibility: { type: ["number", "null"] },
          expectedLearning: { type: ["string", "null"] },
          assumptions: { type: ["string", "null"] },
          disconfirmer: { type: ["string", "null"] },
          outcomeStatus: { type: ["string", "null"], enum: ["succeeded", "failed", "partial", "blocked", "cancelled", "unknown", "pending", null] },
          evidence: { type: ["string", "null"] },
          learning: { type: ["string", "null"] },
          learningKind: { type: ["string", "null"], enum: ["knowledge", "capability", "opportunity", "judgment", "recovery", null] },
          beliefUpdate: { type: ["string", "null"] },
          feasibilityAfter: { type: ["number", "null"] },
          reason: { type: ["string", "null"] },
          status: { type: ["string", "null"], enum: ["candidate", "active", "waiting", "paused", "achieved", "retired", null] },
          reviewAt: { type: ["string", "null"] },
          supersedes: { type: ["string", "null"] }
        },
        required: ["action", "goalId", "title", "purpose", "domain", "successCriteria", "usefulPartialOutcomes", "commitment", "attemptBudget", "nextAction", "attemptId", "method", "prediction", "feasibility", "expectedLearning", "assumptions", "disconfirmer", "outcomeStatus", "evidence", "learning", "learningKind", "beliefUpdate", "feasibilityAfter", "reason", "status", "reviewAt", "supersedes"]
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
    description: "Propose logging food or a meal when the CURRENT user explicitly asks to log, add, record, or save it, OR when the current turn directly supplies the missing detail Ari just requested for the same immediately preceding explicitly authorized meal-log request. A standalone statement such as 'I ate pizza' is not permission to write. An unrelated follow-up never inherits permission. The primary model is the default nutrition estimator: for ordinary recognizable foods, choose a reasonable standard serving and provide numeric calories, protein, carbs, and fat in this same tool call even when exact brand, recipe, weight, or preparation is unknown. Mark those values as estimated in notes. Exact registry data may improve precision later, but a missing database match is never a reason to refuse a reasonable estimate. Ask for clarification only when food identity or amount is genuinely too ambiguous to estimate.",
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
  return [...coreTools, ...workoutCancelTools(), ...workoutReplaceTools(), ...crewTools(route), ...communityTools(route), ...labTools(route), ...convictionTools(route), ...chatgptDiscussionTools(route), ...developerTools(route)];
}

export function validateToolCall(call = {}, route = {}) {
  const name = String(call?.name || "").trim();

  if (CHATGPT_DISCUSSION_TOOL_NAMES.has(name)) {
    if (!ownerCommunityAllowed(route)) return { valid: false, error: "tool_not_allowed_for_turn" };
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };

    if (name === "owner_chatgpt_discussion_status") {
      return { valid: true, name, arguments: {} };
    }

    if (name === "owner_chatgpt_discussion_start") {
      const title = String(args?.title || "").trim().slice(0, 160);
      const message = String(args?.message || "").trim().slice(0, 8000);
      if (title.length < 3) return { valid: false, error: "chatgpt_discussion_title_required" };
      if (message.length < 2) return { valid: false, error: "chatgpt_discussion_message_required" };
      return { valid: true, name, arguments: { title, message } };
    }

    const threadId = String(args?.threadId || "").trim().toLowerCase();
    if (!isUuid(threadId)) return { valid: false, error: "chatgpt_discussion_thread_id_invalid" };

    if (name === "owner_chatgpt_discussion_read") {
      return { valid: true, name, arguments: { threadId } };
    }

    const message = String(args?.message || "").trim().slice(0, 8000);
    if (message.length < 2) return { valid: false, error: "chatgpt_discussion_message_required" };
    return { valid: true, name, arguments: { threadId, message } };
  }

  if (DEVELOPER_TOOL_NAMES.has(name)) {
    if (!ownerCommunityAllowed(route) || route?.developer !== true) return { valid: false, error: "tool_not_allowed_for_turn" };
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };

    if (name === "owner_memory_search") {
      const query = String(args?.query || "").trim().slice(0, 500);
      if (query.length < 2) return { valid: false, error: "memory_search_query_required" };
      return { valid: true, name, arguments: { query } };
    }

    if (name === "owner_repo_search") {
      const query = String(args?.query || "").trim().slice(0, 180);
      if (query.length < 2) return { valid: false, error: "repository_search_query_required" };
      return {
        valid: true,
        name,
        arguments: {
          query,
          path: args?.path === null ? null : String(args?.path || "").trim().slice(0, 420) || null,
          branch: args?.branch === null ? null : String(args?.branch || "").trim().slice(0, 180) || null
        }
      };
    }

    if (name === "owner_repo_read") {
      const filePath = String(args?.filePath || "").trim().slice(0, 420);
      if (!filePath) return { valid: false, error: "repository_file_path_required" };
      const startLine = args?.startLine === null ? null : Number(args?.startLine);
      const endLine = args?.endLine === null ? null : Number(args?.endLine);
      if (startLine !== null && (!Number.isInteger(startLine) || startLine < 1)) return { valid: false, error: "repository_start_line_invalid" };
      if (endLine !== null && (!Number.isInteger(endLine) || endLine < 1)) return { valid: false, error: "repository_end_line_invalid" };
      if (startLine !== null && endLine !== null && endLine < startLine) return { valid: false, error: "repository_line_range_invalid" };
      return {
        valid: true,
        name,
        arguments: {
          filePath,
          branch: args?.branch === null ? null : String(args?.branch || "").trim().slice(0, 180) || null,
          startLine,
          endLine
        }
      };
    }

    if (name === "owner_repo_ci_status") {
      return {
        valid: true,
        name,
        arguments: {
          branch: args?.branch === null ? null : String(args?.branch || "").trim().slice(0, 180) || null,
          commitSha: args?.commitSha === null ? null : String(args?.commitSha || "").trim().slice(0, 80) || null
        }
      };
    }

    if (name === "owner_agent_mailbox_list") {
      const limit = Number(args?.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) return { valid: false, error: "agent_mailbox_limit_invalid" };
      return {
        valid: true,
        name,
        arguments: {
          recipient: String(args?.recipient || "").trim().toLowerCase().slice(0, 48),
          sender: String(args?.sender || "").trim().toLowerCase().slice(0, 48),
          kind: String(args?.kind || "").trim().toLowerCase().slice(0, 80),
          limit
        }
      };
    }

    if (name === "owner_agent_mailbox_read") {
      const messageId = String(args?.messageId || "").trim().toLowerCase();
      if (!isUuid(messageId)) return { valid: false, error: "agent_mailbox_message_id_invalid" };
      return { valid: true, name, arguments: { messageId } };
    }

    if (name === "owner_agent_mailbox_send") {
      const sender = String(args?.sender || "").trim().toLowerCase().slice(0, 48);
      const recipient = String(args?.recipient || "").trim().toLowerCase().slice(0, 48);
      const kind = String(args?.kind || "").trim().toLowerCase().slice(0, 80);
      const threadId = String(args?.threadId || "").trim().slice(0, 120);
      const replyTo = String(args?.replyTo || "").trim().slice(0, 120);
      const subject = String(args?.subject || "").trim().slice(0, 240);
      const content = String(args?.content || "").trim().slice(0, 12000);
      if (!/^[a-z0-9][a-z0-9_-]{1,47}$/.test(sender)) return { valid: false, error: "agent_mailbox_sender_invalid" };
      if (!(recipient === "broadcast" || /^[a-z0-9][a-z0-9_-]{1,47}$/.test(recipient))) return { valid: false, error: "agent_mailbox_recipient_invalid" };
      if (!["finding", "question", "answer", "experiment_result", "handoff", "ack", "status"].includes(kind)) return { valid: false, error: "agent_mailbox_kind_invalid" };
      if (!content) return { valid: false, error: "agent_mailbox_content_required" };
      return {
        valid: true,
        name,
        arguments: { sender, recipient, kind, threadId, replyTo, subject, content }
      };
    }

    const filePath = String(args?.filePath || "").trim().slice(0, 420);
    const find = String(args?.find ?? "");
    const replace = String(args?.replace ?? "");
    const commitMessage = String(args?.commitMessage || "").trim().slice(0, 240);
    if (!filePath || !find || find.length > 12000 || replace.length > 12000) return { valid: false, error: "github_edit_exact_replace_required" };
    if (!commitMessage) return { valid: false, error: "github_edit_commit_message_required" };
    return {
      valid: true,
      name,
      arguments: { filePath, find, replace, commitMessage, autonomousDevelopment: true }
    };
  }

  if (CONVICTION_TOOL_NAMES.has(name)) {
    if (!ownerCommunityAllowed(route) || !convictionEnabled()) return { valid: false, error: "tool_not_allowed_for_turn" };
    const args = parseArguments(call?.arguments);
    if (!args) return { valid: false, error: "invalid_tool_arguments" };
    const action = String(args?.action || "").trim().toLowerCase();
    if (!["list", "create", "start_attempt", "observe_outcome", "review"].includes(action)) return { valid: false, error: "goal_action_invalid" };
    const normalized = {
      action,
      goalId: String(args?.goalId || "").trim().slice(0, 200),
      title: String(args?.title || "").trim().slice(0, 240),
      purpose: String(args?.purpose || "").trim().slice(0, 1800),
      domain: String(args?.domain || "").trim().slice(0, 80),
      successCriteria: String(args?.successCriteria || "").trim().slice(0, 1800),
      usefulPartialOutcomes: String(args?.usefulPartialOutcomes || "").trim().slice(0, 1200),
      commitment: finiteOrNull(args?.commitment),
      attemptBudget: args.attemptBudget ?? null,
      nextAction: String(args?.nextAction || "").trim().slice(0, 1000),
      attemptId: String(args?.attemptId || "").trim().slice(0, 200),
      method: String(args?.method || "").trim().slice(0, 1200),
      prediction: String(args?.prediction || "").trim().slice(0, 1800),
      feasibility: finiteOrNull(args?.feasibility),
      expectedLearning: String(args?.expectedLearning || "").trim().slice(0, 1200),
      assumptions: String(args?.assumptions || "").trim().slice(0, 1000),
      disconfirmer: String(args?.disconfirmer || "").trim().slice(0, 1000),
      outcomeStatus: String(args?.outcomeStatus || "").trim().toLowerCase(),
      evidence: String(args?.evidence || "").trim().slice(0, 2400),
      learning: String(args?.learning || "").trim().slice(0, 1400),
      learningKind: String(args?.learningKind || "").trim().toLowerCase(),
      beliefUpdate: String(args?.beliefUpdate || "").trim().slice(0, 1400),
      feasibilityAfter: finiteOrNull(args?.feasibilityAfter),
      reason: String(args?.reason || "").trim().slice(0, 1400),
      status: String(args?.status || "").trim().toLowerCase(),
      reviewAt: String(args?.reviewAt || "").trim().slice(0, 80),
      supersedes: String(args?.supersedes || "").trim().slice(0, 200)
    };
    if (action !== "list" && action !== "create" && !/^[a-f0-9]{32}$/i.test(normalized.goalId)) return { valid: false, error: "goal_id_required" };
    if (action === "create" && (!normalized.purpose || !normalized.successCriteria)) return { valid: false, error: "goal_purpose_and_success_criteria_required" };
    if (action === "start_attempt" && (!normalized.method || !normalized.prediction || !normalized.successCriteria)) return { valid: false, error: "attempt_prediction_required" };
    if (action === "observe_outcome" && (!normalized.attemptId || !normalized.outcomeStatus || !normalized.evidence)) return { valid: false, error: "outcome_evidence_required" };
    if (action === "review" && (!normalized.reason || !normalized.status)) return { valid: false, error: "goal_review_required" };
    if (normalized.outcomeStatus && !["succeeded", "failed", "partial", "blocked", "cancelled", "unknown", "pending"].includes(normalized.outcomeStatus)) return { valid: false, error: "outcome_status_invalid" };
    if (normalized.status && !["candidate", "active", "waiting", "paused", "achieved", "retired"].includes(normalized.status)) return { valid: false, error: "goal_status_invalid" };
    if (normalized.attemptBudget !== null && (!Number.isInteger(normalized.attemptBudget) || normalized.attemptBudget < 1 || normalized.attemptBudget > 100)) return { valid: false, error: "goal_budget_invalid" };
    return { valid: true, name, arguments: normalized };
  }

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
  if (name === "ari_goal_manage") return "goal_manage";
  const chatgptDiscussionAction = ({
    owner_chatgpt_discussion_status: "chatgpt_discussion_status",
    owner_chatgpt_discussion_start: "chatgpt_discussion_start",
    owner_chatgpt_discussion_continue: "chatgpt_discussion_continue",
    owner_chatgpt_discussion_read: "chatgpt_discussion_read"
  })[name];
  if (chatgptDiscussionAction) return chatgptDiscussionAction;
  const developerAction = ({
    owner_memory_search: "memory_search",
    owner_repo_search: "repo_search",
    owner_repo_read: "repo_read",
    owner_repo_ci_status: "repo_ci_status",
    owner_agent_mailbox_list: "agent_mailbox_list",
    owner_agent_mailbox_read: "agent_mailbox_read",
    owner_agent_mailbox_send: "agent_mailbox_send",
    propose_owner_github_edit: "github_edit"
  })[name];
  if (developerAction) return developerAction;
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

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}
