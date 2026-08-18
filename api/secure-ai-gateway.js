// ARI XP — compatibility-safe AI abuse gateway
// Protects legacy AI routes without changing the submitted native client's
// request contract. This is a budget/abuse guard, not a replacement for auth.

import intentRouterHandler from "./ari-intent-router.js";
import askCalbuddyHandler from "./ask-calbuddy.js";
import usageHandler from "./usage.js";

const ROUTE_LIMITS = Object.freeze({
  intent: {
    endpoint: "/api/ari-intent-router",
    windows: [
      { seconds: 60, requests: 180 },
      { seconds: 3600, requests: 3000 }
    ]
  },
  ask: {
    endpoint: "/api/ask-calbuddy",
    windows: [
      { seconds: 60, requests: 60 },
      { seconds: 3600, requests: 1000 }
    ]
  },
  knowledge: {
    endpoint: "/api/knowledge",
    windows: [
      { seconds: 60, requests: 40 },
      { seconds: 3600, requests: 600 }
    ]
  }
});

export default async function handler(req, res) {
  setSecurityHeaders(res);

  const route = clean(req?.query?.route, 40).toLowerCase();

  if (route === "intent") {
    if (!(await allowRoute(req, res, ROUTE_LIMITS.intent))) return;
    return await intentRouterHandler(req, res);
  }

  if (route === "ask") {
    if (!(await allowRoute(req, res, ROUTE_LIMITS.ask))) return;
    return await askCalbuddyHandler(req, res);
  }

  if (route === "knowledge") {
    if (!(await allowRoute(req, res, ROUTE_LIMITS.knowledge))) return;
    req.query = { ...(req.query || {}), mode: "knowledge" };
    return await usageHandler(req, res);
  }

  if (route === "usage") {
    if (String(req?.query?.mode || "") === "knowledge") {
      if (!(await allowRoute(req, res, ROUTE_LIMITS.knowledge))) return;
    }
    return await usageHandler(req, res);
  }

  return res.status(404).json({
    error: "Unknown ARI AI gateway route.",
    code: "AI_GATEWAY_ROUTE_NOT_FOUND"
  });
}

async function allowRoute(req, res, config) {
  if (!config?.endpoint || !Array.isArray(config.windows)) return true;

  // Only requests capable of invoking provider work consume the gateway budget.
  // Downstream handlers retain their own method/input validation.
  if (req.method !== "POST") return true;

  for (const window of config.windows) {
    const result = await takeBucket({
      bucketKey: "global",
      endpoint: config.endpoint,
      windowSeconds: window.seconds,
      maxRequests: window.requests
    });

    if (result?.allowed === false) {
      const retryAfter = Math.max(1, Number(result.retry_after_seconds || 1));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "ARI is receiving too many requests right now. Try again shortly.",
        code: "ARI_AI_RATE_LIMITED",
        retryAfterSeconds: retryAfter
      });
    }
  }

  return true;
}

async function takeBucket({ bucketKey, endpoint, windowSeconds, maxRequests }) {
  const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);

  // Preserve availability if the limiter's own storage is temporarily down.
  // The gateway is defense-in-depth; downstream auth/validation still applies.
  if (!supabaseUrl || !serviceKey) {
    console.warn("[ARI AI Gateway] Supabase limiter credentials unavailable.");
    return { allowed: true, limiterUnavailable: true };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/ari_server_rate_limit`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        requested_bucket_key: clean(bucketKey, 200),
        requested_endpoint: clean(endpoint, 180),
        requested_window_seconds: Number(windowSeconds),
        requested_max_requests: Number(maxRequests)
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || typeof data.allowed !== "boolean") {
      console.warn("[ARI AI Gateway] Rate limiter rejected request:", response.status);
      return { allowed: true, limiterUnavailable: true };
    }

    return data;
  } catch (error) {
    console.warn("[ARI AI Gateway] Rate limiter failed:", error?.message || error);
    return { allowed: true, limiterUnavailable: true };
  }
}

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function clean(value = "", max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
