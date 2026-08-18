import { buildGrowthInbox } from "./_lib/ari-vnext/growth-inbox.js";
import {
  overlayGrowthFixState,
  syncGrowthFixCandidates,
  updateGrowthFix
} from "./_lib/ari-vnext/growth-fixes.js";

const AUTH_TIMEOUT_MS = 3200;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_growth" });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_growth"
      });
    }
    const owner = await verifyOwner(auth.userId);
    if (!owner) {
      return res.status(403).json({ success: false, error: "Owner access required.", code: "OWNER_ACCESS_REQUIRED", source: "ari_vnext_growth" });
    }

    if (req.method === "POST") {
      const body = resolveBody(req);
      const action = clean(body?.action, 80).toLowerCase();
      if (action !== "set_fix_status") {
        return res.status(400).json({ success: false, error: "Unsupported growth action.", code: "GROWTH_ACTION_UNSUPPORTED" });
      }
      const update = await updateGrowthFix({
        userId: auth.userId,
        fingerprint: clean(body?.fingerprint, 300),
        status: clean(body?.status, 40),
        regressionTestId: clean(body?.regressionTestId, 300) || null,
        fixCommitSha: clean(body?.fixCommitSha, 80) || null,
        verification: body?.verification && typeof body.verification === "object" ? body.verification : null
      });
      if (!update.success) return res.status(409).json({ ...update, source: "ari_vnext_growth" });
    }

    const reflections = await fetchPeerReflections(auth.userId, 30);
    const rawInbox = buildGrowthInbox(reflections);
    const fixes = await syncGrowthFixCandidates({ userId: auth.userId, inbox: rawInbox });
    const inbox = overlayGrowthFixState(rawInbox, fixes);

    return res.status(200).json({
      success: true,
      ...inbox,
      source: "ari_vnext_growth"
    });
  } catch (error) {
    console.warn("[ARI vNext Growth]", error?.message || error);
    return res.status(200).json({
      success: true,
      version: "1.2.0",
      summary: { total: 0, helpAri: 0, watch: 0, ariHandles: 0, repeatedAreas: [], fixCandidates: 0, verifiedFixed: 0, reopened: 0 },
      items: [],
      fixes: [],
      unavailable: true,
      source: "ari_vnext_growth"
    });
  }
}

async function fetchPeerReflections(userId, limit = 30) {
  const config = supabaseConfig();
  if (!config) return [];

  const params = new URLSearchParams({
    select: "id,content,tags,created_at,updated_at",
    user_id: `eq.${userId}`,
    memory_type: "eq.peer_reflection",
    order: "updated_at.desc",
    limit: String(Math.max(1, Math.min(50, Number(limit) || 30)))
  });

  const response = await fetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, {
    headers: serverHeaders(config.key)
  });
  if (!response.ok) return [];
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function verifyOwner(userId) {
  const config = supabaseConfig();
  if (!config || !userId) return false;
  const params = new URLSearchParams({
    id: `eq.${userId}`,
    select: "owner_access,is_admin",
    limit: "1"
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/profiles?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return false;
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row?.owner_access === true || row?.is_admin === true;
  } catch {
    return false;
  }
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 6000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = clean(user?.id, 200);
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    return { authenticated: true, userId };
  } catch (error) {
    return {
      authenticated: false,
      status: 503,
      code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED",
      message: "ARI could not verify the signed-in session."
    };
  } finally {
    clearTimeout(timeoutId);
  }
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

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Growth-Inbox", "v2");
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
