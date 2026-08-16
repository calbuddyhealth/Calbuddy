// ARI XP — Owner-only AI provider cost summary.
// Aggregates server-side provider telemetry without exposing user prompts.

const MAX_ROWS = 10000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) {
      return res.status(401).json({ error: "A signed-in ARI XP session is required." });
    }

    if (!(await isAppAdmin(user.id))) {
      return res.status(403).json({ error: "Owner access required." });
    }

    const rows = await loadUsageRows();
    const now = Date.now();

    return res.status(200).json({
      success: true,
      generatedAt: new Date(now).toISOString(),
      telemetryOnly: true,
      note: "Provider-cost telemetry only. This endpoint does not change user quotas or subscriptions.",
      windows: {
        last24h: aggregate(rows, now - 24 * 60 * 60 * 1000),
        last7d: aggregate(rows, now - 7 * 24 * 60 * 60 * 1000),
        last30d: aggregate(rows, now - 30 * 24 * 60 * 60 * 1000)
      },
      models: breakdown(rows, "model", now - 30 * 24 * 60 * 60 * 1000),
      endpoints: breakdown(rows, "endpoint", now - 30 * 24 * 60 * 60 * 1000),
      usageTypes: breakdown(rows, "usage_type", now - 30 * 24 * 60 * 60 * 1000),
      unattributed: aggregate(
        rows.filter((row) => !row.user_id),
        now - 30 * 24 * 60 * 60 * 1000
      )
    });
  } catch (error) {
    console.error("[ARI Owner AI Costs]", error);
    return res.status(500).json({ error: error?.message || "Could not load AI cost telemetry." });
  }
}

async function getAuthenticatedUser(req) {
  const authorization = clean(req?.headers?.authorization, 5000);
  if (!/^Bearer\s+/i.test(authorization)) return null;

  const response = await fetch(`${required("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: serviceKey(),
      Authorization: authorization,
      Accept: "application/json"
    }
  });

  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return data?.id ? data : data?.user || null;
}

async function isAppAdmin(userId) {
  const params = new URLSearchParams({
    select: "user_id",
    user_id: `eq.${userId}`,
    limit: "1"
  });

  const response = await fetch(
    `${required("SUPABASE_URL")}/rest/v1/ari_app_admins?${params.toString()}`,
    { headers: serverHeaders() }
  );

  if (!response.ok) return false;
  const data = await response.json().catch(() => []);
  return Array.isArray(data) && data.length > 0;
}

async function loadUsageRows() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: "user_id,endpoint,usage_type,request_category,model,input_tokens,cached_input_tokens,output_tokens,total_tokens,estimated_cost_usd,created_at",
    created_at: `gte.${since}`,
    order: "created_at.desc",
    limit: String(MAX_ROWS)
  });

  const response = await fetch(
    `${required("SUPABASE_URL")}/rest/v1/ai_provider_usage_logs?${params.toString()}`,
    { headers: serverHeaders() }
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Provider usage query failed.");
  }

  return Array.isArray(data) ? data : [];
}

function aggregate(rows, startMs) {
  const filtered = rows.filter((row) => new Date(row.created_at).getTime() >= startMs);
  const requests = filtered.length;
  const inputTokens = sum(filtered, "input_tokens");
  const cachedInputTokens = sum(filtered, "cached_input_tokens");
  const outputTokens = sum(filtered, "output_tokens");
  const totalTokens = sum(filtered, "total_tokens");
  const estimatedCostUsd = money(filtered.reduce((total, row) => total + number(row.estimated_cost_usd), 0));

  return {
    requests,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
    averageCostPerRequestUsd: requests ? money(estimatedCostUsd / requests) : 0
  };
}

function breakdown(rows, key, startMs) {
  const groups = new Map();

  for (const row of rows) {
    if (new Date(row.created_at).getTime() < startMs) continue;
    const name = clean(row?.[key], 160) || "unknown";
    const current = groups.get(name) || [];
    current.push(row);
    groups.set(name, current);
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
  const key = serviceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

function serviceKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

function required(name) {
  const value = clean(process.env[name], 10000);
  if (!value) throw new Error(`Missing ${name}.`);
  return value.replace(name === "SUPABASE_URL" ? /\/+$/ : /$^/, "");
}

function clean(value = "", max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
