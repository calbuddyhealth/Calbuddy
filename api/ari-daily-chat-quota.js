import {
  loadDailyChatQuota,
  publicDailyChatQuota,
  saveDailyChatTimezone
} from "./_lib/ari-vnext/daily-chat-quota.js";

const AUTH_TIMEOUT_MS = 3500;

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(auth.status || 401).json({
      success: false,
      code: auth.code || "AUTH_REQUIRED",
      error: auth.message || "Authentication required."
    });
  }

  try {
    let timezoneUpdate = null;
    if (req.method === "POST") {
      const body = resolveBody(req);
      timezoneUpdate = await saveDailyChatTimezone({
        userId: auth.userId,
        timezone: body?.timezone
      });
    }

    const quota = await loadDailyChatQuota({ userId: auth.userId });
    return res.status(200).json({
      success: true,
      quota: publicDailyChatQuota(quota),
      timezoneUpdate
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      code: "ARI_QUOTA_UNAVAILABLE",
      error: error?.message || "Ari quota service is temporarily unavailable."
    });
  }
}

async function authenticateRequest(req) {
  const authorization = String(req?.headers?.authorization || "").trim().slice(0, 5000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = String(match?.[1] || "").trim().slice(0, 5000);
  if (!accessToken) {
    return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = String(
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  if (!supabaseUrl || !apiKey) {
    return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: controller.signal,
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = String(user?.id || "").trim();
    if (!response.ok || !userId) {
      return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    }
    return { authenticated: true, userId };
  } catch (error) {
    return {
      authenticated: false,
      status: 503,
      code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED",
      message: "ARI could not verify the signed-in session."
    };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
