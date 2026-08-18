// ARI vNext — owner improvement lifecycle for Growth Inbox issues.
// A fix is not "verified" just because code changed: it requires a regression
// identity plus explicit verification evidence. Reappearance after verification
// automatically reopens the issue.

export const ARI_GROWTH_FIXES_VERSION = "1.1.0";
const TABLE = "ari_vnext_growth_fixes";
const STATUSES = new Set(["candidate", "fix_in_progress", "verification_pending", "verified_fixed", "reopened"]);

export async function listGrowthFixes({ userId, limit = 40 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,fingerprint,area,issue_key,status,reflection_ids,regression_test_id,fix_commit_sha,verification,created_at,updated_at,verified_at",
    order: "updated_at.desc",
    limit: String(clampInt(limit, 1, 80, 40))
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeFix) : [];
  } catch {
    return [];
  }
}

export async function syncGrowthFixCandidates({ userId, inbox } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const help = (Array.isArray(inbox?.items) ? inbox.items : []).filter((item) => item.level === "help_ari");
  if (!help.length) return listGrowthFixes({ userId: id, limit: 40 });

  const existing = await listGrowthFixes({ userId: id, limit: 60 });
  const byFingerprint = new Map(existing.map((item) => [item.fingerprint, item]));

  for (const item of help.slice(0, 30)) {
    const fingerprint = fingerprintFor(item);
    const previous = byFingerprint.get(fingerprint) || null;
    const reflectionIds = uniqueText([
      ...(Array.isArray(previous?.reflectionIds) ? previous.reflectionIds : []),
      item.id
    ], 30, 200);
    const newestReflectionAt = item.createdAt ? Date.parse(item.createdAt) : 0;
    const verifiedAt = previous?.verifiedAt ? Date.parse(previous.verifiedAt) : 0;
    const shouldReopen = shouldReopenVerifiedFix({ previous, newestReflectionAt });
    const status = shouldReopen ? "reopened" : previous?.status || "candidate";

    const row = {
      user_id: id,
      fingerprint,
      area: clean(item.area, 120) || "general_reasoning",
      issue_key: clean(item.issueKey, 160) || "general_reasoning_general",
      status,
      reflection_ids: reflectionIds,
      regression_test_id: previous?.regressionTestId || suggestedRegressionId(item),
      fix_commit_sha: previous?.fixCommitSha || null,
      verification: safeObject(previous?.verification),
      updated_at: new Date().toISOString(),
      verified_at: shouldReopen ? null : previous?.verifiedAt || null
    };

    try {
      const params = new URLSearchParams({ on_conflict: "user_id,fingerprint" });
      await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
        method: "POST",
        headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(row)
      });
    } catch {
      // Growth tracking must never make Ari brittle.
    }
  }

  return listGrowthFixes({ userId: id, limit: 40 });
}

export async function updateGrowthFix({ userId, fingerprint, status, regressionTestId = null, fixCommitSha = null, verification = null } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const key = clean(fingerprint, 300);
  const next = clean(status, 40);
  if (!config || !id || !key || !STATUSES.has(next)) return { success: false, code: "invalid_growth_fix_update" };

  const fixes = await listGrowthFixes({ userId: id, limit: 60 });
  const current = fixes.find((item) => item.fingerprint === key);
  if (!current) return { success: false, code: "growth_fix_not_found" };

  const regression = clean(regressionTestId || current.regressionTestId, 300) || null;
  const commit = clean(fixCommitSha || current.fixCommitSha, 80) || null;
  const evidence = verification && typeof verification === "object" && !Array.isArray(verification)
    ? verification
    : safeObject(current.verification);

  if (next === "verified_fixed") {
    const validation = validateGrowthVerification({ regressionTestId: regression, fixCommitSha: commit, verification: evidence });
    if (!validation.valid) return { success: false, code: "verification_evidence_insufficient", requirements: validation.requirements };
  }

  const now = new Date().toISOString();
  const patch = {
    status: next,
    regression_test_id: regression,
    fix_commit_sha: commit,
    verification: safeObject(evidence),
    updated_at: now,
    verified_at: next === "verified_fixed" ? now : current.verifiedAt || null
  };
  if (next === "reopened") patch.verified_at = null;

  try {
    const params = new URLSearchParams({ user_id: `eq.${id}`, fingerprint: `eq.${key}` });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(patch)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved ? { success: true, fix: normalizeFix(saved) } : { success: false, code: "growth_fix_update_failed" };
  } catch {
    return { success: false, code: "growth_fix_update_failed" };
  }
}

