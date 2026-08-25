// ARI vNext — server-grounded Crew initiative candidate loader.
// Crew suggestions are derived only from the signed-in user's guarded Crew
// candidate RPC. Browser/client context is never authority for proactive Crew
// suggestions, and this module has no mutation capability.

const MAX_LIMIT = 4;
const REQUEST_TIMEOUT_MS = 3500;

export async function loadCrewInitiativeCandidates({ accessToken = "", now = new Date(), limit = 3 } = {}) {
  const token = clean(accessToken, 7000);
  const config = supabaseConfig();
  const cap = Math.max(1, Math.min(Number(limit) || 3, MAX_LIMIT));

  if (!token || !config) {
    return unavailable("crew_initiative_not_configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/ari_circle_list_crew_candidates`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ result_limit: cap }),
      signal: controller.signal,
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (isMissingRpc(response.status, data)) return unavailable("crew_candidates_not_migrated");
      return unavailable("crew_candidate_read_failed");
    }

    const items = (Array.isArray(data) ? data : [])
      .map(compactCandidate)
      .filter(Boolean)
      .slice(0, cap);

    return {
      available: true,
      generatedAt: toIso(now),
      count: items.length,
      items,
      source: "user_scoped_crew_candidates",
      rules: initiativeRules()
    };
  } catch (error) {
    return unavailable(error?.name === "AbortError" ? "crew_candidate_read_timeout" : "crew_candidate_read_failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

function compactCandidate(row = {}) {
  const candidateKey = clean(row?.candidate_key, 64).toLowerCase();
  const completedTogether = finite(row?.completed_together);
  const memberCount = finite(row?.member_count);
  if (!/^[0-9a-f]{32}$/.test(candidateKey)) return null;
  if (!Number.isFinite(completedTogether) || completedTogether < 2) return null;
  if (!Number.isFinite(memberCount) || memberCount < 3 || memberCount > 8) return null;

  const members = (Array.isArray(row?.members) ? row.members : [])
    .map((member) => ({
      displayName: clean(member?.display_name, 100) || null,
      handle: clean(member?.handle, 80) || null,
      isViewer: member?.is_viewer === true
    }))
    .filter((member) => member.displayName || member.handle || member.isViewer)
    .slice(0, 8);

  return {
    candidateKey,
    memberCount: Math.trunc(memberCount),
    completedTogether: Math.trunc(completedTogether),
    firstCompletedAt: safeIso(row?.first_completed_at),
    lastCompletedAt: safeIso(row?.last_completed_at),
    topActivity: clean(row?.top_activity, 80) || null,
    members
  };
}

function initiativeRules() {
  return {
    userJwtRequired: true,
    serviceRoleFallback: false,
    directCrewTableRead: false,
    mutationAuthority: false,
    rawMemberIdsIncluded: false,
    candidateEvidenceServerAuthoritative: true
  };
}

function unavailable(reason = "unavailable") {
  return {
    available: false,
    count: 0,
    items: [],
    reason,
    source: "user_scoped_crew_candidates",
    rules: initiativeRules()
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  // Deliberately no service-role fallback. Crew initiative reads must execute
  // with the signed-in user's JWT through the guarded RPC.
  const key = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function isMissingRpc(status, data) {
  const text = `${clean(data?.message, 500)} ${clean(data?.details, 500)} ${clean(data?.code, 120)}`;
  return status === 404 || /PGRST202|could not find the function|schema cache/i.test(text);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
