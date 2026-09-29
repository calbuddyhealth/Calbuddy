import {
  estimateOpenAICost,
  extractOpenAIUsage,
  recordOpenAIUsage
} from "./ai-provider-usage.js";

const DEFAULT_DAILY_BUDGET_USD = 1.00;
const DEFAULT_MONTHLY_BUDGET_USD = 20.00;
const DEFAULT_UNKNOWN_CALL_RESERVATION_USD = 0.50;
const BACKGROUND_CATEGORY_PREFIXES = [
  "ari_cognitive_scheduler",
  "ari_experience",
  "ari_dreaming",
  "ari_autonomy",
  "ari_background_specialist",
  "ari_repair_dialogue",
  "ari_theory_dialogue",
  "agent_community_"
];

export async function getBackgroundAiBudgetStatus({
  userId = null,
  now = new Date(),
  fetcher = fetch
} = {}) {
  const dailyLimitUsd = positiveNumber(process.env.ARI_BACKGROUND_DAILY_BUDGET_USD, DEFAULT_DAILY_BUDGET_USD);
  const monthlyLimitUsd = positiveNumber(process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD, DEFAULT_MONTHLY_BUDGET_USD);
  const failClosed = String(process.env.ARI_BACKGROUND_BUDGET_FAIL_CLOSED ?? "true").trim().toLowerCase() !== "false";

  const config = supabaseConfig();
  if (!config) {
    return {
      allowed: !failClosed,
      reason: "usage_ledger_unavailable",
      dailySpendUsd: 0,
      monthlySpendUsd: 0,
      dailyCommittedUsd: 0,
      monthlyCommittedUsd: 0,
      dailyLimitUsd,
      monthlyLimitUsd
    };
  }

  const clock = validDate(now);
  const dayStart = new Date(clock);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), 1));
  const budgetUserId = normalizeUserId(userId);

  try {
    const usageParams = new URLSearchParams({
      select: "created_at,usage_type,request_category,model,input_tokens,cached_input_tokens,output_tokens,total_tokens,estimated_cost_usd,pricing_source",
      created_at: `gte.${monthStart.toISOString()}`,
      order: "created_at.asc",
      limit: "5000"
    });
    if (budgetUserId) usageParams.set("user_id", `eq.${budgetUserId}`);

    const requests = [
      fetcher(`${config.url}/rest/v1/ai_provider_usage_logs?${usageParams.toString()}`, {
        headers: serverHeaders(config.key),
        signal: AbortSignal.timeout(5000)
      })
    ];

    if (budgetUserId) {
      const counterParams = new URLSearchParams({
        user_id: `eq.${budgetUserId}`,
        period_start: `in.(${dayStart.toISOString().slice(0,10)},${monthStart.toISOString().slice(0,10)})`,
        select: "period_kind,period_start,committed_usd"
      });
      requests.push(fetcher(`${config.url}/rest/v1/ari_background_ai_budget_counters?${counterParams.toString()}`, {
        headers: serverHeaders(config.key),
        signal: AbortSignal.timeout(5000)
      }));
    }

    const responses = await Promise.all(requests);
    if (!responses[0].ok) throw new Error(`usage_ledger_${responses[0].status}`);

    const rows = await responses[0].json().catch(() => []);
    let dailySpendUsd = 0;
    let monthlySpendUsd = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!isBackgroundUsageRow(row)) continue;
      const cost = backgroundRowCost(row);
      monthlySpendUsd += cost;
      const created = Date.parse(String(row?.created_at || ""));
      if (Number.isFinite(created) && created >= dayStart.getTime()) dailySpendUsd += cost;
    }

    let dailyCommittedUsd = dailySpendUsd;
    let monthlyCommittedUsd = monthlySpendUsd;
    if (responses[1]?.ok) {
      const counters = await responses[1].json().catch(() => []);
      for (const row of Array.isArray(counters) ? counters : []) {
        const amount = Math.max(0, Number(row?.committed_usd) || 0);
        if (row?.period_kind === "day") dailyCommittedUsd = Math.max(dailyCommittedUsd, amount);
        if (row?.period_kind === "month") monthlyCommittedUsd = Math.max(monthlyCommittedUsd, amount);
      }
    }

    dailySpendUsd = roundMoney(dailySpendUsd);
    monthlySpendUsd = roundMoney(monthlySpendUsd);
    dailyCommittedUsd = roundMoney(dailyCommittedUsd);
    monthlyCommittedUsd = roundMoney(monthlyCommittedUsd);

    const dailyBlocked = dailyCommittedUsd >= dailyLimitUsd;
    const monthlyBlocked = monthlyCommittedUsd >= monthlyLimitUsd;
    return {
      allowed: !(dailyBlocked || monthlyBlocked),
      reason: dailyBlocked ? "daily_budget_reached" : monthlyBlocked ? "monthly_budget_reached" : "within_budget",
      dailySpendUsd,
      monthlySpendUsd,
      dailyCommittedUsd,
      monthlyCommittedUsd,
      dailyLimitUsd,
      monthlyLimitUsd
    };
  } catch (error) {
    return {
      allowed: !failClosed,
      reason: "usage_ledger_query_failed",
      error: clean(error?.message, 180),
      dailySpendUsd: 0,
      monthlySpendUsd: 0,
      dailyCommittedUsd: 0,
      monthlyCommittedUsd: 0,
      dailyLimitUsd,
      monthlyLimitUsd
    };
  }
}

