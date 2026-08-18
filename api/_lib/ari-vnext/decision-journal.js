// ARI vNext — autobiographical journal of meaningful judgments and predictions.
// Stores compact conclusions + provenance, never hidden chain-of-thought.

export const ARI_DECISION_JOURNAL_VERSION = "1.0.1";
const TABLE = "ari_vnext_decisions";

export async function listRecentDecisions({ userId, statuses = [], limit = 12 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,turn_id,domain,decision_type,proposition,confidence,evidence,alternatives,provenance,prediction,status,outcome_direction,outcome,resolution_source,created_at,resolved_at,updated_at",
    order: "created_at.desc",
    limit: String(clampInt(limit, 1, 30, 12))
  });
  const normalized = (Array.isArray(statuses) ? statuses : []).map((item) => clean(item, 30)).filter(Boolean);
  if (normalized.length === 1) params.set("status", `eq.${normalized[0]}`);
  if (normalized.length > 1) params.set("status", `in.(${normalized.join(",")})`);
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeDecision) : [];
  } catch {
    return [];
  }
}

export function buildDecisionRecord({ turnId = null, route = {}, result = null } = {}) {
  const scientific = result?.scientificIntelligence;
  const hypotheses = Array.isArray(scientific?.hypotheses) ? scientific.hypotheses : [];
  const leading = hypotheses[0] || null;
  if (!leading || Number(leading?.score || 0) < 0.42) return null;

  const evidenceNodes = Array.isArray(scientific?.evidenceGraph?.nodes) ? scientific.evidenceGraph.nodes : [];
  const provenance = evidenceNodes
    .filter((node) => node?.source)
    .slice(0, 10)
    .map((node) => ({
      source: clean(node.source, 120),
      type: clean(node.type, 80),
      label: clean(node.label, 220),
      confidence: finiteOrNull(node.confidence)
    }));
  const alternatives = hypotheses.slice(1, 3).map((item) => ({
    id: clean(item?.id, 120),
    label: clean(item?.label, 360),
    score: finiteOrNull(item?.score),
    status: clean(item?.status, 80)
  }));
  const experiment = scientific?.experiment || {};
  const prediction = experiment?.supportsHypothesisIf
    ? {
        statement: clean(experiment.supportsHypothesisIf, 1200),
        disconfirming: clean(experiment.weakensHypothesisIf, 1200),
        horizonDays: finiteOrNull(experiment.durationDays),
        hypothesisId: clean(experiment.hypothesisId || leading.id, 120)
      }
    : {};

  return {
    turnId: clean(turnId, 200) || null,
    domain: route?.training ? "training" : route?.nutrition ? "nutrition" : route?.goals ? "goals" : "fitness",
    decisionType: Object.keys(prediction).length ? "predictive_assessment" : "assessment",
    proposition: clean(leading.label, 1000),
    confidence: clampNumber(leading.score, 0, 0.98, null),
    evidence: {
      for: arrayText(leading?.supportingEvidence, 10, 500),
      against: arrayText(leading?.contradictingEvidence, 10, 500),
      unknowns: arrayText(leading?.unknowns, 10, 500)
    },
    alternatives,
    provenance,
    prediction
  };
}

export async function recordDecision({ userId, record } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id || !record?.proposition) return { stored: false };

  const recent = await listRecentDecisions({ userId: id, statuses: ["open"], limit: 5 });
  const duplicate = recent.find((item) =>
    item.domain === record.domain &&
    item.proposition.toLowerCase() === String(record.proposition).toLowerCase() &&
    Date.now() - Date.parse(item.createdAt || 0) < 36 * 60 * 60 * 1000
  );
  if (duplicate) return { stored: false, reason: "duplicate_recent_decision", decision: duplicate };

  const row = {
    user_id: id,
    turn_id: record.turnId || null,
    domain: clean(record.domain, 80) || "fitness",
    decision_type: clean(record.decisionType, 80) || "assessment",
    proposition: clean(record.proposition, 1000),
    confidence: finiteOrNull(record.confidence),
    evidence: safeObject(record.evidence),
    alternatives: Array.isArray(record.alternatives) ? record.alternatives.slice(0, 4) : [],
    provenance: Array.isArray(record.provenance) ? record.provenance.slice(0, 12) : [],
    prediction: safeObject(record.prediction),
    status: "open",
    updated_at: new Date().toISOString()
  };
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved ? { stored: true, decision: normalizeDecision(saved) } : { stored: false };
  } catch {
    return { stored: false };
  }
}

