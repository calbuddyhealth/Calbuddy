// ARI vNext — model-first orchestration through OpenAI Responses API.

import { reviewExplicitApplicationIntent } from "./action-intent-verifier.js";
import { ARI_PERSONA } from "./persona.js";
import { coachingStateToInstruction, deriveCoachingState } from "./coaching-state.js";
import { communicationProfileToInstruction, resolvePersonalizedCommunicationProfile } from "./communication-profile.js";
import { communicationLearningToInstruction } from "./communication-outcomes.js";
import { buildRelevantContext, contextToText, routeContext } from "./context-router.js";
import { evaluateExperimentSnapshot } from "./experiment-ledger.js";
import { FITNESS_INTELLIGENCE, shouldUseFitnessIntelligence } from "./fitness-intelligence.js";
import { deriveGoalHierarchy, goalHierarchyToInstruction } from "./goal-hierarchy.js";
import { deriveLongitudinalState, longitudinalStateToInstruction } from "./longitudinal-state.js";
import { deriveMetacognition, metacognitionToInstruction } from "./metacognition.js";
import { resolveModelPolicy } from "./model-policy.js";
import { applyOutcomeLearning } from "./outcome-learning.js";
import { deriveRelationshipContinuity, relationshipContinuityToInstruction } from "./relationship-continuity.js";
import { classifySafety, safetyToInstruction } from "./safety-policy.js";
import { deriveScientificIntelligence, scientificIntelligenceToInstruction } from "./scientific-intelligence.js";
import { createPendingAction, resolvePendingActionIntent } from "./pending-action.js";
import { deriveSelfModel, selfModelToInstruction } from "./self-model.js";
import { getAriTools, toolToApplicationAction, validateToolCall } from "./tools.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";

