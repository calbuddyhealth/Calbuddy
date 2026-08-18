import { summarizeCommunicationLearning } from "./_lib/ari-vnext/communication-outcomes.js";
import { durableMemoryCandidate, memoryCategoryForCandidate } from "./_lib/ari-vnext/continuity-service.js";
import { summarizeCalibration } from "./_lib/ari-vnext/decision-journal.js";
import { evaluateExperimentSnapshot, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { validateGrowthVerification, shouldReopenVerifiedFix } from "./_lib/ari-vnext/growth-fixes.js";
import { deriveGoalHierarchy } from "./_lib/ari-vnext/goal-hierarchy.js";
import { deriveInitiativeCandidate } from "./_lib/ari-vnext/initiative-engine.js";
import { shouldSuppressInitiative } from "./_lib/ari-vnext/initiative-events.js";
import { filterMemoryResultForPrivacy } from "./_lib/ari-vnext/memory-service.js";
import { applyOutcomeLearning } from "./_lib/ari-vnext/outcome-learning.js";
import { deriveProactiveInsights } from "./_lib/ari-vnext/proactive-insights.js";
import { deriveRelationshipContinuity } from "./_lib/ari-vnext/relationship-continuity.js";
import { deriveScientificIntelligence, rankHypotheses, designExperiment } from "./_lib/ari-vnext/scientific-intelligence.js";
import { deriveSelfModel } from "./_lib/ari-vnext/self-model.js";
import { deriveTemporalTimeline } from "./_lib/ari-vnext/temporal-timeline.js";
import { deriveUserWorldModel } from "./_lib/ari-vnext/user-world-model.js";

const NOW = new Date("2026-08-18T12:00:00.000Z");

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-ARI-Self-Test", "v1");
  if (process.env.VERCEL_ENV === "production") return res.status(404).json({ success: false, error: "preview_only" });
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "GET only" });

  const tests = [];
  const run = (name, fn) => {
    try {
      const detail = fn();
      tests.push({ name, pass: true, detail: detail ?? null });
    } catch (error) {
      tests.push({ name, pass: false, error: error?.message || String(error) });
    }
  };
  const ok = (value, message = "assertion failed") => { if (!value) throw new Error(message); };
  const eq = (actual, expected, message = "values differ") => { if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); };

  run("persistent recognition reaches established familiarity", () => {
    const continuity = deriveRelationshipContinuity({
      userWorldModel: {
        identity: { displayName: "Synthetic User" },
        preferences: { items: ["Prefers concise coaching"] },
        goals: { stated: ["Preserve strength while losing weight"] },
        constraints: { items: ["Night-shift schedule"] },
        behavior: { trainingAdherence: 0.78 },
        sourceSummary: { durableMemoryLines: 5, experimentOutcomes: 1 }
      },
      decisionState: { recentOpen: [] }, experimentLedger: { active: [] }, temporalTimeline: { events: [] }, now: NOW
    });
    eq(continuity.recognizedUser, true);
    eq(continuity.familiarity, "established");
    return { familiarity: continuity.familiarity, signals: continuity.recognitionSignalCount };
  });

  run("self-model does not reset persistent familiarity on a fresh chat", () => {
    const relationshipContinuity = { recognizedUser: true, familiarity: "established" };
    const model = deriveSelfModel({ turn: { message: "hey", history: [], relationshipContinuity }, route: {}, safety: {} });
    eq(model.current.familiarity, "established");
    eq(model.current.persistentRecognition, true);
    return model.current;
  });

  run("due experiment becomes unfinished business", () => {
    const continuity = deriveRelationshipContinuity({
      userWorldModel: {}, decisionState: { recentOpen: [] },
      experimentLedger: { active: [{ id: "exp-1", domain: "training", hypothesisId: "energy_availability_pressure", hypothesisLabel: "Energy availability pressure", reviewAt: "2026-08-17T12:00:00.000Z" }] },
      temporalTimeline: { events: [] }, now: NOW
    });
    eq(continuity.unfinishedThreads[0]?.state, "review_due");
    return continuity.unfinishedThreads[0];
  });

  run("due experiment makes Ari initiate with zero LLM requirement", () => {
    const proactive = deriveProactiveInsights({ experimentLedger: { dueCount: 1 } });
    const state = deriveInitiativeCandidate({ proactiveInsights: proactive, relationshipContinuity: { unfinishedThreads: [] }, now: NOW });
    eq(state.shouldInitiate, true);
    eq(state.candidate?.requiresLanguageModelCall, false);
    eq(state.candidate?.reasonId, "experiment_review_due");
    return { opener: state.candidate.opener, cost: "0 LLM calls" };
  });

  run("Ari stays quiet when nothing meaningful changed", () => {
    const state = deriveInitiativeCandidate({ proactiveInsights: { items: [] }, relationshipContinuity: { unfinishedThreads: [] }, now: NOW });
    eq(state.shouldInitiate, false);
    return state.reason;
  });

  run("internal self-calibration cannot interrupt the user", () => {
    const state = deriveInitiativeCandidate({
      proactiveInsights: { items: [{ id: "ari_self_calibration_overconfidence", priority: "internal", confidence: 0.9, domain: "ari_self_model", reason: "gap", trigger: "calibration_overconfidence" }] },
      relationshipContinuity: { unfinishedThreads: [] }, now: NOW
    });
    eq(state.shouldInitiate, false);
  });

  run("dismissed initiative is suppressed for seven days", () => {
    const suppression = shouldSuppressInitiative({
      candidate: { initiativeKey: "adherence_drop:test", cooldownHours: 48 },
      events: [{ initiativeKey: "adherence_drop:test", status: "dismissed", surfacedAt: "2026-08-15T12:00:00.000Z" }],
      now: NOW
    });
    eq(suppression.suppress, true);
    eq(suppression.requiredHours, 168);
    return suppression;
  });

  run("materially changed initiative is allowed after older version", () => {
    const suppression = shouldSuppressInitiative({
      candidate: { initiativeKey: "broad_performance_regression:new", cooldownHours: 48 },
      events: [{ initiativeKey: "broad_performance_regression:old", status: "surfaced", surfacedAt: "2026-08-18T10:00:00.000Z" }], now: NOW
    });
    eq(suppression.suppress, false);
  });

  run("explicit primary goal wins and tradeoff is exposed", () => {
    const hierarchy = deriveGoalHierarchy({
      turn: { message: "My main priority is strength, but I also want to lose weight." },
      userWorldModel: { goals: { stated: [], current: {} }, constraints: { items: [] }, behavior: {} },
      coachingState: { goal: "lose" },
      longitudinalState: { training: { adherence: { rate: 0.9, plannedCount: 10, completedCount: 9 } } }
    });
    eq(hierarchy.primary?.id, "strength");
    eq(hierarchy.explicitPriority, true);
    ok(hierarchy.tradeoffs.some((item) => item.id === "fat_loss_speed_vs_strength_preservation"), "missing strength/fat-loss tradeoff");
    return { primary: hierarchy.primary, tradeoffs: hierarchy.tradeoffs.map((x) => x.id) };
  });

  run("privacy filtering removes blocked categories before model use", () => {
    const filtered = filterMemoryResultForPrivacy({
      memories: [
        { id: "p", memoryType: "preference", topic: "preference", content: "User likes short replies." },
        { id: "g", memoryType: "goal", topic: "goal", content: "User wants to lose weight." },
        { id: "r", memoryType: "peer_reflection", topic: "ari_reflection_training", content: "Ari should verify adherence first." }
      ], summary: "old"
    }, { blockedCategories: ["preferences", "goals"] });
    eq(filtered.memories.length, 1);
    eq(filtered.memories[0].id, "r");
    ok(!/short replies|lose weight/i.test(filtered.summary), "blocked memory leaked into summary");
  });

  run("blocked world-model goal cannot be reconstructed", () => {
    const model = deriveUserWorldModel({
      persisted: { privacyControls: { blockedCategories: ["goals"] }, goals: { stated: ["Old goal"], current: { goalType: "lose" } }, preferences: { items: ["Concise"] }, behavior: { trainingAdherence: 0.7 } },
      turn: { message: "My goal is to lose 20 pounds." },
      context: { goals: { goalType: "lose" }, relevantMemory: "User's stated goal is to lose 20 pounds.\nUser likes concise replies." },
      longitudinalState: { weight: { available: false }, training: { adherence: { rate: 0.7 }, progression: {} }, nutrition: {} }
    });
    eq(model.goals.stated.length, 0);
    eq(Object.keys(model.goals.current).length, 0);
  });

  run("durable memory distinguishes preference, goal, outcome and transient chatter", () => {
    eq(memoryCategoryForCandidate(durableMemoryCandidate("I prefer morning workouts")), "preferences");
    eq(memoryCategoryForCandidate(durableMemoryCandidate("My goal is to gain 10 pounds")), "goals");
    eq(durableMemoryCandidate("I prefer cardio for today only"), null);
    const outcome = durableMemoryCandidate("That worked. I'm getting stronger.", { route: { training: true }, history: [{ role: "assistant", content: "Keep the program stable and improve adherence." }] });
    eq(memoryCategoryForCandidate(outcome), "fitness_outcomes");
  });

  run("prediction calibration detects overconfidence after enough outcomes", () => {
    const calibration = summarizeCalibration([
      { confidence: 0.9, outcomeDirection: "supported" },
      { confidence: 0.9, outcomeDirection: "weakened" },
      { confidence: 0.9, outcomeDirection: "weakened" },
      { confidence: 0.9, outcomeDirection: "supported" }
    ]);
    eq(calibration.available, true);
    eq(calibration.tendency, "overconfident");
    return calibration;
  });

  run("structured experiment outcome updates exact hypothesis conservatively", () => {
    const learned = applyOutcomeLearning({ hypotheses: [
      { id: "energy_availability_pressure", label: "Energy", score: 0.5 },
      { id: "recovery_pressure", label: "Recovery", score: 0.46 }
    ], evidenceGraph: { nodes: [], edges: [] } }, "", { recentCompleted: [{ id: "e1", status: "completed", hypothesisId: "recovery_pressure", outcomeDirection: "positive" }] });
    const recovery = learned.hypotheses.find((x) => x.id === "recovery_pressure");
    eq(recovery.outcomeAdjustment, 0.07);
    ok(recovery.score <= 0.98, "confidence escaped cap");
    return learned.outcomeLearning;
  });

  run("low adherence makes execution gap lead and experiment holds program stable", () => {
    const longitudinal = {
      weight: { available: false },
      training: { adherence: { plannedCount: 10, completedCount: 4, missedCount: 6, rate: 0.4 }, progression: { comparableExerciseCount: 4, upCount: 0, stableCount: 2, downCount: 2, windowPrCount: 0, plateauCandidateCount: 1 }, volumeChange: { available: false } },
      nutrition: { loggedDayCount: 0 }, signals: [{ id: "adherence_before_program_change", confidence: "moderate" }]
    };
    const hypotheses = rankHypotheses({ evidenceGraph: { nodes: [] }, coachingState: { goal: "maintain", evidence: { reported: {} }, signals: [] }, longitudinalState: longitudinal });
    eq(hypotheses[0].id, "execution_gap");
    const experiment = designExperiment({ hypotheses, coachingState: { goal: "maintain", evidence: { reported: {} } }, longitudinalState: longitudinal });
    eq(experiment.readiness, "ready");
    ok(/program design stable/i.test(experiment.intervention), "experiment did not preserve program");
  });

  run("pain blocks performance experimentation", () => {
    const state = deriveScientificIntelligence({
      route: { training: true }, context: {},
      coachingState: { goal: "maintain", evidence: { reported: { painOrInjury: true } }, signals: [] },
      longitudinalState: { weight: { available: false }, training: { adherence: { plannedCount: 0, completedCount: 0, rate: null }, progression: { comparableExerciseCount: 0, upCount: 0, stableCount: 0, downCount: 0, windowPrCount: 0, plateauCandidateCount: 0 }, volumeChange: { available: false } }, nutrition: { loggedDayCount: 0 }, signals: [] },
      metacognition: { confidence: "limited", missingEvidence: ["training"] }
    });
    eq(state.experiment.readiness, "blocked_by_safety");
  });

  run("experiment ledger identifies review due and objective outcome", () => {
    const summary = summarizeExperimentLedger([
      { id: "a", status: "active", hypothesisId: "execution_gap", reviewAt: "2026-08-17T12:00:00Z" },
      { id: "b", status: "completed", hypothesisId: "energy_availability_pressure", completedAt: "2026-08-10T12:00:00Z" }
    ], NOW);
    eq(summary.dueCount, 1);
    const evaluation = evaluateExperimentSnapshot({ id: "x", status: "active", hypothesisId: "execution_gap", reviewAt: "2026-08-01T00:00:00Z", baseline: { adherenceRate: 0.45, progression: { up: 0, down: 2, plateaus: 1 } } },
      { weight: { available: false }, training: { adherence: { rate: 0.8 }, progression: { upCount: 1, stableCount: 2, downCount: 0, plateauCandidateCount: 0 } } }, { evidence: { reported: {} } });
    eq(evaluation.suggestedOutcome, "positive");
  });

  run("temporal timeline sorts actual dates instead of transcript order", () => {
    const timeline = deriveTemporalTimeline({
      context: { recentWeights: [{ value: 181, date: "2026-08-17" }, { value: 183, date: "2026-08-01" }], recentTraining: [{ name: "Bench", completed: true, date: "2026-08-10" }] }, limit: 10
    });
    eq(timeline.events[0].at.slice(0, 10), "2026-08-17");
    eq(timeline.events[timeline.events.length - 1].at.slice(0, 10), "2026-08-01");
  });

  run("communication learning waits for repeated evidence and stays non-causal", () => {
    const state = summarizeCommunicationLearning([
      ...Array.from({ length: 3 }, () => ({ status: "resolved", strategyKey: "direct", strategy: { directness: "direct", detail: "brief", realizedReplyLength: "brief" }, outcomeDirection: "positive", associationConfidence: 0.6 })),
      ...Array.from({ length: 3 }, () => ({ status: "resolved", strategyKey: "long", strategy: { directness: "balanced", detail: "detailed", realizedReplyLength: "detailed" }, outcomeDirection: "negative", associationConfidence: 0.6 }))
    ]);
    eq(state.preferredAssociation?.strategyKey, "direct");
    eq(state.causalClaimAllowed, false);
    eq(state.explicitUserPreferenceAlwaysWins, true);
  });

  run("Verified Fixed requires strong evidence and reopens on recurrence", () => {
    eq(validateGrowthVerification({ regressionTestId: "test-1", fixCommitSha: "abc", verification: { deterministicPasses: 1, scenarioReproduced: true, noRegressionObserved: true } }).valid, false);
    eq(validateGrowthVerification({ regressionTestId: "test-1", fixCommitSha: "abc", verification: { deterministicPasses: 2, scenarioReproduced: true, noRegressionObserved: true } }).valid, true);
    eq(shouldReopenVerifiedFix({ previous: { status: "verified_fixed", verifiedAt: "2026-08-10T12:00:00Z" }, newestReflectionAt: Date.parse("2026-08-11T12:00:00Z") }), true);
  });

  const passed = tests.filter((test) => test.pass).length;
  const failed = tests.length - passed;
  return res.status(failed ? 500 : 200).json({
    success: failed === 0,
    environment: process.env.VERCEL_ENV || "unknown",
    testedAt: new Date().toISOString(),
    summary: { total: tests.length, passed, failed },
    tests
  });
}
