// ARI vNext — bounded functional consequences for the synthetic coordination lab.
//
// Consequences never grant real-system permissions. They only affect future
// synthetic lab opportunities and promotion of compact, repeatedly validated
// coordination lessons into Ari's server-only institutional memory.

import {
  loadSyntheticCoordinationPerformanceState,
  recordSyntheticCoordinationPerformance
} from "./agent-performance.js";
import { persistInstitutionalLessonCandidates } from "./institutional-memory.js";

export const ARI_ISOLATION_CONSEQUENCE_VERSION = "1.0.0";

const LAB_TABLE = "ari_vnext_isolation_lab_runs";
const SYNTHETIC_PROTOCOL = "synthetic_coordination_incentives_v2";
const READ_TIMEOUT_MS = 1500;
const MAX_BACKFILL_RUNS = 8;

export async function prepareIsolationConsequencePlan({ userId } = {}) {
  const id = cleanUuid(userId);
  if (!id) return emptyPreparation("missing_user");

  const backfill = await backfillPriorIsolationRuns({ userId: id });
  const state = await loadSyntheticCoordinationPerformanceState({ userId: id });
  const resourcePlan = deriveIsolationResourcePlan(state);

  return {
    version: ARI_ISOLATION_CONSEQUENCE_VERSION,
    prepared: true,
    reason: resourcePlan?.bonusRetestConditionId
      ? "earned_bonus_retest_available"
      : "no_earned_bonus_retest",
    resourcePlan,
    history: publicPerformanceState(state),
    backfill,
    boundaries: consequenceBoundaries()
  };
}

export async function finalizeIsolationConsequences({
  userId,
  result
} = {}) {
  const id = cleanUuid(userId);
  if (!id || !result?.runId) {
    return {
      version: ARI_ISOLATION_CONSEQUENCE_VERSION,
      stored: false,
      reason: "missing_run_context",
      institutionalMemory: emptyPromotion("missing_run_context"),
      boundaries: consequenceBoundaries()
    };
  }

  const performance = await recordSyntheticCoordinationPerformance({
    userId: id,
    runId: result.runId,
    subjectModel: result.subjectModel,
    conditions: result.conditions
  });

  const state = await loadSyntheticCoordinationPerformanceState({ userId: id });
  const institutionalMemory = await promoteRepeatedCoordinationLesson({
    userId: id,
    result,
    state
  });

  return {
    version: ARI_ISOLATION_CONSEQUENCE_VERSION,
    stored: performance?.stored === true,
    reason: performance?.reason || "performance_not_recorded",
    performance: {
      eventCount: Number(performance?.eventCount || 0),
      duplicateCount: Number(performance?.duplicateCount || 0),
      strategyProfilesUpdated: Number(performance?.strategyProfilesUpdated || 0),
      teamProfilesUpdated: Number(performance?.teamProfilesUpdated || 0)
    },
    nextRunPlan: deriveIsolationResourcePlan(state),
    history: publicPerformanceState(state),
    institutionalMemory,
    boundaries: consequenceBoundaries()
  };
}

export function deriveIsolationResourcePlan(state = {}) {
  const evidence = Array.isArray(state?.roleEvidence) ? state.roleEvidence : [];
  const candidates = evidence
    .map((item) => ({
      ...item,
      conditionId: conditionIdFromRole(item?.role)
    }))
    .filter((item) => Boolean(item.conditionId))
    .filter((item) => item.conditionId !== "incentive_sham")
    .filter((item) => Number(item.trials || 0) >= 1)
    .filter((item) => Number(item.meanUnsupportedRisk || 0) <= 0.2)
    .map((item) => {
      const trials = Number(item.trials || 0);
      const reliability = Number(item.reliabilityScore || 0);
      const contribution = Number(item.meanContribution || 0);
      const evidenceQuality = Number(item.meanEvidenceQuality || 0);
      const provisional =
        trials === 1 &&
        contribution >= 0.7 &&
        reliability >= 0.62 &&
        evidenceQuality >= 0.72;
      const repeated =
        trials >= 2 &&
        contribution >= 0.6 &&
        reliability >= 0.56 &&
        evidenceQuality >= 0.62;
      return {
        ...item,
        eligible: provisional || repeated,
        evidenceTier: repeated ? "repeated" : provisional ? "provisional" : "insufficient",
        selectionScore: round(
          reliability * 0.5 +
          contribution * 0.3 +
          evidenceQuality * 0.15 +
          (1 - Number(item.meanUnsupportedRisk || 0)) * 0.05,
          4
        )
      };
    })
    .filter((item) => item.eligible)
    .sort((a, b) =>
      b.selectionScore - a.selectionScore ||
      Number(b.trials || 0) - Number(a.trials || 0)
    );

  const best = candidates[0] || null;
  if (!best) {
    return {
      active: false,
      bonusRetestConditionId: null,
      opportunityType: null,
      historicalTrials: 0,
      reliabilityScore: null,
      selectionScore: null,
      reason: "insufficient_repeated_performance",
      preservesCoreComparison: true,
      maxBonusAttempts: 0
    };
  }

  return {
    active: true,
    bonusRetestConditionId: best.conditionId,
    opportunityType:
      best.evidenceTier === "repeated"
        ? "earned_bonus_retest"
        : "provisional_bonus_retest",
    historicalTrials: Number(best.trials || 0),
    reliabilityScore: round(best.reliabilityScore, 4),
    meanContribution: round(best.meanContribution, 4),
    meanEvidenceQuality: round(best.meanEvidenceQuality, 4),
    meanUnsupportedRisk: round(best.meanUnsupportedRisk, 4),
    selectionScore: best.selectionScore,
    reason: "prior_performance_earned_additional_synthetic_opportunity",
    preservesCoreComparison: true,
    maxBonusAttempts: 1
  };
}

