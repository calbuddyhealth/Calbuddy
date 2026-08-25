// ARI vNext — user-scoped Circle event loader for deterministic initiative.
// This module independently reads the bounded Domain Events RPC with the
// signed-in user's JWT. Browser-supplied Circle context is never initiative
// authority. No service-role fallback and no Circle mutation authority.

export const CIRCLE_EVENT_INITIATIVE_VERSION = "1.0.0";

const MAX_EVENTS = 12;
const DIRECT_INITIATIVE_TYPES = new Set([
  "meetup.accepted",
  "meetup.cancelled",
  "meetup.waitlisted",
  "meetup.declined",
  "mission.progress_verified",
  "mission.progress_rejected",
  "mission.objective_reached"
]);

export async function loadCircleInitiativeEvents({ accessToken, userId, now = new Date(), limit = MAX_EVENTS } = {}) {
  const token = clean(accessToken, 7000);
  const viewerId = clean(userId, 200);
  if (!token || !viewerId) return empty("identity_unavailable");

  const config = supabaseConfig();
  if (!config) return empty("circle_rpc_unavailable");

  const since = new Date(validDate(now).getTime() - 12 * 60 * 60 * 1000).toISOString();
  try {
    const rows = await callRpc(config, token, "ari_circle_list_domain_events", {
      requested_since: since,
      result_limit: Math.max(1, Math.min(Number(limit) || MAX_EVENTS, MAX_EVENTS))
    });

    const items = array(rows)
      .map((row) => compactDirectEvent(row, viewerId))
      .filter(Boolean)
      .sort((a, b) => (Date.parse(b.occurredAt || "") || 0) - (Date.parse(a.occurredAt || "") || 0));

    return {
      version: CIRCLE_EVENT_INITIATIVE_VERSION,
      available: true,
      source: "user_scoped_circle_domain_events",
      items,
      count: items.length,
      rules: initiativeSourceRules()
    };
  } catch (error) {
    if (isMissingRpc(error)) return empty("domain_events_not_migrated");
    console.warn("[ARI Circle Initiative Events]", clean(error?.message, 300) || "read failed");
    return empty("domain_events_read_failed");
  }
}

export function compactDirectEvent(row = {}, viewerId = null) {
  const eventId = clean(row?.event_id, 160);
  const type = clean(row?.event_type, 80).toLowerCase();
  const subjectType = clean(row?.subject_type, 40).toLowerCase();
  const subjectId = clean(row?.subject_id, 160);
  const actorUserId = clean(row?.actor_user_id, 200) || null;
  if (!eventId || !subjectId || !DIRECT_INITIATIVE_TYPES.has(type)) return null;

  // A direct fact the viewer themselves just caused is not initiative. This is
  // presentation suppression only; RPC authorization remains authoritative.
  if (actorUserId && viewerId && actorUserId === viewerId) return null;

  const metadata = safeMetadata(row?.metadata);
  return {
    eventId,
    type,
    subjectType: subjectType || (type.startsWith("mission.") ? "mission" : "meetup"),
    subjectId,
    actor: actorUserId
      ? {
          displayName: clean(row?.actor_display_name, 100) || null,
          handle: clean(row?.actor_handle, 80) || null
        }
      : null,
    metadata,
    occurredAt: safeIso(row?.occurred_at)
  };
}

function safeMetadata(value) {
  const source = object(value);
  const output = {};
  const requestStatus = clean(source?.request_status, 40).toLowerCase();
  const contributionAmount = finite(source?.contribution_amount);
  const unit = clean(source?.unit, 40).toLowerCase();
  if (requestStatus) output.requestStatus = requestStatus;
  if (contributionAmount !== null) output.contributionAmount = contributionAmount;
  if (unit) output.unit = unit;
  return output;
}

async function callRpc(config, accessToken, name, args) {
  const response = await fetch(`${config.url}/rest/v1/rpc/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(args || {}),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(clean(data?.message || data?.error || `Circle RPC ${name} failed.`, 500));
    error.status = response.status;
    error.code = clean(data?.code, 120);
    error.details = clean(data?.details, 500);
    throw error;
  }
  return data;
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function initiativeSourceRules() {
  return {
    directFactsOnly: true,
    noGenericCreationEvents: true,
    noSpotOpenInitiativeUntilServerMatchGrounded: true,
    selfGeneratedActionsSuppressed: true,
    noClientSuppliedEventAuthority: true,
    noServiceRoleFallback: true,
    noMutationAuthority: true
  };
}

function empty(reason) {
  return {
    version: CIRCLE_EVENT_INITIATIVE_VERSION,
    available: false,
    source: "user_scoped_circle_domain_events",
    reason,
    items: [],
    count: 0,
    rules: initiativeSourceRules()
  };
}
function isMissingRpc(error) {
  const text = `${clean(error?.message, 500)} ${clean(error?.details, 500)} ${clean(error?.code, 120)}`;
  return error?.status === 404 || /PGRST202|could not find the function|schema cache/i.test(text);
}
function safeIso(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function array(value) {
  return Array.isArray(value) ? value : [];
}
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