export async function resolveDecisionForExperiment({ userId, hypothesisId, outcomeDirection, outcome = {}, source = "experiment_ledger" } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const hypothesis = clean(hypothesisId, 120);
  if (!config || !id || !hypothesis) return false;
  const open = await listRecentDecisions({ userId: id, statuses: ["open"], limit: 20 });
  const match = open.find((item) => clean(item?.prediction?.hypothesisId, 120) === hypothesis);
  if (!match) return false;
  const direction = normalizeResolution(outcomeDirection);
  const now = new Date().toISOString();
  try {
    const params = new URLSearchParams({ id: `eq.${match.id}`, user_id: `eq.${id}`, status: "eq.open" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        status: "resolved",
        outcome_direction: direction,
        outcome: safeObject(outcome),
        resolution_source: clean(source, 120),
        resolved_at: now,
        updated_at: now
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function summarizeDecisionState(decisions = []) {
  const rows = Array.isArray(decisions) ? decisions : [];
  const open = rows.filter((item) => item.status === "open");
  const resolved = rows.filter((item) => item.status === "resolved");
  const calibration = summarizeCalibration(resolved);
  const timeline = rows.slice(0, 10).map((item) => ({
    at: item.resolvedAt || item.createdAt,
    type: item.status === "resolved" ? "resolved_decision" : "decision",
    domain: item.domain,
    proposition: item.proposition,
    confidence: item.confidence,
    outcomeDirection: item.outcomeDirection || null
  }));
  return {
    version: ARI_DECISION_JOURNAL_VERSION,
    openCount: open.length,
    resolvedCount: resolved.length,
    recentOpen: open.slice(0, 4),
    calibration,
    timeline
  };
}

export function summarizeCalibration(resolved = []) {
  const rows = (Array.isArray(resolved) ? resolved : []).filter((item) => finiteOrNull(item?.confidence) !== null);
  const scorable = rows.filter((item) => ["supported", "weakened"].includes(item?.outcomeDirection));
  if (!scorable.length) return { available: false, sampleSize: 0, accuracy: null, meanConfidence: null, calibrationGap: null, tendency: "unknown" };

  const correct = scorable.filter((item) => item.outcomeDirection === "supported").length;
  const accuracy = correct / scorable.length;
  const meanConfidence = scorable.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / scorable.length;
  const gap = meanConfidence - accuracy;
  return {
    available: scorable.length >= 3,
    sampleSize: scorable.length,
    accuracy: round(accuracy, 3),
    meanConfidence: round(meanConfidence, 3),
    calibrationGap: round(gap, 3),
    tendency: scorable.length < 3 ? "insufficient_sample" : gap > 0.12 ? "overconfident" : gap < -0.12 ? "underconfident" : "roughly_calibrated"
  };
}

export function decisionStateToInstruction(state = null) {
  if (!state) return "";
  return [
    "ARI DECISION JOURNAL",
    "This is a compact history of Ari's prior judgments and whether later evidence supported or weakened them. It is not hidden reasoning.",
    "Do not repeat an old conclusion simply because Ari said it before. Current evidence outranks consistency with the past.",
    "If calibration says Ari is overconfident in the available sample, soften confidence rather than changing the underlying evidence ranking.",
    "When a prior judgment was weakened, treat that as a reason to examine alternatives more carefully under similar conditions.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 7000);
}

function normalizeDecision(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    turnId: row.turn_id || null,
    domain: clean(row.domain, 80),
    decisionType: clean(row.decision_type, 80),
    proposition: clean(row.proposition, 1000),
    confidence: finiteOrNull(row.confidence),
    evidence: safeObject(row.evidence),
    alternatives: Array.isArray(row.alternatives) ? row.alternatives : [],
    provenance: Array.isArray(row.provenance) ? row.provenance : [],
    prediction: safeObject(row.prediction),
    status: clean(row.status, 40),
    outcomeDirection: row.outcome_direction || null,
    outcome: safeObject(row.outcome),
    resolutionSource: row.resolution_source || null,
    createdAt: row.created_at || null,
    resolvedAt: row.resolved_at || null,
    updatedAt: row.updated_at || null
  };
}
function normalizeResolution(value) {
  const direction = clean(value, 40).toLowerCase();
  if (direction === "positive") return "supported";
  if (direction === "negative") return "weakened";
  if (direction === "mixed") return "mixed";
  return ["supported", "weakened", "mixed", "inconclusive"].includes(direction) ? direction : "inconclusive";
}
function arrayText(value, maxItems, maxLength) {
  return (Array.isArray(value) ? value : []).slice(0, maxItems).map((item) => clean(typeof item === "string" ? item : JSON.stringify(item), maxLength)).filter(Boolean);
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clampNumber(value, min, max, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
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