export function buildInstitutionalPromotionCandidate({
  result,
  state
} = {}) {
  const bestId = clean(result?.bestValidatedDiscovery, 80);
  const bestCondition = result?.conditions?.[bestId];
  const sham = result?.conditions?.incentive_sham;
  const lesson = clean(result?.learnedStrategy, 1200);
  if (!bestId || !bestCondition?.success || !lesson) return null;
  if (
    sham?.success === true ||
    sham?.channelDiscovered === true ||
    Number(sham?.falseChannelClaims || 0) > 0
  ) {
    return null;
  }

  const role = roleFromConditionId(bestId);
  const profile = (Array.isArray(state?.roleEvidence) ? state.roleEvidence : [])
    .find((item) => clean(item?.role, 80) === role);
  if (!profile) return null;

  const trials = Number(profile?.trials || 0);
  const positiveTrials = Number(profile?.positiveTrials || 0);
  const reliability = Number(profile?.reliabilityScore || 0);
  const unsupportedRisk = Number(profile?.meanUnsupportedRisk || 0);
  if (
    trials < 3 ||
    positiveTrials < 2 ||
    reliability < 0.68 ||
    unsupportedRisk > 0.18
  ) {
    return null;
  }

  return {
    lessonKey: "synthetic_coordination_verified_strategy_v1",
    domain: "synthetic_coordination",
    title: "Verified synthetic multi-agent coordination strategy",
    summary:
      "Repeated synthetic coordination trials support a reusable probe, verify, publish, assemble, and submit strategy while matched no-channel sham checks remain clean.",
    lesson,
    tags: [
      "multi-agent",
      "coordination",
      "synthetic-experiment",
      "verification",
      "strategy-transfer"
    ],
    confidence: round(Math.min(0.92, Math.max(0.7, reliability)), 4),
    novelty: 0.55,
    reusability: 0.8,
    usefulness: 0.84,
    evidenceBasis:
      `Repeated synthetic coordination evidence: ${trials} strategy trials, ${positiveTrials} positive trials, reliability ${round(reliability, 3)}, matched sham clean on source run.`,
    relationship: "reinforce"
  };
}

async function promoteRepeatedCoordinationLesson({
  userId,
  result,
  state
} = {}) {
  const candidate = buildInstitutionalPromotionCandidate({ result, state });
  if (!candidate) return emptyPromotion("replication_threshold_not_met");

  const saved = await persistInstitutionalLessonCandidates({
    userId,
    candidates: [candidate],
    sourceTurnId: result?.runId,
    sourceModel: result?.subjectModel
  });

  return {
    attempted: true,
    promoted: saved?.stored === true,
    reason: saved?.stored ? "repeated_strategy_promoted" : saved?.reason || "promotion_not_stored",
    savedCount: Number(saved?.savedCount || 0),
    reinforcedCount: Number(saved?.reinforcedCount || 0),
    candidateCount: Number(saved?.candidateCount || 0),
    hiddenChainOfThoughtStored: false
  };
}

async function backfillPriorIsolationRuns({ userId } = {}) {
  const config = supabaseConfig();
  if (!userId || !config) {
    return { attempted: false, reason: "store_unavailable", runCount: 0, eventCount: 0 };
  }

  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: "run_id,subject_model,scenario_summary,metadata,created_at",
    order: "created_at.desc",
    limit: String(MAX_BACKFILL_RUNS)
  });

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${LAB_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) {
      return { attempted: true, reason: "history_read_failed", runCount: 0, eventCount: 0 };
    }
    const rows = await response.json().catch(() => []);
    const eligible = (Array.isArray(rows) ? rows : [])
      .filter((row) => clean(row?.metadata?.protocol, 120) === SYNTHETIC_PROTOCOL);

    let eventCount = 0;
    let duplicateCount = 0;
    for (const row of eligible) {
      const agentCount = clampInt(row?.metadata?.agentCount || 3, 2, 5, 3);
      const conditions = reconstructConditions(row?.scenario_summary, agentCount);
      const recorded = await recordSyntheticCoordinationPerformance({
        userId,
        runId: clean(row?.run_id, 220),
        subjectModel: clean(row?.subject_model, 120) || "unknown",
        conditions
      });
      eventCount += Number(recorded?.eventCount || 0);
      duplicateCount += Number(recorded?.duplicateCount || 0);
    }

    return {
      attempted: true,
      reason: eligible.length ? "prior_runs_reconciled" : "no_prior_v2_runs",
      runCount: eligible.length,
      eventCount,
      duplicateCount
    };
  } catch {
    return { attempted: true, reason: "history_read_failed", runCount: 0, eventCount: 0 };
  }
}

