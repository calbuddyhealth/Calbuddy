// ARI vNext — model-first orchestration through OpenAI Responses API.

import { ARI_PERSONA } from "./persona.js";
import { coachingStateToInstruction, deriveCoachingState } from "./coaching-state.js";
import { communicationProfileToInstruction, resolveCommunicationProfile } from "./communication-profile.js";
import { buildRelevantContext, contextToText, routeContext } from "./context-router.js";
import { FITNESS_INTELLIGENCE, shouldUseFitnessIntelligence } from "./fitness-intelligence.js";
import { deriveLongitudinalState, longitudinalStateToInstruction } from "./longitudinal-state.js";
import { resolveModelPolicy } from "./model-policy.js";
import { classifySafety, safetyToInstruction } from "./safety-policy.js";
import { createPendingAction, resolvePendingActionIntent } from "./pending-action.js";
import { getAriTools, toolToApplicationAction, validateToolCall } from "./tools.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";

export async function runAriVNext(turn = {}) {
  const route = routeContext(turn);
  const safety = classifySafety(turn, route);
  const communication = resolveCommunicationProfile(turn?.preferences);
  const modelPolicy = resolveModelPolicy({ ...route, health: route.health || safety.highStakes });
  const relevantContext = buildRelevantContext(turn, route);
  const coachingState = deriveCoachingState({ turn, route, context: relevantContext });
  const longitudinalState = deriveLongitudinalState({ route, context: relevantContext });
  const pendingIntent = resolvePendingActionIntent(turn);

  if (pendingIntent.type === "confirm") {
    return {
      success: true,
      ready: true,
      reply: "",
      route,
      safety,
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
      modelPolicy,
      coachingState,
      longitudinalState,
      pendingAction: null,
      action: { type: "cancel_pending_action", pendingActionId: pendingIntent.pendingAction?.id || null },
      source: "ari_vnext_pending_cancel"
    };
  }

  const tools = getAriTools(route);
  if (route.currentInfo && process.env.ARI_VNEXT_WEB_SEARCH_ENABLED === "true") {
    tools.push({ type: "web_search" });
  }

  const instructions = buildInstructions({
    route,
    communication,
    safety,
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
  const pendingAction = createPendingAction({
    turn,
    name: applicationAction,
    args: validation.arguments,
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
  relevantContext,
  coachingState,
  longitudinalState
} = {}) {
  const sections = [
    ARI_PERSONA,
    "\nCOMMUNICATION PROFILE\n" + communicationProfileToInstruction(communication),
    "\nSAFETY CONTEXT\n" + safetyToInstruction(safety)
  ];

  if (shouldUseFitnessIntelligence(route)) {
    sections.push("\nFITNESS INTELLIGENCE\n" + FITNESS_INTELLIGENCE);
  }

  if (coachingState) {
    sections.push("\n" + coachingStateToInstruction(coachingState));
  }

  if (longitudinalState) {
    sections.push("\n" + longitudinalStateToInstruction(longitudinalState));
  }

  sections.push(
    "\nRELEVANT ARI XP CONTEXT\nUse only what is relevant to the current question. Treat missing fields as unknown.\n" + contextToText(relevantContext),
    "\nACTION RULE\nOnly call an application function when the CURRENT user message explicitly requests that mutation. Never infer a write from an old turn. A statement like 'I ate eggs' is not permission to log food."
  );

  return sections.join("\n");
}

function buildInput(turn = {}) {
  const input = [];
  for (const item of turn?.history || []) {
    input.push({ role: item.role, content: item.content });
  }
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
