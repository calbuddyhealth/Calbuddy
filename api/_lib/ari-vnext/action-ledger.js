// ARI vNext — server-authoritative proposal ledger.
// The server records the model proposal before it can be shown as confirmable.
// Browser adapters later validate/materialize the proposal against trusted app state.

export const ARI_ACTION_LEDGER_VERSION = "1.0.0";
const WRITE_TIMEOUT_MS = 900;
const READ_TIMEOUT_MS = 900;
const NON_LEDGER_ACTIONS = new Set(["track_experiment", "complete_experiment", "cancel_experiment"]);

export async function persistAriActionProposal({
  userId,
  pendingAction,
  confirmationText = null
} = {}) {
  const safeUserId = clean(userId, 200);
  const pending = normalizePendingAction(pendingAction);
  if (!safeUserId || !pending?.id || !pending?.name || !pending?.sourceTurnId) {
    return { stored: false, required: false, reason: "no_durable_proposal" };
  }
  if (NON_LEDGER_ACTIONS.has(pending.name)) {
    return { stored: false, required: false, reason: "separate_trusted_executor" };
  }

  const config = supabaseConfig();
  if (!config) {
    return { stored: false, required: true, reason: "ledger_store_unavailable" };
  }

  const row = {
    user_id: safeUserId,
    action_type: pending.name,
    status: "proposed",
    payload: {},
    confirmation_text: clean(confirmationText, 800) || null,
    source_turn_id: pending.sourceTurnId,
    vnext_action_id: pending.id,
    vnext_pending_action: pending,
    expires_at: isoOrNull(pending.expiresAt),
    updated_at: new Date().toISOString(),
    result: {}
  };

  try {
    const response = await timedFetch(`${config.url}/rest/v1/ai_app_actions?select=id,status,vnext_action_id,source_turn_id`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row)
    }, WRITE_TIMEOUT_MS);

    if (response.ok) {
      const rows = await response.json().catch(() => []);
      const stored = Array.isArray(rows) ? rows[0] : null;
      return {
        stored: Boolean(stored?.id),
        required: true,
        id: clean(stored?.id, 100) || null,
        status: clean(stored?.status, 40) || "proposed",
        vnextActionId: pending.id,
        sourceTurnId: pending.sourceTurnId,
        source: "ari_action_ledger"
      };
    }

    if (response.status !== 409) {
      const detail = await response.json().catch(() => null);
      console.warn("[ARI Action Ledger] proposal insert rejected", {
        status: response.status,
        code: clean(detail?.code, 120) || null,
        message: clean(detail?.message, 240) || null
      });
      return { stored: false, required: true, reason: `ledger_insert_${response.status}` };
    }

    const existing = await findActionByVNextId({
      config,
      userId: safeUserId,
      vnextActionId: pending.id
    });
    return existing?.id
      ? {
          stored: true,
          required: true,
          duplicate: true,
          id: existing.id,
          status: existing.status || "proposed",
          vnextActionId: pending.id,
          sourceTurnId: pending.sourceTurnId,
          source: "ari_action_ledger"
        }
      : { stored: false, required: true, reason: "ledger_conflict_unresolved" };
  } catch (error) {
    const reason = error?.name === "AbortError" ? "ledger_write_timeout" : "ledger_write_failed";
    console.warn("[ARI Action Ledger] proposal persistence failed", {
      reason,
      errorName: clean(error?.name, 120) || "Error"
    });
    return {
      stored: false,
      required: true,
      reason
    };
  }
}

async function findActionByVNextId({ config, userId, vnextActionId } = {}) {
  if (!config || !userId || !vnextActionId) return null;
  const params = new URLSearchParams({
    select: "id,status,vnext_action_id,source_turn_id",
    user_id: `eq.${userId}`,
    vnext_action_id: `eq.${vnextActionId}`,
    limit: "1"
  });
  const response = await timedFetch(
    `${config.url}/rest/v1/ai_app_actions?${params.toString()}`,
    { headers: serverHeaders(config.key) },
    READ_TIMEOUT_MS
  );
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function normalizePendingAction(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    id: clean(value.id, 200),
    name: clean(value.name, 120),
    arguments: value.arguments && typeof value.arguments === "object" && !Array.isArray(value.arguments)
      ? value.arguments
      : {},
    sourceTurnId: clean(value.sourceTurnId, 200),
    sourceMessage: clean(value.sourceMessage, 4000),
    expiresAt: isoOrNull(value.expiresAt)
  };
}

async function timedFetch(url, options = {}, timeoutMs = 1000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(100, Number(timeoutMs) || 1000));
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    8000
  );
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

function isoOrNull(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
