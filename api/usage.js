// ARI XP Usage API
// V3.0.0 — user quota + full-reasoning provider metering + owner-only cost summary.

import knowledgeHandler from "./knowledge.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const MAX_OWNER_ROWS = 10000;

export default async function handler(req, res) {
  // Production Vercel rewrites /api/knowledge here with ?mode=knowledge so
  // deep reasoning is metered without adding another serverless function.
  if (String(req?.query?.mode || "") === "knowledge") {
    return await handleMeteredKnowledge(req, res);
  }

  // Private owner dashboard uses the same function to preserve the lean API surface.
  if (req.method === "GET" && String(req?.query?.action || "") === "owner_costs") {
    return await handleOwnerCosts(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      user_id,
      action = "check",
      message = "",
      usage_type = "chat",
      model = "gpt-4o-mini"
    } = req.body || {};

    if (!user_id) return res.status(400).json({ error: "Missing user_id." });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase environment variables." });
    }

    const headers = serverHeaders();

    const profileRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user_id)}&select=is_admin,ai_unlimited,subscription_status,ai_daily_limit,ai_trial_ends_at`,
      { headers }
    );

    const profiles = await profileRes.json().catch(() => []);
    const profile = Array.isArray(profiles) ? profiles[0] : null;

    if (!profileRes.ok) {
      console.warn("[ARI Usage] Profile lookup failed; using standard free limits.", {
        status: profileRes.status,
        user_id
      });
    }

    const unlimited = Boolean(
      profile && (
        profile.is_admin ||
        profile.ai_unlimited ||
        profile.subscription_status === "active" ||
        (profile.ai_trial_ends_at && new Date(profile.ai_trial_ends_at) > new Date())
      )
    );

    const today = new Date().toISOString().split("T")[0];

    const usageRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${encodeURIComponent(user_id)}&created_at=gte.${today}T00:00:00.000Z&usage_type=eq.${encodeURIComponent(usage_type)}`,
      { headers }
    );

    const usageLogs = await usageRes.json().catch(() => []);
    const usedToday = Array.isArray(usageLogs) ? usageLogs.length : 0;
    const dailyLimit = Number(profile?.ai_daily_limit || 25);

    if (!unlimited && usedToday >= dailyLimit) {
      return res.status(200).json({
        allowed: false,
        unlimited: false,
        usedToday,
        dailyLimit,
        message: "You’ve reached today’s free AI limit."
      });
    }

    if (action === "log") {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id,
          message,
          model,
          usage_type,
          tokens_used: 0,
          cost_estimate: 0
        })
      });
    }

    return res.status(200).json({
      allowed: true,
      unlimited,
      usedToday: action === "log" ? usedToday + 1 : usedToday,
      dailyLimit,
      profileReady: Boolean(profile)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Usage API failed." });
  }
}

