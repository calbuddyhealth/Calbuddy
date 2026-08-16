// ARI XP — server-side AI provider usage ledger
// Keeps provider cost accounting separate from user-facing quota accounting.

const OPENAI_STANDARD_RATES_USD_PER_MILLION = {
  "gpt-4o-mini": { input: 0.15, cachedInput: 0.075, output: 0.60 },
  "gpt-4.1-mini": { input: 0.40, cachedInput: 0.10, output: 1.60 },
  "gpt-4o": { input: 2.50, cachedInput: 1.25, output: 10.00 }
};

function clean(value = "", max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function safeInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function safeRate(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeModel(model = "") {
  const value = clean(model, 180).toLowerCase();
  if (!value) return "unknown";

  // Snapshot IDs inherit their alias pricing unless explicitly overridden.
  for (const alias of Object.keys(OPENAI_STANDARD_RATES_USD_PER_MILLION)) {
    if (value === alias || value.startsWith(`${alias}-`)) return alias;
  }

  return value;
}

function resolveRates(model = "") {
  const normalized = normalizeModel(model);
  const known = OPENAI_STANDARD_RATES_USD_PER_MILLION[normalized];

  if (known) {
    return {
      ...known,
      pricingSource: `openai_standard_2026-08-16:${normalized}`
    };
  }

  // Unknown/new model aliases can be priced without a code deploy by setting
  // these Vercel environment variables to USD per 1M tokens.
  const envInput = safeRate(process.env.ARI_OPENAI_INPUT_USD_PER_MILLION);
  const envCached = safeRate(process.env.ARI_OPENAI_CACHED_INPUT_USD_PER_MILLION);
  const envOutput = safeRate(process.env.ARI_OPENAI_OUTPUT_USD_PER_MILLION);

  if (envInput !== null && envOutput !== null) {
    return {
      input: envInput,
      cachedInput: envCached ?? envInput,
      output: envOutput,
      pricingSource: "vercel_env_override"
    };
  }

  return {
    input: 0,
    cachedInput: 0,
    output: 0,
    pricingSource: `unpriced_model:${normalized}`
  };
}

export function extractOpenAIUsage(data = {}) {
  const usage = data?.usage || {};

  const inputTokens = safeInt(
    usage.prompt_tokens ??
    usage.input_tokens ??
    usage.inputTokens
  );
  const outputTokens = safeInt(
    usage.completion_tokens ??
    usage.output_tokens ??
    usage.outputTokens
  );
  const cachedInputTokens = Math.min(
    inputTokens,
    safeInt(
      usage?.prompt_tokens_details?.cached_tokens ??
      usage?.input_tokens_details?.cached_tokens ??
      usage?.input_tokens_details?.cached_input_tokens ??
      usage.cached_input_tokens
    )
  );
  const totalTokens = safeInt(usage.total_tokens) || inputTokens + outputTokens;

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens
  };
}

export function estimateOpenAICost({ model = "", usage = {} } = {}) {
  const rates = resolveRates(model);
  const inputTokens = safeInt(usage.inputTokens);
  const cachedInputTokens = Math.min(inputTokens, safeInt(usage.cachedInputTokens));
  const uncachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const outputTokens = safeInt(usage.outputTokens);

  const cost =
    (uncachedInputTokens / 1_000_000) * rates.input +
    (cachedInputTokens / 1_000_000) * rates.cachedInput +
    (outputTokens / 1_000_000) * rates.output;

  return {
    estimatedCostUsd: Number(cost.toFixed(8)),
    pricingSource: rates.pricingSource,
    rates
  };
}

export async function recordOpenAIUsage({
  userId = null,
  endpoint,
  usageType = "chat",
  requestCategory = null,
  model,
  responseData = {},
  providerRequestId = null,
  metadata = {}
} = {}) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("[ARI AI Cost] Supabase service credentials unavailable; provider usage not recorded.");
      return null;
    }

    const resolvedModel = clean(responseData?.model || model || "unknown", 180) || "unknown";
    const usage = extractOpenAIUsage(responseData);
    const cost = estimateOpenAICost({ model: resolvedModel, usage });

    const row = {
      user_id: userId || null,
      provider: "openai",
      endpoint: clean(endpoint || "unknown", 180) || "unknown",
      usage_type: clean(usageType || "chat", 80) || "chat",
      request_category: clean(requestCategory || "", 120) || null,
      model: resolvedModel,
      input_tokens: usage.inputTokens,
      cached_input_tokens: usage.cachedInputTokens,
      output_tokens: usage.outputTokens,
      total_tokens: usage.totalTokens,
      estimated_cost_usd: cost.estimatedCostUsd,
      provider_request_id: clean(providerRequestId || responseData?.id || "", 220) || null,
      pricing_source: cost.pricingSource,
      metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}
    };

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_provider_usage_logs`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn("[ARI AI Cost] Provider usage insert failed:", response.status, errorText.slice(0, 500));
      return null;
    }

    return {
      ...usage,
      estimatedCostUsd: cost.estimatedCostUsd,
      pricingSource: cost.pricingSource,
      model: resolvedModel
    };
  } catch (error) {
    // Cost telemetry must never break a user-facing ARI response.
    console.warn("[ARI AI Cost] Provider usage recording failed:", error?.message || error);
    return null;
  }
}
