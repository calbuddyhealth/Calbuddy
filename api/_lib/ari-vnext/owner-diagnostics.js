// ARI vNext — Phase 11F owner-only sanitized diagnostics.
// Reads only the explicitly whitelisted columns from the Phase 11B ledger.
// It never reads the trace JSON blob, prompt/reply text, tool arguments, memory,
// application state, secrets, or hidden reasoning, and it has no mutation authority.

export const ARI_OWNER_DIAGNOSTICS_VERSION = "11F.1.0";

const TABLE = "ari_observability_turns";
const MAX_LIMIT = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_COLUMNS = [
  "created_at",
  "user_id",
  "turn_id",
  "conversation_id",
  "trace_version",
  "store_version",
  "outcome",
  "outcome_source",
  "error_code",
  "active_domains",
  "follow_up",
  "current_info",
  "high_stakes",
  "developer_route",
  "casual_conversation",
  "nutrition_logging",
  "coaching_state",
  "model",
  "routing_class",
  "model_mode",
  "reasoning_effort",
  "fast_eligible",
  "context_profile",
  "history_before",
  "history_after",
  "reference_status",
  "reference_reason",
  "reference_candidate_count",
  "clarification_required",
  "authorization_mode",
  "authorization_decision",
  "authorization_confidence",
  "application_action",
  "action_type",
  "confirmation_state",
  "compound_mode",
  "compound_action_count",
  "compound_blocked",
  "performance_status",
  "performance_turn_class",
  "model_call_count",
  "avoided_model_call_count",
  "failed_model_call_count",
  "total_tokens",
  "model_latency_ms",
  "estimated_cost_usd"
].join(",");

export async function loadRecentAriDiagnostics({
  ownerAuthorization = null,
  subjectUserId = null,
  limit = 25,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!isVerifiedOwnerAuthorization(ownerAuthorization)) {
    return failure(403, "OWNER_ACCESS_DENIED");
  }

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  if (!supabaseUrl || !serviceKey || typeof fetchImpl !== "function") {
    return failure(503, "OBSERVABILITY_UNAVAILABLE");
  }

  const userFilter = clean(subjectUserId, 80).toLowerCase();
  if (userFilter && !UUID_PATTERN.test(userFilter)) {
    return failure(400, "INVALID_USER_FILTER");
  }

  const boundedLimit = boundedInteger(limit, 1, MAX_LIMIT, 25);
  const params = new URLSearchParams();
  params.set("select", SELECT_COLUMNS);
  params.set("order", "created_at.desc");
  params.set("limit", String(boundedLimit));
  if (userFilter) params.set("user_id", `eq.${userFilter}`);

  let response;
  try {
    response = await fetchImpl(`${supabaseUrl}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json"
      }
    });
  } catch {
    return failure(503, "OBSERVABILITY_UNAVAILABLE");
  }

  if (!response?.ok) {
    return failure(response?.status || 503, "OBSERVABILITY_READ_FAILED");
  }

  const rows = await response.json().catch(() => []);
  const diagnostics = Array.isArray(rows) ? rows.slice(0, boundedLimit).map(toOwnerDiagnostic) : [];
  return {
    success: true,
    status: 200,
    code: null,
    version: ARI_OWNER_DIAGNOSTICS_VERSION,
    ownerOnly: true,
    count: diagnostics.length,
    diagnostics
  };
}

export function toOwnerDiagnostic(row = {}) {
  return {
    createdAt: clean(row?.created_at, 80) || null,
    subjectUserId: clean(row?.user_id, 80) || null,
    turnId: clean(row?.turn_id, 220) || null,
    conversationId: clean(row?.conversation_id, 220) || null,
    versions: {
      trace: clean(row?.trace_version, 40) || null,
      store: clean(row?.store_version, 40) || null,
      diagnostics: ARI_OWNER_DIAGNOSTICS_VERSION
    },
    outcome: {
      status: clean(row?.outcome, 60) || "unknown",
      source: clean(row?.outcome_source, 180) || null,
      errorCode: clean(row?.error_code, 100) || null
    },
    route: {
      activeDomains: stringArray(row?.active_domains, 8, 40),
      followUp: row?.follow_up === true,
      currentInfo: row?.current_info === true,
      highStakes: row?.high_stakes === true,
      developer: row?.developer_route === true,
      casualConversation: row?.casual_conversation === true,
      nutritionLogging: row?.nutrition_logging === true,
      coachingState: row?.coaching_state === true
    },
    model: {
      name: clean(row?.model, 160) || null,
      routingClass: clean(row?.routing_class, 100) || null,
      mode: clean(row?.model_mode, 80) || null,
      reasoningEffort: clean(row?.reasoning_effort, 40) || null,
      fastEligible: row?.fast_eligible === true
    },
    context: {
      profile: clean(row?.context_profile, 60) || null,
      historyBefore: nonNegativeInteger(row?.history_before),
      historyAfter: nonNegativeInteger(row?.history_after)
    },
    reference: {
      status: clean(row?.reference_status, 60) || null,
      reason: clean(row?.reference_reason, 120) || null,
      candidateCount: nonNegativeInteger(row?.reference_candidate_count),
      clarificationRequired: row?.clarification_required === true
    },
    authorization: {
      mode: clean(row?.authorization_mode, 60) || null,
      decision: clean(row?.authorization_decision, 160) || null,
      confidence: boundedDecimal(row?.authorization_confidence)
    },
    action: {
      applicationAction: clean(row?.application_action, 160) || null,
      type: clean(row?.action_type, 100) || null,
      confirmation: clean(row?.confirmation_state, 60) || null
    },
    compound: {
      mode: clean(row?.compound_mode, 60) || null,
      actionCount: nonNegativeInteger(row?.compound_action_count),
      blocked: row?.compound_blocked === true
    },
    performance: {
      status: clean(row?.performance_status, 40) || null,
      turnClass: clean(row?.performance_turn_class, 100) || null,
      modelCallCount: nonNegativeInteger(row?.model_call_count),
      avoidedModelCallCount: nonNegativeInteger(row?.avoided_model_call_count),
      failedModelCallCount: nonNegativeInteger(row?.failed_model_call_count),
      totalTokens: nonNegativeInteger(row?.total_tokens),
      modelLatencyMs: nonNegativeInteger(row?.model_latency_ms),
      estimatedCostUsd: boundedCost(row?.estimated_cost_usd)
    }
  };
}

export function isVerifiedOwnerAuthorization(authorization = null) {
  return authorization?.authorized === true && authorization?.mode === "supabase_verified_owner" && UUID_PATTERN.test(clean(authorization?.user?.id, 80));
}

function failure(status, code) {
  return {
    success: false,
    status,
    code,
    version: ARI_OWNER_DIAGNOSTICS_VERSION,
    ownerOnly: true,
    count: 0,
    diagnostics: []
  };
}

function stringArray(value, maxItems, maxChars) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item, maxChars)).filter(Boolean).slice(0, maxItems);
}

function boundedInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
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