export async function assertBackgroundAiBudget(options = {}) {
  const status = await getBackgroundAiBudgetStatus(options);
  if (status.allowed) return status;
  throw budgetError(status.reason, status);
}

export function estimateBackgroundReservationUsd({
  model = "",
  requestBody = null,
  estimatedInputTokens = null,
  maxOutputTokens = null
} = {}) {
  const serializedLength = requestBody
    ? safeJsonString(requestBody).length
    : 0;
  const inputTokens = Math.max(
    1,
    Number.isFinite(Number(estimatedInputTokens))
      ? Math.ceil(Number(estimatedInputTokens))
      : Math.ceil(serializedLength / 2) + 500
  );
  const outputTokens = Math.max(
    1,
    Math.ceil(Number(maxOutputTokens ?? requestBody?.max_output_tokens ?? 800) || 800)
  );
  const estimate = estimateOpenAICost({
    model,
    usage: {
      inputTokens,
      cachedInputTokens: 0,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    }
  });

  if (String(estimate?.pricingSource || "").startsWith("unpriced_model:")) {
    return roundMoney(positiveNumber(
      process.env.ARI_BACKGROUND_UNKNOWN_CALL_RESERVATION_USD,
      DEFAULT_UNKNOWN_CALL_RESERVATION_USD
    ));
  }

  const raw = Math.max(0, Number(estimate?.estimatedCostUsd) || 0);
  const normalized = normalizeModelClass(model);
  const floor = normalized === "sol" ? 0.10 : normalized === "terra" ? 0.04 : 0.01;
  const hostedToolAllowance = estimateHostedToolAllowance(requestBody);
  const tokenReservation = Math.max(floor, raw * 1.15 + 0.005);
  return roundMoney(Math.min(5, tokenReservation + hostedToolAllowance));
}

