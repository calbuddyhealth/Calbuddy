// ARI vNext — conservative outcome-to-hypothesis learning.
// Completed structured experiments are preferred evidence. Legacy user-reported
// outcome memories remain useful for experiences that predate the ledger.
// Current objective evidence always outranks autobiographical outcome history.

export const ARI_OUTCOME_LEARNING_VERSION = "1.1.0";

export function applyOutcomeLearning(scientificState = null, relevantMemory = "", experimentLedger = null) {
  if (!scientificState || !Array.isArray(scientificState?.hypotheses)) return scientificState;

  const structured = parseStructuredExperiments(experimentLedger);
  const remembered = parseOutcomes(relevantMemory);
  const outcomes = [...structured, ...remembered].slice(0, 10);

  if (!outcomes.length) {
    return {
      ...scientificState,
      outcomeLearning: {
        version: ARI_OUTCOME_LEARNING_VERSION,
        applied: false,
        matchedOutcomes: 0,
        structuredOutcomes: 0,
        rememberedOutcomes: 0,
        adjustments: []
      }
    };
  }

  const adjustments = new Map();
  for (const outcome of outcomes) {
    const hypothesisId = outcome.hypothesisId || mapOutcomeToHypothesis(outcome.text);
    if (!hypothesisId) continue;

    // Structured experiments carry more evidentiary weight than unstructured
    // retrospective statements, but the total influence remains tightly capped.
    const delta = outcome.source === "experiment_ledger"
      ? structuredDelta(outcome.direction)
      : rememberedDelta(outcome.direction);
    if (delta === 0) continue;

    const row = adjustments.get(hypothesisId) || { hypothesisId, delta: 0, evidence: [], structuredEvidenceCount: 0 };
    row.delta = clamp(row.delta + delta, -0.12, 0.12);
    row.evidence.push(outcomeEvidenceLabel(outcome));
    if (outcome.source === "experiment_ledger") row.structuredEvidenceCount += 1;
    adjustments.set(hypothesisId, row);
  }

  if (!adjustments.size) {
    return {
      ...scientificState,
      outcomeLearning: {
        version: ARI_OUTCOME_LEARNING_VERSION,
        applied: false,
        matchedOutcomes: outcomes.length,
        structuredOutcomes: structured.length,
        rememberedOutcomes: remembered.length,
        adjustments: []
      }
    };
  }

  const hypotheses = scientificState.hypotheses
    .map((item) => {
      const adjustment = adjustments.get(item.id);
      if (!adjustment) return { ...item };
      return {
        ...item,
        preOutcomeScore: item.score,
        score: round(clamp(Number(item.score || 0) + adjustment.delta, 0, 0.98), 2),
        outcomeAdjustment: round(adjustment.delta, 2),
        outcomeEvidence: adjustment.evidence.slice(0, 4)
      };
    })
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  hypotheses.forEach((item, index) => {
    item.rank = index + 1;
    item.status = index === 0
      ? (item.score >= 0.55 ? "leading" : "weak_leader")
      : index === 1 && item.score >= Math.max(0.25, Number(hypotheses[0]?.score || 0) - 0.18)
        ? "credible_alternative"
        : "deprioritized";
  });

  return {
    ...scientificState,
    hypotheses,
    outcomeLearning: {
      version: ARI_OUTCOME_LEARNING_VERSION,
      applied: true,
      matchedOutcomes: outcomes.length,
      structuredOutcomes: structured.length,
      rememberedOutcomes: remembered.length,
      adjustments: [...adjustments.values()].map((item) => ({
        hypothesisId: item.hypothesisId,
        delta: round(item.delta, 2),
        evidenceCount: item.evidence.length,
        structuredEvidenceCount: item.structuredEvidenceCount
      }))
    }
  };
}

function parseStructuredExperiments(ledger = null) {
  const completed = Array.isArray(ledger?.recentCompleted) ? ledger.recentCompleted : [];
  return completed
    .filter((item) => item?.status === "completed" && item?.hypothesisId)
    .map((item) => ({
      source: "experiment_ledger",
      experimentId: compact(item?.id, 160),
      hypothesisId: compact(item?.hypothesisId, 160),
      direction: normalizeDirection(item?.outcomeDirection),
      confidenceBefore: finiteOrNull(item?.confidenceBefore),
      confidenceAfter: finiteOrNull(item?.confidenceAfter),
      text: compact(item?.hypothesisLabel || item?.prediction || "Completed Ari experiment", 360)
    }))
    .filter((item) => item.direction && item.direction !== "inconclusive")
    .slice(0, 6);
}

function parseOutcomes(value = "") {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .map((line) => {
      const match = line.match(/User reported a (positive|negative|mixed) outcome after recent/i);
      return match
        ? { source: "durable_memory", direction: match[1].toLowerCase(), hypothesisId: null, text: line }
        : null;
    })
    .filter(Boolean)
    .slice(0, 6);
}

function structuredDelta(direction) {
  if (direction === "positive") return 0.07;
  if (direction === "negative") return -0.06;
  if (direction === "mixed") return 0.01;
  return 0;
}

function rememberedDelta(direction) {
  if (direction === "positive") return 0.05;
  if (direction === "negative") return -0.04;
  if (direction === "mixed") return 0.01;
  return 0;
}

function outcomeEvidenceLabel(outcome = {}) {
  if (outcome.source === "experiment_ledger") {
    return `structured_experiment:${outcome.experimentId || "unknown"}:${outcome.direction}`;
  }
  return `${outcome.direction}:${compact(outcome.text, 260)}`;
}

function mapOutcomeToHypothesis(text = "") {
  const value = String(text || "").toLowerCase();
  if (/\b(calorie|calories|intake|deficit|nutrition|protein|food|meal)\b/.test(value)) return "energy_availability_pressure";
  if (/\b(sleep|recovery|rest day|rest days|fatigue|soreness|deload)\b/.test(value)) return "recovery_pressure";
  if (/\b(adherence|consisten|complete sessions|missed sessions|show up|attendance)\b/.test(value)) return "execution_gap";
  if (/\b(program|volume|sets|reps|progression|exercise selection|exercise order|stimulus)\b/.test(value)) return "program_stimulus_mismatch";
  return null;
}

function normalizeDirection(value) {
  const direction = String(value || "").toLowerCase();
  return ["positive", "negative", "mixed", "inconclusive"].includes(direction) ? direction : null;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function compact(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}
