// ARI vNext — model-first orchestration through OpenAI Responses API.

import { ARI_PERSONA } from "./persona.js";
import { coachingStateToInstruction, deriveCoachingState } from "./coaching-state.js";
import { communicationProfileToInstruction, resolveCommunicationProfile } from "./communication-profile.js";
import { buildRelevantContext, contextToText, routeContext } from "./context-router.js";
import { evaluateExperimentSnapshot } from "./experiment-ledger.js";
import { FITNESS_INTELLIGENCE, shouldUseFitnessIntelligence } from "./fitness-intelligence.js";
import { deriveLongitudinalState, longitudinalStateToInstruction } from "./longitudinal-state.js";
import { deriveMetacognition, metacognitionToInstruction } from "./metacognition.js";
import { resolveModelPolicy } from "./model-policy.js";
import { applyOutcomeLearning } from "./outcome-learning.js";
import { classifySafety, safetyToInstruction } from "./safety-policy.js";
import { deriveScientificIntelligence, scientificIntelligenceToInstruction } from "./scientific-intelligence.js";
import { createPendingAction, resolvePendingActionIntent } from "./pending-action.js";
import { deriveSelfModel, selfModelToInstruction } from "./self-model.js";
import { getAriTools, toolToApplicationAction, validateToolCall } from "./tools.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";

export async function runAriVNext(turn = {}) {
  const route = routeContext(turn);
  const safety = classifySafety(turn, route);
  const communication = resolveCommunicationProfile(turn?.preferences);
  const selfModel = deriveSelfModel({ turn, route, safety });
  const modelPolicy = resolveModelPolicy({ ...route, health: route.health || safety.highStakes });
  const relevantContext = buildRelevantContext(turn, route);
  const coachingState = deriveCoachingState({ turn, route, context: relevantContext });
  const longitudinalState = deriveLongitudinalState({ route, context: relevantContext });
  const metacognition = deriveMetacognition({
    route,
    context: relevantContext,
    safety,
    coachingState,
    longitudinalState
  });
  const rawScientificIntelligence = deriveScientificIntelligence({
    turn,
    route,
    context: relevantContext,
    coachingState,
    longitudinalState,
    metacognition
  });
  const scientificIntelligence = applyOutcomeLearning(
    rawScientificIntelligence,
    relevantContext?.relevantMemory || "",
    relevantContext?.experimentLedger || null
  );
  const experimentReviewState = deriveExperimentReviewState({
    experimentLedger: relevantContext?.experimentLedger,
    longitudinalState,
    coachingState
  });
  const temporalContext = deriveTemporalContext(turn);
  const pendingIntent = resolvePendingActionIntent(turn);

  if (pendingIntent.type === "confirm") {
    return {
      success: true,
      ready: true,
      reply: "",
      route,
      safety,
      selfModel,
      metacognition,
      scientificIntelligence,
      experimentReviewState,
      temporalContext,
      modelPolicy,
      coachingState,
      longitudinalState,
      pendingAction: pendingIntent.pendingAction,
      action: {
        type: "execute_pending_action",
        applicationAction: pendingIntent.pendingAction?.name || "none",
        pendingActionId: pendingIntent.pendingAction?.id || null,
        arguments: pendingIntent.pendingAction?.arguments || {}
      },
      source: "ari_vnext_pending_confirmation"
    };
  }

  if (pendingIntent.type === "cancel") {
    return {
      success: true,
      ready: true,
      reply: "Okay — I won't make that change.",
      route,
      safety,
      selfModel,
      metacognition,
      scientificIntelligence,
      experimentReviewState,
      temporalContext,
      modelPolicy,
      coachingState,
      longitudinalState,
      pendingAction: null,
      action: { type: "cancel_pending_action", pendingActionId: pendingIntent.pendingAction?.id || null },
      source: "ari_vnext_pending_cancel"
    };
  }

  const tools = getAriTools(route);
  // Freshness-sensitive questions must not depend on the base model's training
  // cutoff. Live search is on by default for this narrow route and can only be
  // disabled explicitly through the environment flag.
  if (route.currentInfo && process.env.ARI_VNEXT_WEB_SEARCH_ENABLED !== "false") {
    tools.push({ type: "web_search" });
  }

  const instructions = buildInstructions({
    route,
    communication,
    safety,
    selfModel,
    metacognition,
    scientificIntelligence,
    experimentReviewState,
    temporalContext,
    relevantContext,
    coachingState,
    longitudinalState
  });
  const input = buildInput(turn);

  const first = await callResponses({
    turn,
    policy: modelPolicy,
    instructions,
    input,
    tools
  });

  const functionCall = findFunctionCall(first?.output);
  if (!functionCall) {
    return {
      success: true,
      ready: true,
      reply: extractOutputText(first),
      route,
      safety,
      selfModel,
      metacognition,
      scientificIntelligence,
      experimentReviewState,
      temporalContext,
      modelPolicy,
      coachingState,
      longitudinalState,
      pendingAction: null,
      action: null,
      provider: providerSummary(first),
      source: "ari_vnext"
    };
  }

  const validation = validateToolCall(functionCall, route);
  if (!validation.valid) {
    throw new Error(validation.error || "Ari selected an invalid application capability.");
  }

  const applicationAction = toolToApplicationAction(validation.name);
  const canonical = canonicalizeApplicationArguments({
    applicationAction,
    arguments: validation.arguments,
    route,
    scientificIntelligence,
    relevantContext
  });
  if (!canonical.valid) {
    throw new Error(canonical.error || "Ari selected an application action that does not match the current verified state.");
  }

  const pendingAction = createPendingAction({
    turn,
    name: applicationAction,
    args: canonical.arguments,
    confirmationRequired: true
  });

  const toolResult = {
    status: "confirmation_required",
    pendingActionId: pendingAction.id,
    applicationAction,
    arguments: pendingAction.arguments,
    instruction: "Explain naturally what Ari is ready to change and ask for confirmation. Do not claim the action already happened."
  };

  const continuationInput = [
    ...input,
    ...(Array.isArray(first?.output) ? first.output : []),
    {
      type: "function_call_output",
      call_id: functionCall.call_id,
      output: JSON.stringify(toolResult)
    }
  ];

  const second = await callResponses({
    turn,
    policy: modelPolicy,
    instructions,
    input: continuationInput,
    tools
  });

  return {
    success: true,
    ready: true,
    reply: extractOutputText(second) || "I can make that change. Confirm and I'll apply it.",
    route,
    safety,
    selfModel,
    metacognition,
    scientificIntelligence,
    experimentReviewState,
    temporalContext,
    modelPolicy,
    coachingState,
    longitudinalState,
    pendingAction,
    action: {
      type: "proposed_action",
      applicationAction,
      pendingActionId: pendingAction.id,
      arguments: pendingAction.arguments
    },
    provider: providerSummary(second),
    source: "ari_vnext_action_proposal"
  };
}