export async function reserveBackgroundAiBudget({
  userId = null,
  requestCategory,
  model,
  requestBody = null,
  estimatedInputTokens = null,
  maxOutputTokens = null,
  now = new Date(),
  fetcher = fetch
} = {}) {
  const budgetUserId = normalizeUserId(userId);
  const config = supabaseConfig();
  const failClosed = String(process.env.ARI_BACKGROUND_BUDGET_FAIL_CLOSED ?? "true").trim().toLowerCase() !== "false";
  if (!config || !budgetUserId) {
    if (!failClosed) return { allowed: true, reservationId: null, reason: "reservation_bypassed" };
    throw budgetError("reservation_identity_or_store_unavailable");
  }

  const status = await getBackgroundAiBudgetStatus({ userId: budgetUserId, now, fetcher });
  if (!status.allowed) throw budgetError(status.reason, status);

  const estimatedCostUsd = estimateBackgroundReservationUsd({
    model,
    requestBody,
    estimatedInputTokens,
    maxOutputTokens
  });

  const response = await fetcher(`${config.url}/rest/v1/rpc/ari_reserve_background_ai_budget`, {
    method: "POST",
    headers: serverHeaders(config.key),
    body: JSON.stringify({
      p_user_id: budgetUserId,
      p_request_category: clean(requestCategory, 200) || "background",
      p_model: clean(model, 160) || "unknown",
      p_estimated_cost_usd: estimatedCostUsd,
      p_daily_limit_usd: status.dailyLimitUsd,
      p_monthly_limit_usd: status.monthlyLimitUsd,
      p_seed_daily_spend_usd: status.dailySpendUsd,
      p_seed_monthly_spend_usd: status.monthlySpendUsd
    }),
    signal: AbortSignal.timeout(5000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.allowed) {
    throw budgetError(clean(data?.reason, 160) || `reservation_http_${response.status}`, {
      ...status,
      ...(data && typeof data === "object" ? data : {})
    });
  }

  return {
    allowed: true,
    reservationId: data.reservationId || null,
    estimatedCostUsd,
    dailyCommittedUsd: Number(data.dailyCommittedUsd || status.dailyCommittedUsd || 0),
    monthlyCommittedUsd: Number(data.monthlyCommittedUsd || status.monthlyCommittedUsd || 0),
    userId: budgetUserId
  };
}

export async function settleBackgroundAiBudget({
  reservationId,
  model,
  responseData = {},
  costMultiplier = 1,
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(reservationId, 100);
  if (!config || !id) return { settled: false, reason: "reservation_missing" };

  const usage = extractOpenAIUsage(responseData);
  const estimate = estimateOpenAICost({ model, usage });
  const multiplier = Math.max(0, Number(costMultiplier) || 1);
  const actualCostUsd = roundMoney(
    (Number(estimate?.estimatedCostUsd) || 0) * multiplier +
    observedHostedToolCost(responseData)
  );

  try {
    const response = await fetcher(`${config.url}/rest/v1/rpc/ari_settle_background_ai_budget`, {
      method: "POST",
      headers: serverHeaders(config.key),
      body: JSON.stringify({
        p_reservation_id: id,
        p_actual_cost_usd: actualCostUsd
      }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json().catch(() => null);
    return response.ok
      ? { settled: data?.settled !== false, actualCostUsd, data }
      : { settled: false, reason: `http_${response.status}`, actualCostUsd };
  } catch {
    return { settled: false, reason: "reservation_settle_failed", actualCostUsd };
  }
}

export async function releaseBackgroundAiBudget({
  reservationId,
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(reservationId, 100);
  if (!config || !id) return { released: false, reason: "reservation_missing" };
  try {
    const response = await fetcher(`${config.url}/rest/v1/rpc/ari_release_background_ai_budget`, {
      method: "POST",
      headers: serverHeaders(config.key),
      body: JSON.stringify({ p_reservation_id: id }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json().catch(() => null);
    return response.ok
      ? { released: data?.released !== false, data }
      : { released: false, reason: `http_${response.status}` };
  } catch {
    return { released: false, reason: "reservation_release_failed" };
  }
}

export async function executeBackgroundOpenAIRequest({
  userId = null,
  endpoint,
  requestCategory,
  model,
  body,
  apiKey,
  url = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses",
  fetcher = fetch,
  signal = undefined,
  metadata = {},
  extraHeaders = {},
  costMultiplier = 1
} = {}) {
  const reservation = await reserveBackgroundAiBudget({
    userId,
    requestCategory,
    model,
    requestBody: body,
    maxOutputTokens: body?.max_output_tokens,
    fetcher
  });

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders
      },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {})
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await releaseBackgroundAiBudget({ reservationId: reservation.reservationId, fetcher }).catch(() => {});
      return { ok: false, status: response.status, headers: response.headers, data, reservation };
    }

    await recordBackgroundOpenAIUsage({
      userId: reservation.userId || userId,
      endpoint,
      requestCategory,
      model: data?.model || model,
      responseData: data,
      providerRequestId: data?.id || null,
      metadata
    }).catch(() => {});

    await settleBackgroundAiBudget({
      reservationId: reservation.reservationId,
      model: data?.model || model,
      responseData: data,
      costMultiplier,
      fetcher
    }).catch(() => {});

    return { ok: true, status: response.status, headers: response.headers, data, reservation };
  } catch (error) {
    await releaseBackgroundAiBudget({ reservationId: reservation.reservationId, fetcher }).catch(() => {});
    throw error;
  }
}

export async function recordBackgroundOpenAIUsage({
  userId = null,
  endpoint,
  requestCategory,
  model,
  responseData = {},
  providerRequestId = null,
  metadata = {}
} = {}) {
  return recordOpenAIUsage({
    userId: normalizeUserId(userId) || null,
    endpoint,
    usageType: "background",
    requestCategory,
    model,
    responseData,
    providerRequestId,
    metadata: {
      ...(metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}),
      background: true
    }
  });
}

function isBackgroundUsageRow(row = {}) {
  if (String(row?.usage_type || "").toLowerCase() === "background") return true;
  const category = String(row?.request_category || "").toLowerCase();
  return BACKGROUND_CATEGORY_PREFIXES.some((prefix) => category.startsWith(prefix));
}

function backgroundRowCost(row = {}) {
  const recorded = Math.max(0, Number(row?.estimated_cost_usd) || 0);
  const inputTokens = Math.max(0, Number(row?.input_tokens) || 0);
  const cachedInputTokens = Math.max(0, Number(row?.cached_input_tokens) || 0);
  const outputTokens = Math.max(0, Number(row?.output_tokens) || 0);
  const totalTokens = Math.max(0, Number(row?.total_tokens) || inputTokens + outputTokens);
  const pricingSource = String(row?.pricing_source || "");

  if (totalTokens > 0 && (recorded === 0 || pricingSource.startsWith("unpriced_model:"))) {
    const recalculated = estimateOpenAICost({
      model: row?.model || "",
      usage: { inputTokens, cachedInputTokens, outputTokens, totalTokens }
    });
    if (recalculated?.pricingSource && !String(recalculated.pricingSource).startsWith("unpriced_model:")) {
      return Math.max(0, Number(recalculated.estimatedCostUsd) || 0);
    }
  }
  return recorded;
}

function estimateHostedToolAllowance(body = null) {
  const tools = Array.isArray(body?.tools) ? body.tools : [];
  let allowance = 0;
  for (const tool of tools) {
    const type = clean(tool?.type, 80).toLowerCase();
    if (type === "web_search" || type === "web_search_preview") allowance += 0.05;
    else if (type === "file_search") allowance += 0.0125;
  }
  return allowance;
}

function observedHostedToolCost(responseData = {}) {
  let cost = 0;
  for (const item of Array.isArray(responseData?.output) ? responseData.output : []) {
    const type = clean(item?.type, 80).toLowerCase();
    if (type === "web_search_call") cost += 0.01;
    else if (type === "file_search_call") cost += 0.0025;
  }
  return cost;
}

function normalizeUserId(value) {
  const direct = clean(value, 200) || clean(process.env.ARI_OWNER_USER_ID, 200);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(direct)
    ? direct
    : "";
}
function normalizeModelClass(value) {
  const model = clean(value, 160).toLowerCase();
  if (model.includes("sol")) return "sol";
  if (model.includes("terra")) return "terra";
  return "luna";
}
function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}
function budgetError(reason, budget = null) {
  const error = new Error(`ARI background AI budget blocked: ${reason}`);
  error.code = "ARI_BACKGROUND_BUDGET_BLOCKED";
  error.budget = budget || { reason };
  return error;
}
function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100000000) / 100000000;
}
function safeJsonString(value) {
  try { return JSON.stringify(value ?? {}); } catch { return ""; }
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
