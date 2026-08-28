// ARI vNext — Phase 11B durable sanitized observability ledger.
//
// Service-role only. This module persists decision codes and counters only.
// It never persists prompt/user/reply text, tool arguments, memory payloads,
// app state, secrets, or hidden reasoning. Failures are always fail-soft.

import { ARI_DECISION_TRACE_VERSION, assertSanitizedDecisionTrace } from "./decision-trace.js";

export const ARI_OBSERVABILITY_STORE_VERSION = "1.0.0";
const TABLE = "ari_observability_turns";

export async function recordAriObservabilityTurn({
  userId = null,
  turnId = null,
  conversationId = null,
  trace = null
} = {}) {
  try {
    if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
      return { stored: false, reason: "missing_trace" };
    }
    if (!assertSanitizedDecisionTrace(trace)) {
      return { stored: false, reason: "trace_failed_privacy_guard" };
    }

    const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
    const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
    if (!supabaseUrl || !serviceKey) {
      return { stored: false, reason: "service_credentials_unavailable" };
    }

    const row = toObservabilityRow({ userId, turnId, conversationId, trace });
    if (!row.user_id || !row.turn_id) return { stored: false, reason: "missing_identity" };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${TABLE}?on_conflict=user_id%2Cturn_id`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal"
        },
        body: JSON.stringify(row)
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn("[ARI Observability] Insert failed:", response.status, errorText.slice(0, 300));
      return { stored: false, reason: "insert_failed", status: response.status };
    }

    return {
      stored: true,
      reason: "stored",
      traceVersion: row.trace_version,
      storeVersion: ARI_OBSERVABILITY_STORE_VERSION
    };
  } catch (error) {
    console.warn("[ARI Observability] Recording failed:", error?.message || error);
    return { stored: false, reason: "recording_error" };
  }
}

export function toObservabilityRow({ userId = null, turnId = null, conversationId = null, trace = {} } = {}) {
  const route = object(trace?.route);
  const model = object(trace?.model);
  const context = object(trace?.context);
  const reference = object(trace?.reference);
  const authorization = object(trace?.authorization);
  const action = object(trace?.action);
  const compound = object(trace?.compound);
  const performance = object(trace?.performance);
  const outcome = object(trace?.outcome);

  return {
    user_id: clean(userId, 80) || null,
    turn_id: clean(turnId || trace?.turnId, 220) || null,
    conversation_id: clean(conversationId || trace?.conversationId, 220) || null,
    trace_version: clean(trace?.version || ARI_DECISION_TRACE_VERSION, 40),
    store_version: ARI_OBSERVABILITY_STORE_VERSION,
    outcome: clean(outcome?.status, 60) || "unknown",
    outcome_source: clean(outcome?.source, 180) || null,
    error_code: clean(outcome?.errorCode, 100) || null,
    active_domains: Array.isArray(route?.activeDomains)
      ? route.activeDomains.map((value) => clean(value, 40)).filter(Boolean).slice(0, 8)
      : [],
    follow_up: route?.followUp === true,
    current_info: route?.currentInfo === true,
    high_stakes: route?.health === true,
    developer_route: route?.developer === true,
    casual_conversation: route?.casualConversation === true,
    nutrition_logging: route?.nutritionLogging === true,
    coaching_state: route?.coachingState === true,
    model: clean(model?.model, 160) || null,
    routing_class: clean(model?.routingClass, 100) || null,
    model_mode: clean(model?.mode, 80) || null,
    reasoning_effort: clean(model?.reasoningEffort, 40) || null,
    fast_eligible: model?.fastEligible === true,
    context_profile: clean(context?.profile, 60) || null,
    history_before: nonNegativeInteger(context?.historyBefore),
    history_after: nonNegativeInteger(context?.historyAfter),
    reference_status: clean(reference?.status, 60) || null,
    reference_reason: clean(reference?.reason, 120) || null,
    reference_candidate_count: nonNegativeInteger(reference?.candidateCount),
    clarification_required: reference?.clarificationRequired === true,
    authorization_mode: clean(authorization?.mode, 60) || null,
    authorization_decision: clean(authorization?.decision, 160) || null,
    authorization_confidence: boundedDecimal(authorization?.confidence),
    application_action: clean(action?.applicationAction, 160) || null,
    action_type: clean(action?.type, 100) || null,
    confirmation_state: clean(action?.confirmation, 60) || null,
    compound_mode: clean(compound?.mode, 60) || null,
    compound_action_count: nonNegativeInteger(compound?.actionCount),
    compound_blocked: compound?.blocked === true,
    performance_status: clean(performance?.status, 40) || null,
    performance_turn_class: clean(performance?.turnClass, 100) || null,
    model_call_count: nonNegativeInteger(performance?.callCount),
    avoided_model_call_count: nonNegativeInteger(performance?.avoidedCallCount),
    failed_model_call_count: nonNegativeInteger(performance?.failedCallCount),
    total_tokens: nonNegativeInteger(performance?.totalTokens),
    model_latency_ms: nonNegativeInteger(performance?.modelLatencyMs),
    estimated_cost_usd: boundedCost(performance?.estimatedCostUsd),
    trace: trace
  };
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.min(2147483647, Math.round(number)) : 0;
}

function boundedDecimal(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 1000) / 1000));
}

function boundedCost(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(999999, Math.round(number * 1e8) / 1e8) : null;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
