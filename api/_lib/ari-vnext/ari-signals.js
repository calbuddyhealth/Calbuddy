import { connect } from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

export const ARI_SIGNALS_VERSION = "1.0.0";
const INITIATIVE_TABLE = "ari_vnext_initiative_events";
const PREF_TABLE = "ari_signal_preferences";
const DEVICE_TABLE = "ari_push_devices";
const DEFAULT_PREFS = Object.freeze({
  inAppEnabled: true,
  pushEnabled: false,
  quietHoursEnabled: true,
  quietStart: "22:00",
  quietEnd: "07:00",
  timezone: "America/Los_Angeles",
  pushCategories: ["insight", "question", "experiment_result", "change", "approval"]
});

let cachedApnsJwt = null;
let cachedApnsJwtAt = 0;

export async function listAriSignals({ userId, limit = 30 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,initiative_key,reason_id,priority,status,payload,surfaced_at,engaged_at,dismissed_at,expires_at,updated_at",
    order: "surfaced_at.desc",
    limit: String(clampInt(limit, 1, 60, 30))
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/${INITIATIVE_TABLE}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return (Array.isArray(rows) ? rows : []).map(signalFromRow).filter(Boolean);
  } catch {
    return [];
  }
}

export async function updateAriSignal({ userId, signalId, action } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const eventId = clean(signalId, 200);
  const nextAction = clean(action, 30).toLowerCase();
  if (!config || !id || !eventId || !["engage", "dismiss"].includes(nextAction)) {
    return { success: false, code: "INVALID_SIGNAL_UPDATE" };
  }
  const now = new Date().toISOString();
  const patch = nextAction === "engage"
    ? { status: "engaged", engaged_at: now, updated_at: now }
    : { status: "dismissed", dismissed_at: now, updated_at: now };
  const params = new URLSearchParams({ id: `eq.${eventId}`, user_id: `eq.${id}` });
  try {
    const response = await fetch(`${config.url}/rest/v1/${INITIATIVE_TABLE}?${params}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(patch)
    });
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return response.ok && row
      ? { success: true, signal: signalFromRow(row) }
      : { success: false, code: "SIGNAL_UPDATE_FAILED" };
  } catch {
    return { success: false, code: "SIGNAL_UPDATE_FAILED" };
  }
}

export async function loadAriSignalPreferences({ userId } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { ...DEFAULT_PREFS };
  const params = new URLSearchParams({ user_id: `eq.${id}`, select: "*", limit: "1" });
  try {
    const response = await fetch(`${config.url}/rest/v1/${PREF_TABLE}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return { ...DEFAULT_PREFS };
    const rows = await response.json().catch(() => []);
    return normalizePreferences(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveAriSignalPreferences({ userId, preferences = {} } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { success: false, code: "SIGNAL_STORE_UNAVAILABLE" };
  const current = await loadAriSignalPreferences({ userId: id });
  const next = normalizePreferences({ ...toDbPreferences(current), ...toDbPreferences(preferences) });
  const now = new Date().toISOString();
  const row = {
    user_id: id,
    in_app_enabled: next.inAppEnabled,
    push_enabled: next.pushEnabled,
    quiet_hours_enabled: next.quietHoursEnabled,
    quiet_start: next.quietStart,
    quiet_end: next.quietEnd,
    timezone: next.timezone,
    push_categories: next.pushCategories,
    updated_at: now
  };
  try {
    const response = await fetch(`${config.url}/rest/v1/${PREF_TABLE}?on_conflict=user_id`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(row)
    });
    const rows = await response.json().catch(() => []);
    const saved = Array.isArray(rows) ? rows[0] : rows;
    return response.ok && saved
      ? { success: true, preferences: normalizePreferences(saved) }
      : { success: false, code: "SIGNAL_PREFERENCES_SAVE_FAILED" };
  } catch {
    return { success: false, code: "SIGNAL_PREFERENCES_SAVE_FAILED" };
  }
}

export async function registerAriPushDevice({ userId, token, platform = "ios", appId = "com.arixp.app" } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const deviceToken = clean(token, 1000).replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (!config || !id || !deviceToken || clean(platform, 20) !== "ios") {
    return { success: false, code: "INVALID_PUSH_DEVICE" };
  }
  const now = new Date().toISOString();
  const row = {
    user_id: id,
    platform: "ios",
    token: deviceToken,
    app_id: clean(appId, 200) || "com.arixp.app",
    enabled: true,
    last_seen_at: now,
    updated_at: now
  };
  try {
    const response = await fetch(`${config.url}/rest/v1/${DEVICE_TABLE}?on_conflict=user_id,token`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(row)
    });
    const rows = await response.json().catch(() => []);
    const saved = Array.isArray(rows) ? rows[0] : rows;
    return response.ok && saved
      ? { success: true, deviceId: saved.id || null }
      : { success: false, code: "PUSH_DEVICE_SAVE_FAILED" };
  } catch {
    return { success: false, code: "PUSH_DEVICE_SAVE_FAILED" };
  }
}

export function classifyInitiativeAsSignal(candidate = {}) {
  const reason = clean(candidate.reasonId, 160);
  const priority = normalizePriority(candidate.priority);
  let category = "insight";
  if (/experiment|prediction|review_due/i.test(reason)) category = "experiment_result";
  else if (/world_model|adherence|weight_loss|recovery|regression/i.test(reason)) category = "change";
  else if (/question|missing|clarif/i.test(reason)) category = "question";
  const pushEligible = priority === "high" || category === "experiment_result";
  return {
    category,
    priority,
    pushEligible,
    title: titleForCategory(category),
    body: clean(candidate.opener, 600) || "Ari has something worth showing you.",
    context: {
      initiativeKey: clean(candidate.initiativeKey, 260),
      reasonId: reason,
      followUpPrompt: clean(candidate.followUpPrompt, 1000),
      action: clean(candidate.action, 120),
      domain: clean(candidate.domain, 80)
    }
  };
}

export async function maybeDeliverAriSignalPush({ userId, signalId, candidate } = {}) {
  const signal = classifyInitiativeAsSignal(candidate);
  if (!signal.pushEligible) return { attempted: false, reason: "signal_not_push_eligible", signal };
  const preferences = await loadAriSignalPreferences({ userId });
  if (!preferences.pushEnabled) return { attempted: false, reason: "push_disabled", signal };
  if (!preferences.pushCategories.includes(signal.category)) return { attempted: false, reason: "category_disabled", signal };
  if (preferences.quietHoursEnabled && isInQuietHours(preferences)) {
    return { attempted: false, reason: "quiet_hours", signal };
  }
  const devices = await listPushDevices({ userId });
  if (!devices.length) return { attempted: false, reason: "no_registered_device", signal };
  const deliveries = await Promise.allSettled(devices.map((device) => sendApns({
    token: device.token,
    appId: device.appId,
    title: signal.title,
    body: signal.body,
    data: {
      ariSignalId: clean(signalId, 200),
      ariSignalKey: signal.context.initiativeKey,
      deepLink: `home.html?ariSignal=${encodeURIComponent(clean(signalId, 200))}`
    }
  })));
  const sent = deliveries.filter((item) => item.status === "fulfilled" && item.value?.sent).length;
  return { attempted: true, sent, devices: devices.length, signal };
}

async function listPushDevices({ userId } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    enabled: "eq.true",
    select: "id,token,platform,app_id,updated_at",
    order: "updated_at.desc",
    limit: "8"
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/${DEVICE_TABLE}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id || null,
      token: clean(row.token, 1000),
      platform: clean(row.platform, 20),
      appId: clean(row.app_id, 200) || "com.arixp.app"
    })).filter((item) => item.token && item.platform === "ios");
  } catch {
    return [];
  }
}