export async function runAriVNext(turn = {}) {
  const route = routeContext(turn);
  const safety = classifySafety(turn, route);
  const communication = resolvePersonalizedCommunicationProfile({
    preferences: turn?.preferences || {},
    learning: turn?.context?.communicationLearning || null,
    message: turn?.message || "",
    safety
  });
  const relationshipContinuity = deriveRelationshipContinuity({
    userWorldModel: turn?.context?.userWorldModel || null,
    decisionState: turn?.context?.decisionState || null,
    experimentLedger: turn?.context?.experimentLedger || null,
    temporalTimeline: turn?.context?.temporalTimeline || null,
    recentContinuityPairs: Number(turn?.context?.recentContinuityPairs || 0)
  });
  const selfModel = deriveSelfModel({ turn: { ...turn, relationshipContinuity }, route, safety });
  const modelPolicy = resolveModelPolicy({ ...route, health: route.health || safety.highStakes });
  const relevantContext = buildRelevantContext(turn, route);
  const coachingState = deriveCoachingState({ turn, route, context: relevantContext });
  const longitudinalState = deriveLongitudinalState({ route, context: relevantContext });
  const goalHierarchy = deriveGoalHierarchy({
    turn,
    userWorldModel: relevantContext?.userWorldModel || null,
    coachingState,
    longitudinalState
  });
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
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
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
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
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
  if (route.currentInfo && process.env.ARI_VNEXT_WEB_SEARCH_ENABLED !== "false") {
    tools.push({ type: "web_search" });
  }

  const instructions = buildInstructions({
    route,
    communication,
    safety,
    selfModel,
    relationshipContinuity,
    goalHierarchy,
    metacognition,
    scientificIntelligence,
    experimentReviewState,
    temporalContext,
    relevantContext,
    coachingState,
    longitudinalState
  });
  const input = buildInput(turn);

  let first = await callResponses({
    turn,
    policy: modelPolicy,
    instructions,
    input,
    tools
  });

  let functionCall = findFunctionCall(first?.output);
  const functionNames = new Set(
    tools
      .filter((tool) => tool?.type === "function" && tool?.name)
      .map((tool) => String(tool.name))
  );

  // The primary model remains the main semantic authority. A tiny GPT-4o-mini
  // verifier is used only when the primary model attempts a mutation, or when
  // a command-like turn received no tool call and may have been missed.
  const shouldVerify = Boolean(functionCall) || shouldReviewNoToolTurn(turn);
  const semanticActionReview = shouldVerify
    ? await reviewExplicitApplicationIntent({ turn, route, tools })
    : null;

  if (
    semanticActionReview?.decision === "blocked_future_meal_plan" &&
    Number(semanticActionReview?.confidence || 0) >= 0.78
  ) {
    return productBoundaryResult({
      reply: "Meal Plan only tracks today, so I won't create or schedule a future Meal Plan. When that day arrives, I can build it from your current calorie goal and what you've actually eaten.",
      source: "ari_vnext_product_boundary",
      first,
      semanticActionReview,
      route,
      safety,
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
      metacognition,
      scientificIntelligence,
      experimentReviewState,
      temporalContext,
      modelPolicy,
      coachingState,
      longitudinalState
    });
  }

  if (
    semanticActionReview?.decision === "blocked_missing_daily_goal" &&
    Number(semanticActionReview?.confidence || 0) >= 0.78
  ) {
    return productBoundaryResult({
      reply: "Your Daily Calorie Goal isn't set, so I won't invent a calorie budget. Set the goal in Goals or give me an explicit calorie target, and I can build today's Meal Plan from that.",
      source: "ari_vnext_product_boundary",
      first,
      semanticActionReview,
      route,
      safety,
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
      metacognition,
      scientificIntelligence,
      experimentReviewState,
      temporalContext,
      modelPolicy,
      coachingState,
      longitudinalState
    });
  }

  const reviewConfidence = Number(semanticActionReview?.confidence || 0);
  const reviewedDecision = String(semanticActionReview?.decision || "");
  const reviewedToolName =
    reviewConfidence >= 0.84 && functionNames.has(reviewedDecision)
      ? reviewedDecision
      : "";

  // If Ari's first pass tried to write from a statement/question and the
  // semantic verifier confidently says there is no write permission, suppress
  // the tool and let Ari answer conversationally with no mutation tools visible.
  if (functionCall && reviewedDecision === "none" && reviewConfidence >= 0.84) {
    first = await callResponses({
      turn,
      policy: modelPolicy,
      instructions,
      input,
      tools: []
    });
    functionCall = null;
  }

  // If the verifier confidently resolves a different explicit capability—or
  // catches an explicit request the first pass merely talked about—rerun the
  // full Ari brain with that one function required. The verifier never creates
  // arguments itself.
  if (
    reviewedToolName &&
    (!functionCall || String(functionCall.name) !== reviewedToolName)
  ) {
    first = await callResponses({
      turn,
      policy: modelPolicy,
      instructions,
      input,
      tools,
      toolChoice: { type: "function", name: reviewedToolName }
    });
    functionCall = findFunctionCall(first?.output);
    if (!functionCall) {
      throw new Error("Ari recognized an explicit app action but could not prepare the trusted capability.");
    }
  }

  if (!functionCall) {
    return {
      success: true,
      ready: true,
      reply: extractOutputText(first),
      route,
      safety,
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
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
      semanticActionReview: publicActionReview(semanticActionReview),
      source: "ari_vnext"
    };
  }

  let validation = validateToolCall(functionCall, route);

  // One bounded correction pass keeps a malformed model tool call from turning
  // into a user-visible failure. The same function is required and the model is
  // told the exact validator error; trusted validation still decides whether the
  // repaired arguments are acceptable.
  if (!validation.valid) {
    const repairInstructions = [
      instructions,
      "\nTOOL ARGUMENT CORRECTION",
      `Your previous ${String(functionCall.name || "application")} function call failed trusted validation with: ${String(validation.error || "invalid_arguments")}.`,
      "Reissue the SAME function with corrected arguments only. Preserve the user's request exactly; do not switch actions.",
      "For Meal Plan, use at most one breakfast, one lunch, one dinner, and one snack. Never create duplicate meal slots."
    ].join("\n");

    const repaired = await callResponses({
      turn,
      policy: modelPolicy,
      instructions: repairInstructions,
      input,
      tools,
      toolChoice: { type: "function", name: String(functionCall.name) }
    });
    const repairedCall = findFunctionCall(repaired?.output);
    const repairedValidation = repairedCall
      ? validateToolCall(repairedCall, route)
      : { valid: false, error: "missing_repaired_tool_call" };

    if (!repairedValidation.valid) {
      throw new Error(repairedValidation.error || validation.error || "Ari selected an invalid application capability.");
    }

    first = repaired;
    functionCall = repairedCall;
    validation = repairedValidation;
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

  // Logging a resolved meal no longer spends a second primary-model call just
  // to word the confirmation. OpenAI still owns semantic interpretation and
  // argument construction; trusted validation still owns whether the proposal
  // is allowed. The confirmed payload itself is the source of truth for this
  // deterministic reply, so wording cannot drift away from what will execute.
  const deterministicReply = formatDeterministicPendingReply(applicationAction, pendingAction.arguments);
  if (deterministicReply) {
    return {
      success: true,
      ready: true,
      reply: deterministicReply,
      route,
      safety,
      communication,
      selfModel,
      relationshipContinuity,
      goalHierarchy,
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
      provider: providerSummary(first),
      semanticActionReview: publicActionReview(semanticActionReview),
      source: "ari_vnext_action_proposal"
    };
  }

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
    communication,
    selfModel,
    relationshipContinuity,
    goalHierarchy,
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
    semanticActionReview: publicActionReview(semanticActionReview),
    source: "ari_vnext_action_proposal"
  };
}

