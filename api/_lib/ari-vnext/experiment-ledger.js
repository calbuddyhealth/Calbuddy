// ARI vNext — persistent N-of-1 experiment ledger.
// Server-only persistence for hypotheses, predictions, interventions and outcomes.

export const ARI_EXPERIMENT_LEDGER_VERSION = "1.0.0";
const TABLE = "ari_vnext_experiments";

export async function listUserExperiments({ userId, statuses = [], limit = 8 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];

  const params = new URLSearchParams();
  params.set("user_id", `eq.${id}`);
  params.set("select", "id,user_id,source_turn_id,domain,status,hypothesis_id,hypothesis_label,hypothesis_score,prediction,intervention,controls,baseline,measures,supports_hypothesis_if,weakens_hypothesis_if,duration_days,started_at,review_at,completed_at,result,outcome_direction,confidence_before,confidence_after,evaluation_source,created_at,updated_at");
  params.set("order", "created_at.desc");
  params.set("limit", String(clampInt(limit, 1, 20, 8)));
  const normalized = (Array.isArray(statuses) ? statuses : []).map((item) => clean(item, 40)).filter(Boolean);
  if (normalized.length === 1) params.set("status", `eq.${normalized[0]}`);
  if (normalized.length > 1) params.set("status", `in.(${normalized.join(",")})`);

  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeExperiment) : [];
  } catch {
    return [];
  }
}

export async function startExperiment({ userId, sourceTurnId = null, route = {}, scientificIntelligence = null } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { success: false, code: "experiment_store_unavailable" };

  const experiment = scientificIntelligence?.experiment;
  const hypotheses = Array.isArray(scientificIntelligence?.hypotheses) ? scientificIntelligence.hypotheses : [];
  if (!experiment || experiment.readiness !== "ready") {
    return { success: false, code: "experiment_not_ready", message: "Ari does not have enough evidence to start a tracked experiment yet." };
  }

  const hypothesis = hypotheses.find((item) => item.id === experiment.hypothesisId) || hypotheses[0] || null;
  if (!hypothesis?.id) return { success: false, code: "experiment_hypothesis_missing" };

  const existing = await listUserExperiments({ userId: id, statuses: ["active"], limit: 8 });
  const duplicate = existing.find((item) => item.hypothesisId === hypothesis.id);
  if (duplicate) {
    return { success: false, code: "experiment_already_active", experiment: duplicate };
  }

  const now = new Date();
  const durationDays = clampInt(experiment.durationDays, 1, 90, 14);
  const reviewAt = new Date(now.getTime() + durationDays * 86400000);
  const domain = route?.training ? "training" : route?.nutrition ? "nutrition" : route?.goals ? "goals" : "fitness";
  const prediction = buildPrediction(experiment);
  const row = {
    user_id: id,
    source_turn_id: clean(sourceTurnId, 200) || null,
    domain,
    status: "active",
    hypothesis_id: clean(hypothesis.id, 120),
    hypothesis_label: clean(hypothesis.label || experiment.hypothesis, 500),
    hypothesis_score: finiteOrNull(hypothesis.score),
    prediction,
    intervention: {
      description: clean(experiment.intervention, 1800),
      principle: clean(experiment.principle, 900)
    },
    controls: arrayText(experiment.holdConstant, 12, 400),
    baseline: safeObject(experiment.baseline),
    measures: arrayText(experiment.measure, 12, 400),
    supports_hypothesis_if: clean(experiment.supportsHypothesisIf, 1600) || null,
    weakens_hypothesis_if: clean(experiment.weakensHypothesisIf, 1600) || null,
    duration_days: durationDays,
    started_at: now.toISOString(),
    review_at: reviewAt.toISOString(),
    confidence_before: finiteOrNull(hypothesis.score),
    evaluation_source: "ari_vnext_investigator_v1",
    updated_at: now.toISOString()
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row)
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      return { success: false, code: "experiment_insert_failed", status: response.status };
    }
    const saved = normalizeExperiment(Array.isArray(data) ? data[0] : data);
    return { success: true, experiment: saved };
  } catch (error) {
    return { success: false, code: "experiment_insert_failed", message: error?.message || "Experiment could not be stored." };
  }
}