async function handleMeteredKnowledge(req, res) {
  let recorded = false;
  const requestCategory = resolveRequestCategory(req?.body);
  const userId = await resolveAuthenticatedUserId(req);

  let facade;
  facade = new Proxy(res, {
    get(target, property) {
      if (property === "status") {
        return (code) => {
          target.status(code);
          return facade;
        };
      }

      if (property === "json") {
        return async (payload) => {
          if (!recorded && payload?.success === true && payload?.modelInvocation?.usage) {
            recorded = true;
            await recordOpenAIUsage({
              userId,
              endpoint: "/api/knowledge",
              usageType: "reasoning",
              requestCategory,
              model:
                payload?.modelInvocation?.model ||
                payload?.modelInvocation?.configuredModel ||
                process.env.OPENAI_REASONING_MODEL ||
                process.env.OPENAI_MODEL ||
                "gpt-4.1-mini",
              responseData: {
                model: payload?.modelInvocation?.model,
                usage: payload?.modelInvocation?.usage
              },
              metadata: {
                finish_reason: payload?.modelInvocation?.finishReason || null,
                developer_reasoning: payload?.modelInvocation?.isDeveloperReasoning === true,
                max_output_tokens: Number(payload?.modelInvocation?.maxOutputTokens || 0),
                output_characters: Number(payload?.modelInvocation?.outputCharacters || 0),
                timing_ms: Number(payload?.timing?.totalMs || 0)
              }
            });
          }
          return target.json(payload);
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });

  return await knowledgeHandler(req, facade);
}

async function handleOwnerCosts(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) {
      return res.status(401).json({ error: "A signed-in ARI XP session is required." });
    }

    if (!(await isAppAdmin(user.id))) {
      return res.status(403).json({ error: "Owner access required." });
    }

    const rows = await loadProviderRows();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return res.status(200).json({
      success: true,
      generatedAt: new Date(now).toISOString(),
      telemetryOnly: true,
      windows: {
        last24h: aggregate(rows, now - day),
        last7d: aggregate(rows, now - 7 * day),
        last30d: aggregate(rows, now - 30 * day)
      },
      models: breakdown(rows, "model", now - 30 * day),
      endpoints: breakdown(rows, "endpoint", now - 30 * day),
      usageTypes: breakdown(rows, "usage_type", now - 30 * day),
      unattributed: aggregate(rows.filter((row) => !row.user_id), now - 30 * day)
    });
  } catch (error) {
    console.error("[ARI Owner AI Costs]", error);
    return res.status(500).json({ error: error?.message || "Could not load AI cost telemetry." });
  }
}

function resolveRequestCategory(body = {}) {
  const packet = body?.cognitivePacket || {};
  const domain = clean(packet?.situation?.domain || packet?.request?.domain || packet?.classification?.domain || packet?.domain || "", 80);
  const mode = clean(packet?.request?.mode || packet?.classification?.intent || packet?.intent || "", 80);
  if (domain && mode) return `${domain}:${mode}`.slice(0, 120);
  return (domain || mode || "cognitive_reasoning").slice(0, 120);
}

async function resolveAuthenticatedUserId(req) {
  const user = await getAuthenticatedUser(req).catch(() => null);
  return clean(user?.id, 100) || null;
}

async function getAuthenticatedUser(req) {
  const authorization = clean(req?.headers?.authorization, 5000);
  if (!/^Bearer\s+/i.test(authorization)) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const response = await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/, "")}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: authorization,
      Accept: "application/json"
    }
  });

  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return data?.id ? data : data?.user || null;
}

async function isAppAdmin(userId) {
  const params = new URLSearchParams({ select: "user_id", user_id: `eq.${userId}`, limit: "1" });
  const response = await fetch(
    `${String(process.env.SUPABASE_URL).replace(/\/+$/, "")}/rest/v1/ari_app_admins?${params.toString()}`,
    { headers: serverHeaders() }
  );
  if (!response.ok) return false;
  const data = await response.json().catch(() => []);
  return Array.isArray(data) && data.length > 0;
}

async function loadProviderRows() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: "user_id,endpoint,usage_type,request_category,model,input_tokens,cached_input_tokens,output_tokens,total_tokens,estimated_cost_usd,created_at",
    created_at: `gte.${since}`,
    order: "created_at.desc",
    limit: String(MAX_OWNER_ROWS)
  });
  const response = await fetch(
    `${String(process.env.SUPABASE_URL).replace(/\/+$/, "")}/rest/v1/ai_provider_usage_logs?${params.toString()}`,
    { headers: serverHeaders() }
  );
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data?.message || data?.error || "Provider usage query failed.");
  return Array.isArray(data) ? data : [];
}

function aggregate(rows, startMs) {
  const filtered = rows.filter((row) => new Date(row.created_at).getTime() >= startMs);
  const requests = filtered.length;
  const estimatedCostUsd = money(filtered.reduce((total, row) => total + number(row.estimated_cost_usd), 0));
  return {
    requests,
    inputTokens: sum(filtered, "input_tokens"),
    cachedInputTokens: sum(filtered, "cached_input_tokens"),
    outputTokens: sum(filtered, "output_tokens"),
    totalTokens: sum(filtered, "total_tokens"),
    estimatedCostUsd,
    averageCostPerRequestUsd: requests ? money(estimatedCostUsd / requests) : 0
  };
}

function breakdown(rows, key, startMs) {
  const groups = new Map();
  for (const row of rows) {
    if (new Date(row.created_at).getTime() < startMs) continue;
    const name = clean(row?.[key], 160) || "unknown";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  return [...groups.entries()]
    .map(([name, groupRows]) => ({ name, ...aggregate(groupRows, startMs) }))
    .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd || b.requests - a.requests);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + number(row?.[key]), 0);
}
function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function money(value) {
  return Number(number(value).toFixed(8));
}
function serverHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}
function clean(value = "", max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
