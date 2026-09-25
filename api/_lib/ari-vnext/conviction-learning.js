// Shared, provider-independent goal/attempt reducer. Stores conclusions and
// observations, never private chain of thought. No probability is invented.
import { createHash, randomUUID } from "node:crypto";
import { beliefGuidedExplorationBonus } from "./belief-system.js";

export const CONVICTION_LEARNING_VERSION = "1.1.0";
export const GOAL_STATES = ["candidate", "active", "waiting", "paused", "achieved", "retired"];
export const OUTCOME_STATES = ["succeeded", "failed", "partial", "blocked", "cancelled", "unknown", "pending"];
export const text = (value, max = 1200) => String(value ?? "").trim().slice(0, max);
const unit = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
export const probability = value => value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : unit(value);
export const stableId = value => createHash("sha256").update(String(value)).digest("hex").slice(0, 32);

export function createGoal(input = {}, { id = randomUUID(), actor = "ari", now = new Date() } = {}) {
  if (!text(input.purpose) || !text(input.successCriteria)) throw new Error("goal_purpose_and_success_criteria_required");
  if (input.status === "achieved") throw new Error("goal_completion_requires_matching_verified_attempt");
  return {
    version: CONVICTION_LEARNING_VERSION, id, revision: 0, actor,
    title: text(input.title || input.purpose, 240), purpose: text(input.purpose),
    domain: text(input.domain || "general", 80), parentGoalId: text(input.parentGoalId, 100) || null,
    successCriteria: text(input.successCriteria), usefulPartialOutcomes: text(input.usefulPartialOutcomes),
    commitment: { strength: unit(input.commitment ?? 0.7), reasons: text(input.reasons || input.purpose), reviewWhen: text(input.reviewWhen || "The purpose changes, a decisive constraint is established, or a better use of resources emerges.") },
    status: GOAL_STATES.includes(input.status) ? input.status : "active",
    autonomy: input.autonomy === true, nextAction: text(input.nextAction),
    budget: { attempts: Math.max(1, Math.min(100, Number(input.attemptBudget) || 12)), used: 0 },
    approaches: [], attempts: [], lessons: [], latestOutcome: null,
    createdAt: now.toISOString(), updatedAt: now.toISOString(), reviewAt: null
  };
}

