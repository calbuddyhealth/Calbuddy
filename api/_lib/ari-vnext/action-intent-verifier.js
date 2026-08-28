// ARI vNext — semantic verification for explicit app mutations.
// Clear routine logging and bounded reference mutations are authorized
// deterministically; ambiguous writes still use the bounded GPT-4o-mini
// verifier. Neither path executes data.

import { resolveReferenceTarget } from "./reference-context.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
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
const SINGLE_REFERENCE_MUTATION_TOOLS = new Set([
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
    if (!isDirectReferenceMutationCommand(turn?.message, decision)) return null;
    return {
      version: "1.10.0",
      decision,
      confidence: 1,
      reason: "Explicit current-turn reference-bound mutation verified deterministically.",
      dailyGoalKnown: resolveDailyGoalKnown(turn),
      model: null,
      providerRequestId: null,
      usage: null,
      source: referenceIntentSource(decision)
    };
  }

  if (!ROUTINE_LOG_TOOLS.has(decision)) return null;
  if (!availableTools.includes(decision)) return null;
  if (!routineRouteSupports(decision, route)) return null;
  if (!isDirectRoutineLogCommand(turn?.message, decision)) return null;

  return {
    version: "1.10.0",
    decision,
    confidence: 1,
    reason: "Explicit current-turn routine logging command verified deterministically.",
    dailyGoalKnown: resolveDailyGoalKnown(turn),
    model: null,
    providerRequestId: null,
    usage: null,
    source: "deterministic_routine_log"
  };
}

