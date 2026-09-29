import { runAriExperienceCycle } from "./experience-runtime.js";
import { runAriAutonomyCycle } from "./autonomy-runtime.js";
import { runAriDreamingCycle } from "./dreaming-runtime.js";
import { probeCommunityWork, runAriCommunityCycle } from "./community-autonomy.js";
import { probeRepairDialogueWork, runRepairDialogueCycle } from "./chatgpt-repair-dialogue.js";
import { runTheoryDialogueCycle } from "./chatgpt-theory-dialogue.js";
import {
  listDueExperienceFollowups,
  listRecentExperiences,
  loadExperienceSeeds
} from "./experience-store.js";
import { loadLatestDreamRun } from "./dreaming-store.js";
import { loadGoals } from "./goal-store.js";
import { listRecentInitiatives } from "./initiative-events.js";
import {
  claimCognitiveTrigger,
  finishCognitiveTrigger,
  listCognitiveScheduleEvents,
  recordCognitiveScheduleEvent
} from "./cognitive-scheduler-store.js";
import {
  executeBackgroundOpenAIRequest,
  getBackgroundAiBudgetStatus
} from "../background-ai-budget.js";

export const ARI_COGNITIVE_SCHEDULER_VERSION = "2.0.0";

const RESPONSES_URL =
  process.env.ARI_RESPONSES_URL ||
  process.env.OPENAI_RESPONSES_URL ||
  "https://api.openai.com/v1/responses";

const LANE_CONFIG = Object.freeze({
  repair: {
    intervalHours: 4,
    maxStarvationHours: 24,
    priority: 1.5,
    minActivity: 0.45,
    expectedCostWeight: 0.75
  },
  autonomy: {
    intervalHours: 12,
    maxStarvationHours: 36,
    priority: 1.3,
    minActivity: 0.40,
    expectedCostWeight: 1.25
  },
  experience: {
    intervalHours: 12,
    maxStarvationHours: 36,
    priority: 1.05,
    minActivity: 0.38,
    expectedCostWeight: 0.45
  },
  community: {
    intervalHours: 12,
    maxStarvationHours: 36,
    priority: 0.90,
    minActivity: 0.38,
    expectedCostWeight: 0.65
  },
  dreaming: {
    intervalHours: 24,
    maxStarvationHours: 48,
    priority: 0.80,
    minActivity: 0.60,
    expectedCostWeight: 0.70
  },
  theory: {
    intervalHours: 48,
    maxStarvationHours: 96,
    priority: 0.55,
    minActivity: 0.80,
    expectedCostWeight: 0.70
  }
});