export async function closeExperiment({ userId, experimentId, outcomeDirection, result = {}, confidenceAfter = null, evaluationSource = "user_and_ari" } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const expId = clean(experimentId, 200);
  const outcome = clean(outcomeDirection, 40).toLowerCase();
  if (!config || !id || !expId) return { success: false, code: "experiment_store_unavailable" };
  if (!["positive", "negative", "mixed", "inconclusive"].includes(outcome)) {
    return { success: false, code: "invalid_experiment_outcome" };
  }

  const now = new Date().toISOString();
  const patch = {
    status: "completed",
    completed_at: now,
    outcome_direction: outcome,
    result: safeObject(result),
    confidence_after: finiteOrNull(confidenceAfter),
    evaluation_source: clean(evaluationSource, 120) || "user_and_ari",
    updated_at: now
  };

  try {
    const params = new URLSearchParams({ id: `eq.${expId}`, user_id: `eq.${id}`, status: "eq.active" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(patch)
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) return { success: false, code: "experiment_update_failed", status: response.status };
    const saved = Array.isArray(data) ? data[0] : data;
    if (!saved) return { success: false, code: "active_experiment_not_found" };
    return { success: true, experiment: normalizeExperiment(saved) };
  } catch (error) {
    return { success: false, code: "experiment_update_failed", message: error?.message || "Experiment could not be completed." };
  }
}

export async function cancelExperiment({ userId, experimentId, reason = "cancelled_by_user" } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const expId = clean(experimentId, 200);
  if (!config || !id || !expId) return { success: false, code: "experiment_store_unavailable" };

  const now = new Date().toISOString();
  const patch = {
    status: "cancelled",
    completed_at: now,
    result: { reason: clean(reason, 500) },
    evaluation_source: "user_cancelled",
    updated_at: now
  };

  try {
    const params = new URLSearchParams({ id: `eq.${expId}`, user_id: `eq.${id}`, status: "eq.active" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(patch)
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) return { success: false, code: "experiment_cancel_failed", status: response.status };
    const saved = Array.isArray(data) ? data[0] : data;
    return saved ? { success: true, experiment: normalizeExperiment(saved) } : { success: false, code: "active_experiment_not_found" };
  } catch (error) {
    return { success: false, code: "experiment_cancel_failed", message: error?.message || "Experiment could not be cancelled." };
  }
}

export function summarizeExperimentLedger(experiments = [], now = new Date()) {
  const rows = Array.isArray(experiments) ? experiments : [];
  const currentMs = now instanceof Date ? now.getTime() : Date.now();
  const active = rows.filter((item) => item.status === "active");
  const completed = rows.filter((item) => item.status === "completed");
  const due = active.filter((item) => item.reviewAt && Date.parse(item.reviewAt) <= currentMs);

  return {
    version: ARI_EXPERIMENT_LEDGER_VERSION,
    activeCount: active.length,
    completedCount: completed.length,
    dueCount: due.length,
    active: active.slice(0, 4).map(compactExperiment),
    due: due.slice(0, 4).map(compactExperiment),
    recentCompleted: completed.slice(0, 4).map(compactExperiment)
  };
}

export function evaluateExperimentSnapshot(experiment = {}, longitudinalState = null, coachingState = null) {
  if (!experiment?.id || experiment?.status !== "active") return null;
  const baseline = safeObject(experiment.baseline);
  const current = {
    weightVelocityPerWeek: longitudinalState?.weight?.available ? finiteOrNull(longitudinalState.weight.velocityPerWeek) : null,
    adherenceRate: finiteOrNull(longitudinalState?.training?.adherence?.rate),
    progression: {
      up: Number(longitudinalState?.training?.progression?.upCount || 0),
      stable: Number(longitudinalState?.training?.progression?.stableCount || 0),
      down: Number(longitudinalState?.training?.progression?.downCount || 0),
      plateaus: Number(longitudinalState?.training?.progression?.plateauCandidateCount || 0),
      recentWindowPrs: Number(longitudinalState?.training?.progression?.windowPrCount || 0)
    },
    reported: safeObject(coachingState?.evidence?.reported)
  };

  const delta = {
    weightVelocityPerWeek: numericDelta(current.weightVelocityPerWeek, baseline?.weightVelocityPerWeek),
    adherenceRate: numericDelta(current.adherenceRate, baseline?.adherenceRate),
    upTrendCount: Number(current.progression.up || 0) - Number(baseline?.progression?.up || 0),
    downTrendCount: Number(current.progression.down || 0) - Number(baseline?.progression?.down || 0),
    plateauCount: Number(current.progression.plateaus || 0) - Number(baseline?.progression?.plateaus || 0)
  };

  const suggestion = suggestOutcome(experiment.hypothesisId, delta, current);
  return {
    experimentId: experiment.id,
    hypothesisId: experiment.hypothesisId,
    baseline,
    current,
    delta,
    reviewDue: Boolean(experiment.reviewAt && Date.parse(experiment.reviewAt) <= Date.now()),
    suggestedOutcome: suggestion.outcome,
    confidence: suggestion.confidence,
    rationale: suggestion.rationale
  };
}

function suggestOutcome(hypothesisId, delta, current) {
  if (hypothesisId === "execution_gap") {
    if (delta.adherenceRate !== null && delta.adherenceRate >= 0.15 && current.progression.down <= 1) return { outcome: "positive", confidence: 0.64, rationale: "Adherence improved materially without a broad decline pattern." };
    if (current.adherenceRate >= 0.75 && current.progression.down >= 2) return { outcome: "negative", confidence: 0.62, rationale: "Adherence is now reasonably high but several comparable trends remain down." };
  }
  if (hypothesisId === "energy_availability_pressure") {
    if (delta.downTrendCount <= -1 && current.progression.up >= 1) return { outcome: "positive", confidence: 0.6, rationale: "Performance trajectory improved relative to baseline while the experiment was active." };
    if (current.progression.down >= 2 && delta.downTrendCount >= 0) return { outcome: "negative", confidence: 0.58, rationale: "Performance pressure persisted or worsened during the observation window." };
  }
  if (hypothesisId === "recovery_pressure") {
    if (!current.reported?.fatigue && !current.reported?.poorSleep && !current.reported?.persistentSoreness && delta.downTrendCount <= -1) return { outcome: "positive", confidence: 0.56, rationale: "Recovery complaints are not currently present and performance pressure improved." };
  }
  if (hypothesisId === "program_stimulus_mismatch") {
    if (delta.upTrendCount >= 1 || delta.plateauCount <= -1) return { outcome: "positive", confidence: 0.62, rationale: "Progression improved or plateau candidates decreased after the narrow program change." };
    if (current.progression.down >= 2 && delta.plateauCount >= 0) return { outcome: "negative", confidence: 0.58, rationale: "The affected pattern did not improve during the experiment window." };
  }
  return { outcome: "inconclusive", confidence: 0.45, rationale: "The available measurements do not cleanly distinguish support from contradiction yet." };
}

function buildPrediction(experiment = {}) {
  const supports = clean(experiment.supportsHypothesisIf, 1000);
  return supports ? `Prediction: ${supports}` : clean(experiment.hypothesis, 1000);
}

function compactExperiment(item = {}) {
  return {
    id: item.id,
    status: item.status,
    domain: item.domain,
    hypothesisId: item.hypothesisId,
    hypothesisLabel: item.hypothesisLabel,
    hypothesisScore: item.hypothesisScore,
    prediction: item.prediction,
    intervention: item.intervention,
    controls: item.controls,
    baseline: item.baseline,
    measures: item.measures,
    supportsHypothesisIf: item.supportsHypothesisIf,
    weakensHypothesisIf: item.weakensHypothesisIf,
    durationDays: item.durationDays,
    startedAt: item.startedAt,
    reviewAt: item.reviewAt,
    completedAt: item.completedAt,
    outcomeDirection: item.outcomeDirection,
    confidenceBefore: item.confidenceBefore,
    confidenceAfter: item.confidenceAfter
  };
}

function normalizeExperiment(row = {}) {
  return {
    id: row?.id || null,
    userId: row?.user_id || null,
    sourceTurnId: row?.source_turn_id || null,
    domain: row?.domain || "fitness",
    status: row?.status || "proposed",
    hypothesisId: row?.hypothesis_id || null,
    hypothesisLabel: row?.hypothesis_label || null,
    hypothesisScore: finiteOrNull(row?.hypothesis_score),
    prediction: row?.prediction || null,
    intervention: safeObject(row?.intervention),
    controls: Array.isArray(row?.controls) ? row.controls : [],
    baseline: safeObject(row?.baseline),
    measures: Array.isArray(row?.measures) ? row.measures : [],
    supportsHypothesisIf: row?.supports_hypothesis_if || null,
    weakensHypothesisIf: row?.weakens_hypothesis_if || null,
    durationDays: finiteOrNull(row?.duration_days),
    startedAt: row?.started_at || null,
    reviewAt: row?.review_at || null,
    completedAt: row?.completed_at || null,
    result: safeObject(row?.result),
    outcomeDirection: row?.outcome_direction || null,
    confidenceBefore: finiteOrNull(row?.confidence_before),
    confidenceAfter: finiteOrNull(row?.confidence_after),
    evaluationSource: row?.evaluation_source || null,
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, 8000);
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

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function arrayText(value, maxItems, maxLength) {
  return (Array.isArray(value) ? value : []).slice(0, maxItems).map((item) => clean(item, maxLength)).filter(Boolean);
}

function numericDelta(a, b) {
  const left = finiteOrNull(a);
  const right = finiteOrNull(b);
  return left === null || right === null ? null : round(left - right, 3);
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
