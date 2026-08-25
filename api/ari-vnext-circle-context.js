// ARI vNext — read-only Action Network context boundary.
// Uses the signed-in user's JWT for every Circle RPC so adult access, blocking,
// and source-RPC authorization remain authoritative. No service-role fallback.

const VERSION = "1.0.0";
const MAX_OPPORTUNITIES = 12;
const MAX_INTENTS = 3;
const MAX_MATCH_INTENTS = 2;
const MAX_MATCHES_PER_INTENT = 6;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_circle_context" });
  }

  const accessToken = bearerToken(req?.headers?.authorization);
  if (!accessToken) {
    return res.status(401).json({
      success: false,
      available: false,
      code: "AUTH_TOKEN_MISSING",
      error: "A signed-in ARI session is required.",
      source: "ari_vnext_circle_context"
    });
  }

  const config = supabaseConfig();
  if (!config) {
    return res.status(503).json({
      success: false,
      available: false,
      code: "CIRCLE_CONTEXT_UNAVAILABLE",
      error: "ARI Circle context is not configured.",
      source: "ari_vnext_circle_context"
    });
  }

  try {
    const ageState = await callRpc(config, accessToken, "ari_circle_my_age_state", {});
    if (ageState?.circle_allowed !== true) {
      return res.status(200).json({
        success: true,
        available: false,
        locked: true,
        reason: "circle_not_allowed",
        version: VERSION,
        source: "guarded_circle_rpcs"
      });
    }

    const [opportunitiesRaw, intentsRaw] = await Promise.all([
      callRpc(config, accessToken, "ari_circle_list_opportunities", {
        requested_types: ["meetup", "mission"],
        requested_activity: null,
        requested_window: "upcoming",
        result_limit: MAX_OPPORTUNITIES
      }),
      callRpc(config, accessToken, "ari_circle_list_my_action_intents", {
        include_inactive: false,
        result_limit: MAX_INTENTS
      })
    ]);

    const opportunities = array(opportunitiesRaw).map(compactOpportunity).filter(Boolean);
    const activeIntents = array(intentsRaw).map(compactIntent).filter(Boolean);

    const matchBatches = await Promise.all(
      activeIntents.slice(0, MAX_MATCH_INTENTS).map(async (intent) => {
        try {
          const rows = await callRpc(config, accessToken, "ari_circle_match_opportunities", {
            requested_intent_id: intent.intentId,
            result_limit: MAX_MATCHES_PER_INTENT
          });
          return array(rows).map((row) => compactMatch(row, intent.intentId)).filter(Boolean);
        } catch (error) {
          if (isMissingActionNetworkRpc(error)) return [];
          throw error;
        }
      })
    );

    const bestMatches = dedupeMatches(matchBatches.flat()).slice(0, 10);
    const situation = buildSituation({ opportunities, activeIntents, bestMatches });

    return res.status(200).json({
      success: true,
      available: true,
      version: VERSION,
      source: "guarded_circle_rpcs",
      generatedAt: new Date().toISOString(),
      ...situation,
      privacy: {
        exactMeetingPointsIncluded: false,
        directMessagesIncluded: false,
        rawCoordinatesIncluded: false,
        rawFeedContentIncluded: false
      }
    });
  } catch (error) {
    const missing = isMissingActionNetworkRpc(error);
    const status = missing ? 200 : normalizeStatus(error?.status);
    return res.status(status).json({
      success: missing,
      available: false,
      code: missing ? "ACTION_NETWORK_NOT_MIGRATED" : "CIRCLE_CONTEXT_READ_FAILED",
      error: missing ? undefined : clean(error?.message, 400) || "ARI could not read Circle context.",
      version: VERSION,
      source: "ari_vnext_circle_context"
    });
  }
}