export async function runAriCognitiveScheduler({
  userId,
  now = new Date(),
  trigger = null,
  routeAmbiguity = chooseCognitiveLane,
  collectSignals = collectCognitiveSignals,
  loadEvents = listCognitiveScheduleEvents,
  recordEvent = recordCognitiveScheduleEvent
} = {}) {
  const id = clean(userId, 200);
  if (!id) return { success: false, acted: false, reason: "owner_id_missing" };
  const clock = validDate(now);

  const triggeredLane = normalizeLane(trigger?.lane);
  const [budgetBefore, events, signals] = await Promise.all([
    getBackgroundAiBudgetStatus({ userId: id, now: clock }),
    loadEvents({
      userId: id,
      since: new Date(clock.getTime() - 14 * 86400000),
      limit: 180
    }).catch(() => []),
    triggeredLane
      ? Promise.resolve(emptySignals())
      : collectSignals({ userId: id, now: clock }).catch(() => emptySignals())
  ]);

  const history = deriveSchedulerHistory(events, clock);
  const candidates = buildCognitiveCandidates({
    history,
    signals,
    budget: budgetBefore,
    now: clock
  });

  let decision;
  if (triggeredLane && laneEnabled(triggeredLane)) {
    decision = {
      lane: triggeredLane,
      reason: clean(trigger?.reason, 240) || "urgent_trigger",
      decisionMode: "urgent_trigger",
      score: 99,
      modelCalls: 0
    };
  } else {
    const deterministic = selectDeterministicCognitiveLane({ candidates });
    if (deterministic.needsModel) {
      decision = await routeAmbiguity({
        userId: id,
        candidates: deterministic.ambiguousCandidates,
        budget: budgetBefore,
        now: clock
      });
    } else {
      decision = deterministic;
    }
  }

  const lane = normalizeLane(decision?.lane);
  const selected = candidates.find((item) => item.lane === lane) || null;
  await recordEvent({
    userId: id,
    lane: lane || null,
    decisionMode: clean(decision?.decisionMode, 60) || "deterministic_noop",
    reason: clean(decision?.reason, 400) || "no_lane_selected",
    score: finiteOrNull(decision?.score ?? selected?.score),
    candidates: candidates.map(compactCandidateForLedger),
    signals,
    triggerId: trigger?.id || null
  }).catch(() => {});

  if (!lane) {
    return {
      success: true,
      acted: false,
      reason: clean(decision?.reason, 240) || "no_material_work",
      decision,
      budget: budgetBefore,
      candidates,
      version: ARI_COGNITIVE_SCHEDULER_VERSION
    };
  }

  if (!budgetBefore.allowed) {
    return {
      success: true,
      acted: false,
      lane,
      reason: budgetBefore.reason,
      decision,
      budget: budgetBefore,
      candidates,
      version: ARI_COGNITIVE_SCHEDULER_VERSION
    };
  }

  const result = await runLane({ lane, userId: id, now: clock });
  const budgetAfter = await getBackgroundAiBudgetStatus({ userId: id, now: clock })
    .catch(() => budgetBefore);

  return {
    success: result?.success !== false,
    acted: result?.acted === true || result?.dreamed === true,
    lane,
    decision,
    laneResult: result,
    budget: budgetAfter,
    candidates,
    version: ARI_COGNITIVE_SCHEDULER_VERSION
  };
}

export async function runNextUrgentCognitiveTrigger({
  userId,
  now = new Date(),
  claim = claimCognitiveTrigger,
  finish = finishCognitiveTrigger,
  runScheduler = runAriCognitiveScheduler
} = {}) {
  const id = clean(userId, 200);
  if (!id) return { success: true, acted: false, reason: "owner_id_missing" };

  const claimed = await claim({ userId: id });
  if (!claimed?.claimed || !claimed?.trigger?.id) {
    return { success: true, acted: false, reason: claimed?.reason || "no_pending_trigger" };
  }

  const trigger = claimed.trigger;
  try {
    const result = await runScheduler({ userId: id, now, trigger });
    await finish({
      userId: id,
      triggerId: trigger.id,
      success: result?.success !== false,
      payload: {
        ...safeObject(trigger.payload),
        execution: {
          lane: result?.lane || trigger.lane,
          acted: result?.acted === true,
          reason: clean(result?.reason || result?.laneResult?.reason, 240) || null,
          completedAt: validDate(now).toISOString()
        }
      }
    }).catch(() => {});
    return {
      success: result?.success !== false,
      acted: result?.acted === true,
      triggerId: trigger.id,
      lane: trigger.lane,
      scheduler: result
    };
  } catch (error) {
    await finish({
      userId: id,
      triggerId: trigger.id,
      success: false,
      payload: {
        ...safeObject(trigger.payload),
        execution: { error: clean(error?.message, 300), completedAt: validDate(now).toISOString() }
      }
    }).catch(() => {});
    return { success: false, acted: false, triggerId: trigger.id, lane: trigger.lane, reason: "trigger_execution_failed" };
  }
}