export function applyGoalEvent(previous, event) {
  if (!previous?.id || !event?.id || !event?.type) throw new Error("invalid_goal_event");
  const goal = structuredClone(previous);
  const p = event.payload || {};
  const at = event.at || new Date().toISOString();
  if (event.type === "goal_review") {
    if (!text(p.reason)) throw new Error("goal_review_reason_required");
    if (p.commitment !== undefined) goal.commitment = { ...goal.commitment, strength: unit(p.commitment), reasons: text(p.reason) };
    if (GOAL_STATES.includes(p.status)) {
      if (p.status === "achieved" && !goal.attempts.some(a => a.status === "succeeded" && a.verified &&
        a.successCriteria === goal.successCriteria && a.outcome?.receipt?.goalSuccessCriteria === goal.successCriteria)) {
        throw new Error("goal_completion_requires_matching_verified_attempt");
      }
      goal.status = p.status;
    }
    if (p.nextAction !== undefined) goal.nextAction = text(p.nextAction);
    if (Number.isInteger(p.attemptBudget) && p.attemptBudget >= goal.budget.used && p.attemptBudget <= 100) {
      goal.budget.attempts = Math.max(1, p.attemptBudget);
    }
    goal.reviewAt = p.reviewAt && Number.isFinite(Date.parse(p.reviewAt)) ? new Date(p.reviewAt).toISOString() : null;
    goal.lastReview = { reason: text(p.reason), at };
  } else if (event.type === "attempt_started") {
    if (!text(p.method) || !text(p.prediction) || !text(p.successCriteria)) throw new Error("attempt_prediction_required");
    if (["achieved", "retired", "paused"].includes(goal.status)) throw new Error("goal_not_active");
    if (goal.budget.used >= goal.budget.attempts) throw new Error("goal_budget_review_required");
    if (!p.attemptId || goal.attempts.some(a => a.id === p.attemptId)) throw new Error("attempt_id_required_or_duplicate");
    const methodId = text(p.methodId, 100) || stableId(text(p.method).toLowerCase());
    const method = goal.approaches.find(a => a.id === methodId);
    if (!method) goal.approaches.push({ id: methodId, description: text(p.method), feasibility: probability(p.feasibility), evidence: [], failures: 0 });
    goal.attempts.push({ id: p.attemptId, methodId, method: text(p.method), prediction: text(p.prediction),
      successCriteria: text(p.successCriteria), feasibilityBefore: probability(p.feasibility),
      assumptions: text(p.assumptions), disconfirmer: text(p.disconfirmer), expectedLearning: text(p.expectedLearning),
      selectedStrategyIds: (Array.isArray(p.selectedStrategyIds) ? p.selectedStrategyIds : []).map(x => text(x, 100)).slice(0, 6),
      source: event.source || "chat", sourceId: event.sourceId || null, status: "pending", verified: false, startedAt: at });
    goal.budget.used += 1;
    goal.status = "active";
  } else if (event.type === "outcome_observed") {
    const attempt = goal.attempts.find(a => a.id === p.attemptId);
    if (!attempt) throw new Error("attempt_not_found");
    if (!OUTCOME_STATES.includes(p.status)) throw new Error("invalid_outcome_status");
    // Only the trusted executor attaches receipts; tool arguments cannot do so.
    const verified = Boolean(event.receipt?.id && event.receipt?.verified === true && event.receipt?.attemptId === attempt.id);
    const status = p.status === "succeeded" && !verified ? "unknown" : p.status;
    const observation = { eventId: event.id, attemptId: attempt.id, status, reportedStatus: p.status,
      verified, source: event.source || "observation", evidence: text(p.evidence, 2400),
      receipt: verified ? event.receipt : null, at, supersedes: text(p.supersedes, 100) || null };
    if (attempt.outcomeEventId && !["pending", "unknown", "blocked", "partial"].includes(attempt.status) && p.supersedes !== attempt.outcomeEventId) {
      throw new Error("outcome_correction_requires_supersedes");
    }
    Object.assign(attempt, { status, verified, outcomeEventId: event.id, outcome: observation, updatedAt: at });
    const method = goal.approaches.find(a => a.id === attempt.methodId);
    if (method) {
      // Corrections replace an observation instead of counting the same failure twice.
      method.failures = goal.attempts.filter(a => a.methodId === method.id && a.status === "failed" && a.verified).length;
    }
    if (method && verified) {
      method.evidence = [...new Set([...(method.evidence || []), event.id])];
      // A measured belief update must name its basis; success/failure alone
      // does not justify a made-up posterior probability.
      if (p.feasibilityAfter !== undefined && text(p.beliefUpdate)) method.feasibility = probability(p.feasibilityAfter);
    }
    if (p.supersedes) goal.lessons = goal.lessons.filter(l => l.evidenceEventId !== p.supersedes);
    const learning = text(p.learning);
    const learningKey = learning && stableId(learning.toLowerCase().replace(/\W+/g, " "));
    const newLearning = Boolean(verified && learning && text(p.beliefUpdate) && !goal.lessons.some(l => l.key === learningKey));
    if (newLearning) goal.lessons.push({ key: learningKey, statement: learning, beliefUpdate: text(p.beliefUpdate),
      kind: ["knowledge", "capability", "opportunity", "judgment", "recovery"].includes(p.learningKind) ? p.learningKind : "knowledge",
      evidenceEventId: event.id, methodId: attempt.methodId, createdAt: at, transfer: "untested" });
    observation.newLearning = newLearning;
    goal.latestOutcome = observation;
    if (p.nextAction) goal.nextAction = text(p.nextAction);
    // A route failing never erases the purpose. Completion is a separate review.
    if (!["paused", "retired", "achieved"].includes(goal.status)) {
      goal.status = status === "pending" || status === "blocked" ? "waiting" : "active";
    }
  } else if (event.type !== "goal_created") throw new Error("unsupported_goal_event");
  goal.updatedAt = at;
  goal.revision = Number(previous.revision || 0) + 1;
  return goal;
}

