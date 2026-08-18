// ARI vNext — conservative outcome-to-hypothesis learning.
// Applies small confidence adjustments from prior user-reported outcomes.
// Current objective evidence always outranks these autobiographical hints.

export const ARI_OUTCOME_LEARNING_VERSION = "1.0.0";

export function applyOutcomeLearning(scientificState = null, relevantMemory = "") {
  if (!scientificState || !Array.isArray(scientificState?.hypotheses)) return scientificState;

  const outcomes = parseOutcomes(relevantMemory);
  if (!outcomes.length) {
    return {
      ...scientificState,
      outcomeLearning: { version: ARI_OUTCOME_LEARNING_VERSION, applied: false, matchedOutcomes: 0, adjustments: [] }
    };
  }

  const adjustments = new Map();
  for (const outcome of outcomes.slice(0, 6)) {
    const hypothesisId = mapOutcomeToHypothesis(outcome.text);
    if (!hypothesisId) continue;
    const delta = outcome.direction === "positive" ? 0.06 : outcome.direction === "negative" ? -0.05 : 0.01;
    const row = adjustments.get(hypothesisId) || { hypothesisId, delta: 0, evidence: [] };
    row.delta = clamp(row.delta + delta, -0.12, 0.12);
    row.evidence.push(`${outcome.direction}:${compact(outcome.text, 260)}`);
    adjustments.set(hypothesisId, row);
  }

  if (!adjustments.size) {
    return {
      ...scientificState,
      outcomeLearning: { version: ARI_OUTCOME_LEARNING_VERSION, applied: false, matchedOutcomes: outcomes.length, adjustments: [] }
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
        outcomeEvidence: adjustment.evidence.slice(0, 3)
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
      adjustments: [...adjustments.values()].map((item) => ({
        hypothesisId: item.hypothesisId,
        delta: round(item.delta, 2),
        evidenceCount: item.evidence.length
      }))
    }
  };
}

function parseOutcomes(value = "") {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .map((line) => {
      const match = line.match(/User reported a (positive|negative|mixed) outcome after recent/i);
      return match ? { direction: match[1].toLowerCase(), text: line } : null;
    })
    .filter(Boolean);
}

function mapOutcomeToHypothesis(text = "") {
  const value = String(text || "").toLowerCase();
  if (/\b(calorie|calories|intake|deficit|nutrition|protein|food|meal)\b/.test(value)) return "energy_availability_pressure";
  if (/\b(sleep|recovery|rest day|rest days|fatigue|soreness|deload)\b/.test(value)) return "recovery_pressure";
  if (/\b(adherence|consisten|complete sessions|missed sessions|show up|attendance)\b/.test(value)) return "execution_gap";
  if (/\b(program|volume|sets|reps|progression|exercise selection|exercise order|stimulus)\b/.test(value)) return "program_stimulus_mismatch";
  return null;
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