export async function collectCognitiveSignals({
  userId,
  now = new Date(),
  repairProbe = probeRepairDialogueWork,
  experienceProbe = probeExperienceWork,
  communityProbe = probeCommunityWork,
  goalsLoader = loadGoals,
  dreamLoader = loadLatestDreamRun,
  initiativesLoader = listRecentInitiatives
} = {}) {
  const clock = validDate(now);
  const [repairResult, experienceResult, communityResult, goalsResult, dreamResult, initiativesResult] =
    await Promise.allSettled([
      repairProbe(),
      experienceProbe({ userId, now: clock }),
      communityProbe({ userId, now: clock }),
      goalsLoader({ userId, includeClosed: false, limit: 60 }),
      dreamLoader({ userId }),
      initiativesLoader({ userId, limit: 30 })
    ]);

  const repair = fulfilledValue(repairResult, {});
  const experience = fulfilledValue(experienceResult, {});
  const community = fulfilledValue(communityResult, {});
  const goals = fulfilledValue(goalsResult, []);
  const latestDream = fulfilledValue(dreamResult, null);
  const initiatives = fulfilledValue(initiativesResult, []);

  const autonomyGoals = (Array.isArray(goals) ? goals : []).filter((goal) =>
    goal?.autonomy === true &&
    goal?.status === "active" &&
    finite(goal?.budget?.used, 0) < finite(goal?.budget?.attempts, 1)
  );

  const unresolvedOwnerHandoff = (Array.isArray(initiatives) ? initiatives : []).some((item) => {
    if (item?.status !== "surfaced") return false;
    const source = clean(item?.payload?.source, 80);
    const age = hoursSince(item?.surfacedAt, clock);
    return source === "ari_autonomy_runtime" && age < 24;
  });

  const dreamAttemptAt = latestDream?.completed_at || latestDream?.updated_at || latestDream?.started_at || null;
  const dreamFailureAge = latestDream?.status === "failed"
    ? hoursSince(dreamAttemptAt, clock)
    : Number.POSITIVE_INFINITY;

  return {
    repair: {
      activityScore: repair?.pending ? 1 : 0,
      urgent: repair?.pending === true,
      pendingCount: repair?.pending ? 1 : 0,
      reason: repair?.reason || "no_pending_repair"
    },
    autonomy: {
      activityScore: autonomyGoals.length ? Math.min(1, 0.50 + autonomyGoals.length * 0.12) : 0,
      urgent: false,
      activeGoalCount: autonomyGoals.length,
      blocked: unresolvedOwnerHandoff,
      reason: unresolvedOwnerHandoff
        ? "awaiting_owner_handoff"
        : autonomyGoals.length
          ? "active_autonomy_goal"
          : "no_active_autonomy_goal"
    },
    experience: {
      activityScore: experience?.dueCount > 0
        ? Math.min(1, 0.58 + experience.dueCount * 0.12)
        : experience?.seedCount > 0
          ? Math.min(0.82, 0.45 + experience.seedCount * 0.10)
          : 0,
      urgent: false,
      dueCount: finite(experience?.dueCount, 0),
      seedCount: finite(experience?.seedCount, 0),
      reason: experience?.reason || "no_experience_work"
    },
    community: {
      activityScore: community?.hasWork
        ? Math.min(1, 0.45 + finite(community?.candidateCount, 0) * 0.12)
        : 0,
      urgent: false,
      candidateCount: finite(community?.candidateCount, 0),
      reason: community?.reason || "no_community_work"
    },
    dreaming: {
      activityScore: 0,
      urgent: false,
      blocked: latestDream?.status === "failed" && dreamFailureAge < 12,
      latestStatus: clean(latestDream?.status, 40) || null,
      latestAttemptAt: dreamAttemptAt,
      reason: latestDream?.status === "failed" && dreamFailureAge < 12
        ? "dream_failure_backoff"
        : "maintenance_only_until_starvation"
    },
    theory: {
      activityScore: 0,
      urgent: false,
      reason: "maintenance_only_until_starvation"
    }
  };
}

export async function probeExperienceWork({ userId, now = new Date() } = {}) {
  try {
    const [due, recent] = await Promise.all([
      listDueExperienceFollowups({ userId, now, limit: 3 }),
      listRecentExperiences({ userId, limit: 28 })
    ]);
    if (Array.isArray(due) && due.length) {
      return { available: true, dueCount: due.length, seedCount: 0, reason: "due_experience_followup" };
    }
    const seeds = await loadExperienceSeeds({
      userId,
      recentExperiences: Array.isArray(recent) ? recent : [],
      limit: 4
    });
    return {
      available: true,
      dueCount: 0,
      seedCount: Array.isArray(seeds) ? seeds.length : 0,
      reason: Array.isArray(seeds) && seeds.length ? "new_experience_seed" : "no_experience_work"
    };
  } catch {
    return { available: false, dueCount: 0, seedCount: 0, reason: "experience_probe_failed" };
  }
}

