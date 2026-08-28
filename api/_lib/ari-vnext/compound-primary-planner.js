// ARI vNext — Phase 10E shared primary planner for bounded compound turns.
//
// This layer is deliberately narrower than Phase 9C. It consolidates only
// independent routine-log clauses whose CURRENT language already deterministically
// authorizes one exact tool. The shared model proposes arguments; it does not
// authorize, canonicalize, confirm, or execute any mutation.

import { reviewDeterministicRoutineLogIntent } from "./action-intent-verifier.js";
import { budgetTurnContext } from "./context-budget.js";
import { isReferenceFollowUp } from "./reference-context.js";
import { getAriTools, toolToApplicationAction } from "./tools.js";

export const COMPOUND_PRIMARY_PLANNER_VERSION = "1.0.0";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const MAX_SHARED_CLAUSES = 3;
const SAFE_SHARED_OPERATIONS = new Set([
  "log_meal",
  "log_activity",
  "log_weight"
]);
const DESTRUCTIVE_OR_TARGETED = /\b(?:undo|delete|remove|discard|replace|swap|cancel|leave|withdraw|archive|decline|accept|join|rsvp|edit|correct|fix)\b/i;

export function analyzeCompoundPrimaryEligibility({ turn = {}, clauses = [] } = {}) {
  const normalizedClauses = (Array.isArray(clauses) ? clauses : [])
    .map((clause) => clean(clause, 1200))
    .filter(Boolean);

  if (normalizedClauses.length < 2 || normalizedClauses.length > MAX_SHARED_CLAUSES) {
    return ineligible("clause_count_out_of_bounds");
  }

  const original = clean(turn?.message, 1800);
  if (isReferenceFollowUp(original) || DESTRUCTIVE_OR_TARGETED.test(original)) {
    return ineligible("reference_or_targeted_compound_turn");
  }

  const clauseSpecs = [];
  for (let index = 0; index < normalizedClauses.length; index += 1) {
    const clause = normalizedClauses[index];
    if (isReferenceFollowUp(clause) || DESTRUCTIVE_OR_TARGETED.test(clause)) {
      return ineligible("reference_or_targeted_clause");
    }

    const budgeted = budgetTurnContext({
      ...turn,
      message: clause,
      pendingAction: null
    });
    const route = budgeted.route || {};

    if (route?.health || route?.currentInfo || route?.developer || route?.coachingState) {
      return ineligible("strong_reasoning_clause");
    }

    const tools = getAriTools(route).filter((tool) => tool?.type === "function" && tool?.name);
    const safeTools = tools.filter((tool) => SAFE_SHARED_OPERATIONS.has(toolToApplicationAction(tool.name)));
    const availableTools = safeTools.map((tool) => String(tool.name));
    const deterministicNames = [];

    for (const tool of safeTools) {
      const functionCall = { name: String(tool.name) };
      const routine = reviewDeterministicRoutineLogIntent({
        turn: budgeted.turn,
        route,
        functionCall,
        availableTools
      });
      if (routine?.decision === tool.name) deterministicNames.push(String(tool.name));
    }

    const unique = [...new Set(deterministicNames)];
    if (unique.length !== 1) return ineligible("clause_not_uniquely_deterministic");

    const expectedToolName = unique[0];
    const expectedTool = safeTools.find((tool) => tool.name === expectedToolName);
    if (!expectedTool) return ineligible("expected_tool_missing");

    clauseSpecs.push({
      index,
      clause,
      route,
      turn: budgeted.turn,
      budget: budgeted.budget,
      expectedToolName,
      applicationAction: toolToApplicationAction(expectedToolName),
      tool: expectedTool
    });
  }

  const names = clauseSpecs.map((spec) => spec.expectedToolName);
  if (new Set(names).size !== names.length) {
    // Two same-tool clauses could have their arguments swapped by one shared model
    // pass. Keep those on the mature independent path instead of guessing order.
    return ineligible("duplicate_tool_requires_independent_interpretation");
  }

  return {
    eligible: true,
    reason: "unique_deterministic_routine_log_clauses",
    clauseSpecs,
    model: choosePlannerModel(clauseSpecs),
    tools: clauseSpecs.map((spec) => spec.tool)
  };
}