function signalFromRow(row) {
  if (!row || typeof row !== "object") return null;
  const payload = safeObject(row.payload);
  const classified = classifyInitiativeAsSignal({
    reasonId: row.reason_id,
    priority: row.priority,
    opener: payload.opener,
    followUpPrompt: payload.followUpPrompt,
    action: payload.action,
    domain: payload.domain,
    initiativeKey: row.initiative_key
  });
  return {
    id: row.id || null,
    initiativeKey: clean(row.initiative_key, 260),
    reasonId: clean(row.reason_id, 200),
    category: classified.category,
    priority: classified.priority,
    status: clean(row.status, 30) || "surfaced",
    title: classified.title,
    message: classified.body,
    followUpPrompt: clean(payload.followUpPrompt, 1000),
    action: clean(payload.action, 120),
    context: clean(payload.context, 900),
    domain: clean(payload.domain, 80),
    surfacedAt: row.surfaced_at || null,
    engagedAt: row.engaged_at || null,
    dismissedAt: row.dismissed_at || null,
    unread: row.status === "surfaced"
  };
}

function normalizePreferences(row = {}) {
  const categoriesRaw = row.push_categories ?? row.pushCategories;
  return {
    inAppEnabled: bool(row.in_app_enabled ?? row.inAppEnabled, DEFAULT_PREFS.inAppEnabled),
    pushEnabled: bool(row.push_enabled ?? row.pushEnabled, DEFAULT_PREFS.pushEnabled),
    quietHoursEnabled: bool(row.quiet_hours_enabled ?? row.quietHoursEnabled, DEFAULT_PREFS.quietHoursEnabled),
    quietStart: timeValue(row.quiet_start ?? row.quietStart, DEFAULT_PREFS.quietStart),
    quietEnd: timeValue(row.quiet_end ?? row.quietEnd, DEFAULT_PREFS.quietEnd),
    timezone: clean(row.timezone, 100) || DEFAULT_PREFS.timezone,
    pushCategories: Array.isArray(categoriesRaw)
      ? categoriesRaw.map((value) => clean(value, 40)).filter(Boolean).slice(0, 12)
      : [...DEFAULT_PREFS.pushCategories]
  };
}

