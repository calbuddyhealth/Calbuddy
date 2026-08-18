// ARI vNext — compact chronological event model.
// Lets Ari reason about before/after/since without relying on transcript order.

export const ARI_TEMPORAL_TIMELINE_VERSION = "1.0.0";

export function deriveTemporalTimeline({ context = {}, experiments = [], decisions = [], limit = 24 } = {}) {
  const events = [];

  for (const item of Array.isArray(context?.recentWeights) ? context.recentWeights : []) {
    const at = resolveDate(item, ["logged_at", "created_at", "date"]);
    const weight = finiteOrNull(item?.weight_lbs ?? item?.weight ?? item?.value);
    if (!at || weight === null) continue;
    events.push({ at, type: "weight", domain: "goals", label: `Weight ${weight} lb`, value: weight, source: "weight_logs" });
  }

  for (const item of Array.isArray(context?.recentTraining) ? context.recentTraining : []) {
    const at = resolveDate(item, ["completed_at", "workout_date", "training_date", "date", "created_at"]);
    if (!at) continue;
    const name = clean(item?.title || item?.name || item?.focus || item?.exercise_name || "Training session", 160);
    events.push({
      at,
      type: item?.completed === true ? "training_completed" : "training_event",
      domain: "training",
      label: name,
      value: {
        completed: item?.completed === true,
        sets: finiteOrNull(item?.completed_sets ?? item?.sets),
        durationMinutes: finiteOrNull(item?.duration_minutes ?? item?.durationMinutes)
      },
      source: "training_history"
    });
  }

  for (const item of Array.isArray(context?.recentMeals) ? context.recentMeals : []) {
    const at = resolveDate(item, ["nutrition_date", "created_at", "date"]);
    if (!at) continue;
    events.push({
      at,
      type: "nutrition_event",
      domain: "nutrition",
      label: clean(item?.name || "Meal", 140),
      value: { calories: finiteOrNull(item?.calories), proteinG: finiteOrNull(item?.protein_g ?? item?.proteinG) },
      source: "meal_logs"
    });
  }

  for (const item of Array.isArray(experiments) ? experiments : []) {
    if (item?.startedAt) events.push({
      at: item.startedAt,
      type: "experiment_started",
      domain: item.domain || "fitness",
      label: clean(item.hypothesisLabel || item.hypothesisId || "Ari experiment", 220),
      value: { experimentId: item.id, hypothesisId: item.hypothesisId, confidence: finiteOrNull(item.confidenceBefore) },
      source: "ari_experiment_ledger"
    });
    if (item?.completedAt) events.push({
      at: item.completedAt,
      type: "experiment_completed",
      domain: item.domain || "fitness",
      label: clean(item.hypothesisLabel || item.hypothesisId || "Ari experiment", 220),
      value: { experimentId: item.id, outcomeDirection: item.outcomeDirection, confidenceAfter: finiteOrNull(item.confidenceAfter) },
      source: "ari_experiment_ledger"
    });
  }

  for (const item of Array.isArray(decisions) ? decisions : []) {
    if (item?.createdAt) events.push({
      at: item.createdAt,
      type: "ari_decision",
      domain: item.domain || "fitness",
      label: clean(item.proposition, 260),
      value: { decisionId: item.id, confidence: finiteOrNull(item.confidence), status: item.status },
      source: "ari_decision_journal"
    });
    if (item?.resolvedAt) events.push({
      at: item.resolvedAt,
      type: "ari_decision_resolved",
      domain: item.domain || "fitness",
      label: clean(item.proposition, 260),
      value: { decisionId: item.id, outcomeDirection: item.outcomeDirection },
      source: "ari_decision_journal"
    });
  }

  const sorted = events
    .filter((item) => Number.isFinite(Date.parse(item.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return {
    version: ARI_TEMPORAL_TIMELINE_VERSION,
    eventCount: sorted.length,
    latestAt: sorted[0]?.at || null,
    earliestAt: sorted[sorted.length - 1]?.at || null,
    events: sorted.slice(0, clampInt(limit, 6, 40, 24))
  };
}

export function temporalTimelineToInstruction(timeline = null) {
  if (!timeline?.events?.length) return "";
  return [
    "TEMPORAL EVENT TIMELINE",
    "Use dated events to reason about before/after/since relationships. Do not infer causation from sequence alone.",
    "When the user says 'since', 'before', 'after', or references a phase, anchor the answer to actual dated events where available.",
    JSON.stringify(timeline, null, 2)
  ].join("\n").slice(0, 7000);
}

function resolveDate(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (!value) continue;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return null;
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
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
