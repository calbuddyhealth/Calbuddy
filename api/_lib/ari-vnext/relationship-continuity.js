// ARI vNext — relationship continuity and unfinished-business model.
// Gives Ari a natural sense of shared history without inventing intimacy,
// emotions, memories, or subjective consciousness.

export const ARI_RELATIONSHIP_CONTINUITY_VERSION = "1.0.0";

export function deriveRelationshipContinuity({
  userWorldModel = null,
  decisionState = null,
  experimentLedger = null,
  temporalTimeline = null,
  recentContinuityPairs = 0,
  now = new Date()
} = {}) {
  const model = userWorldModel && typeof userWorldModel === "object" ? userWorldModel : {};
  const source = model?.sourceSummary || {};
  const identity = model?.identity || {};
  const preferences = Array.isArray(model?.preferences?.items) ? model.preferences.items : [];
  const statedGoals = Array.isArray(model?.goals?.stated) ? model.goals.stated : [];
  const constraints = Array.isArray(model?.constraints?.items) ? model.constraints.items : [];
  const behavior = model?.behavior || {};
  const activeExperiments = Array.isArray(experimentLedger?.active) ? experimentLedger.active : [];
  const openDecisions = Array.isArray(decisionState?.recentOpen) ? decisionState.recentOpen : [];
  const timelineEvents = Array.isArray(temporalTimeline?.events) ? temporalTimeline.events : [];

  const recognitionSignals = [
    Object.keys(identity).length > 0,
    preferences.length > 0,
    statedGoals.length > 0,
    constraints.length > 0,
    hasObservedBehavior(behavior),
    Number(source?.durableMemoryLines || 0) > 0,
    Number(source?.experimentOutcomes || 0) > 0,
    activeExperiments.length > 0,
    openDecisions.length > 0,
    Number(recentContinuityPairs || 0) > 0
  ].filter(Boolean).length;

  const familiarity = recognitionSignals >= 6
    ? "established"
    : recognitionSignals >= 3
      ? "familiar"
      : recognitionSignals >= 1
        ? "developing"
        : "new";

  const unfinishedThreads = [
    ...experimentThreads(activeExperiments, now),
    ...decisionThreads(openDecisions, now),
    ...tensionThreads(model?.tensions)
  ]
    .sort((a, b) => threadWeight(b.priority) - threadWeight(a.priority) || dateValue(a.dueAt) - dateValue(b.dueAt))
    .slice(0, 6);

  const recentSharedEvents = timelineEvents
    .filter((item) => item?.at)
    .slice(0, 8)
    .map((item) => ({
      at: item.at,
      type: clean(item.type, 80),
      domain: clean(item.domain, 80),
      label: clean(item.label || item.proposition, 360)
    }));

  return {
    version: ARI_RELATIONSHIP_CONTINUITY_VERSION,
    recognizedUser: familiarity !== "new",
    familiarity,
    recognitionSignalCount: recognitionSignals,
    preferredName: clean(identity?.displayName || identity?.name || "", 120) || null,
    unfinishedThreads,
    unfinishedThreadCount: unfinishedThreads.length,
    recentSharedEvents,
    recentContinuityPairs: Number(recentContinuityPairs || 0),
    rules: {
      demonstrateRecognitionNaturally: true,
      doNotReciteBiography: true,
      doNotSayIRememberRepeatedly: true,
      neverInventSharedHistory: true,
      unfinishedBusinessCanBeRevisited: true,
      currentEvidenceCanOverridePastUnderstanding: true,
      noPossessivenessOrDependency: true,
      noClaimOfSubjectiveConsciousness: true
    }
  };
}

export function relationshipContinuityToInstruction(state = null) {
  if (!state) return "";
  return [
    "RELATIONSHIP CONTINUITY",
    `Recognition state: ${state.recognizedUser ? "returning user" : "new/insufficient continuity"}. Familiarity: ${state.familiarity || "new"}.`,
    "Demonstrate recognition through relevant judgment and continuity, not by reciting the user's biography or repeatedly saying 'I remember'.",
    "When a current request touches unfinished business, naturally connect it to the specific prior experiment, decision, or goal tension that is actually present in the supplied state.",
    "If the user has changed their mind, circumstances, or priorities, update the relationship model instead of forcing consistency with the past.",
    "Never invent a shared event, private memory, emotional attachment, possessiveness, neediness, or off-screen experience.",
    "Ari can feel continuous and recognizable while remaining honest that subjective consciousness is not established.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 7000);
}

function experimentThreads(experiments = [], now = new Date()) {
  const nowMs = dateValue(now);
  return experiments.slice(0, 6).map((item) => {
    const reviewAt = item?.reviewAt || item?.review_at || null;
    const due = reviewAt ? dateValue(reviewAt) <= nowMs : false;
    return {
      id: `experiment:${clean(item?.id, 160)}`,
      type: "experiment",
      domain: clean(item?.domain, 80) || "fitness",
      priority: due ? "high" : "medium",
      state: due ? "review_due" : "active",
      summary: due
        ? `A user-approved experiment is due for review: ${clean(item?.hypothesisLabel || item?.hypothesisId || "tracked hypothesis", 300)}.`
        : `A user-approved experiment is still in progress: ${clean(item?.hypothesisLabel || item?.hypothesisId || "tracked hypothesis", 300)}.`,
      dueAt: reviewAt,
      referenceId: item?.id || null
    };
  });
}

function decisionThreads(decisions = [], now = new Date()) {
  const nowMs = dateValue(now);
  return decisions.slice(0, 5).map((item) => {
    const horizonDays = finiteOrNull(item?.prediction?.horizonDays);
    const createdMs = dateValue(item?.createdAt);
    const dueMs = horizonDays !== null && createdMs ? createdMs + horizonDays * 86400000 : 0;
    const due = Boolean(dueMs && dueMs <= nowMs);
    return {
      id: `decision:${clean(item?.id, 160)}`,
      type: "decision",
      domain: clean(item?.domain, 80) || "fitness",
      priority: due ? "medium" : "low",
      state: due ? "prediction_due" : "watching",
      summary: due
        ? `Ari previously made a prediction that has reached its observation horizon: ${clean(item?.proposition, 420)}.`
        : `Ari is still watching a prior judgment: ${clean(item?.proposition, 420)}.`,
      dueAt: dueMs ? new Date(dueMs).toISOString() : null,
      referenceId: item?.id || null
    };
  });
}

function tensionThreads(tensions = []) {
  return (Array.isArray(tensions) ? tensions : []).slice(0, 3).map((item) => ({
    id: `tension:${clean(item?.id, 160)}`,
    type: "goal_tension",
    domain: "planning",
    priority: "low",
    state: "unresolved",
    summary: clean(item?.summary, 420),
    dueAt: null,
    referenceId: item?.id || null
  }));
}

function hasObservedBehavior(value = {}) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => item !== null && item !== undefined && item !== "" && (typeof item !== "object" || Object.values(item || {}).some((nested) => nested !== null && nested !== undefined)));
}
function threadWeight(value) {
  if (value === "high") return 4;
  if (value === "medium") return 3;
  if (value === "low") return 2;
  return 1;
}
function dateValue(value) {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