function buildInstructions({
  route,
  communication,
  safety,
  selfModel,
  relationshipContinuity,
  goalHierarchy,
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
    "\n" + relationshipContinuityToInstruction(relationshipContinuity),
    "\nMETACOGNITION\n" + metacognitionToInstruction(metacognition),
    "\nCOMMUNICATION PROFILE\n" + communicationProfileToInstruction(communication),
    "\nSAFETY CONTEXT\n" + safetyToInstruction(safety)
  ];

  if (shouldUseFitnessIntelligence(route)) {
    sections.push("\nFITNESS INTELLIGENCE\n" + FITNESS_INTELLIGENCE);
  }

  if (goalHierarchy) sections.push("\n" + goalHierarchyToInstruction(goalHierarchy));
  if (relevantContext?.communicationLearning) sections.push("\n" + communicationLearningToInstruction(relevantContext.communicationLearning));
  if (coachingState) sections.push("\n" + coachingStateToInstruction(coachingState));
  if (longitudinalState) sections.push("\n" + longitudinalStateToInstruction(longitudinalState));
  if (scientificIntelligence) sections.push("\n" + scientificIntelligenceToInstruction(scientificIntelligence));
  if (experimentReviewState) sections.push("\n" + experimentReviewToInstruction(experimentReviewState));

  sections.push(
    "\nARI XP PRODUCT BOUNDARIES\nMeal Plan is strictly today-only. Never generate, schedule, or imply support for a future Meal Plan. If the user asks for tomorrow or another future day, state that Meal Plan only tracks today. Planned food is not consumed food. Calories burned do not increase the Nutrition food allowance unless the product contract explicitly changes. Never invent a missing Daily Calorie Goal.",
    "\nDATA FIDELITY\nFor any proposed write, preserve every explicit quantity and named item from the CURRENT user request. Do not silently drop components. If a user asks to log multiple foods as one meal, the single meal record must represent all of those foods with combined nutrition and clear serving details.",
    "\nRELEVANT ARI XP CONTEXT\nUse only what is relevant to the current question. Treat missing fields as unknown.\n" + contextToText(relevantContext),
    "\nACTION RULE\nOnly call an application function when the CURRENT user message explicitly requests that mutation. Never infer a write from an old turn. A statement like 'I ate eggs' or 'I ate the breakfast you planned' is not permission to log food. When the current message DOES explicitly request a supported app mutation, use the matching function instead of only describing what you could do. Natural phrasing counts; the user does not need to name the feature or tool. Never start, finish, or cancel an experiment without an explicit current-turn request and confirmation."
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

async function callResponses({ turn, policy, instructions, input, tools = [], toolChoice = "auto" } = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), policy?.timeoutMs || 25000);
  const normalizedTools = Array.isArray(tools) ? tools : [];

  const body = {
    model: policy?.model,
    instructions,
    input,
    max_output_tokens: policy?.maxOutputTokens || 1200,
    store: false
  };

  if (normalizedTools.length) {
    body.tools = normalizedTools;
    body.tool_choice = toolChoice || "auto";
    body.parallel_tool_calls = false;
  }

  if (policy?.supportsReasoning && policy?.reasoningEffort) {
    body.reasoning = { effort: policy.reasoningEffort };
  }

  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-vnext:${userId.slice(0, 54)}`.slice(0, 64);
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

function shouldReviewNoToolTurn(turn = {}) {
  const text = String(turn?.message || "").trim().toLowerCase();
  if (!text) return false;

  // This does not decide the action. It only decides whether to spend the
  // small semantic-verifier call after the primary brain chose no tool.
  return /\b(?:can you|could you|please|i want you to|help me|log|record|save|add|create|build|make|plan|change|update|replace|remove|track|start|finish|complete|cancel|set\s+(?:it|that|this|me|my)|put\s+(?:it|that|this|together)|figure\s+out.+for\s+me)\b/i.test(text);
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

export function formatDeterministicPendingReply(applicationAction = "", args = {}) {
  if (String(applicationAction || "").trim() !== "log_meal") return "";

  const name = String(args?.name || "meal").replace(/\s+/g, " ").trim().slice(0, 160) || "meal";
  const servingSize = String(args?.servingSize || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const calories = Number(args?.calories);
  const calorieText = Number.isFinite(calories) && calories > 0
    ? ` — ${Math.round(calories)} calories`
    : "";
  const servingText = servingSize ? ` (${servingSize})` : "";

  return `Ready to log ${name}${servingText}${calorieText}. Confirm to save it.`;
}

function publicActionReview(review = null) {
  if (!review) return null;
  return {
    version: review?.version || "1.0.0",
    decision: review?.decision || "none",
    confidence: Number(review?.confidence || 0),
    reason: String(review?.reason || "").slice(0, 500),
    dailyGoalKnown: typeof review?.dailyGoalKnown === "boolean" ? review.dailyGoalKnown : null,
    model: review?.model || null
  };
}

function providerSummary(data = {}) {
  return {
    id: data?.id || null,
    model: data?.model || null,
    usage: data?.usage || null
  };
}

function productBoundaryResult({
  reply,
  source,
  first,
  semanticActionReview,
  route,
  safety,
  communication,
  selfModel,
  relationshipContinuity,
  goalHierarchy,
  metacognition,
  scientificIntelligence,
  experimentReviewState,
  temporalContext,
  modelPolicy,
  coachingState,
  longitudinalState
} = {}) {
  return {
    success: true,
    ready: true,
    reply,
    route,
    safety,
    communication,
    selfModel,
    relationshipContinuity,
    goalHierarchy,
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
    semanticActionReview: publicActionReview(semanticActionReview),
    source
  };
}
