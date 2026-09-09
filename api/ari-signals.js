import {
  ARI_SIGNALS_VERSION,
  listAriSignals,
  loadAriSignalPreferences,
  registerAriPushDevice,
  saveAriSignalPreferences,
  updateAriSignal
} from "./_lib/ari-vnext/ari-signals.js";
import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";

const OWNER_SIGNALS_VERSION = "2.0.0-owner";

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_signals" });
  }

  const owner = await verifyOwnerRequest(req);
  if (!owner.authorized) {
    return sendOwnerAuthorizationError(res, owner);
  }

  const userId = owner.user.id;

  if (req.method === "GET") {
    const [rawSignals, preferences] = await Promise.all([
      listAriSignals({ userId, limit: 40 }),
      loadAriSignalPreferences({ userId })
    ]);
    const signals = rawSignals
      .map(enrichOwnerSignal)
      .filter((signal) => signal.status !== "dismissed" && !signal.expired)
      .sort(compareSignals);

    return res.status(200).json({
      success: true,
      version: OWNER_SIGNALS_VERSION,
      engineVersion: ARI_SIGNALS_VERSION,
      ownerMode: true,
      signals,
      unreadCount: signals.filter((signal) => signal.unread).length,
      attentionCount: signals.filter((signal) => signal.attention === "act_now").length,
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
    const result = await updateAriSignal({ userId, signalId: body?.signalId, action });
    return res.status(result.success ? 200 : 400).json({ ...result, version: OWNER_SIGNALS_VERSION, ownerMode: true, source: "ari_signals" });
  }

  if (action === "preferences") {
    const result = await saveAriSignalPreferences({ userId, preferences: body?.preferences || {} });
    return res.status(result.success ? 200 : 400).json({ ...result, version: OWNER_SIGNALS_VERSION, ownerMode: true, source: "ari_signals" });
  }

  if (action === "register-device") {
    const result = await registerAriPushDevice({
      userId,
      token: body?.token,
      platform: body?.platform || "ios",
      appId: body?.appId || "com.arixp.app"
    });
    return res.status(result.success ? 200 : 400).json({ ...result, version: OWNER_SIGNALS_VERSION, ownerMode: true, source: "ari_signals" });
  }

  return res.status(400).json({ success: false, code: "SIGNAL_ACTION_UNSUPPORTED", error: "Unsupported Ari Signal action.", source: "ari_signals" });
}

function enrichOwnerSignal(signal = {}) {
  const priority = clean(signal.priority, 30).toLowerCase();
  const reason = clean(signal.reasonId, 200).toLowerCase();
  const action = clean(signal.action, 120);
  const followUpPrompt = clean(signal.followUpPrompt, 1000);
  const category = classifyOwnerCategory({ reason, action, fallback: signal.category });
  const actionable = Boolean(action || followUpPrompt) || ["workflow", "approval", "question"].includes(category);
  const score = attentionScore({ priority, category, actionable, unread: signal.unread === true });
  const attention = score >= 85 ? "act_now" : score >= 60 ? "watch" : "background";
  const expiresAt = signal.expiresAt || null;
  const expired = expiresAt ? Date.parse(expiresAt) <= Date.now() : false;

  return {
    ...signal,
    category,
    ownerOnly: true,
    actionable,
    score,
    attention,
    whyNow: buildWhyNow({ category, priority, actionable }),
    nextAction: action || (followUpPrompt ? "continue_conversation" : "review"),
    expired
  };
}

function classifyOwnerCategory({ reason, action, fallback }) {
  const text = `${reason} ${String(action || "").toLowerCase()}`;
  if (/fail|error|retry|cancel|pending|confirm|tool|log|workflow|transaction/.test(text)) return "workflow";
  if (/approval|permission|authorize/.test(text)) return "approval";
  if (/question|missing|clarif|input/.test(text)) return "question";
  if (/experiment|prediction|review_due|result/.test(text)) return "experiment_result";
  if (/regression|system|diagnostic|health|reliability/.test(text)) return "system";
  if (/world_model|adherence|weight|recovery|trend|change/.test(text)) return "pattern";
  return clean(fallback, 40) || "insight";
}

function attentionScore({ priority, category, actionable, unread }) {
  let score = priority === "high" ? 78 : priority === "medium" ? 54 : priority === "positive" ? 45 : 32;
  if (category === "workflow" || category === "approval") score += 14;
  else if (category === "system") score += 10;
  else if (category === "question" || category === "experiment_result") score += 7;
  if (actionable) score += 6;
  if (unread) score += 3;
  return Math.min(100, Math.max(0, score));
}

function buildWhyNow({ category, priority, actionable }) {
  if (category === "workflow") return "An Ari action or workflow needs resolution.";
  if (category === "approval") return "Ari is waiting for an owner decision before acting.";
  if (category === "system") return "A reliability or diagnostic change may affect Ari behavior.";
  if (category === "experiment_result") return "A tracked experiment or prediction has new information.";
  if (category === "pattern") return "A meaningful pattern changed enough to be worth reviewing.";
  if (category === "question") return "Ari needs owner input to resolve uncertainty.";
  if (priority === "high") return "A high-priority change deserves owner attention.";
  return actionable ? "There is a concrete next step available." : "Ari noticed something potentially useful.";
}

function compareSignals(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return Date.parse(b.surfacedAt || 0) - Date.parse(a.surfacedAt || 0);
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
  setOwnerSecurityHeaders(res);
  res.setHeader("X-ARI-Signals", OWNER_SIGNALS_VERSION);
  res.setHeader("X-ARI-Signals-Mode", "owner-only");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
