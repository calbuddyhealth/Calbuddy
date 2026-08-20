import {
  ARI_SIGNALS_VERSION,
  listAriSignals,
  loadAriSignalPreferences,
  registerAriPushDevice,
  saveAriSignalPreferences,
  updateAriSignal
} from "./_lib/ari-vnext/ari-signals.js";

const AUTH_TIMEOUT_MS = 3500;

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_signals" });
  }

  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(auth.status || 401).json({ success: false, error: auth.message, code: auth.code, source: "ari_signals" });
  }

  if (req.method === "GET") {
    const [signals, preferences] = await Promise.all([
      listAriSignals({ userId: auth.userId, limit: 40 }),
      loadAriSignalPreferences({ userId: auth.userId })
    ]);
    return res.status(200).json({
      success: true,
      version: ARI_SIGNALS_VERSION,
      signals,
      unreadCount: signals.filter((signal) => signal.unread).length,
      preferences,
      nativePush: {
        supported: true,
        serverConfigured: apnsServerConfigured()
      },
      source: "ari_signals"
    });
  }

  const body = resolveBody(req);
  const action = clean(body?.action, 40).toLowerCase();

  if (action === "engage" || action === "dismiss") {
    const result = await updateAriSignal({
      userId: auth.userId,
      signalId: body?.signalId,
      action
    });
    return res.status(result.success ? 200 : 400).json({ ...result, version: ARI_SIGNALS_VERSION, source: "ari_signals" });
  }

  if (action === "preferences") {
    const result = await saveAriSignalPreferences({
      userId: auth.userId,
      preferences: body?.preferences || {}
    });
    return res.status(result.success ? 200 : 400).json({ ...result, version: ARI_SIGNALS_VERSION, source: "ari_signals" });
  }

  if (action === "register-device") {
    const result = await registerAriPushDevice({
      userId: auth.userId,
      token: body?.token,
      platform: body?.platform || "ios",
      appId: body?.appId || "com.arixp.app"
    });
    return res.status(result.success ? 200 : 400).json({ ...result, version: ARI_SIGNALS_VERSION, source: "ari_signals" });
  }

  return res.status(400).json({ success: false, code: "SIGNAL_ACTION_UNSUPPORTED", error: "Unsupported Ari Signal action.", source: "ari_signals" });
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
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

function apnsServerConfigured() {
  return Boolean(
    clean(process.env.APNS_TEAM_ID, 100) &&
    clean(process.env.APNS_KEY_ID, 100) &&
    clean(process.env.APNS_AUTH_KEY, 10000) &&
    clean(process.env.APNS_BUNDLE_ID || "com.arixp.app", 200)
  );
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
  res.setHeader("X-ARI-Signals", ARI_SIGNALS_VERSION);
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