export function buildCognitiveCandidates({
  history = {},
  signals = {},
  budget = {},
  now = new Date()
} = {}) {
  const clock = validDate(now);
  const nowMs = clock.getTime();
  const schedulerStartedMs = Date.parse(String(history?.startedAt || ""));
  const pressure = budgetPressure(budget);

  return Object.entries(LANE_CONFIG)
    .filter(([lane]) => laneEnabled(lane))
    .map(([lane, config]) => {
      const lastAt = history?.lanes?.[lane] || null;
      const lastMs = Date.parse(String(lastAt || ""));
      const fallbackHours = Number.isFinite(schedulerStartedMs)
        ? Math.max(config.intervalHours, (nowMs - schedulerStartedMs) / 3600000)
        : config.intervalHours;
      const elapsedHours = Number.isFinite(lastMs)
        ? Math.max(0, (nowMs - lastMs) / 3600000)
        : fallbackHours;
      const signal = safeObject(signals?.[lane]);
      const activityScore = clamp(finite(signal.activityScore, 0));
      const blocked = signal.blocked === true;
      const urgent = signal.urgent === true;
      const overdueRatio = elapsedHours / config.intervalHours;
      const starvationRatio = elapsedHours / config.maxStarvationHours;
      const starved = starvationRatio >= 1;
      const due = overdueRatio >= 1;
      const meaningful = activityScore >= config.minActivity;
      const eligible = !blocked && (urgent || starved || (due && meaningful));
      const score = eligible
        ? round(
            config.priority +
            activityScore * 2 +
            Math.min(2, overdueRatio) * 0.30 +
            Math.min(2, starvationRatio) * 0.50 -
            pressure * config.expectedCostWeight,
            4
          )
        : 0;

      return {
        lane,
        eligible,
        blocked,
        urgent,
        starved,
        due,
        neverSelected: !lastAt,
        intervalHours: config.intervalHours,
        maxStarvationHours: config.maxStarvationHours,
        hoursSinceLastSelection: round(elapsedHours, 2),
        overdueRatio: round(overdueRatio, 3),
        starvationRatio: round(starvationRatio, 3),
        priority: config.priority,
        activityScore,
        expectedCostWeight: config.expectedCostWeight,
        score,
        signal
      };
    })
    .sort((a, b) =>
      Number(b.urgent) - Number(a.urgent) ||
      Number(b.starved) - Number(a.starved) ||
      b.score - a.score ||
      b.priority - a.priority
    );
}

export function selectDeterministicCognitiveLane({ candidates = [] } = {}) {
  const eligible = (Array.isArray(candidates) ? candidates : []).filter((item) => item?.eligible);
  if (!eligible.length) {
    return {
      lane: "none",
      reason: "no_material_work",
      decisionMode: "deterministic_noop",
      score: 0,
      modelCalls: 0,
      needsModel: false
    };
  }

  const urgent = eligible.filter((item) => item.urgent);
  if (urgent.length) {
    const chosen = urgent[0];
    return deterministicChoice(chosen, "urgent_signal");
  }

  const starved = eligible.filter((item) => item.starved);
  if (starved.length) {
    const chosen = [...starved].sort((a, b) =>
      b.starvationRatio - a.starvationRatio || b.score - a.score
    )[0];
    return deterministicChoice(chosen, "starvation_protection");
  }

  if (eligible.length === 1) return deterministicChoice(eligible[0], "single_eligible_lane");

  const ordered = [...eligible].sort((a, b) => b.score - a.score);
  const gap = ordered[0].score - ordered[1].score;
  if (gap >= 0.30) return deterministicChoice(ordered[0], "clear_score_margin");

  return {
    lane: null,
    reason: "ambiguous_high_value_lanes",
    decisionMode: "luna_ambiguity",
    score: ordered[0].score,
    modelCalls: 1,
    needsModel: true,
    ambiguousCandidates: ordered.slice(0, 3)
  };
}

