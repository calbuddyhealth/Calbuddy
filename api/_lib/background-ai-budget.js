import { recordOpenAIUsage } from "./ai-provider-usage.js";

const DEFAULT_DAILY_BUDGET_USD = 1.00;
const DEFAULT_MONTHLY_BUDGET_USD = 20.00;
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

export async function getBackgroundAiBudgetStatus({ now = new Date(), fetcher = fetch } = {}) {
  const dailyLimitUsd = positiveNumber(process.env.ARI_BACKGROUND_DAILY_BUDGET_USD, DEFAULT_DAILY_BUDGET_USD);
  const monthlyLimitUsd = positiveNumber(process.env.ARI_BACKGROUND_MONTHLY_BUDGET_USD, DEFAULT_MONTHLY_BUDGET_USD);
  const failClosed = String(process.env.ARI_BACKGROUND_BUDGET_FAIL_CLOSED ?? "true").trim().toLowerCase() !== "false";

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      allowed: !failClosed,
      reason: "usage_ledger_unavailable",
      dailySpendUsd: 0,
      monthlySpendUsd: 0,
      dailyLimitUsd,
      monthlyLimitUsd
    };
  }

  const clock = validDate(now);
  const dayStart = new Date(clock);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), 1));

  try {
    const params = new URLSearchParams({
      select: "created_at,usage_type,request_category,estimated_cost_usd",
      created_at: `gte.${monthStart.toISOString()}`,
      order: "created_at.asc",
      limit: "5000"
    });
    const response = await fetcher(`${process.env.SUPABASE_URL}/rest/v1/ai_provider_usage_logs?${params.toString()}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    if (!response.ok) throw new Error(`usage_ledger_${response.status}`);
    const rows = await response.json().catch(() => []);
    let dailySpendUsd = 0;
    let monthlySpendUsd = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!isBackgroundUsageRow(row)) continue;
      const cost = Math.max(0, Number(row?.estimated_cost_usd) || 0);
      monthlySpendUsd += cost;
      const created = Date.parse(String(row?.created_at || ""));
      if (Number.isFinite(created) && created >= dayStart.getTime()) dailySpendUsd += cost;
    }

    dailySpendUsd = roundMoney(dailySpendUsd);
    monthlySpendUsd = roundMoney(monthlySpendUsd);
    const dailyBlocked = dailySpendUsd >= dailyLimitUsd;
    const monthlyBlocked = monthlySpendUsd >= monthlyLimitUsd;
    return {
      allowed: !(dailyBlocked || monthlyBlocked),
      reason: dailyBlocked ? "daily_budget_reached" : monthlyBlocked ? "monthly_budget_reached" : "within_budget",
      dailySpendUsd,
      monthlySpendUsd,
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
      dailyLimitUsd,
      monthlyLimitUsd
    };
  }
}

export async function assertBackgroundAiBudget(options = {}) {
  const status = await getBackgroundAiBudgetStatus(options);
  if (status.allowed) return status;
  const error = new Error(`ARI background AI budget blocked: ${status.reason}`);
  error.code = "ARI_BACKGROUND_BUDGET_BLOCKED";
  error.budget = status;
  throw error;
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
    userId,
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
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