function buildInstructions({
  route,
  communication,
  safety,
  selfModel,
  metacognition,
  scientificIntelligence,
  experimentReviewState,
  temporalContext,
  relevantContext,
  coachingState,
  longitudinalState
} = {}) {
  const sections = [
    ARI_PERSONA,
    "\nTEMPORAL GROUNDING\n" + temporalContextToInstruction(temporalContext, route),
    "\nSELF MODEL\n" + selfModelToInstruction(selfModel),
    "\nMETACOGNITION\n" + metacognitionToInstruction(metacognition),
    "\nCOMMUNICATION PROFILE\n" + communicationProfileToInstruction(communication),
    "\nSAFETY CONTEXT\n" + safetyToInstruction(safety)
  ];

  if (shouldUseFitnessIntelligence(route)) {
    sections.push("\nFITNESS INTELLIGENCE\n" + FITNESS_INTELLIGENCE);
  }

  if (coachingState) sections.push("\n" + coachingStateToInstruction(coachingState));
  if (longitudinalState) sections.push("\n" + longitudinalStateToInstruction(longitudinalState));
  if (scientificIntelligence) sections.push("\n" + scientificIntelligenceToInstruction(scientificIntelligence));
  if (experimentReviewState) sections.push("\n" + experimentReviewToInstruction(experimentReviewState));

  sections.push(
    "\nRELEVANT ARI XP CONTEXT\nUse only what is relevant to the current question. Treat missing fields as unknown.\n" + contextToText(relevantContext),
    "\nACTION RULE\nOnly call an application function when the CURRENT user message explicitly requests that mutation. Never infer a write from an old turn. A statement like 'I ate eggs' is not permission to log food. Never start, finish, or cancel an experiment without an explicit current-turn request and confirmation."
  );

  return sections.join("\n");
}