export function buildSituation({ opportunities = [], activeIntents = [], bestMatches = [] } = {}) {
  const schedule = opportunities.filter((item) => [
    "host", "joined", "pending", "waitlisted", "creator", "submitted", "verified", "completed"
  ].includes(item.viewerState)).slice(0, 8);

  const hostPendingRequestCount = opportunities.reduce((total, item) => {
    if (item.viewerState !== "host") return total;
    return total + Math.max(0, number(item.pendingRequestCount) || 0);
  }, 0);

  return {
    summary: {
      opportunityCount: opportunities.length,
      activeIntentCount: activeIntents.length,
      bestMatchCount: bestMatches.length,
      scheduledCount: schedule.length,
      hostPendingRequestCount
    },
    activeIntents,
    bestMatches,
    schedule,
    opportunities: opportunities.slice(0, 10)
  };
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

function compactOpportunity(row = {}) {
  const key = clean(row?.opportunity_key, 160);
  if (!key) return null;
  const metadata = object(row?.metadata);
  return {
    key,
    type: clean(row?.opportunity_type, 40),
    id: clean(row?.opportunity_id, 120),
    title: clean(row?.title, 120),
    activity: clean(row?.activity, 80),
    area: clean(row?.area, 120) || null,
    startsAt: row?.starts_at || null,
    endsAt: row?.ends_at || null,
    organizer: {
      id: clean(row?.organizer_user_id, 120) || null,
      displayName: clean(row?.organizer_display_name, 100) || null,
      handle: clean(row?.organizer_handle, 80) || null
    },
    participantCount: number(row?.participant_count),
    capacity: number(row?.capacity),
    spotsRemaining: number(row?.spots_remaining),
    viewerState: clean(row?.viewer_state, 40) || "available",
    verificationMode: clean(row?.verification_mode, 60) || null,
    joinMode: clean(row?.join_mode, 40) || null,
    rewardXp: number(row?.reward_xp),
    pendingRequestCount: number(metadata?.pending_request_count)
  };
}

function compactIntent(row = {}) {
  const intentId = clean(row?.intent_id, 120);
  if (!intentId) return null;
  return {
    intentId,
    activity: clean(row?.activity, 80),
    experienceLevel: clean(row?.experience_level, 40),
    intensity: clean(row?.intensity, 40),
    desiredGroupMin: number(row?.desired_group_min),
    desiredGroupMax: number(row?.desired_group_max),
    area: clean(row?.area, 120) || null,
    radiusMiles: number(row?.radius_miles),
    timeWindowStart: row?.time_window_start || null,
    timeWindowEnd: row?.time_window_end || null,
    expiresAt: row?.expires_at || null
  };
}

function compactMatch(row = {}, intentId = null) {
  const opportunity = compactOpportunity(row);
  if (!opportunity) return null;
  return {
    ...opportunity,
    intentId,
    matchScore: number(row?.match_score),
    matchReasons: array(row?.match_reasons).map((item) => clean(item, 140)).filter(Boolean).slice(0, 6)
  };
}

function dedupeMatches(rows = []) {
  const byKey = new Map();
  for (const row of rows) {
    if (!row?.key) continue;
    const current = byKey.get(row.key);
    if (!current || (number(row.matchScore) || 0) > (number(current.matchScore) || 0)) {
      byKey.set(row.key, row);
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const scoreDelta = (number(b.matchScore) || 0) - (number(a.matchScore) || 0);
    if (scoreDelta) return scoreDelta;
    return Date.parse(a?.startsAt || "") - Date.parse(b?.startsAt || "");
  });
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  // Deliberately no service-role fallback. Circle RPCs must execute as the user.
  const key = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function bearerToken(value = "") {
  const match = /^Bearer\s+(.+)$/i.exec(clean(value, 7000));
  return clean(match?.[1], 7000) || null;
}

function isMissingActionNetworkRpc(error) {
  const text = `${clean(error?.message, 500)} ${clean(error?.details, 500)} ${clean(error?.code, 120)}`;
  return error?.status === 404 || /PGRST202|could not find the function|schema cache/i.test(text);
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function normalizeStatus(value) {
  const status = Number(value);
  return Number.isFinite(status) && status >= 400 && status <= 599 ? Math.floor(status) : 500;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function number(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
