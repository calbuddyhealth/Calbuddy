// ARI vNext — server-authoritative daily chat quota.
// Regular accounts receive a bounded number of paid AI turns per local day.
// Owner identity remains separate from the private Ari Unlimited chat entitlement.

import { loadAriUnlimitedEntitlement } from "../../../server/ari-intelligence-control-store.js";

export const ARI_DAILY_CHAT_QUOTA_VERSION = "1.1.0";

const RESERVATION_TABLE = "ari_daily_chat_quota_reservations";
const SETTINGS_TABLE = "ari_daily_chat_quota_settings";
const DEFAULT_DAILY_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 1400;
const TIMEZONE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function dailyChatLimit() {
  const configured = Number(process.env.ARI_DAILY_CHAT_LIMIT);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_DAILY_LIMIT;
  return Math.max(1, Math.min(100, Math.floor(configured)));
}

export function isOwnerQuotaExempt(userId = "") {
  const user = clean(userId, 200).toLowerCase();
  const owner = clean(process.env.ARI_OWNER_USER_ID, 200).toLowerCase();
  return Boolean(user && owner && user === owner);
}

export async function reserveDailyChatQuota({ userId, turnId } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  if (!user || !turn) return unavailableQuota("invalid_identity");

  if (isOwnerQuotaExempt(user)) return ownerQuota();
  if (await isAriUnlimited(user)) return ariUnlimitedQuota();

  const config = supabaseConfig();
  if (!config) return unavailableQuota("storage_unavailable");

  const timezone = await resolveSavedTimezone({ userId: user, config });
  const response = await timedFetch(`${config.url}/rest/v1/rpc/ari_reserve_daily_chat_quota`, {
    method: "POST",
    headers: serverHeaders(config.key),
    body: JSON.stringify({
      requested_user_id: user,
      requested_turn_id: turn,
      requested_timezone: timezone,
      requested_daily_limit: dailyChatLimit()
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data.allowed !== "boolean") {
    throw quotaError("ARI daily quota could not be verified.", "ARI_QUOTA_UNAVAILABLE", 503);
  }

  return normalizeQuota({
    ...data,
    enabled: true,
    unlimited: false,
    reserved: data.allowed === true && data.replayed !== true,
    source: data.replayed === true ? "existing_reservation" : "daily_quota_rpc"
  });
}

export async function consumeDailyChatQuota({ userId, turnId } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  if (!user || !turn) return unavailableQuota("invalid_identity");
  if (isOwnerQuotaExempt(user)) return ownerQuota();
  if (await isAriUnlimited(user)) return ariUnlimitedQuota();

  const config = supabaseConfig();
  if (!config) return unavailableQuota("storage_unavailable");

  const params = new URLSearchParams({
    user_id: `eq.${user}`,
    turn_id: `eq.${turn}`,
    status: "eq.reserved"
  });
  const now = new Date().toISOString();
  const response = await timedFetch(`${config.url}/rest/v1/${RESERVATION_TABLE}?${params.toString()}`, {
    method: "PATCH",
    headers: serverHeaders(config.key, { Prefer: "return=representation" }),
    body: JSON.stringify({ status: "consumed", updated_at: now })
  });
  if (!response.ok) return unavailableQuota("consume_failed");

  const rows = await response.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? await loadQuotaSnapshot({ userId: user, config, timezone: row.timezone }) : unavailableQuota("reservation_missing");
}

export async function releaseDailyChatQuota({ userId, turnId } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  if (!user || !turn) return true;
  if (isOwnerQuotaExempt(user)) return true;
  if (await isAriUnlimited(user)) return true;

  const config = supabaseConfig();
  if (!config) return false;
  const params = new URLSearchParams({
    user_id: `eq.${user}`,
    turn_id: `eq.${turn}`,
    status: "eq.reserved"
  });
  const response = await timedFetch(`${config.url}/rest/v1/${RESERVATION_TABLE}?${params.toString()}`, {
    method: "DELETE",
    headers: serverHeaders(config.key, { Prefer: "return=minimal" })
  }).catch(() => null);
  return Boolean(response?.ok);
}

export async function saveDailyChatTimezone({ userId, timezone } = {}) {
  const user = clean(userId, 200);
  const zone = normalizeTimezone(timezone);
  if (!user || !zone) return { saved: false, reason: "invalid_timezone" };
  if (isOwnerQuotaExempt(user)) return { saved: true, timezone: zone, ownerExempt: true };

  const config = supabaseConfig();
  if (!config) return { saved: false, reason: "storage_unavailable" };

  const current = await readSettings({ userId: user, config });
  if (current?.timezone === zone) return { saved: true, timezone: zone, changed: false };

  const changedAt = Date.parse(String(current?.timezone_updated_at || ""));
  if (current?.timezone && Number.isFinite(changedAt) && Date.now() - changedAt < TIMEZONE_CHANGE_COOLDOWN_MS) {
    return {
      saved: false,
      timezone: current.timezone,
      reason: "timezone_change_cooldown",
      retryAt: new Date(changedAt + TIMEZONE_CHANGE_COOLDOWN_MS).toISOString()
    };
  }

  const now = new Date().toISOString();
  const response = await timedFetch(`${config.url}/rest/v1/${SETTINGS_TABLE}?on_conflict=user_id`, {
    method: "POST",
    headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({
      user_id: user,
      timezone: zone,
      timezone_updated_at: now,
      updated_at: now
    })
  });
  if (!response.ok) return { saved: false, reason: "timezone_save_failed" };
  return { saved: true, timezone: zone, changed: Boolean(current?.timezone) };
}

export async function loadDailyChatQuota({ userId } = {}) {
  const user = clean(userId, 200);
  if (!user) return unavailableQuota("invalid_identity");
  if (isOwnerQuotaExempt(user)) return ownerQuota();
  if (await isAriUnlimited(user)) return ariUnlimitedQuota();
  const config = supabaseConfig();
  if (!config) return unavailableQuota("storage_unavailable");
  const timezone = await resolveSavedTimezone({ userId: user, config });
  return await loadQuotaSnapshot({ userId: user, config, timezone });
}

export function publicDailyChatQuota(value = null) {
  const quota = value && typeof value === "object" ? value : {};
  return {
    enabled: quota.enabled !== false,
    allowed: quota.allowed !== false,
    unlimited: quota.unlimited === true,
    used: finiteOrNull(quota.used),
    remaining: finiteOrNull(quota.remaining),
    dailyLimit: finiteOrNull(quota.dailyLimit),
    timezone: clean(quota.timezone, 100) || null,
    localDate: clean(quota.localDate, 20) || null,
    resetAt: clean(quota.resetAt, 80) || null,
    source: clean(quota.source, 80) || null
  };
}

export function dailyLimitReply(quota = {}) {
  const limit = finiteOrNull(quota.dailyLimit) || dailyChatLimit();
  return `You've used your ${limit} Ari questions for today. Your questions reset at midnight.`;
}

async function isAriUnlimited(userId) {
  const entitlement = await loadAriUnlimitedEntitlement({ userId }).catch(() => null);
  return entitlement?.enabled === true;
}

async function loadQuotaSnapshot({ userId, config, timezone }) {
  const zone = normalizeTimezone(timezone) || "UTC";
  const localDate = dateInTimezone(new Date(), zone);
  const params = new URLSearchParams({
    select: "turn_id,status",
    user_id: `eq.${userId}`,
    local_date: `eq.${localDate}`,
    status: "in.(reserved,consumed)"
  });
  const response = await timedFetch(`${config.url}/rest/v1/${RESERVATION_TABLE}?${params.toString()}`, {
    headers: serverHeaders(config.key)
  });
  if (!response.ok) return unavailableQuota("snapshot_failed");
  const rows = await response.json().catch(() => []);
  const used = Array.isArray(rows) ? rows.length : 0;
  const dailyLimit = dailyChatLimit();
  return normalizeQuota({
    enabled: true,
    allowed: used < dailyLimit,
    unlimited: false,
    used,
    remaining: Math.max(0, dailyLimit - used),
    dailyLimit,
    timezone: zone,
    localDate,
    resetAt: nextMidnightIso(zone),
    source: "quota_snapshot"
  });
}

async function resolveSavedTimezone({ userId, config }) {
  const settings = await readSettings({ userId, config });
  if (normalizeTimezone(settings?.timezone)) return settings.timezone;

  const params = new URLSearchParams({
    select: "timezone",
    user_id: `eq.${userId}`,
    limit: "1"
  });
  const response = await timedFetch(`${config.url}/rest/v1/ari_signal_preferences?${params.toString()}`, {
    headers: serverHeaders(config.key)
  }).catch(() => null);
  if (response?.ok) {
    const rows = await response.json().catch(() => []);
    const candidate = normalizeTimezone(Array.isArray(rows) ? rows[0]?.timezone : null);
    if (candidate) {
      await saveDailyChatTimezone({ userId, timezone: candidate }).catch(() => null);
      return candidate;
    }
  }
  return "UTC";
}

async function readSettings({ userId, config }) {
  const params = new URLSearchParams({
    select: "timezone,timezone_updated_at",
    user_id: `eq.${userId}`,
    limit: "1"
  });
  const response = await timedFetch(`${config.url}/rest/v1/${SETTINGS_TABLE}?${params.toString()}`, {
    headers: serverHeaders(config.key)
  }).catch(() => null);
  if (!response?.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function ownerQuota() {
  return {
    enabled: true,
    allowed: true,
    unlimited: true,
    reserved: false,
    used: null,
    remaining: null,
    dailyLimit: null,
    timezone: null,
    localDate: null,
    resetAt: null,
    source: "owner_exempt"
  };
}

function ariUnlimitedQuota() {
  return {
    enabled: true,
    allowed: true,
    unlimited: true,
    reserved: false,
    used: null,
    remaining: null,
    dailyLimit: null,
    timezone: null,
    localDate: null,
    resetAt: null,
    source: "ari_unlimited"
  };
}

function unavailableQuota(reason) {
  return {
    enabled: false,
    allowed: true,
    unlimited: false,
    reserved: false,
    used: null,
    remaining: null,
    dailyLimit: dailyChatLimit(),
    timezone: null,
    localDate: null,
    resetAt: null,
    source: reason
  };
}

function normalizeQuota(value = {}) {
  return {
    enabled: value.enabled !== false,
    allowed: value.allowed !== false,
    unlimited: value.unlimited === true,
    reserved: value.reserved === true,
    replayed: value.replayed === true,
    used: finiteOrNull(value.used),
    remaining: finiteOrNull(value.remaining),
    dailyLimit: finiteOrNull(value.dailyLimit),
    timezone: clean(value.timezone, 100) || null,
    localDate: clean(value.localDate, 20) || null,
    resetAt: clean(value.resetAt, 80) || null,
    source: clean(value.source, 80) || null
  };
}

function normalizeTimezone(value) {
  const zone = clean(value, 100);
  if (!zone) return "";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return "";
  }
}

function dateInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function nextMidnightIso(timezone) {
  const now = new Date();
  const today = dateInTimezone(now, timezone);
  const [year, month, day] = today.split("-").map(Number);
  const approximate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
  for (let minutes = -14 * 60; minutes <= 14 * 60; minutes += 15) {
    const candidate = new Date(approximate.getTime() + minutes * 60000);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(candidate);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const target = new Date(Date.UTC(year, month - 1, day + 1));
    const targetDate = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
    const candidateDate = `${value.year}-${value.month}-${value.day}`;
    if (candidateDate === targetDate && value.hour === "00" && value.minute === "00") return candidate.toISOString();
  }
  return null;
}

function quotaError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
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

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
