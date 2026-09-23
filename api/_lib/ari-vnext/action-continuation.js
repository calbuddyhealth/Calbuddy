// ARI vNext — bounded continuation evidence for incomplete app actions.
//
// This module does NOT choose an action and does NOT execute anything.
// It only recognizes the narrow case where:
// 1) the immediately preceding user turn explicitly authorized a mutation,
// 2) Ari immediately asked for a missing detail needed to prepare it, and
// 3) the current turn supplies a follow-up detail.
//
// The semantic verifier remains responsible for deciding whether the same
// authorized action is actually being completed.

export const ACTION_CONTINUATION_VERSION = "1.0.0";

const MUTATION_CUE =
  /\b(?:log|record|save|add|create|build|make|plan|edit|change|replace|remove|delete|update|cancel|schedule|track|set|start|finish|complete|submit|publish|reply|respond|join|leave|archive)\b/i;

const CLARIFICATION_CUE =
  /\b(?:need|missing|clarif|specif|which|what|when|what day|which day|what date|how many|how much|serving|portion|size|amount|details?|describe|before i can|to prepare|to create|to build|to log|to save|what exactly)\b/i;

const TERMINAL_REPLY =
  /\b(?:saved|logged|recorded|created|updated|deleted|removed|cancelled|canceled|completed successfully|done[.!]?$)\b/i;

const CONFIRM_OR_CANCEL =
  /^(?:yes|yep|yeah|confirm(?:ed| it| that)?|do it|go ahead|save it|log it|add it|make it|update it|no|nope|cancel(?: it| that| this)?|never ?mind|stop)[.!\s]*$/i;

export function deriveAuthorizedActionContinuation(turn = {}) {
  const currentMessage = clean(turn?.message, 1600);
  const history = normalizeHistory(turn?.history).slice(-6);

  if (!currentMessage) return inactive("missing_current_message");
  if (CONFIRM_OR_CANCEL.test(currentMessage)) return inactive("confirmation_or_cancellation");
  if (MUTATION_CUE.test(currentMessage)) return inactive("current_turn_has_own_authorization");
  if (history.length < 2) return inactive("insufficient_history");

  const previousAssistant = history.at(-1);
  const previousUser = history.at(-2);

  if (previousAssistant?.role !== "assistant" || previousUser?.role !== "user") {
    return inactive("history_not_immediate_user_assistant_pair");
  }

  if (!MUTATION_CUE.test(previousUser.content)) {
    return inactive("previous_user_did_not_authorize_mutation");
  }

  if (!CLARIFICATION_CUE.test(previousAssistant.content) || TERMINAL_REPLY.test(previousAssistant.content)) {
    return inactive("previous_assistant_not_requesting_missing_detail");
  }

  return {
    version: ACTION_CONTINUATION_VERSION,
    active: true,
    reason: "immediate_authorized_clarification",
    authorizedUserMessage: clean(previousUser.content, 1200),
    clarificationMessage: clean(previousAssistant.content, 1200),
    currentDetail: currentMessage
  };
}

export function actionContinuationToInstruction(state = null) {
  if (!state?.active) return "";

  return [
    "BOUNDED ACTION CONTINUATION",
    "The immediately preceding user turn explicitly authorized an application mutation, and Ari immediately asked for a missing detail before it could prepare that same mutation.",
    "The current turn may complete ONLY that exact previously authorized action. This is not permission to infer a different write, add extra changes, or revive older requests.",
    "If the current reply does not clearly answer Ari's immediately preceding clarification, treat it as ordinary conversation and do not mutate app state.",
    `Authorized user request: ${state.authorizedUserMessage}`,
    `Ari clarification: ${state.clarificationMessage}`,
    `Current detail: ${state.currentDetail}`
  ].join("\n");
}

function inactive(reason) {
  return {
    version: ACTION_CONTINUATION_VERSION,
    active: false,
    reason,
    authorizedUserMessage: "",
    clarificationMessage: "",
    currentDetail: ""
  };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: clean(item?.content, 1800)
    }))
    .filter((item) => item.content);
}

function clean(value, max = 1200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
