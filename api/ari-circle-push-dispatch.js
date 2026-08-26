import { deliverNativePush, ARI_NATIVE_PUSH_VERSION } from "./_lib/ari-vnext/native-push.js";

const OUTBOX_TABLE = "ari_circle_push_deliveries";
const NOTIFICATION_TABLE = "ari_circle_notifications";
const PREF_TABLE = "ari_notification_preferences";
const MAX_ATTEMPTS = 5;

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, code: "METHOD_NOT_ALLOWED", source: "ari_circle_push" });
  }

  const config = supabaseConfig();
  if (!config) return res.status(503).json({ success: false, code: "PUSH_STORE_UNAVAILABLE", source: "ari_circle_push" });

  const body = resolveBody(req);
  const deliveryId = clean(body?.deliveryId, 200);
  if (!isUuid(deliveryId)) {
    return res.status(400).json({ success: false, code: "INVALID_DELIVERY_ID", source: "ari_circle_push" });
  }

  const claimed = await claimDelivery(config, deliveryId);
  if (!claimed) {
    return res.status(200).json({ success: true, status: "already_handled", source: "ari_circle_push" });
  }

  try {
    const notification = await loadNotification(config, claimed.notification_id);
    if (!notification || notification.user_id !== claimed.user_id) {
      await finishDelivery(config, claimed.id, {
        status: "failed",
        last_error: "notification_missing_or_mismatched"
      });
      return res.status(200).json({ success: true, status: "failed", reason: "notification_missing", source: "ari_circle_push" });
    }

    const activityEnabled = await circleActivityEnabled(config, claimed.user_id);
    if (!activityEnabled) {
      await finishDelivery(config, claimed.id, { status: "skipped", last_error: "circle_activity_disabled" });
      return res.status(200).json({ success: true, status: "skipped", reason: "circle_activity_disabled", source: "ari_circle_push" });
    }

    const kind = clean(notification?.data?.kind, 80);
    const meetupId = clean(notification?.data?.meetup_id, 200);
    if (!kind.startsWith("meetup_") || !isUuid(meetupId)) {
      await finishDelivery(config, claimed.id, { status: "skipped", last_error: "not_meetup_push" });
      return res.status(200).json({ success: true, status: "skipped", reason: "not_meetup_push", source: "ari_circle_push" });
    }

    const result = await deliverNativePush({
      userId: claimed.user_id,
      title: notification.title || "ARI Circle",
      body: notification.body || "Something changed in your meetup.",
      data: {
        circleNotificationId: notification.id,
        meetupId,
        kind,
        deepLink: deepLinkFor(kind, meetupId)
      },
      respectQuietHours: true
    });

    if (result.sent > 0) {
      await finishDelivery(config, claimed.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
        last_error: null
      });
      return res.status(200).json({ success: true, status: "sent", sent: result.sent, source: "ari_circle_push" });
    }

    if (!result.attempted && ["push_disabled", "quiet_hours", "no_registered_device"].includes(result.reason)) {
      await finishDelivery(config, claimed.id, { status: "skipped", last_error: result.reason });
      return res.status(200).json({ success: true, status: "skipped", reason: result.reason, source: "ari_circle_push" });
    }

    const allInvalid = Array.isArray(result.results) && result.results.length > 0 && result.results.every((item) => item?.invalidToken === true);
    if (allInvalid) {
      await finishDelivery(config, claimed.id, { status: "skipped", last_error: "invalid_device_tokens" });
      return res.status(200).json({ success: true, status: "skipped", reason: "invalid_device_tokens", source: "ari_circle_push" });
    }

    const attempts = Math.max(1, Number(claimed.attempt_count) || 1);
    if (attempts < MAX_ATTEMPTS) {
      await finishDelivery(config, claimed.id, {
        status: "pending",
        next_attempt_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        last_error: clean(result.reason, 240) || "push_delivery_failed"
      });
      return res.status(202).json({ success: true, status: "retry_scheduled", reason: result.reason || "push_delivery_failed", source: "ari_circle_push" });
    }

    await finishDelivery(config, claimed.id, {
      status: "failed",
      last_error: clean(result.reason, 240) || "push_delivery_failed"
    });
    return res.status(200).json({ success: true, status: "failed", reason: result.reason || "push_delivery_failed", source: "ari_circle_push" });
  } catch (error) {
    const attempts = Math.max(1, Number(claimed.attempt_count) || 1);
    await finishDelivery(config, claimed.id, attempts < MAX_ATTEMPTS
      ? {
          status: "pending",
          next_attempt_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          last_error: clean(error?.message, 240) || "push_dispatch_error"
        }
      : {
          status: "failed",
          last_error: clean(error?.message, 240) || "push_dispatch_error"
        });
    return res.status(202).json({ success: true, status: attempts < MAX_ATTEMPTS ? "retry_scheduled" : "failed", source: "ari_circle_push" });
  }
}

async function claimDelivery(config, deliveryId) {
  const current = await restOne(config, OUTBOX_TABLE, new URLSearchParams({ id: `eq.${deliveryId}`, select: "id,notification_id,user_id,status,attempt_count,next_attempt_at", limit: "1" }));
  if (!current || current.status !== "pending") return null;
  if (current.next_attempt_at && Date.parse(current.next_attempt_at) > Date.now()) return null;

  const params = new URLSearchParams({ id: `eq.${deliveryId}`, status: "eq.pending" });
  const response = await fetch(`${config.url}/rest/v1/${OUTBOX_TABLE}?${params}`, {
    method: "PATCH",
    headers: serverHeaders(config.key, { Prefer: "return=representation" }),
    body: JSON.stringify({
      status: "sending",
      attempt_count: Math.max(0, Number(current.attempt_count) || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });
  const rows = await response.json().catch(() => []);
  return response.ok ? (Array.isArray(rows) ? rows[0] : rows) : null;
}

async function loadNotification(config, notificationId) {
  return await restOne(config, NOTIFICATION_TABLE, new URLSearchParams({
    id: `eq.${clean(notificationId, 200)}`,
    select: "id,user_id,title,body,data,created_at",
    limit: "1"
  }));
}

async function circleActivityEnabled(config, userId) {
  const row = await restOne(config, PREF_TABLE, new URLSearchParams({
    user_id: `eq.${userId}`,
    select: "circle_activity_enabled",
    limit: "1"
  }));
  return row?.circle_activity_enabled !== false;
}

async function finishDelivery(config, deliveryId, patch) {
  const params = new URLSearchParams({ id: `eq.${deliveryId}` });
  await fetch(`${config.url}/rest/v1/${OUTBOX_TABLE}?${params}`, {
    method: "PATCH",
    headers: serverHeaders(config.key),
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  }).catch(() => null);
}

async function restOne(config, table, params) {
  try {
    const response = await fetch(`${config.url}/rest/v1/${table}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] || null : rows || null;
  } catch {
    return null;
  }
}

function deepLinkFor(kind, meetupId) {
  const id = encodeURIComponent(meetupId);
  if (["meetup_request", "meetup_spot_opened"].includes(kind)) {
    return `ari-circle-meetup.html?requests=${id}`;
  }
  if (["meetup_accepted", "meetup_joined", "meetup_reminder", "meetup_verified"].includes(kind)) {
    return `ari-circle-meetup-room.html?meetup=${id}`;
  }
  return "ari-circle-meetup.html";
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
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Native-Push", ARI_NATIVE_PUSH_VERSION);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 200));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
