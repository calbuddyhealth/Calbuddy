// ARI vNext — structured persistent model of the person.
// This is not a transcript. It separates stated goals/preferences from observed
// behavior and measured response so Ari can notice mismatches without shaming.

export const ARI_USER_WORLD_MODEL_VERSION = "1.1.1";
const TABLE = "ari_vnext_user_models";
const PRIVACY_CATEGORIES = new Set(["identity", "preferences", "goals", "constraints", "behavior", "fitness_outcomes", "relationship"]);

export async function loadUserWorldModel({ userId } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return null;
  try {
    const params = new URLSearchParams({ user_id: `eq.${id}`, limit: "1" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return normalizeModel(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return null;
  }
}

export function deriveUserWorldModel({
  persisted = null,
  turn = {},
  context = {},
  communication = null,
  selfModel = null,
  coachingState = null,
  longitudinalState = null
} = {}) {
  const privacyControls = normalizePrivacyControls(persisted?.privacyControls);
  const blocked = new Set(privacyControls.blockedCategories);
  const memoryLines = String(context?.relevantMemory || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 24);

  const profile = blocked.has("identity") ? {} : compactObject(context?.user);
  const incomingGoalsContext = blocked.has("goals") ? {} : compactObject(context?.goals);
  const goalsContext = blocked.has("goals")
    ? {}
    : Object.keys(incomingGoalsContext).length
      ? mergeObject(persisted?.goals?.current, incomingGoalsContext)
      : compactObject(persisted?.goals?.current);
  const preferences = blocked.has("preferences") ? [] : uniqueText([
    ...arrayValues(persisted?.preferences?.items),
    ...memoryLines.filter((line) => /\b(prefer|like|love|favorite|favourite|dislike|hate|want ari to|prefer ari to)\b/i.test(line))
  ], 18, 360);
  const constraints = blocked.has("constraints") ? [] : uniqueText([
    ...arrayValues(persisted?.constraints?.items),
    ...memoryLines.filter((line) => /\b(can't|cannot|unable|schedule|shift|time constraint|injur|pain|allerg|budget|equipment|access)\b/i.test(line))
  ], 18, 360);
  const explicitGoals = blocked.has("goals") ? [] : uniqueText([
    ...arrayValues(persisted?.goals?.stated),
    ...memoryLines.filter((line) => /\b(my goal|my target|trying to|want to (lose|gain|maintain|run|train|lift|build|improve|reach)|cutting|bulking)\b/i.test(line)),
    ...extractCurrentTurnGoals(turn?.message)
  ], 14, 360);

  const adherence = longitudinalState?.training?.adherence || {};
  const progression = longitudinalState?.training?.progression || {};
  const weight = longitudinalState?.weight || {};
  const nutrition = longitudinalState?.nutrition || {};
  const experiments = context?.experimentLedger || {};
  const oldBehavior = blocked.has("behavior") ? {} : compactObject(persisted?.behavior);
  const oldPerformance = compactObject(oldBehavior?.recentPerformance);

  const observedBehavior = blocked.has("behavior") ? {} : {
    trainingAdherence: preferObserved(adherence?.rate, oldBehavior.trainingAdherence),
    plannedTrainingExposure: preferObserved(adherence?.plannedCount, oldBehavior.plannedTrainingExposure),
    completedTrainingExposure: preferObserved(adherence?.completedCount, oldBehavior.completedTrainingExposure),
    nutritionLoggedDays: preferObserved(nutrition?.loggedDayCount, oldBehavior.nutritionLoggedDays),
    recentPerformance: {
      up: preferObserved(progression?.upCount, oldPerformance.up),
      stable: preferObserved(progression?.stableCount, oldPerformance.stable),
      down: preferObserved(progression?.downCount, oldPerformance.down),
      plateaus: preferObserved(progression?.plateauCandidateCount, oldPerformance.plateaus)
    },
    weightVelocityPerWeek: weight?.available
      ? finiteOrNull(weight?.velocityPerWeek)
      : finiteOrNull(oldBehavior.weightVelocityPerWeek)
  };

  const currentOutcomes = blocked.has("fitness_outcomes") ? [] : (Array.isArray(experiments?.recentCompleted) ? experiments.recentCompleted : [])
    .slice(0, 4)
    .map((item) => ({
      hypothesisId: clean(item?.hypothesisId, 120),
      outcomeDirection: clean(item?.outcomeDirection, 40),
      confidenceBefore: finiteOrNull(item?.confidenceBefore),
      confidenceAfter: finiteOrNull(item?.confidenceAfter),
      completedAt: item?.completedAt || null
    }));
  const oldResponse = blocked.has("fitness_outcomes") ? {} : compactObject(persisted?.physiologicalResponse);
  const physiologicalResponse = blocked.has("fitness_outcomes") ? {} : {
    completedExperiments: experiments?.completedCount !== undefined && experiments?.completedCount !== null
      ? Number(experiments.completedCount || 0)
      : Number(oldResponse?.completedExperiments || 0),
    recentOutcomes: currentOutcomes.length ? currentOutcomes : (Array.isArray(oldResponse?.recentOutcomes) ? oldResponse.recentOutcomes.slice(0, 4) : [])
  };

  const contradictions = detectGoalBehaviorTensions({
    goals: explicitGoals,
    goalsContext,
    observedBehavior,
    constraints
  });

  return {
    version: ARI_USER_WORLD_MODEL_VERSION,
    privacyControls,
    identity: blocked.has("identity") ? {} : mergeObject(persisted?.identity, profile),
    preferences: blocked.has("preferences") ? { items: [] } : { items: preferences },
    goals: blocked.has("goals") ? { stated: [], current: {} } : { stated: explicitGoals, current: goalsContext },
    constraints: blocked.has("constraints") ? { items: [] } : { items: constraints },
    behavior: observedBehavior,
    responseProfile: {
      detail: communication?.detail || persisted?.responseProfile?.detail || persisted?.responseProfile?.verbosity || null,
      directness: communication?.directness || persisted?.responseProfile?.directness || null,
      tone: communication?.tone || persisted?.responseProfile?.tone || null,
      familiarity: selfModel?.current?.familiarity || persisted?.responseProfile?.familiarity || null
    },
    physiologicalResponse,
    relationship: blocked.has("relationship") ? {} : {
      mode: selfModel?.current?.mode || persisted?.relationship?.mode || null,
      familiarity: selfModel?.current?.familiarity || persisted?.relationship?.familiarity || null
    },
    tensions: blocked.has("goals") || blocked.has("behavior") || blocked.has("constraints")
      ? []
      : contradictions.length ? contradictions : (Array.isArray(persisted?.tensions) ? persisted.tensions.slice(0, 5) : []),
    sourceSummary: {
      profile: !blocked.has("identity") && (Object.keys(profile).length > 0 || Boolean(persisted?.sourceSummary?.profile)),
      durableMemoryLines: Math.max(memoryLines.length, Number(persisted?.sourceSummary?.durableMemoryLines || 0)),
      longitudinalTraining: !blocked.has("behavior") && (Number(adherence?.plannedCount || 0) > 0 || Boolean(persisted?.sourceSummary?.longitudinalTraining)),
      longitudinalWeight: !blocked.has("behavior") && (Boolean(weight?.available) || Boolean(persisted?.sourceSummary?.longitudinalWeight)),
      experimentOutcomes: blocked.has("fitness_outcomes") ? 0 : Math.max(Number(experiments?.completedCount || 0), Number(persisted?.sourceSummary?.experimentOutcomes || 0))
    }
  };
}

export async function persistUserWorldModel({ userId, model } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id || !model) return false;
  const row = {
    user_id: id,
    model_version: ARI_USER_WORLD_MODEL_VERSION,
    identity: compactObject(model.identity),
    preferences: compactObject(model.preferences),
    goals: compactObject(model.goals),
    constraints: compactObject(model.constraints),
    behavior: compactObject(model.behavior),
    response_profile: compactObject(model.responseProfile),
    physiological_response: compactObject(model.physiologicalResponse),
    relationship: compactObject(model.relationship),
    source_summary: compactObject({ ...(model.sourceSummary || {}), tensions: model.tensions || [] }),
    privacy_controls: normalizePrivacyControls(model.privacyControls),
    updated_at: new Date().toISOString()
  };
  try {
    const params = new URLSearchParams({ on_conflict: "user_id" });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(row)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function userWorldModelToInstruction(model = null) {
  if (!model) return "";
  return [
    "USER WORLD MODEL",
    "Separate what the user says they want from what their observed behavior and measured outcomes show.",
    "Use tensions as gentle decision-relevant contradictions, never as a character judgment.",
    "Do not invent identity, preferences, constraints, or physiology. Missing fields remain unknown.",
    "When a stated goal conflicts with a repeated behavior pattern, design around the behavior pattern unless the user explicitly wants a new experiment.",
    "Privacy controls are authoritative. A blocked category is intentionally unavailable; do not infer or reconstruct it from neighboring context.",
    JSON.stringify(model, null, 2)
  ].join("\n").slice(0, 8500);
}

export function normalizePrivacyControls(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const blockedCategories = (Array.isArray(source.blockedCategories) ? source.blockedCategories : [])
    .map((item) => clean(item, 80).toLowerCase())
    .filter((item) => PRIVACY_CATEGORIES.has(item));
  return {
    blockedCategories: [...new Set(blockedCategories)],
    updatedAt: source.updatedAt || null
  };
}

export function isMemoryCategoryBlocked(privacyControls, category) {
  const normalized = normalizePrivacyControls(privacyControls);
  return normalized.blockedCategories.includes(clean(category, 80).toLowerCase());
}

function detectGoalBehaviorTensions({ goals = [], goalsContext = {}, observedBehavior = {}, constraints = [] } = {}) {
  const tensions = [];
  const goalText = `${goals.join(" ")} ${JSON.stringify(goalsContext)}`.toLowerCase();
  if (/\b(5|five|6|six)\s*(day|days|times).*week|train.*(5|five|6|six).*week/.test(goalText) && observedBehavior.trainingAdherence !== null && observedBehavior.trainingAdherence < 0.65) {
    tensions.push({
      id: "ambition_vs_observed_adherence",
      summary: "Requested training frequency may exceed the schedule the user has recently sustained.",
      confidence: 0.66,
      source: "goal_plus_longitudinal_behavior"
    });
  }
  if (/\b(aggressive|fast|quick|rapid).*\b(lose|cut|weight)\b/.test(goalText) && constraints.some((item) => /\b(hunger|recovery|strength|energy)\b/i.test(item))) {
    tensions.push({
      id: "speed_vs_recovery_constraint",
      summary: "A faster body-composition pace may conflict with an explicitly stated recovery or comfort constraint.",
      confidence: 0.62,
      source: "goal_plus_stated_constraint"
    });
  }
  return tensions.slice(0, 5);
}

function extractCurrentTurnGoals(message = "") {
  const text = clean(message, 1200);
  if (!text || !/\b(my goal|my target|i want to|i'm trying to|i am trying to)\b/i.test(text)) return [];
  return [text];
}

function normalizeModel(row) {
  if (!row || typeof row !== "object") return null;
  const source = row.source_summary && typeof row.source_summary === "object" ? row.source_summary : {};
  return {
    version: row.model_version || ARI_USER_WORLD_MODEL_VERSION,
    privacyControls: normalizePrivacyControls(row.privacy_controls),
    identity: compactObject(row.identity),
    preferences: compactObject(row.preferences),
    goals: compactObject(row.goals),
    constraints: compactObject(row.constraints),
    behavior: compactObject(row.behavior),
    responseProfile: compactObject(row.response_profile),
    physiologicalResponse: compactObject(row.physiological_response),
    relationship: compactObject(row.relationship),
    tensions: Array.isArray(source.tensions) ? source.tensions.slice(0, 5) : [],
    sourceSummary: source,
    updatedAt: row.updated_at || null
  };
}

function preferObserved(current, previous) {
  const value = finiteOrNull(current);
  return value !== null ? value : finiteOrNull(previous);
}
function mergeObject(a, b) {
  return { ...compactObject(a), ...compactObject(b) };
}
function compactObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function arrayValues(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => clean(item, 360)) : [];
}
function uniqueText(values, maxItems, maxLen) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = clean(value, maxLen);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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