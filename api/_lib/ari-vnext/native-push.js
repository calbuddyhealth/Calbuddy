import { connect } from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

export const ARI_NATIVE_PUSH_VERSION = "1.0.0";
const PREF_TABLE = "ari_signal_preferences";
const DEVICE_TABLE = "ari_push_devices";
let cachedApnsJwt = null;
let cachedApnsJwtAt = 0;

export function nativePushServerConfigured(appId = "com.arixp.app") {
  return Boolean(apnsConfig(appId));
}

export async function deliverNativePush({
  userId,
  title,
  body,
  data = {},
  respectQuietHours = true
} = {}) {
  const id = clean(userId, 200);
  const pushTitle = clean(title, 120);
  const pushBody = clean(body, 500);
  if (!id || !pushTitle || !pushBody) {
    return { attempted: false, sent: 0, reason: "invalid_push_payload" };
  }

  const preferences = await loadNativePushPreferences(id);
  if (!preferences.pushEnabled) return { attempted: false, sent: 0, reason: "push_disabled" };
  if (respectQuietHours && preferences.quietHoursEnabled && isInQuietHours(preferences)) {
    return { attempted: false, sent: 0, reason: "quiet_hours" };
  }

  const devices = await listPushDevices(id);
  if (!devices.length) return { attempted: false, sent: 0, reason: "no_registered_device" };

  const deliveries = await Promise.allSettled(devices.map(async (device) => {
    const result = await sendApns({
      token: device.token,
      appId: device.appId,
      title: pushTitle,
      body: pushBody,
      data
    });
    if (result.invalidToken) await disablePushDevice(device.id);
    return result;
  }));

  const results = deliveries.map((item) => item.status === "fulfilled"
    ? item.value
    : { sent: false, reason: clean(item.reason?.message, 180) || "push_delivery_failed" });
  const sent = results.filter((result) => result?.sent).length;
  const transientFailure = results.some((result) => !result?.sent && !result?.invalidToken && !["apns_not_configured"].includes(result?.reason));
  const serverConfigured = results.every((result) => result?.reason !== "apns_not_configured");

  return {
    attempted: true,
    sent,
    devices: devices.length,
    reason: sent > 0 ? "sent" : (serverConfigured ? "delivery_failed" : "apns_not_configured"),
    transientFailure,
    results
  };
}

async function loadNativePushPreferences(userId) {
  const config = supabaseConfig();
  if (!config) return defaultPreferences();
  const params = new URLSearchParams({ user_id: `eq.${userId}`, select: "push_enabled,quiet_hours_enabled,quiet_start,quiet_end,timezone", limit: "1" });
  try {
    const response = await fetch(`${config.url}/rest/v1/${PREF_TABLE}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return defaultPreferences();
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      pushEnabled: row?.push_enabled === true,
      quietHoursEnabled: row?.quiet_hours_enabled !== false,
      quietStart: timeValue(row?.quiet_start, "22:00"),
      quietEnd: timeValue(row?.quiet_end, "07:00"),
      timezone: clean(row?.timezone, 100) || "America/Los_Angeles"
    };
  } catch {
    return defaultPreferences();
  }
}

async function listPushDevices(userId) {
  const config = supabaseConfig();
  if (!config) return [];
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
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
      id: clean(row?.id, 200),
      token: clean(row?.token, 1000),
      platform: clean(row?.platform, 20),
      appId: clean(row?.app_id, 200) || "com.arixp.app"
    })).filter((row) => row.id && row.token && row.platform === "ios");
  } catch {
    return [];
  }
}

async function disablePushDevice(deviceId) {
  const config = supabaseConfig();
  const id = clean(deviceId, 200);
  if (!config || !id) return;
  const params = new URLSearchParams({ id: `eq.${id}` });
  await fetch(`${config.url}/rest/v1/${DEVICE_TABLE}?${params}`, {
    method: "PATCH",
    headers: serverHeaders(config.key),
    body: JSON.stringify({ enabled: false, updated_at: new Date().toISOString() })
  }).catch(() => null);
}

function defaultPreferences() {
  return {
    pushEnabled: false,
    quietHoursEnabled: true,
    quietStart: "22:00",
    quietEnd: "07:00",
    timezone: "America/Los_Angeles"
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
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
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
  const [hours, mins] = timeValue(value, "00:00").split(":").map(Number);
  return hours * 60 + mins;
}

async function sendApns({ token, appId, title, body, data }) {
  const config = apnsConfig(appId);
  if (!config) return { sent: false, reason: "apns_not_configured" };
  const authority = config.environment === "sandbox"
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";
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
      ":path": `/3/device/${clean(token, 1000)}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json"
    });

    let responseBody = "";
    let status = 0;
    request.setEncoding("utf8");
    request.on("response", (headers) => {
      status = Number(headers[":status"] || 0);
    });
    request.on("data", (chunk) => { responseBody += chunk; });
    request.on("end", () => {
      let reason = "";
      try { reason = clean(JSON.parse(responseBody || "{}")?.reason, 120); } catch {}
      const invalidToken = status === 410 || ["BadDeviceToken", "DeviceTokenNotForTopic", "Unregistered"].includes(reason);
      finish({
        sent: status === 200,
        status,
        reason: status === 200 ? "sent" : (reason || `apns_${status || "failed"}`),
        invalidToken
      });
    });
    request.on("error", (error) => finish({ sent: false, reason: clean(error?.message, 180) || "apns_request_failed" }));
    request.end(JSON.stringify({
      aps: {
        alert: { title, body },
        sound: "default"
      },
      ...(data && typeof data === "object" ? data : {})
    }));
  });
}

function apnsConfig(appId) {
  const teamId = clean(process.env.APNS_TEAM_ID, 100);
  const keyId = clean(process.env.APNS_KEY_ID, 100);
  const privateKey = String(process.env.APNS_AUTH_KEY || "").replace(/\\n/g, "\n").trim();
  const bundleId = clean(process.env.APNS_BUNDLE_ID || appId, 200);
  if (!teamId || !keyId || !privateKey || !bundleId) return null;
  return {
    teamId,
    keyId,
    privateKey,
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
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
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

function timeValue(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})/.exec(clean(value, 20));
  if (!match) return fallback;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const mins = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