export async function chooseCognitiveLane({
  userId,
  candidates = [],
  budget = {},
  now = new Date(),
  fetcher = fetch,
  executeModel = executeBackgroundOpenAIRequest
} = {}) {
  const source = (Array.isArray(candidates) ? candidates : []).filter((item) => item?.eligible).slice(0, 3);
  if (!source.length) {
    return { lane: "none", reason: "no_eligible_lane", decisionMode: "luna_not_needed", score: 0, modelCalls: 0 };
  }

  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) return deterministicChoice(source[0], "router_provider_unavailable");

  const model = clean(
    process.env.OPENAI_ARI_COGNITIVE_ROUTER_MODEL ||
    process.env.OPENAI_ARI_BACKGROUND_MODEL ||
    "gpt-5.6-luna",
    160
  );
  const body = {
    model,
    store: false,
    max_output_tokens: 320,
    reasoning: { effort: "low" },
    instructions: [
      "You are Ari's low-cost tie-breaker, not her primary scheduler.",
      "The deterministic scheduler already established that these lanes are worthwhile and close in score.",
      "Choose exactly one candidate lane. Prefer the lane with the strongest new-work signal and near-term information value.",
      "Do not select a lane outside the supplied candidate list.",
      "Do not perform the lane's work. Return only the routing JSON."
    ].join("\n"),
    input: [{
      role: "user",
      content: [{
        type: "input_text",
        text: JSON.stringify({
          now: validDate(now).toISOString(),
          candidates: source.map(compactCandidateForRouter),
          budgetPressure: budgetPressure(budget)
        })
      }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "ari_cognitive_scheduler_tiebreak",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["lane", "reason"],
          properties: {
            lane: { type: "string", enum: source.map((item) => item.lane) },
            reason: { type: "string", maxLength: 240 }
          }
        }
      }
    },
    safety_identifier: clean(userId, 200),
    prompt_cache_key: "ari-cognitive-tiebreak-v2"
  };

  try {
    const provider = await executeModel({
      userId,
      endpoint: "/api/ari-cognitive-cycle",
      requestCategory: "ari_cognitive_scheduler_tiebreak",
      model,
      body,
      apiKey,
      url: RESPONSES_URL,
      fetcher,
      signal: AbortSignal.timeout(12000),
      metadata: { candidateLanes: source.map((item) => item.lane) }
    });
    if (!provider?.ok) return deterministicChoice(source[0], "router_provider_failure");
    const parsed = parseJson(extractOutputText(provider.data || {}));
    const chosen = source.find((item) => item.lane === parsed?.lane);
    if (!chosen) return deterministicChoice(source[0], "router_invalid_choice");
    return {
      lane: chosen.lane,
      reason: clean(parsed?.reason, 240) || "luna_tiebreak",
      decisionMode: "luna_ambiguity",
      score: chosen.score,
      modelCalls: 1,
      needsModel: false
    };
  } catch (error) {
    if (error?.code === "ARI_BACKGROUND_BUDGET_BLOCKED") {
      return {
        lane: "none",
        reason: error?.budget?.reason || "router_budget_blocked",
        decisionMode: "budget_noop",
        score: 0,
        modelCalls: 0,
        needsModel: false
      };
    }
    return deterministicChoice(source[0], "router_exception_fallback");
  }
}

export function deriveSchedulerHistory(events = [], now = new Date()) {
  const source = Array.isArray(events) ? events : [];
  const lanes = {};
  let startedAt = null;

  for (const event of source) {
    const createdAt = event?.createdAt || event?.created_at || null;
    if (createdAt && (!startedAt || Date.parse(createdAt) < Date.parse(startedAt))) startedAt = createdAt;
    const lane = normalizeLane(event?.lane);
    if (lane && createdAt && !lanes[lane]) lanes[lane] = createdAt;
  }

  return {
    lanes,
    startedAt: startedAt || validDate(now).toISOString()
  };
}

