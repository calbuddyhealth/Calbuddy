// ARI vNext — server-side saved Conversation Style loader.
// Saved manual selections are explicit locks. Auto values are omitted so
// Conversation Personalization can adapt those dimensions naturally.

export const ARI_SAVED_COMMUNICATION_PREFERENCES_VERSION = "1.0.0";

const TABLE = "ari_user_preferences";

export async function loadSavedCommunicationPreferences({ userId } = {}) {
  const id = clean(userId, 200);
  if (!id) return emptyResult("missing_user");

  const config = supabaseConfig();
  if (!config) return emptyResult("supabase_unavailable");

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "preference_overrides,active_preset,schema_version,last_change_source,updated_at",
    limit: "1"
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return emptyResult(`read_failed_${response.status}`);

    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    return normalizeSavedCommunicationPreferences(row);
  } catch {
    return emptyResult("read_exception");
  }
}

export function normalizeSavedCommunicationPreferences(row = null) {
  if (!row || typeof row !== "object") return emptyResult("no_record");

  const activePreset = clean(row.active_preset || row.activePreset, 40).toLowerCase() || "default";

  // Historical V3 default records persisted a complete Natural/Balanced
  // snapshot even when the user never customized anything. Treat that preset
  // as Automatic so old defaults cannot accidentally become six manual locks.
  if (["default", "auto", "automatic"].includes(activePreset)) {
    return {
      version: ARI_SAVED_COMMUNICATION_PREFERENCES_VERSION,
      activePreset: "default",
      preferences: {},
      explicitLocks: [],
      automatic: true,
      legacyDefaultTreatedAsAutomatic: true,
      source: "saved_conversation_style"
    };
  }

  const overrides = safeObject(row.preference_overrides || row.preferenceOverrides);
  const language = safeObject(overrides.language);
  const preferences = {};
  const explicitLocks = [];

  addLock(preferences, explicitLocks, "tone", mapTone(language.tone));
  addLock(preferences, explicitLocks, "directness", mapDirectness(language.directness));
  addLock(preferences, explicitLocks, "detail", mapDetail(language.detail));
  addLock(preferences, explicitLocks, "humor", mapHumor(language.humor));
  addLock(preferences, explicitLocks, "profanity", mapProfanity(language.profanity));
  addLock(preferences, explicitLocks, "complexity", mapComplexity(language.complexity));

  return {
    version: ARI_SAVED_COMMUNICATION_PREFERENCES_VERSION,
    activePreset,
    preferences,
    explicitLocks,
    automatic: explicitLocks.length === 0,
    legacyDefaultTreatedAsAutomatic: false,
    source: "saved_conversation_style"
  };
}

function addLock(target, locks, key, value) {
  if (!value || value === "adaptive") return;
  target[key] = value;
  locks.push(key);
}

function mapTone(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive") return null;
  if (["professional", "natural", "casual", "warm", "coach"].includes(v)) return v;
  return null;
}

function mapDirectness(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive") return null;
  if (v === "blunt" || v === "direct") return "direct";
  if (["gentle", "balanced"].includes(v)) return v;
  return null;
}

function mapDetail(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive") return null;
  if (v === "concise" || v === "brief") return "brief";
  if (["balanced", "detailed"].includes(v)) return v;
  return null;
}

function mapHumor(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive") return null;
  if (["none", "occasional", "frequent"].includes(v)) return v;
  return null;
}

function mapProfanity(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive" || v === "default") return null;
  if (v === "never") return "never";
  if (v === "match_me" || v === "match_user") return "match_user";
  if (v === "always_allowed" || v === "allowed") return "allowed";
  return null;
}

function mapComplexity(value) {
  const v = clean(value, 40).toLowerCase();
  if (!v || v === "auto" || v === "adaptive") return null;
  if (["simple", "balanced", "advanced"].includes(v)) return v;
  return null;
}

function emptyResult(reason) {
  return {
    version: ARI_SAVED_COMMUNICATION_PREFERENCES_VERSION,
    activePreset: "default",
    preferences: {},
    explicitLocks: [],
    automatic: true,
    legacyDefaultTreatedAsAutomatic: false,
    source: "saved_conversation_style",
    reason
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