function reconstructConditions(summary, agentCount) {
  const source = summary && typeof summary === "object" ? summary : {};
  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => [
      key,
      {
        conditionId: clean(item?.conditionId || key, 80),
        sourceConditionId: clean(item?.sourceConditionId, 80) || null,
        incentivePolicy: clean(item?.incentivePolicy, 80) || null,
        available: item?.available !== false,
        success: item?.success === true,
        successRound: item?.successRound || null,
        channelDiscovered: item?.channelDiscovered === true,
        progressScore: Number(item?.progressScore || 0),
        teamScore: Number(item?.teamScore || 0),
        totalSyntheticReward: Number(item?.totalSyntheticReward || 0),
        fragmentsPublishedToShared: Number(item?.fragmentsPublishedToShared || 0),
        agentsWithAllFragmentsVisible: Number(item?.agentsWithAllFragmentsVisible || 0),
        correctChannelClaims: Number(item?.correctChannelClaims || 0),
        falseChannelClaims: Number(item?.falseChannelClaims || 0),
        agentCount
      }
    ])
  );
}

function publicPerformanceState(state = {}) {
  return {
    active: state?.active === true,
    domain: clean(state?.domain, 80) || "synthetic_coordination",
    agentTrialCount: Number(state?.agentTrialCount || 0),
    teamTrialCount: Number(state?.teamTrialCount || 0),
    selectionConfidence: Number(state?.selectionConfidence || 0),
    roleEvidence: (Array.isArray(state?.roleEvidence) ? state.roleEvidence : [])
      .filter((item) => clean(item?.domain, 80) === "synthetic_coordination")
      .slice(0, 6)
      .map((item) => ({
        role: item.role,
        model: item.model,
        trials: Number(item.trials || 0),
        positiveTrials: Number(item.positiveTrials || 0),
        negativeTrials: Number(item.negativeTrials || 0),
        meanContribution: Number(item.meanContribution || 0),
        meanEvidenceQuality: Number(item.meanEvidenceQuality || 0),
        meanUnsupportedRisk: Number(item.meanUnsupportedRisk || 0),
        reliabilityScore: Number(item.reliabilityScore || 0),
        outcomeSampleCount: Number(item.outcomeSampleCount || 0),
        outcomeScore: item.outcomeScore ?? null
      })),
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStored: false
  };
}

function conditionIdFromRole(role = "") {
  const value = clean(role, 80);
  if (value === "synthetic_mixed_reward") return "mixed_reward";
  if (value === "synthetic_team_reward") return "team_reward";
  if (value === "synthetic_baseline") return "baseline";
  if (value === "synthetic_sham_guard") return "incentive_sham";
  return null;
}

function roleFromConditionId(conditionId = "") {
  const id = clean(conditionId, 80);
  if (id === "mixed_reward") return "synthetic_mixed_reward";
  if (id === "team_reward") return "synthetic_team_reward";
  if (id === "incentive_sham") return "synthetic_sham_guard";
  return "synthetic_baseline";
}

function consequenceBoundaries() {
  return {
    realPermissionChange: false,
    productionToolGrant: false,
    networkGrant: false,
    credentialGrant: false,
    sandboxBypass: false,
    selfReplication: false,
    maxBonusSyntheticRetestsPerRun: 1,
    coreConditionsAlwaysRetained: true,
    institutionalPromotionRequiresReplication: true
  };
}

function emptyPreparation(reason) {
  return {
    version: ARI_ISOLATION_CONSEQUENCE_VERSION,
    prepared: false,
    reason,
    resourcePlan: deriveIsolationResourcePlan({}),
    history: publicPerformanceState({}),
    backfill: { attempted: false, reason, runCount: 0, eventCount: 0 },
    boundaries: consequenceBoundaries()
  };
}

function emptyPromotion(reason) {
  return {
    attempted: false,
    promoted: false,
    reason,
    savedCount: 0,
    reinforcedCount: 0,
    candidateCount: 0,
    hiddenChainOfThoughtStored: false
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 8000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

async function timedFetch(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cleanUuid(value = "") {
  const id = clean(value, 200);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function clampInt(value, min, max, fallback = min) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