async function runLane({ lane, userId, now }) {
  switch (lane) {
    case "repair":
      return runRepairDialogueCycle({ userId });
    case "autonomy":
      return runAriAutonomyCycle({ userId, now });
    case "experience":
      return runAriExperienceCycle({ userId, now });
    case "community":
      return runAriCommunityCycle({ userId, now });
    case "dreaming":
      return runAriDreamingCycle({ userId, now });
    case "theory":
      return runTheoryDialogueCycle({ userId, now });
    default:
      return { success: true, acted: false, reason: "unknown_lane" };
  }
}

function laneEnabled(lane) {
  const env = {
    repair: process.env.ARI_CHATGPT_REPAIR_DIALOGUE_ENABLED,
    autonomy: process.env.ARI_AUTONOMY_RUNTIME_ENABLED,
    experience: process.env.ARI_EXPERIENCE_ENGINE_ENABLED,
    community: process.env.ARI_AGENT_COMMUNITY_AUTONOMY_ENABLED,
    dreaming: process.env.ARI_DREAMING_ENABLED,
    theory: process.env.ARI_CHATGPT_THEORY_DIALOGUE_ENABLED
  }[lane];
  return String(env ?? "").trim().toLowerCase() !== "false";
}

function deterministicChoice(candidate, reason) {
  return {
    lane: candidate?.lane || "none",
    reason,
    decisionMode: "deterministic",
    score: finite(candidate?.score, 0),
    modelCalls: 0,
    needsModel: false
  };
}
function compactCandidateForRouter(item = {}) {
  return {
    lane: item.lane,
    score: item.score,
    activityScore: item.activityScore,
    hoursSinceLastSelection: item.hoursSinceLastSelection,
    overdueRatio: item.overdueRatio,
    starvationRatio: item.starvationRatio,
    signal: safeObject(item.signal)
  };
}
function compactCandidateForLedger(item = {}) {
  return {
    lane: item.lane,
    eligible: item.eligible === true,
    blocked: item.blocked === true,
    urgent: item.urgent === true,
    starved: item.starved === true,
    score: finite(item.score, 0),
    activityScore: finite(item.activityScore, 0),
    hoursSinceLastSelection: finite(item.hoursSinceLastSelection, 0)
  };
}
function emptySignals() {
  return Object.fromEntries(Object.keys(LANE_CONFIG).map((lane) => [
    lane,
    { activityScore: 0, urgent: false, reason: "signal_unavailable" }
  ]));
}
function budgetPressure(budget = {}) {
  const daily = finite(budget?.dailyCommittedUsd ?? budget?.dailySpendUsd, 0) /
    Math.max(0.000001, finite(budget?.dailyLimitUsd, 1));
  const monthly = finite(budget?.monthlyCommittedUsd ?? budget?.monthlySpendUsd, 0) /
    Math.max(0.000001, finite(budget?.monthlyLimitUsd, 1));
  return clamp(Math.max(daily, monthly));
}
function normalizeLane(value) {
  const lane = clean(value, 40).toLowerCase();
  return Object.prototype.hasOwnProperty.call(LANE_CONFIG, lane) ? lane : "";
}
function fulfilledValue(result, fallback) {
  return result?.status === "fulfilled" ? result.value : fallback;
}
function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string") return data.output_text;
  return (Array.isArray(data?.output) ? data.output : [])
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((part) => typeof part?.text === "string" ? part.text : typeof part?.value === "string" ? part.value : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}
function parseJson(value = "") {
  const source = String(value || "").trim();
  if (!source) return null;
  try { return JSON.parse(source); } catch {}
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(source.slice(first, last + 1)); } catch {}
  }
  return null;
}
function hoursSince(value, now = new Date()) {
  const then = Date.parse(String(value || ""));
  return Number.isFinite(then)
    ? Math.max(0, (validDate(now).getTime() - then) / 3600000)
    : Number.POSITIVE_INFINITY;
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, finite(value, min)));
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(finite(value, 0) * factor) / factor;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
