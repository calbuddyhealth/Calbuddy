import { normalizeReasoningProfile } from "./ari-intelligence-entitlement.js";

const CONTROL_TABLE = "ari_intelligence_controls";
const PROFILE_TABLE = "profiles";

export async function loadAriIntelligenceControls({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseServiceConfig();
  if (!id || !config) return defaultControls("unavailable");

  try {
    const params = new URLSearchParams({
      select: "advanced_enabled,reasoning_profile,updated_at",
      user_id: `eq.${id}`,
      limit: "1"
    });
    const response = await fetch(`${config.url}/rest/v1/${CONTROL_TABLE}?${params.toString()}`, {
      headers: serviceHeaders(config.key),
      cache: "no-store"
    });
    if (!response.ok) return defaultControls("read_failed");
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return defaultControls("default");

    return {
      enabled: row.advanced_enabled === true,
      reasoningProfile: normalizeReasoningProfile(row.reasoning_profile),
      updatedAt: row.updated_at || null,
      source: "server_store"
    };
  } catch {
    return defaultControls("read_failed");
  }
}

export async function saveAriIntelligenceControls({ userId, enabled = false, reasoningProfile = "adaptive" } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseServiceConfig();
  if (!id) throw new Error("A valid user id is required to save ARI intelligence controls.");
  if (!config) throw new Error("ARI intelligence control storage is not configured.");

  const payload = {
    user_id: id,
    advanced_enabled: enabled === true,
    reasoning_profile: normalizeReasoningProfile(reasoningProfile),
    updated_at: new Date().toISOString()
  };

  const response = await fetch(`${config.url}/rest/v1/${CONTROL_TABLE}?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...serviceHeaders(config.key),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const rows = await response.json().catch(() => []);
  if (!response.ok) {
    const message = rows?.message || rows?.error || "ARI intelligence controls could not be saved.";
    throw new Error(String(message));
  }

  const row = Array.isArray(rows) ? rows[0] : rows;
  return {
    enabled: row?.advanced_enabled === true,
    reasoningProfile: normalizeReasoningProfile(row?.reasoning_profile || payload.reasoning_profile),
    updatedAt: row?.updated_at || payload.updated_at,
    source: "server_store"
  };
}

export async function loadAriCommercialEntitlement({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseServiceConfig();
  const premiumFeatureEnabled = String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").trim().toLowerCase() === "true";

  // Do not spend a database request on premium state while the feature flag is off.
  if (!premiumFeatureEnabled || !id || !config) {
    return { subscriptionTier: "", subscriptionStatus: "", source: "premium_disabled" };
  }

  try {
    const params = new URLSearchParams({
      select: "subscription_tier,subscription_status",
      id: `eq.${id}`,
      limit: "1"
    });
    const response = await fetch(`${config.url}/rest/v1/${PROFILE_TABLE}?${params.toString()}`, {
      headers: serviceHeaders(config.key),
      cache: "no-store"
    });
    if (!response.ok) return { subscriptionTier: "", subscriptionStatus: "", source: "read_failed" };
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      subscriptionTier: String(row?.subscription_tier || "").trim().toLowerCase(),
      subscriptionStatus: String(row?.subscription_status || "").trim().toLowerCase(),
      source: "profiles"
    };
  } catch {
    return { subscriptionTier: "", subscriptionStatus: "", source: "read_failed" };
  }
}

function defaultControls(source = "default") {
  return {
    enabled: false,
    reasoningProfile: "adaptive",
    updatedAt: null,
    source
  };
}

function supabaseServiceConfig() {
  const url = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return url && key ? { url, key } : null;
}

function serviceHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function cleanUserId(value) {
  const id = String(value || "").trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}