export async function reviewExplicitApplicationIntent({
  turn = {},
  route = {},
  tools = [],
  functionCall = null
} = {}) {
  attachReferenceResolution({ turn, route });

  const availableTools = (Array.isArray(tools) ? tools : [])
    .filter((tool) => tool?.type === "function" && typeof tool?.name === "string")
    .map((tool) => String(tool.name).trim())
    .filter(Boolean);

  if (!availableTools.length) return null;

  const deterministic = reviewDeterministicRoutineLogIntent({
    turn,
    route,
    functionCall,
    availableTools
  });
  if (deterministic) return enforceReferenceResolutionOnReview(deterministic, { turn, route });

  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  const dailyGoalKnown = resolveDailyGoalKnown(turn);
  const decisions = [
    "none",
    "blocked_future_meal_plan",
    "blocked_missing_daily_goal",
    ...availableTools
  ];

  const verifierTool = {
    type: "function",
    name: "verify_action_intent",
    description: "Classify whether the CURRENT user message explicitly requests one available ARI XP app mutation.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        decision: { type: "string", enum: decisions },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason: { type: "string" }
      },
      required: ["decision", "confidence", "reason"]
    }
  };

  const instructions = [
    "You are Ari vNext's semantic action verifier.",
    "Ari's primary reasoning pass has already run. Independently verify whether the CURRENT user message explicitly authorizes an ARI XP mutation.",
    "Do not infer permission to mutate from conversation history, app state, or a statement of fact.",
    "A statement such as 'I ate eggs' is NOT permission to log food. 'I ate the breakfast you planned for me' is also NOT permission to log the planned meal. A question such as 'is chicken healthy?' is NOT a mutation request.",
    "If the user explicitly asks Ari to log, save, record, create, build, plan, edit, change, replace, remove, delete, discard, undo, update, correct, fix, start, complete, cancel, host, publish, join, RSVP, request a spot, leave, withdraw, back out, submit, add progress, contribute progress, accept, decline, archive, close, or end something and a matching tool is available, select that tool.",
    "Reference rule: the CURRENT message supplies write permission. A trusted Reference Packet may identify what 'it', 'that', 'them', 'the second one', 'the second item', or similar language refers to, but history and references never grant permission by themselves.",
    "A current trusted-context app_reference can identify a Meal Plan item/component or Circle object just like a persisted executor reference. It still never authorizes a write. Use an explicit ordinal only within the candidate collection that carries that ordinal. If the target remains ambiguous, do not guess.",
    "For reference-bound Nutrition, 'undo/delete/remove that meal' can select propose_undo_nutrition_mutation. 'Change that meal to 450 calories', 'make that 40g protein', or 'rename it chicken bowl' can select propose_update_nutrition_meal. Never accept or invent a meal database ID from conversation text.",
    "For TODAY'S referenced Meal Plan: 'log that breakfast' can select propose_log_referenced_planned_meal; 'log the second item' or 'log those two items' can select propose_log_referenced_plan_components using only component referenceIds; 'remove/discard that snack' can select propose_discard_referenced_meal_plan; 'replace/swap that lunch with X' can select propose_replace_referenced_meal_plan. 'I ate that breakfast' or 'I ate the second item' remains a fact and is NOT permission to log it.",
    "A Meal Plan reference action never receives a raw plan database ID from the model. The trusted browser layer re-reads today's canonical plan at confirmation time, and selected components must still resolve to the same active plan.",
    "For reference-bound Training activity changes, 'change that run to 45 minutes', 'update that to 400 calories', 'correct the duration on that activity', or 'make that 45 minutes' can select propose_update_activity_log. 'Delete that run', 'remove that activity', or 'undo that activity log' can select propose_delete_activity_log.",
    "For a referenced planned workout, use propose_edit_referenced_workout for explicit changes such as 'make that workout 45 minutes', 'add lateral raises to it', or 'remove bench from that'. Use propose_delete_workout only for an explicit request to delete/remove/clear/cancel the planned workout. Do not infer a date; the trusted reference supplies it.",
    "For a referenced weigh-in, use propose_update_weight_log for an explicit correction such as 'actually make that 185.8' or 'change that weight to 84 kg'. Use propose_delete_weight_log only for an explicit delete/remove/undo request.",
    "A bare fact such as 'I ran 45 minutes', 'I weigh 185', or 'that meal was 450 calories' is not permission to modify saved state unless it is clearly framed as a correction/change to the saved object.",
    "For ARI Circle Meetups, distinguish cancelling the user's OWN participation from cancelling an entire HOSTED meetup. 'I can't make it, take me out' means leave/withdraw. 'Cancel the meetup I'm hosting' means cancel the hosted meetup. Never escalate one into the other.",
    "For ARI Circle reference follow-ups such as 'join the second one', use only the exact canonical Meetup/Mission/Crew identity attached to the matching trusted app_reference or Action Network object. An ordinal is meaningful only inside the same ordered collection. If multiple collections conflict, ask for clarification rather than guessing.",
    "For ARI Circle Missions, distinguish read-only discovery from a write. 'What Missions are active?', 'show me Missions at Mission Bay', or 'how close are we?' are read-only and must use decision=none. 'Create a 100-mile community Mission', 'join that Mission', and 'add my 3 miles to that Mission' are explicit writes when the matching tool is available.",
    "Never treat a request to review, approve, verify, reject, or judge ANOTHER person's Mission contribution as permission for create/join/progress tools. No Mission-review mutation tool is available in this phase.",
    "For ARI Circle Crews, discovery or explanation is read-only. 'Why is this a Crew candidate?', 'who have I trained with?', or 'show my Crews' must use decision=none. 'Make this group a Crew' can select propose_create_circle_crew only when that tool is available; the trusted server must resolve the opaque evidence-backed candidate. Never infer or invent founding members.",
    "For Crew invitations, 'accept that Crew invite' maps only to the accept-invite tool and 'decline/pass on that Crew invite' maps only to the decline-invite tool. Do not treat accepting a Crew invite as permission to add other people.",
    "For Crew departures, distinguish leaving the user's OWN membership from archiving an entire OWNED Crew. 'I want out of this Crew' means leave. 'Archive/close/end the Crew I own' means archive. Never escalate a leave request into archive.",
    "No Crew tool may add arbitrary members, choose a replacement member, make a Crew public, award XP, or alter another member's invitation response.",
    "For ARI Circle, a discovery question such as 'anything going on tonight?' or 'what should I do?' is read-only and must use decision=none. Only choose a Circle mutation tool when the current message explicitly asks to change Circle state.",
    "Interpret natural language semantically. The user does not need to use the exact tool or feature name. For example, 'figure out what I should eat for the rest of today using my calories left and set it up for me' can be a request to create today's Meal Plan.",
    "ARI XP Meal Plan is strictly TODAY ONLY. If the user asks Ari to create or schedule a Meal Plan for tomorrow or another future day, select blocked_future_meal_plan instead of any tool.",
    "If the user asks Ari to create today's Meal Plan based on their saved Daily Calorie Goal or remaining calorie budget, but that saved goal is unknown and the user did not provide an explicit numeric calorie target in the CURRENT message, select blocked_missing_daily_goal.",
    "Do not select blocked_missing_daily_goal for a general meal idea that is not budget-based, or when the user gives a clear explicit calorie target such as 500 calories.",
    "Do not select blocked_future_meal_plan for a general future nutrition question that is not asking to create/schedule the ARI XP Meal Plan.",
    `Saved Daily Calorie Goal known: ${dailyGoalKnown ? "true" : "false"}.`,
    `Available app tools: ${availableTools.join(", ")}.`,
    `Current route: ${JSON.stringify({ nutrition: Boolean(route?.nutrition), training: Boolean(route?.training), goals: Boolean(route?.goals), social: Boolean(route?.social), circleAllowed: Boolean(route?.circleAllowed), teenMode: Boolean(route?.teenMode) })}.`,
    "Use decision=none when the message is advice, explanation, casual conversation, a factual statement, a discovery/read request, or otherwise does not explicitly authorize a write."
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const body = {
    model: process.env.ARI_VNEXT_FAST_MODEL || "gpt-4o-mini",
    instructions,
    input: [{ role: "user", content: String(turn?.message || "").trim() }],
    tools: [verifierTool],
    tool_choice: { type: "function", name: "verify_action_intent" },
    parallel_tool_calls: false,
    max_output_tokens: 180,
    store: false
  };

  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-action:${userId.slice(0, 53)}`.slice(0, 64);
  }

  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;

    const call = Array.isArray(data?.output)
      ? data.output.find((item) => item?.type === "function_call" && item?.name === "verify_action_intent")
      : null;
    if (!call) return null;

    let args = {};
    try {
      args = JSON.parse(String(call?.arguments || "{}"));
    } catch {
      return null;
    }

    let decision = String(args?.decision || "none").trim();
    const confidence = Number.isFinite(Number(args?.confidence))
      ? Math.max(0, Math.min(1, Number(args.confidence)))
      : 0;

    if (!decisions.includes(decision)) return null;

    if (
      decision === "blocked_missing_daily_goal" &&
      dailyGoalKnown &&
      availableTools.includes("propose_today_meal_plan")
    ) {
      decision = "propose_today_meal_plan";
    }

    return enforceReferenceResolutionOnReview({
      version: "1.10.0",
      decision,
      confidence,
      reason: String(args?.reason || "").trim().slice(0, 500),
      dailyGoalKnown,
      model: data?.model || body.model,
      providerRequestId: data?.id || null,
      usage: data?.usage || null,
      source: "model_verifier"
    }, { turn, route });
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function attachReferenceResolution({ turn = {}, route = {} } = {}) {
  if (!route || typeof route !== "object") return null;
  const resolution = resolveReferenceTarget({
    message: turn?.message || "",
    referenceState: turn?.context?.referenceState || {},
    route
  });
  route.referenceResolution = resolution;
  return resolution;
}

function enforceReferenceResolutionOnReview(review = {}, { turn = {}, route = {} } = {}) {
  const decision = String(review?.decision || "").trim();
  if (!SINGLE_REFERENCE_MUTATION_TOOLS.has(decision)) return review;

  const resolution = route?.referenceResolution || attachReferenceResolution({ turn, route });
  if (resolution?.status === "resolved" && resolution?.selectedReferenceId) return review;

  const ambiguous = resolution?.status === "ambiguous";
  return {
    ...review,
    decision: "none",
    confidence: 1,
    reason: ambiguous
      ? "The current reference matches multiple authoritative app targets, so Ari must clarify instead of guessing."
      : "The current reference does not resolve to exactly one authoritative app target, so Ari must clarify instead of guessing.",
    source: "deterministic_reference_resolution_block",
    referenceResolution: resolution || null
  };
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
  if (["propose_update_activity_log", "propose_delete_activity_log", "propose_edit_referenced_workout", "propose_delete_workout"].includes(decision)) return route?.training === true;
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