export function validateGrowthVerification({ regressionTestId = null, fixCommitSha = null, verification = null } = {}) {
  const evidence = verification && typeof verification === "object" && !Array.isArray(verification) ? verification : {};
  const requirements = {
    regressionTestId: Boolean(clean(regressionTestId, 300)),
    fixCommitSha: Boolean(clean(fixCommitSha, 80)),
    deterministicPassesAtLeast: 2,
    scenarioReproduced: evidence?.scenarioReproduced === true,
    noRegressionObserved: evidence?.noRegressionObserved === true
  };
  const deterministicPasses = Number(evidence?.deterministicPasses || 0);
  const valid = Boolean(
    requirements.regressionTestId &&
    requirements.fixCommitSha &&
    deterministicPasses >= 2 &&
    requirements.scenarioReproduced &&
    requirements.noRegressionObserved
  );
  return { valid, deterministicPasses, requirements };
}

export function shouldReopenVerifiedFix({ previous = null, newestReflectionAt = 0 } = {}) {
  if (previous?.status !== "verified_fixed") return false;
  const verifiedAt = previous?.verifiedAt ? Date.parse(previous.verifiedAt) : 0;
  return Number(newestReflectionAt || 0) > verifiedAt;
}

export function overlayGrowthFixState(inbox = {}, fixes = []) {
  const byFingerprint = new Map((Array.isArray(fixes) ? fixes : []).map((item) => [item.fingerprint, item]));
  const items = (Array.isArray(inbox?.items) ? inbox.items : []).map((item) => {
    const fingerprint = fingerprintFor(item);
    const fix = byFingerprint.get(fingerprint) || null;
    return {
      ...item,
      fingerprint,
      fixState: fix ? compactFix(fix) : null,
      verifiedFixed: fix?.status === "verified_fixed",
      reopened: fix?.status === "reopened"
    };
  });

  const summary = {
    ...(inbox?.summary || {}),
    fixCandidates: (Array.isArray(fixes) ? fixes : []).filter((item) => ["candidate", "fix_in_progress", "verification_pending", "reopened"].includes(item.status)).length,
    verifiedFixed: (Array.isArray(fixes) ? fixes : []).filter((item) => item.status === "verified_fixed").length,
    reopened: (Array.isArray(fixes) ? fixes : []).filter((item) => item.status === "reopened").length
  };

  return { ...inbox, version: `${inbox?.version || "growth"}+fixes-${ARI_GROWTH_FIXES_VERSION}`, summary, items, fixes: (Array.isArray(fixes) ? fixes : []).map(compactFix) };
}

export function fingerprintFor(item = {}) {
  return `${clean(item.area, 120) || "general_reasoning"}:${clean(item.issueKey, 160) || "general"}`.slice(0, 300);
}

function suggestedRegressionId(item = {}) {
  return `ari-vnext-growth-${clean(item.area, 70) || "general"}-${clean(item.issueKey, 90) || "issue"}`
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .toLowerCase()
    .slice(0, 240);
}
function compactFix(item = {}) {
  return {
    fingerprint: item.fingerprint,
    area: item.area,
    issueKey: item.issueKey,
    status: item.status,
    regressionTestId: item.regressionTestId,
    fixCommitSha: item.fixCommitSha,
    verification: item.verification,
    updatedAt: item.updatedAt,
    verifiedAt: item.verifiedAt
  };
}
function normalizeFix(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.user_id || null,
    fingerprint: clean(row.fingerprint, 300),
    area: clean(row.area, 120),
    issueKey: clean(row.issue_key, 160),
    status: clean(row.status, 40),
    reflectionIds: Array.isArray(row.reflection_ids) ? row.reflection_ids : [],
    regressionTestId: row.regression_test_id || null,
    fixCommitSha: row.fix_commit_sha || null,
    verification: safeObject(row.verification),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    verifiedAt: row.verified_at || null
  };
}
function uniqueText(values, maxItems, maxLen) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const text = clean(value, maxLen);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
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
