// ARI vNext — deterministic confirmation continuation.
//
// Once a real pending action already exists, asking another model to paraphrase
// "review and confirm" adds cost and latency but no useful reasoning. This module
// synthesizes that presentation response deterministically. It never authorizes,
// canonicalizes, confirms, or executes a mutation.

export const MODEL_CALL_OPTIMIZER_VERSION = "2.0.0";

export function maybeOptimizeModelCall({ stage = "", body = {}, trace = null } = {}) {
  if (stage !== "confirmation_continuation") return null;
  if (String(process.env.ARI_PHASE10_DETERMINISTIC_CONFIRMATION_ENABLED || "true").toLowerCase() === "false") return null;

  const calls = Array.isArray(trace?.calls) ? trace.calls : [];
  if (calls.some((call) => call?.status && call.status !== "completed")) return null;

  const toolResult = extractConfirmationToolResult(body?.input);
  if (!toolResult) return null;

  const realProvider = summarizePriorProvider(calls, body?.model);
  const reply = confirmationReply(toolResult.applicationAction);
  return {
    optimized: true,
    version: MODEL_CALL_OPTIMIZER_VERSION,
    reason: "deterministic_confirmation_presentation",
    applicationAction: toolResult.applicationAction,
    response: syntheticResponse({ body, reply, realProvider })
  };
}

export function extractConfirmationToolResult(input = []) {
  if (!Array.isArray(input)) return null;
  const item = [...input].reverse().find((candidate) => candidate?.type === "function_call_output");
  if (!item || typeof item?.output !== "string") return null;

  let parsed = null;
  try { parsed = JSON.parse(item.output); } catch { return null; }
  if (!parsed || parsed?.status !== "confirmation_required") return null;

  const pendingActionId = clean(parsed?.pendingActionId, 220);
  const applicationAction = clean(parsed?.applicationAction, 120);
  if (!pendingActionId || !applicationAction) return null;

  return { pendingActionId, applicationAction };
}

export function confirmationReply(applicationAction = "") {
  const action = clean(applicationAction, 120);
  const map = {
    update_goal: "I’ve got that goal change ready. Review the details below and confirm.",
    plan_workout: "I’ve got that workout ready to add. Review the details below and confirm.",
    edit_workout: "I’ve got those workout changes ready. Review the details below and confirm.",
    edit_referenced_workout: "I’ve got that workout change ready. Review the details below and confirm.",
    delete_workout: "I’ve got that workout removal ready. Review the details below and confirm.",
    update_nutrition_meal: "I’ve got that meal correction ready. Review the details below and confirm.",
    undo_nutrition_mutation: "I’ve got that nutrition undo ready. Review the details below and confirm.",
    update_activity_log: "I’ve got that activity correction ready. Review the details below and confirm.",
    delete_activity_log: "I’ve got that activity removal ready. Review the details below and confirm.",
    update_weight_log: "I’ve got that weigh-in correction ready. Review the details below and confirm.",
    delete_weight_log: "I’ve got that weigh-in removal ready. Review the details below and confirm.",
    create_circle_meetup: "I’ve got that Meetup ready to create. Review the details below and confirm.",
    create_circle_mission: "I’ve got that Mission ready to create. Review the details below and confirm.",
    create_circle_crew: "I’ve got that Crew ready to create. Review the details below and confirm.",
    log_referenced_planned_meal: "I’ve got that planned meal ready to log. Review the details below and confirm.",
    log_referenced_plan_components: "I’ve got those planned items ready to log. Review the details below and confirm.",
    discard_referenced_meal_plan: "I’ve got that planned meal removal ready. Review the details below and confirm.",
    replace_referenced_meal_plan: "I’ve got that planned meal replacement ready. Review the details below and confirm."
  };
  return map[action] || "I’ve got that change ready. Review the details below and confirm.";
}

function summarizePriorProvider(calls = [], fallbackModel = "") {
  const completed = calls.filter((call) => call?.status === "completed");
  const usage = {};
  const models = [];
  const ids = [];

  for (const call of completed) {
    const model = clean(call?.model, 120);
    if (model) models.push(model);
    const id = clean(call?.providerRequestId, 180);
    if (id) ids.push(id);
    mergeNumbers(usage, call?.usage);
  }

  return {
    id: ids.length === 1 ? ids[0] : ids.length ? `trace:${ids.join("+").slice(0, 170)}` : null,
    model: models[0] || clean(fallbackModel, 120) || "deterministic_confirmation",
    usage
  };
}

function syntheticResponse({ body = {}, reply = "", realProvider = {} } = {}) {
  const payload = {
    id: realProvider?.id || `ari_confirmation_${Date.now().toString(36)}`,
    object: "response",
    model: clean(realProvider?.model || body?.model, 120) || "deterministic_confirmation",
    output_text: reply,
    output: [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: reply }]
      }
    ],
    usage: realProvider?.usage && typeof realProvider.usage === "object"
      ? realProvider.usage
      : { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function mergeNumbers(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      target[key] = Number(target[key] || 0) + value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = target[key] && typeof target[key] === "object" && !Array.isArray(target[key]) ? target[key] : {};
      mergeNumbers(target[key], value);
    }
  }
  return target;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