function canonicalizeApplicationArguments({ applicationAction, arguments: args = {}, route = {}, scientificIntelligence = null, relevantContext = {} } = {}) {
  if (applicationAction === "track_experiment") {
    const experiment = scientificIntelligence?.experiment;
    const requestedId = String(args?.hypothesisId || "").trim();
    if (!experiment || experiment.readiness !== "ready") return { valid: false, error: "experiment_not_ready" };
    if (!requestedId || requestedId !== String(experiment.hypothesisId || "")) return { valid: false, error: "experiment_hypothesis_mismatch" };
    const active = Array.isArray(relevantContext?.experimentLedger?.active) ? relevantContext.experimentLedger.active : [];
    if (active.some((item) => item?.hypothesisId === requestedId)) return { valid: false, error: "experiment_already_active" };
    return {
      valid: true,
      arguments: {
        route: { training: Boolean(route.training), nutrition: Boolean(route.nutrition), goals: Boolean(route.goals) },
        scientificIntelligence: {
          experiment,
          hypotheses: (scientificIntelligence?.hypotheses || []).slice(0, 5).map((item) => ({
            id: item.id,
            label: item.label,
            score: item.score,
            status: item.status
          }))
        }
      }
    };
  }

  if (applicationAction === "complete_experiment" || applicationAction === "cancel_experiment") {
    const active = Array.isArray(relevantContext?.experimentLedger?.active) ? relevantContext.experimentLedger.active : [];
    const experimentId = String(args?.experimentId || "").trim();
    if (!experimentId || !active.some((item) => String(item?.id || "") === experimentId)) {
      return { valid: false, error: "active_experiment_not_found" };
    }
    return { valid: true, arguments: { ...args, experimentId } };
  }

  return { valid: true, arguments: args };
}

function deriveExperimentReviewState({ experimentLedger = null, longitudinalState = null, coachingState = null } = {}) {
  const active = Array.isArray(experimentLedger?.active) ? experimentLedger.active : [];
  if (!active.length) return null;

  const evaluations = active
    .map((experiment) => evaluateExperimentSnapshot(experiment, longitudinalState, coachingState))
    .filter(Boolean);

  return {
    version: "1.0.0",
    activeCount: active.length,
    dueCount: Number(experimentLedger?.dueCount || 0),
    evaluations: evaluations.slice(0, 4)
  };
}

function experimentReviewToInstruction(state = null) {
  if (!state) return "";
  return [
    "PERSISTENT EXPERIMENT LEDGER",
    "An active experiment is a real user-approved observation window. Do not casually change its controlled variables or start a conflicting experiment.",
    "If a review is not due, use new data as observations but avoid prematurely declaring the hypothesis proven or disproven.",
    "If a review is due, compare baseline with the current snapshot. The deterministic suggested outcome is evidence, not authority; confounders and incomplete logs can still make the result inconclusive.",
    "Never mark an experiment completed automatically. If the user wants to record the result, use the experiment completion tool and require confirmation.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 6500);
}

function buildInput(turn = {}) {
  const input = [];
  for (const item of turn?.history || []) input.push({ role: item.role, content: item.content });
  input.push({ role: "user", content: turn?.message || "" });
  return input;
}

async function callResponses({ turn, policy, instructions, input, tools = [] } = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), policy?.timeoutMs || 25000);

  const body = {
    model: policy?.model,
    instructions,
    input,
    tools,
    tool_choice: "auto",
    parallel_tool_calls: false,
    max_output_tokens: policy?.maxOutputTokens || 1200,
    store: false
  };

  if (policy?.supportsReasoning && policy?.reasoningEffort) {
    body.reasoning = { effort: policy.reasoningEffort };
  }

  if (turn?.userId) {
    body.safety_identifier = String(turn.userId).slice(0, 200);
    body.prompt_cache_key = `ari-vnext:${String(turn.userId).slice(0, 120)}`;
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
    if (!response.ok) {
      const error = new Error(data?.error?.message || "OpenAI Responses request failed.");
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Ari vNext model request timed out.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function deriveTemporalContext(turn = {}) {
  const createdAt = String(turn?.createdAt || "").trim();
  const parsed = Date.parse(createdAt);
  const now = Number.isFinite(parsed) ? new Date(parsed) : new Date();
  return {
    isoUtc: now.toISOString(),
    utcDate: now.toISOString().slice(0, 10),
    year: now.getUTCFullYear(),
    source: "server_request_time"
  };
}

function temporalContextToInstruction(temporal = {}, route = {}) {
  const lines = [
    `Current server date/time: ${temporal?.isoUtc || new Date().toISOString()}.`,
    `Current year: ${temporal?.year || new Date().getUTCFullYear()}.`,
    "Treat dates before the current date as past and dates after it as future. Never infer the present year from the model's training cutoff."
  ];

  if (route?.currentInfo) {
    lines.push(
      "This request is freshness-sensitive. Use the available web search tool before answering facts that can change over time.",
      "For current officeholders, presidents, elections, company leaders, prices, schedules, scores, news, availability, or similar changing facts, do not answer from model memory alone.",
      "Prefer authoritative/primary sources when available and make clear when current information could not be verified."
    );
  }

  return lines.join("\n");
}

function findFunctionCall(output = []) {
  if (!Array.isArray(output)) return null;
  return output.find((item) => item?.type === "function_call" && item?.name && item?.call_id) || null;
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";

  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

function providerSummary(data = {}) {
  return {
    id: data?.id || null,
    model: data?.model || null,
    usage: data?.usage || null
  };
}