function toDbPreferences(value = {}) {
  return {
    in_app_enabled: value.inAppEnabled ?? value.in_app_enabled,
    push_enabled: value.pushEnabled ?? value.push_enabled,
    quiet_hours_enabled: value.quietHoursEnabled ?? value.quiet_hours_enabled,
    quiet_start: value.quietStart ?? value.quiet_start,
    quiet_end: value.quietEnd ?? value.quiet_end,
    timezone: value.timezone,
    push_categories: value.pushCategories ?? value.push_categories
  };
}

function isInQuietHours(preferences) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: preferences.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const now = hour * 60 + minute;
    const start = minutes(preferences.quietStart);
    const end = minutes(preferences.quietEnd);
    if (start === end) return false;
    return start < end ? now >= start && now < end : now >= start || now < end;
  } catch {
    return false;
  }
}

function minutes(value) {
  const [h, m] = timeValue(value, "00:00").split(":").map(Number);
  return h * 60 + m;
}

async function sendApns({ token, appId, title, body, data }) {
  const config = apnsConfig(appId);
  if (!config) return { sent: false, reason: "apns_not_configured" };
  const authority = config.environment === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const jwt = apnsJwt(config);
  return await new Promise((resolve) => {
    const client = connect(authority);
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { client.close(); } catch {}
      resolve(value);
    };
    client.setTimeout(5000, () => finish({ sent: false, reason: "apns_timeout" }));
    client.on("error", (error) => finish({ sent: false, reason: clean(error?.message, 180) || "apns_connection_failed" }));
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json"
    });
    let responseBody = "";
    request.setEncoding("utf8");
    request.on("response", (headers) => {
      const status = Number(headers[":status"] || 0);
      request.on("data", (chunk) => { responseBody += chunk; });
      request.on("end", () => finish({ sent: status === 200, status, response: clean(responseBody, 300) }));
    });
    request.on("error", (error) => finish({ sent: false, reason: clean(error?.message, 180) || "apns_request_failed" }));
    request.end(JSON.stringify({
      aps: {
        alert: { title: clean(title, 120), body: clean(body, 500) },
        sound: "default",
        "thread-id": "ari-signals"
      },
      ...(data || {})
    }));
  });
}

function apnsConfig(appId) {
  const teamId = clean(process.env.APNS_TEAM_ID, 100);
  const keyId = clean(process.env.APNS_KEY_ID, 100);
  const rawKey = String(process.env.APNS_AUTH_KEY || "").replace(/\\n/g, "\n").trim();
  const bundleId = clean(process.env.APNS_BUNDLE_ID || appId, 200);
  if (!teamId || !keyId || !rawKey || !bundleId) return null;
  return {
    teamId,
    keyId,
    privateKey: rawKey,
    bundleId,
    environment: clean(process.env.APNS_ENVIRONMENT, 30).toLowerCase() === "sandbox" ? "sandbox" : "production"
  };
}

function apnsJwt(config) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedApnsJwt && nowSeconds - cachedApnsJwtAt < 45 * 60) return cachedApnsJwt;
  const header = base64url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const payload = base64url(JSON.stringify({ iss: config.teamId, iat: nowSeconds }));
  const unsigned = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: "ieee-p1363"
  });
  cachedApnsJwt = `${unsigned}.${base64url(signature)}`;
  cachedApnsJwtAt = nowSeconds;
  return cachedApnsJwt;
}

function base64url(value) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function titleForCategory(category) {
  if (category === "experiment_result") return "Ari has a result";
  if (category === "question") return "Ari wants your input";
  if (category === "change") return "Ari noticed a change";
  if (category === "approval") return "Ari needs your approval";
  return "Ari has something to tell you";
}
function normalizePriority(value) {
  const priority = clean(value, 30).toLowerCase();
  return ["high", "medium", "positive", "low"].includes(priority) ? priority : "medium";
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function bool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function timeValue(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ""));
  if (!match) return fallback;
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra };
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