export async function planCompoundPrimary({ turn = {}, clauses = [] } = {}) {
  const analysis = analyzeCompoundPrimaryEligibility({ turn, clauses });
  if (!analysis.eligible) return { ...analysis, usable: false };

  const apiKey = clean(process.env.OPENAI_API_KEY, 500);
  if (!apiKey) return { ...analysis, usable: false, reason: "api_key_unavailable" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 22000);
  const body = {
    model: analysis.model,
    instructions: buildPlannerInstructions(analysis.clauseSpecs),
    input: [{
      role: "user",
      content: analysis.clauseSpecs
        .map((spec) => `Clause ${spec.index + 1}: ${spec.clause}`)
        .join("\n")
    }],
    tools: analysis.tools,
    tool_choice: "auto",
    parallel_tool_calls: true,
    max_output_tokens: 1400,
    store: false
  };

  if (isReasoningModel(analysis.model)) body.reasoning = { effort: "low" };
  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-compound:${userId.slice(0, 50)}`.slice(0, 64);
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
    if (!response.ok) return { ...analysis, usable: false, reason: "shared_primary_provider_error" };

    const calls = (Array.isArray(data?.output) ? data.output : [])
      .filter((item) => item?.type === "function_call" && item?.name && item?.call_id);
    const preparedCalls = validatePreparedCalls(calls, analysis.clauseSpecs);
    if (!preparedCalls) {
      return {
        ...analysis,
        usable: false,
        reason: "shared_primary_shape_mismatch",
        provider: providerSummary(data)
      };
    }

    return {
      ...analysis,
      usable: true,
      preparedCalls,
      provider: providerSummary(data),
      version: COMPOUND_PRIMARY_PLANNER_VERSION
    };
  } catch (error) {
    return {
      ...analysis,
      usable: false,
      reason: error?.name === "AbortError" ? "shared_primary_timeout" : "shared_primary_transport_error"
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function validatePreparedCalls(calls = [], clauseSpecs = []) {
  if (!Array.isArray(calls) || calls.length !== clauseSpecs.length) return null;
  const prepared = [];

  for (let index = 0; index < clauseSpecs.length; index += 1) {
    const call = calls[index];
    const spec = clauseSpecs[index];
    if (String(call?.name || "") !== String(spec?.expectedToolName || "")) return null;

    let args = null;
    try {
      args = JSON.parse(String(call?.arguments || "{}"));
    } catch {
      return null;
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) return null;

    prepared.push({
      index,
      call_id: clean(call.call_id, 180) || `phase10e_${index + 1}`,
      name: String(call.name),
      arguments: JSON.stringify(args),
      applicationAction: spec.applicationAction
    });
  }

  return prepared;
}

function buildPlannerInstructions(specs = []) {
  return [
    "PHASE 10E COMPOUND PRIMARY INTERPRETATION",
    "Interpret the numbered independent ARI XP routine-log clauses below with exactly one function call per clause, in clause order.",
    "The server has already determined that each CURRENT clause explicitly authorizes exactly one listed routine-log tool. You do not authorize any write; only prepare that tool's arguments from the clause.",
    "Never merge clauses, never borrow quantities or identities from another clause, and never invent a persisted ID or target.",
    "Return no conversational answer. Emit exactly the expected function calls in order.",
    ...specs.map((spec) => `Clause ${spec.index + 1} expected tool: ${spec.expectedToolName}.`)
  ].join("\n");
}

function choosePlannerModel(specs = []) {
  const includesNutrition = specs.some((spec) => spec.applicationAction === "log_meal");
  return includesNutrition
    ? process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna"
    : process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
}

function providerSummary(data = {}) {
  return {
    id: data?.id || null,
    model: data?.model || null,
    usage: data?.usage || null
  };
}

function ineligible(reason) {
  return {
    eligible: false,
    usable: false,
    reason,
    clauseSpecs: [],
    tools: []
  };
}

function isReasoningModel(value = "") {
  return /^gpt-5|^o[0-9]/i.test(String(value || ""));
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