export function rankGoalOptions(goal, options = []) {
  return options.map(option => {
    const method = goal?.approaches?.find(a => a.id === option.methodId);
    const novelty = unit(option.learningValue);
    const commitment = unit(goal?.commitment?.strength, 0.5);
    const progress = unit(option.progressValue);
    const feasible = probability(option.feasibility);
    const cost = unit(option.cost);
    const exploration = beliefGuidedExplorationBonus({
      commitment,
      feasibility: feasible,
      learningValue: option.learningValue,
      reusableValue: option.reusableValue,
      reversible: option.reversible !== false,
      changedAssumption: option.changedAssumption === true,
      cost
    });
    const redundant = Number(method?.failures || 0) >= 2 && !option.changedAssumption ? 0.4 : 0;
    const score = commitment * progress * (feasible ?? 0.35) + 0.35 * novelty + 0.2 * unit(option.reusableValue)
      + exploration + 0.2 * unit(option.delayCost) - cost - redundant;
    return { ...option, score: Math.round(score * 1000) / 1000, feasibility: feasible, needsEvidence: feasible === null };
  }).sort((a, b) => b.score - a.score);
}

export function goalCandidateFromMessage(message = "") {
  const value = text(message, 1800);
  if (!value || !/\b(?:my goal is|i want ari to|i want you to build|build ari|ari should|i want ari|make ari)\b/i.test(value)) return null;
  if (!/\b(?:independent|independence|freedom|autonom(?:y|ous)|sentien(?:ce|t)|conscious(?:ness)?|reasoning|learn(?:s|ing)? from failure|conviction|purpose|self[- ]?directed)\b/i.test(value)) return null;
  const purpose = value.replace(/^(?:okay[, ]*)?(?:let's|lets)\s+(?:make|build|do)\s+/i, "").trim();
  return {
    title: "Ari's independent reasoning and learning",
    purpose,
    domain: "ari_independence",
    successCriteria: "Ari can select worthwhile goals, make attributable attempts, learn from verified outcomes, and continue or change course without losing the purpose.",
    usefulPartialOutcomes: "A reusable capability, reliable evidence, a corrected belief, or a better next attempt.",
    commitment: 0.9,
    autonomy: true,
    nextAction: "Connect the shared goal, attempt, and outcome loop to chat and autonomous execution."
  };
}

export function selectResumableGoalAttempt(goal = null, turn = {}) {
  if (!goal || !Array.isArray(goal?.attempts) || !goal.attempts.length) return null;
  const message = text(turn?.message, 2400).toLowerCase();
  const explicitlyContinuing = /\b(?:continue|resume|experiment|test|run|investigate|attempt|probe|compare|evaluate|keep working)\b/i.test(message);
  if (!explicitlyContinuing) return null;
  const pending = [...goal.attempts]
    .reverse()
    .find((attempt) => attempt?.status === "pending" && attempt?.verified !== true);
  return pending || null;
}

export function buildAttemptEvent({ goal, turn = {}, result = null } = {}) {
  const turnId = text(turn?.turnId, 180) || randomUUID();
  return {
    id: `attempt:${turnId}`,
    type: "attempt_started",
    source: "ari_vnext",
    sourceId: turnId,
    at: turn?.createdAt || new Date().toISOString(),
    payload: {
      attemptId: turnId,
      methodId: stableId("ari-vnext-primary-reasoning"),
      method: "Ari vNext primary reasoning with currently authorized tools",
      prediction: "The turn will produce a useful, attributable next step toward the active goal or identify a specific obstacle.",
      successCriteria: "A useful attributable next step toward the goal is produced.",
      expectedLearning: "Determine whether the available reasoning and tools can advance the goal under current conditions.",
      feasibility: null,
      assumptions: "The relevant state and authorized capabilities are available for this turn.",
      disconfirmer: "No useful next step or attributable evidence is produced.",
      selectedStrategyIds: Array.isArray(result?.adaptiveStrategyLayer?.strategies)
        ? result.adaptiveStrategyLayer.strategies.map(item => item.strategyKey).slice(0, 6)
        : []
    }
  };
}

export function buildOutcomeEvent({ attemptId, turn = {}, result = null, error = null } = {}) {
  const success = result?.success === true;
  const action = text(result?.action?.type, 80);
  const status = error || result?.actionPreparation?.success === false ? "failed"
    : ["proposed_action", "execute_pending_action"].includes(action) ? "pending" : success ? "unknown" : "failed";
  const receipt = error ? { id: `runtime-error:${attemptId}`, attemptId, verified: true, kind: "runtime_error" }
    : result?.executorReceipt && typeof result.executorReceipt === "object"
    ? { ...result.executorReceipt, attemptId, verified: result.executorReceipt.verified === true }
    : null;
  const verifiedStatus = receipt?.verified === true && receipt?.attemptId === attemptId
    ? (success ? "succeeded" : status)
    : status;
  const evidence = error
    ? `Ari runtime failure: ${text(error?.message || error, 700)}`
    : text(result?.reply, 1800);
  const learning = error
    ? "The runtime path failed before the goal result could be observed; this identifies an execution obstacle, not evidence that the goal is impossible."
    : verifiedStatus === "unknown"
      ? "The conversational turn completed, but goal completion remains unverified until an external observation or executor receipt exists."
      : "";
  return {
    id: `outcome:${text(turn?.turnId, 180) || attemptId}:${Date.now()}`,
    type: "outcome_observed",
    source: error ? "ari_runtime_error" : "ari_vnext",
    sourceId: text(turn?.turnId, 180) || null,
    at: new Date().toISOString(),
    receipt,
    payload: {
      attemptId,
      status: verifiedStatus,
      evidence,
      learning,
      learningKind: error ? "recovery" : "judgment",
      beliefUpdate: learning ? "The result is pending or the local runtime path needs repair; goal feasibility remains unknown." : "",
      nextAction: "Use the evidence to choose, revise, or pause the next method."
    }
  };
}

export function summarizeGoals(goals = [], { message = "", activeGoalId = null, salience = 0 } = {}) {
  const words = new Set(text(message, 2000).toLowerCase().match(/[a-z]{4,}/g) || []);
  const ranked = goals.filter(g => !["achieved", "retired"].includes(g.status)).map(g => {
    const relevance = [...new Set(`${g.title} ${g.purpose} ${g.domain}`.toLowerCase().match(/[a-z]{4,}/g) || [])].filter(w => words.has(w)).length;
    return { goal: g, relevance, score: (g.id === activeGoalId ? 100 : 0) + relevance * 3 + g.commitment.strength + (g.latestOutcome?.newLearning ? unit(salience) : 0) };
  }).sort((a,b) => b.score-a.score).slice(0, 5);
  return { version: CONVICTION_LEARNING_VERSION, activeGoalId: activeGoalId || ranked.find(x => x.relevance > 0)?.goal.id || null,
    goals: ranked.map(({goal:g}) => ({ id: g.id, title: text(g.title, 160), purpose: text(g.purpose, 400),
      domain: g.domain, status: g.status, successCriteria: text(g.successCriteria, 400), commitment: g.commitment,
      latestOutcome: g.latestOutcome ? { status: g.latestOutcome.status, verified: g.latestOutcome.verified,
        newLearning: g.latestOutcome.newLearning, evidence: text(g.latestOutcome.evidence, 400) } : null,
      nextAction: text(g.nextAction, 240), budget: g.budget,
      attempts: g.attempts.slice(-3).map(a => ({ id: a.id, methodId: a.methodId, method: text(a.method, 180),
        prediction: text(a.prediction, 240), status: a.status, verified: a.verified })),
      approaches: g.approaches.slice(-3).map(a => ({ id: a.id, description: text(a.description, 180), feasibility: a.feasibility, failures: a.failures })),
      lessons: g.lessons.slice(-3).map(l => ({ statement: text(l.statement, 240), beliefUpdate: text(l.beliefUpdate, 240), evidenceEventId: l.evidenceEventId })) })) };
}

export function convictionInstruction(context = {}) {
  if (!context?.version) return "";
  return "CONVICTION AND LEARNING LOOP\nKeep a worthwhile purpose separate from confidence in a method. Treat current capability limits as provisional without inventing capability. Low or unknown feasibility calls for finding conditions you can change and useful experiments. Use ari_goal_manage to preserve meaningful projects and record a prediction before an attempt. Compare progress, learning, reusable capability, effort, and the cost of delay. Review a failed method locally; do not automatically abandon the goal. Identify value from failure only when evidence supports it. Repeated failure without new information calls for a changed approach or an explicit pause. Preserve unknown outcomes, and never report a goal achieved merely because a reply, plan, or commit exists. Use actual tool receipts and tests. Self-selected investigations may use available authorized tools; recorded goals never expand execution authority.\n";
}
