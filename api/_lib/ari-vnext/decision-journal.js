// ARI vNext — autobiographical journal of meaningful judgments and predictions.
// Stores compact conclusions + provenance, never hidden chain-of-thought.

import { decisionReviewDueAt } from "./long-horizon-outcomes.js";

export const ARI_DECISION_JOURNAL_VERSION = "1.3.0";
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
        successCriteria: clean(experiment.supportsHypothesisIf, 1200),
        disconfirming: clean(experiment.weakensHypothesisIf, 1200),
        horizonDays: finiteOrNull(experiment.durationDays),
        hypothesisId: clean(experiment.hypothesisId || leading.id, 120),
        baseline: safeObject(experiment.baseline),
        measure: arrayText(experiment.measure, 10, 240),
        holdConstant: arrayText(experiment.holdConstant, 10, 240)
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

export async function resolveDecision({
  userId,
  decisionId,
  outcomeDirection,
  outcome = {},
  source = "observed_outcome"
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const decision = clean(decisionId, 200);
  if (!config || !id || !decision) return { resolved: false, reason: "decision_store_unavailable" };

  const direction = normalizeResolution(outcomeDirection);
  const now = new Date().toISOString();
  try {
    const params = new URLSearchParams({ id: "eq." + decision, user_id: "eq." + id, status: "eq.open" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify({
        status: "resolved",
        outcome_direction: direction,
        outcome: safeObject(outcome),
        resolution_source: clean(source, 120),
        resolved_at: now,
        updated_at: now
      })
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved
      ? { resolved: true, decision: normalizeDecision(saved) }
      : { resolved: false, reason: "open_decision_not_found" };
  } catch {
    return { resolved: false, reason: "decision_update_failed" };
  }
}

export async function resolveDecisionForExperiment({ userId, hypothesisId, outcomeDirection, outcome = {}, source = "experiment_ledger" } = {}) {
  const id = clean(userId, 200);
  const hypothesis = clean(hypothesisId, 120);
  if (!id || !hypothesis) return false;
  const open = await listRecentDecisions({ userId: id, statuses: ["open"], limit: 20 });
  const match = open.find((item) => clean(item?.prediction?.hypothesisId, 120) === hypothesis);
  if (!match) return false;
  const resolved = await resolveDecision({
    userId: id,
    decisionId: match.id,
    outcomeDirection,
    outcome,
    source
  });
  return resolved.resolved === true;
}

export function summarizeDecisionState(decisions = [], now = new Date()) {
  const rows = Array.isArray(decisions) ? decisions : [];
  const open = rows.filter((item) => item.status === "open");
  const resolved = rows.filter((item) => item.status === "resolved");
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(String(now || ""));
  const due = open
    .map((item) => ({ ...item, reviewDueAt: decisionReviewDueAt(item) }))
    .filter((item) => item.reviewDueAt && Date.parse(item.reviewDueAt) <= (Number.isFinite(nowMs) ? nowMs : Date.now()));
  const calibration = summarizeCalibration(resolved);
  const domains = [...new Set(resolved.map((item) => clean(item?.domain, 80)).filter(Boolean))];
  const byDomain = {};
  for (const domain of domains) {
    byDomain[domain] = summarizeCalibration(resolved.filter((item) => item.domain === domain));
  }
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
    dueCount: due.length,
    due: due.slice(0, 4).map(compactDecisionStateRow),
    recentOpen: open.slice(0, 6).map(compactDecisionStateRow),
    recentResolved: resolved.slice(0, 6).map(compactDecisionStateRow),
    calibration,
    calibrationByDomain: byDomain,
    confidenceGuidance: calibrationGuidance(calibration),
    timeline
  };
}

export function buildDecisionReviewPacket({
  decision = null,
  longitudinalState = null,
  coachingState = null,
  now = new Date()
} = {}) {
  if (!decision || typeof decision !== "object") return null;

  const prediction = decision?.prediction && typeof decision.prediction === "object"
    ? decision.prediction
    : {};
  const createdAt = decision?.createdAt || null;
  const reviewAt = decision?.reviewDueAt || prediction?.reviewAt || null;
  const horizonDays = finiteOrNull(prediction?.horizonDays);
  const originalPrediction = clean(
    prediction?.statement || prediction?.successCriteria || decision?.proposition,
    1000
  );
  const baseline = buildReviewBaseline(decision);
  const currentEvidence = buildCurrentReviewEvidence({
    decision,
    longitudinalState,
    coachingState
  });
  const evidenceQuality = reviewEvidenceQuality({
    longitudinalState,
    currentEvidence,
    decision
  });
  const preliminary = preliminaryPredictionAssessment({
    decision,
    longitudinalState,
    currentEvidence
  });

  return {
    version: "1.0.0",
    decisionId: clean(decision?.id, 200) || null,
    domain: clean(decision?.domain, 80) || "general",
    kind: clean(prediction?.kind, 40) || clean(decision?.decisionType, 80) || "prediction",
    proposition: clean(decision?.proposition, 900),
    originalPrediction,
    successCriteria: clean(prediction?.successCriteria || prediction?.statement, 900) || null,
    disconfirmingCriteria: clean(prediction?.disconfirming, 900) || null,
    hypothesisId: clean(prediction?.hypothesisId, 120) || null,
    observationWindow: {
      startAt: createdAt,
      reviewAt,
      horizonDays,
      due: Boolean(reviewAt && dateValue(reviewAt) <= dateValue(now || new Date()))
    },
    baseline,
    currentEvidence,
    evidenceQuality,
    preliminaryVerdict: preliminary.verdict,
    preliminaryRationale: preliminary.rationale,
    finalVerdictRequired: true,
    resolutionOptions: ["supported", "weakened", "mixed", "inconclusive"],
    hiddenChainOfThoughtStored: false
  };
}

function buildReviewBaseline(decision = {}) {
  const predictionBaseline = decision?.prediction?.baseline;
  const metrics = [];
  if (predictionBaseline && typeof predictionBaseline === "object" && !Array.isArray(predictionBaseline)) {
    if (predictionBaseline.weightVelocityPerWeek !== null && predictionBaseline.weightVelocityPerWeek !== undefined) {
      metrics.push(`Weight velocity: ${signedNumber(predictionBaseline.weightVelocityPerWeek)} lb/week`);
    }
    if (predictionBaseline.adherenceRate !== null && predictionBaseline.adherenceRate !== undefined) {
      metrics.push(`Training adherence: ${percent(predictionBaseline.adherenceRate)}`);
    }
    const progression = predictionBaseline.progression || {};
    if (Object.keys(progression).length) {
      metrics.push(
        `Progression: ${Number(progression.up || 0)} up, ${Number(progression.stable || 0)} stable, ${Number(progression.down || 0)} down, ${Number(progression.plateaus || 0)} plateau candidates, ${Number(progression.recentWindowPrs || 0)} recent-window PRs`
      );
    }
    if (clean(predictionBaseline.goal, 80)) metrics.push(`Goal: ${clean(predictionBaseline.goal, 80)}`);
  }

  const supporting = arrayText(decision?.evidence?.for, 6, 320);
  const against = arrayText(decision?.evidence?.against, 4, 320);
  const unknowns = arrayText(decision?.evidence?.unknowns, 4, 320);

  return {
    available: metrics.length > 0 || supporting.length > 0 || against.length > 0 || unknowns.length > 0,
    metrics,
    supportingEvidence: supporting,
    contradictingEvidence: against,
    unknowns
  };
}

function buildCurrentReviewEvidence({ decision = {}, longitudinalState = null, coachingState = null } = {}) {
  const state = longitudinalState && typeof longitudinalState === "object" ? longitudinalState : {};
  const evidence = [];
  const weight = state?.weight || {};
  const adherence = state?.training?.adherence || {};
  const progression = state?.training?.progression || {};
  const nutrition = state?.nutrition || {};

  if (weight.available) {
    evidence.push({
      id: "weight_velocity",
      label: `Weight velocity: ${signedNumber(weight.velocityPerWeek)} lb/week across ${Number(weight.spanDays || 0)} days (${Number(weight.pointCount || 0)} points)`,
      confidence: Number(weight.spanDays || 0) >= 14 && Number(weight.pointCount || 0) >= 5 ? 0.86 : 0.66
    });
  }
  if (Number(adherence.plannedCount || 0) > 0) {
    evidence.push({
      id: "training_adherence",
      label: `Training adherence: ${percent(adherence.rate)} (${Number(adherence.completedCount || 0)}/${Number(adherence.plannedCount || 0)} planned sessions completed)`,
      confidence: Number(adherence.plannedCount || 0) >= 6 ? 0.9 : 0.72
    });
  }
  if (Number(progression.comparableExerciseCount || 0) > 0) {
    evidence.push({
      id: "performance_trajectory",
      label: `Comparable exercise trajectory: ${Number(progression.upCount || 0)} up, ${Number(progression.stableCount || 0)} stable, ${Number(progression.downCount || 0)} down; ${Number(progression.windowPrCount || 0)} recent-window PRs; ${Number(progression.plateauCandidateCount || 0)} plateau candidates`,
      confidence: Number(progression.comparableExerciseCount || 0) >= 3 ? 0.84 : 0.65
    });
  }
  if (Number(nutrition.loggedDayCount || 0) > 0) {
    evidence.push({
      id: "nutrition_coverage",
      label: `Nutrition coverage: ${Number(nutrition.loggedDayCount || 0)} logged days; average logged calories ${finiteOrNull(nutrition.averageLoggedCalories) ?? "unknown"}; average logged protein ${finiteOrNull(nutrition.averageLoggedProteinG) ?? "unknown"} g`,
      confidence: Number(nutrition.loggedDayCount || 0) >= 5 ? 0.58 : 0.42
    });
  }

  for (const item of Array.isArray(state?.signals) ? state.signals.slice(0, 6) : []) {
    if (!item?.summary) continue;
    evidence.push({
      id: clean(item.id, 120),
      label: clean(item.summary, 420),
      confidence: confidenceNumber(item.confidence)
    });
  }

  const reported = coachingState?.evidence?.reported || {};
  for (const [key, active] of Object.entries(reported)) {
    if (!active) continue;
    evidence.push({
      id: `reported_${clean(key, 80)}`,
      label: `User-reported context: ${humanize(key)}`,
      confidence: 0.78
    });
  }

  return evidence.slice(0, 10);
}

function reviewEvidenceQuality({ longitudinalState = null, currentEvidence = [], decision = null } = {}) {
  const state = longitudinalState || {};
  const comparable = Number(state?.training?.progression?.comparableExerciseCount || 0);
  const planned = Number(state?.training?.adherence?.plannedCount || 0);
  const weightPoints = Number(state?.weight?.pointCount || 0);
  const nutritionDays = Number(state?.nutrition?.loggedDayCount || 0);
  const evidenceCount = Array.isArray(currentEvidence) ? currentEvidence.length : 0;
  const unknowns = arrayText(decision?.evidence?.unknowns, 8, 220).length;

  let score = 0;
  if (comparable >= 3) score += 2;
  else if (comparable > 0) score += 1;
  if (planned >= 6) score += 2;
  else if (planned > 0) score += 1;
  if (weightPoints >= 5) score += 1;
  if (nutritionDays >= 5) score += 1;
  if (evidenceCount >= 4) score += 1;
  if (unknowns >= 3) score -= 1;

  return {
    label: score >= 5 ? "strong" : score >= 3 ? "moderate" : score >= 1 ? "partial" : "limited",
    score,
    evidenceCount,
    note: score >= 5
      ? "Enough current observations exist for a meaningful review, though the result can still be mixed."
      : score >= 3
        ? "Several current observations are available, but important uncertainty may remain."
        : score >= 1
          ? "Some current evidence is available, but the review should remain cautious."
          : "The observation window is due, but the available evidence is too sparse for a confident verdict."
  };
}

function preliminaryPredictionAssessment({ decision = {}, longitudinalState = null, currentEvidence = [] } = {}) {
  const hypothesisId = clean(decision?.prediction?.hypothesisId, 120);
  if (hypothesisId !== "normal_variability_or_measurement_noise") {
    return {
      verdict: "pending_review",
      rationale: currentEvidence.length
        ? "New observations are available, but this prediction still requires an explicit evidence comparison before resolution."
        : "The review date has arrived, but no reliable automatic verdict is available from the current structured evidence."
    };
  }

  const progression = longitudinalState?.training?.progression || {};
  const signals = new Set((Array.isArray(longitudinalState?.signals) ? longitudinalState.signals : []).map((item) => clean(item?.id, 120)));
  const comparable = Number(progression.comparableExerciseCount || 0);
  const down = Number(progression.downCount || 0);
  const up = Number(progression.upCount || 0);
  const broadPressure = signals.has("broad_performance_pressure") || signals.has("multi_exercise_performance_regression");
  const plateau = signals.has("multi_exercise_plateau_pattern");

  if (comparable >= 3 && (broadPressure || down >= 2 || plateau)) {
    return {
      verdict: "weakened",
      rationale: "The decline repeated across enough comparable exposure to look less like isolated session noise."
    };
  }

  if (comparable >= 3 && down <= 1 && !broadPressure && !plateau && (up >= 1 || Number(progression.stableCount || 0) >= 2)) {
    return {
      verdict: "supported",
      rationale: "The pattern did not broaden across comparable exposures, which is consistent with normal session variability or measurement noise."
    };
  }

  return {
    verdict: "inconclusive",
    rationale: "The observation window ended, but there still is not enough comparable evidence to separate normal variability from a persistent pattern."
  };
}

function confidenceNumber(value) {
  if (typeof value === "number") return Math.max(0, Math.min(1, value));
  const text = clean(value, 40).toLowerCase();
  if (text === "high") return 0.88;
  if (text === "moderate") return 0.7;
  if (text === "low") return 0.48;
  return 0.55;
}

function percent(value) {
  const number = finiteOrNull(value);
  return number === null ? "unknown" : `${Math.round(number * 100)}%`;
}

function signedNumber(value) {
  const number = finiteOrNull(value);
  if (number === null) return "unknown";
  return `${number >= 0 ? "+" : ""}${Math.round(number * 100) / 100}`;
}

function humanize(value) {
  return clean(value, 120)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
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
    state?.confidenceGuidance || "Do not modify confidence from historical calibration until the sample is large enough.",
    "When a prior judgment was weakened, treat that as a reason to examine alternatives more carefully under similar conditions.",
    "For long-horizon decisions, real-world outcomes outrank conversational agreement. A due review is an invitation to compare the original expectation with what actually happened.",
    "A resolved outcome is bounded evidence, not a universal rule. Transfer the lesson only when the future context is materially similar.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 8500);
}

function compactDecisionStateRow(item = {}) {
  return {
    id: item?.id || null,
    domain: clean(item?.domain, 80),
    decisionType: clean(item?.decisionType, 80),
    proposition: clean(item?.proposition, 700),
    confidence: finiteOrNull(item?.confidence),
    evidence: {
      for: arrayText(item?.evidence?.for, 8, 320),
      against: arrayText(item?.evidence?.against, 8, 320),
      unknowns: arrayText(item?.evidence?.unknowns, 8, 320)
    },
    prediction: {
      kind: clean(item?.prediction?.kind, 40) || null,
      statement: clean(item?.prediction?.statement, 700) || null,
      successCriteria: clean(item?.prediction?.successCriteria, 700) || null,
      disconfirming: clean(item?.prediction?.disconfirming, 700) || null,
      horizonDays: finiteOrNull(item?.prediction?.horizonDays),
      reviewAt: item?.prediction?.reviewAt || null,
      reviewQuestion: clean(item?.prediction?.reviewQuestion, 700) || null,
      hypothesisId: clean(item?.prediction?.hypothesisId, 120) || null,
      baseline: safeObject(item?.prediction?.baseline),
      measure: arrayText(item?.prediction?.measure, 10, 240),
      holdConstant: arrayText(item?.prediction?.holdConstant, 10, 240)
    },
    status: clean(item?.status, 40),
    outcomeDirection: clean(item?.outcomeDirection, 40) || null,
    outcome: {
      summary: clean(item?.outcome?.summary, 700) || null,
      lesson: clean(item?.outcome?.lesson, 900) || null,
      observedAt: item?.outcome?.observedAt || null
    },
    reviewDueAt: item?.reviewDueAt || decisionReviewDueAt(item),
    createdAt: item?.createdAt || null,
    resolvedAt: item?.resolvedAt || null
  };
}

function calibrationGuidance(calibration = {}) {
  if (!calibration?.available) return "Calibration sample is still too small. Do not change confidence merely to fit a tiny historical sample.";
  if (calibration.tendency === "overconfident") return "Historical predictions have been more confident than their observed hit rate. Express similar current conclusions more cautiously without changing the underlying evidence ranking.";
  if (calibration.tendency === "underconfident") return "Historical predictions have been more accurate than their expressed confidence. Ari may state well-supported conclusions somewhat more decisively, while preserving uncertainty and alternatives.";
  if (calibration.tendency === "roughly_calibrated") return "Historical confidence is roughly aligned with observed outcomes. Keep current confidence tied to evidence rather than artificially adjusting it.";
  return "Calibration state is uncertain. Keep confidence tied to current evidence.";
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
