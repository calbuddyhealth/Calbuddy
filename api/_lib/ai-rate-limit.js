// ARI XP — server-side AI abuse guard
// Uses the provider usage ledger as a lightweight per-user rolling window.
// This is intentionally generous for normal use and blocks obvious hammering.

function clean(value = "", max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function safePositiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function normalizeRules(rules = []) {
  return (Array.isArray(rules) ? rules : [])
    .map((rule) => ({
      windowSeconds: safePositiveInt(rule?.windowSeconds, 60),
      maxRequests: safePositiveInt(rule?.maxRequests, 30)
    }))
    .filter((rule) => rule.windowSeconds > 0 && rule.maxRequests > 0)
    .sort((a, b) => b.windowSeconds - a.windowSeconds);
}

export async function enforceAiRateLimit({ userId, endpoint, rules = [] } = {}) {
  const safeUserId = clean(userId, 80);
  const safeEndpoint = clean(endpoint, 180);
  const safeRules = normalizeRules(rules);

  if (!safeUserId || !safeEndpoint || !safeRules.length) {
    return { allowed: true, retryAfterSeconds: 0, reason: "not_configured" };
  }

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);

  // If telemetry storage is unavailable, preserve app availability rather than
  // turning an infrastructure issue into a user lockout.
  if (!supabaseUrl || !serviceKey) {
    console.warn("[ARI AI Rate Limit] Supabase service credentials unavailable; limiter skipped.");
    return { allowed: true, retryAfterSeconds: 0, reason: "storage_unavailable" };
  }

  const largestWindow = safeRules[0].windowSeconds;
  const largestRequestCap = Math.max(...safeRules.map((rule) => rule.maxRequests));
  const since = new Date(Date.now() - largestWindow * 1000).toISOString();

  const params = new URLSearchParams({
    select: "created_at",
    user_id: `eq.${safeUserId}`,
    endpoint: `eq.${safeEndpoint}`,
    created_at: `gte.${since}`,
    order: "created_at.desc",
    limit: String(Math.min(largestRequestCap + 1, 1000))
  });

  let response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/ai_provider_usage_logs?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json"
      }
    });
  } catch (error) {
    console.warn("[ARI AI Rate Limit] Usage lookup failed:", error?.message || error);
    return { allowed: true, retryAfterSeconds: 0, reason: "lookup_failed" };
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.warn("[ARI AI Rate Limit] Usage lookup rejected:", response.status, errorText.slice(0, 300));
    return { allowed: true, retryAfterSeconds: 0, reason: "lookup_rejected" };
  }

  const rows = await response.json().catch(() => []);
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => Date.parse(row?.created_at || ""))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  const now = Date.now();

  for (const rule of safeRules) {
    const threshold = now - rule.windowSeconds * 1000;
    const withinWindow = timestamps.filter((timestamp) => timestamp >= threshold);

    if (withinWindow.length >= rule.maxRequests) {
      const oldestRelevant = withinWindow[withinWindow.length - 1] || now;
      const retryAt = oldestRelevant + rule.windowSeconds * 1000;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
        reason: "user_rate_limit",
        windowSeconds: rule.windowSeconds,
        maxRequests: rule.maxRequests
      };
    }
  }

  return { allowed: true, retryAfterSeconds: 0, reason: "within_limit" };
}
