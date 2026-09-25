// ARI vNext — durable execution and investigation sessions.
//
// This module stores compact, observable task state only. It never stores hidden
// chain-of-thought. A session exists so a substantial task can resume after a
// navigation, timeout, failed attempt, or later turn without pretending that
// unobserved work happened.

import { createHash } from "node:crypto";

export const ARI_EXECUTION_SESSION_VERSION = "1.0.0";
export const EXECUTION_SESSION_STATUSES = Object.freeze([
  "active",
  "waiting",
  "blocked",
  "completed",
  "abandoned"
]);
export const EXECUTION_PROGRESS_STATES = Object.freeze([
  "planned",
  "verification_requested",
  "test_attempted",
  "test_failed",
  "test_passed",
  "evidence_gained",
  "strategy_changed",
  "completed"
]);

export function deriveExecutionWorkspace({
  previous = null,
  turn = {},
  route = {},
  goal = null
} = {}) {
  const prior = normalizeExecutionSession(previous?.executionSession || previous);
  const message = clean(turn?.message, 4000);
  const substantial = isSubstantialTask({ message, route });
  const explicitContinue = /\b(?:continue|keep going|resume|pick (?:it|this) back up|finish (?:it|this)|what(?:'s| is) left|keep working)\b/i.test(message);
  const priorRelevant = Boolean(
    prior &&
    ["active", "waiting", "blocked"].includes(prior.status) &&
    (
      explicitContinue ||
      route?.developer === true ||
      route?.followUp === true ||
      (goal?.id && prior.goalId && String(goal.id) === String(prior.goalId))
    )
  );

  if (!substantial && !priorRelevant) {
    return {
      version: ARI_EXECUTION_SESSION_VERSION,
      active: false,
      resumed: false,
      session: null
    };
  }

  const now = validIso(turn?.createdAt) || new Date().toISOString();
  const session = priorRelevant
    ? {
        ...prior,
        status: prior.status === "completed" || prior.status === "abandoned" ? "active" : prior.status,
        updatedAt: now,
        lastTurnId: clean(turn?.turnId, 200) || prior.lastTurnId || null,
        lastSurface: clean(turn?.surface, 200) || prior.lastSurface || null,
        resumeCount: Number(prior.resumeCount || 0) + 1
      }
    : createExecutionSession({ turn, route, goal, now });

  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    active: true,
    resumed: priorRelevant,
    session,
    instruction: {
      preserveGoal: true,
      preserveCurrentApproach: true,
      preserveFailedAttempts: true,
      preserveEvidence: true,
      preserveArtifacts: true,
      preserveNextStep: true,
      useObservedResultsToChooseNextStep: true,
      smallestDiscriminatingExperimentPreferred: true,
      uncertainHypothesesRemainProvisional: true,
      verificationIsNotCompletion: true,
      testAttemptIsNotTestPass: true,
      usefulFailureCountsAsProgress: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function advanceExecutionSession({
  previous = null,
  workspace = null,
  turn = {},
  result = {}
} = {}) {
  const base = normalizeExecutionSession(
    workspace?.session ||
    previous?.executionSession ||
    previous
  );
  if (!base) return null;

  const now = new Date().toISOString();
  const observations = deriveObservations(result);
  const artifacts = deriveArtifacts(result);
  const progressEvents = deriveProgressEvents(result, { observations, artifacts });
  const hypotheses = deriveStructuredHypotheses(result);
  const experiment = deriveExperiment(result, hypotheses);
  const strategyChanged = progressEvents.some((item) => item.state === "strategy_changed");
  const completionVerified = progressEvents.some((item) => item.state === "test_passed") ||
    progressEvents.some((item) => item.state === "completed");
  const failed = result?.success === false || progressEvents.some((item) => item.state === "test_failed");

  const attempts = compactUnique([
    ...base.attempts,
    {
      id: stableId(`${clean(turn?.turnId, 160)}:${progressEvents.map(item => item.state).join(",")}:${clean(result?.action?.applicationAction || result?.action?.type, 120)}`),
      turnId: clean(turn?.turnId, 200) || null,
      at: now,
      approach: clean(
        result?.investigation?.approach ||
        result?.requestUnderstanding?.selectedTool ||
        result?.action?.applicationAction ||
        result?.source ||
        base.currentApproach ||
        "reasoning",
        240
      ),
      outcome: completionVerified ? "verified_progress" : failed ? "failed" : observations.length ? "observed" : "attempted",
      learned: clean(deriveLearningSummary(result, observations), 700) || null
    }
  ], "id", 18);

  const currentApproach = clean(
    result?.investigation?.nextApproach ||
    (strategyChanged ? result?.investigation?.approach : "") ||
    base.currentApproach,
    500
  );

  const nextStep = clean(
    result?.investigation?.nextStep ||
    result?.scientificIntelligence?.experiment?.nextStep ||
    result?.metacognition?.curiosity?.activeQuestion?.question ||
    inferNextStep({ result, failed, completionVerified, experiment, base }),
    900
  );

  const status = completionVerified && explicitCompletionSignal(result)
    ? "completed"
    : result?.pendingAction?.id
      ? "waiting"
      : result?.success === false
        ? "blocked"
        : "active";

  return {
    ...base,
    version: ARI_EXECUTION_SESSION_VERSION,
    status,
    updatedAt: now,
    lastTurnId: clean(turn?.turnId, 200) || base.lastTurnId || null,
    lastSurface: clean(turn?.surface, 200) || base.lastSurface || null,
    currentApproach: currentApproach || base.currentApproach || null,
    observations: compactUnique([...base.observations, ...observations], "id", 24),
    artifacts: compactUnique([...base.artifacts, ...artifacts], "id", 20),
    attempts,
    hypotheses: mergeHypotheses(base.hypotheses, hypotheses),
    experiment: experiment || base.experiment || null,
    progress: compactUnique([...base.progress, ...progressEvents], "id", 30),
    failedAttemptCount: attempts.filter(item => item.outcome === "failed").length,
    verifiedProgressCount: progressEventsMerged([...base.progress, ...progressEvents])
      .filter(item => ["test_passed", "evidence_gained", "completed"].includes(item.state)).length,
    nextStep: status === "completed" ? null : nextStep || base.nextStep || null,
    completion: {
      verified: status === "completed",
      evidence: status === "completed"
        ? observations.slice(-4).map(item => item.summary)
        : base.completion?.evidence || []
    },
    hiddenChainOfThoughtStored: false
  };
}

export function executionSessionToInstruction(workspace = null) {
  const session = workspace?.session || null;
  if (!workspace?.active || !session) return "";
  return [
    "ARI EXECUTION / INVESTIGATION SESSION",
    "A substantial task is active. This is compact durable task state, not hidden reasoning.",
    "Resume from observed state instead of restarting after navigation, timeout, or a later turn.",
    "Preserve the goal, current approach, failed attempts, evidence, artifacts, and next step.",
    "For difficult uncertainty, keep multiple materially different hypotheses provisional until evidence distinguishes them.",
    "Prefer the smallest safe experiment that can discriminate between leading explanations.",
    "Verification requested, test attempted, test failed, and test passed are different states. Never collapse them into success.",
    "A failed experiment is useful progress when it removes an explanation, reveals a constraint, or changes the next strategy.",
    "Only claim completion from verified observable evidence.",
    JSON.stringify(compactSessionForPrompt(session), null, 2)
  ].join("\n").slice(0, 5200);
}

export function compactExecutionSession(session = null) {
  const value = normalizeExecutionSession(session);
  if (!value) return null;
  return {
    version: value.version,
    id: value.id,
    status: value.status,
    title: value.title,
    goalId: value.goalId,
    goal: value.goal,
    successCriteria: value.successCriteria,
    currentApproach: value.currentApproach,
    attempts: value.attempts.slice(-10),
    observations: value.observations.slice(-12),
    artifacts: value.artifacts.slice(-10),
    hypotheses: value.hypotheses.slice(0, 6),
    experiment: value.experiment,
    progress: value.progress.slice(-16),
    failedAttemptCount: value.failedAttemptCount,
    verifiedProgressCount: value.verifiedProgressCount,
    nextStep: value.nextStep,
    completion: value.completion,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    lastTurnId: value.lastTurnId,
    lastSurface: value.lastSurface,
    resumeCount: value.resumeCount,
    hiddenChainOfThoughtStored: false
  };
}

function createExecutionSession({ turn = {}, route = {}, goal = null, now } = {}) {
  const message = clean(turn?.message, 4000);
  const goalText = clean(goal?.purpose || goal?.title || message, 900);
  const id = stableId(`${clean(turn?.userId, 120)}:${goal?.id || goalText.toLowerCase()}:${now.slice(0, 10)}`);
  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    id,
    status: "active",
    title: clean(goal?.title || summarizeTitle(message), 220),
    goalId: clean(goal?.id, 160) || null,
    goal: goalText,
    successCriteria: clean(goal?.successCriteria || inferSuccessCriteria(route), 700),
    currentApproach: null,
    attempts: [],
    observations: [],
    artifacts: [],
    hypotheses: [],
    experiment: null,
    progress: [{
      id: stableId(`${id}:planned`),
      state: "planned",
      at: now,
      summary: "Durable execution session created."
    }],
    failedAttemptCount: 0,
    verifiedProgressCount: 0,
    nextStep: clean(goal?.nextAction, 900) || "Inspect the strongest available evidence and choose the next discriminating action.",
    completion: { verified: false, evidence: [] },
    createdAt: now,
    updatedAt: now,
    lastTurnId: clean(turn?.turnId, 200) || null,
    lastSurface: clean(turn?.surface, 200) || null,
    resumeCount: 0,
    hiddenChainOfThoughtStored: false
  };
}

function deriveProgressEvents(result = {}, { observations = [], artifacts = [] } = {}) {
  const now = new Date().toISOString();
  const events = [];
  const add = (state, summary, evidence = []) => {
    if (!EXECUTION_PROGRESS_STATES.includes(state)) return;
    events.push({
      id: stableId(`${state}:${summary}:${JSON.stringify(evidence).slice(0, 500)}`),
      state,
      at: now,
      summary: clean(summary, 500),
      evidence: arrayText(evidence, 5, 260)
    });
  };

  if (result?.metacognition?.cortex?.needs?.verification === true ||
      result?.modelPolicy?.liveSearchRequired === true ||
      result?.investigation?.verificationRequested === true) {
    add("verification_requested", "Additional verification was identified as necessary.");
  }

  const attempted = Boolean(
    result?.investigation?.testAttempted ||
    result?.ownerLab ||
    result?.executorReceipt ||
    result?.actionPreparation?.repaired ||
    result?.scientificIntelligence?.experimentReview?.attempted ||
    artifacts.length
  );
  if (attempted) add("test_attempted", "An observable verification or execution step was attempted.");

  const passed = Boolean(
    result?.investigation?.testPassed === true ||
    result?.executorReceipt?.verified === true ||
    result?.ownerLab?.success === true ||
    result?.verification?.passed === true
  );
  const failed = Boolean(
    result?.investigation?.testPassed === false ||
    result?.verification?.passed === false ||
    result?.actionPreparation?.success === false ||
    result?.success === false
  );
  if (passed) add("test_passed", "A verification step produced a passing result.", observations.map(item => item.summary));
  else if (failed && attempted) add("test_failed", "A verification step failed or did not establish the expected result.", observations.map(item => item.summary));

  if (observations.length) add("evidence_gained", "New observable evidence was collected.", observations.map(item => item.summary));
  if (result?.investigation?.strategyChanged === true || result?.actionPreparation?.repaired === true) {
    add("strategy_changed", "The approach changed in response to observed evidence.");
  }
  if (explicitCompletionSignal(result) && passed) {
    add("completed", "The task reached verified completion.", observations.map(item => item.summary));
  }

  return events;
}

function deriveObservations(result = {}) {
  const rows = [];
  const push = (source, summary, data = null) => {
    const text = clean(summary, 700);
    if (!text) return;
    rows.push({
      id: stableId(`${source}:${text}`),
      source,
      summary: text,
      data: data && typeof data === "object" ? compactObject(data) : null,
      at: new Date().toISOString()
    });
  };

  if (result?.executorReceipt?.verified) {
    push("executor_receipt", `Verified executor receipt ${clean(result.executorReceipt.id, 140) || "received"}.`);
  }
  if (result?.actionPreparation?.success === false) {
    push("action_preparation", `Action preparation failed: ${clean(result.actionPreparation.code || result.actionPreparation.reason, 220) || "unknown reason"}.`);
  }
  if (result?.ownerLab) push("owner_lab", "Controlled owner Lab produced an observable result.", result.ownerLab);
  if (result?.scientificIntelligence?.outcomeLearning?.applied) {
    push("outcome_learning", "Structured outcome learning was applied.", result.scientificIntelligence.outcomeLearning);
  }
  if (result?.investigation?.observation) push("investigation", result.investigation.observation, result.investigation);
  if (result?.visualAnalysis) push("visual_inspector", "Visual Inspector evidence was returned.", result.visualAnalysis);
  if (result?.evidence?.summary) push("evidence", result.evidence.summary, result.evidence);

  return rows.slice(0, 10);
}

function deriveArtifacts(result = {}) {
  const rows = [];
  const add = (type, ref, summary = "") => {
    const value = clean(ref, 500);
    if (!value) return;
    rows.push({
      id: stableId(`${type}:${value}`),
      type,
      ref: value,
      summary: clean(summary, 400) || null,
      at: new Date().toISOString()
    });
  };
  if (result?.executorReceipt?.id) add("executor_receipt", result.executorReceipt.id, "Verified application execution receipt.");
  if (result?.provider?.id) add("provider_response", result.provider.id, "Model/provider response identifier.");
  if (result?.investigation?.artifactRef) add(result.investigation.artifactType || "artifact", result.investigation.artifactRef, result.investigation.artifactSummary);
  if (result?.ownerLab?.runId) add("lab_run", result.ownerLab.runId, "Controlled owner Lab run.");
  return rows.slice(0, 8);
}

function deriveStructuredHypotheses(result = {}) {
  const source = Array.isArray(result?.investigation?.hypotheses)
    ? result.investigation.hypotheses
    : Array.isArray(result?.scientificIntelligence?.hypotheses)
      ? result.scientificIntelligence.hypotheses
      : [];
  return source.slice(0, 6).map((item, index) => ({
    id: clean(item?.id, 120) || stableId(`hypothesis:${index}:${item?.label || item?.summary || ""}`),
    label: clean(item?.label || item?.summary || item?.id, 500),
    status: ["candidate", "leading", "credible_alternative", "supported", "weakened", "rejected"].includes(item?.status)
      ? item.status
      : index === 0 ? "leading" : "candidate",
    confidence: finiteOrNull(item?.score ?? item?.confidence),
    evidenceFor: arrayText(item?.support || item?.evidenceFor, 5, 260),
    evidenceAgainst: arrayText(item?.against || item?.evidenceAgainst, 5, 260),
    disconfirmers: arrayText(item?.disconfirmers || item?.unknowns, 5, 260),
    provisional: true
  })).filter(item => item.label);
}

function deriveExperiment(result = {}, hypotheses = []) {
  const source = result?.investigation?.experiment || result?.scientificIntelligence?.experiment || null;
  if (!source && hypotheses.length < 2) return null;
  const leading = hypotheses[0] || null;
  const alternative = hypotheses[1] || null;
  return {
    id: clean(source?.id, 140) || stableId(`experiment:${leading?.id || "unknown"}:${alternative?.id || "unknown"}`),
    question: clean(
      source?.question ||
      source?.purpose ||
      (leading && alternative ? `What observation best distinguishes ${leading.label} from ${alternative.label}?` : ""),
      700
    ),
    method: clean(source?.method || source?.intervention || source?.plan, 900) || null,
    expectedDiscriminator: clean(source?.expectedDiscriminator || source?.prediction || source?.successCriteria, 700) || null,
    reversible: source?.reversible !== false,
    status: clean(source?.status || source?.readiness, 80) || "proposed",
    hypothesisIds: [leading?.id, alternative?.id].filter(Boolean)
  };
}

function mergeHypotheses(previous = [], incoming = []) {
  const map = new Map();
  for (const item of [...(Array.isArray(previous) ? previous : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    if (!item?.id) continue;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item, provisional: item?.status !== "supported" });
  }
  return [...map.values()].slice(0, 8);
}

function inferNextStep({ result = {}, failed = false, completionVerified = false, experiment = null, base = {} } = {}) {
  if (completionVerified && explicitCompletionSignal(result)) return "";
  if (failed) return "Use the failure evidence to change the approach before repeating the same attempt.";
  if (experiment?.question) return experiment.question;
  if (result?.metacognition?.missingEvidence?.length) {
    return `Resolve the highest-value missing evidence: ${clean(result.metacognition.missingEvidence[0], 300)}.`;
  }
  return base?.nextStep || "Take the highest-information next action and verify its observable result.";
}

function deriveLearningSummary(result = {}, observations = []) {
  if (result?.investigation?.learning) return result.investigation.learning;
  if (result?.scientificIntelligence?.outcomeLearning?.lesson) return result.scientificIntelligence.outcomeLearning.lesson;
  if (observations.length) return observations.map(item => item.summary).slice(0, 3).join(" ");
  if (result?.success === false) return clean(result?.failure?.message || result?.error, 500);
  return "";
}

function explicitCompletionSignal(result = {}) {
  return Boolean(
    result?.investigation?.completed === true ||
    result?.verification?.completed === true ||
    (result?.action?.verified === true && result?.investigation?.completionRelevant === true)
  );
}

function isSubstantialTask({ message = "", route = {} } = {}) {
  if (!message) return false;
  if (route?.casualConversation === true) return false;
  if (route?.developer === true && /\b(?:implement|build|fix|debug|investigate|inspect|analy[sz]e|review|test|trace|refactor|upgrade|wire|integrate|merge|continue|finish|architecture)\b/i.test(message)) return true;
  if (route?.complexity === "deep" && /\b(?:investigate|analy[sz]e|compare|test|experiment|hypothesis|strategy|plan|solve|figure out|why)\b/i.test(message)) return true;
  return false;
}

function inferSuccessCriteria(route = {}) {
  if (route?.developer) return "Observed evidence supports the diagnosis, the chosen change is implemented through authorized tooling, and verification distinguishes attempted work from a passing result.";
  return "The task reaches an observable verified outcome or a clearly evidenced stopping point.";
}

function summarizeTitle(message = "") {
  const text = clean(message, 220);
  if (!text) return "Investigation";
  return text.length <= 90 ? text : `${text.slice(0, 87)}...`;
}

function compactSessionForPrompt(session = {}) {
  return {
    id: session.id,
    status: session.status,
    title: session.title,
    goal: session.goal,
    successCriteria: session.successCriteria,
    currentApproach: session.currentApproach,
    recentAttempts: session.attempts.slice(-5),
    recentObservations: session.observations.slice(-6),
    artifacts: session.artifacts.slice(-6),
    hypotheses: session.hypotheses.slice(0, 5),
    experiment: session.experiment,
    recentProgress: session.progress.slice(-8),
    failedAttemptCount: session.failedAttemptCount,
    verifiedProgressCount: session.verifiedProgressCount,
    nextStep: session.nextStep,
    resumeCount: session.resumeCount
  };
}

function normalizeExecutionSession(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!value.id || !value.goal) return null;
  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    id: clean(value.id, 180),
    status: EXECUTION_SESSION_STATUSES.includes(value.status) ? value.status : "active",
    title: clean(value.title, 220) || "Investigation",
    goalId: clean(value.goalId, 160) || null,
    goal: clean(value.goal, 900),
    successCriteria: clean(value.successCriteria, 700),
    currentApproach: clean(value.currentApproach, 500) || null,
    attempts: Array.isArray(value.attempts) ? value.attempts.slice(-18) : [],
    observations: Array.isArray(value.observations) ? value.observations.slice(-24) : [],
    artifacts: Array.isArray(value.artifacts) ? value.artifacts.slice(-20) : [],
    hypotheses: Array.isArray(value.hypotheses) ? value.hypotheses.slice(0, 8) : [],
    experiment: value.experiment && typeof value.experiment === "object" ? value.experiment : null,
    progress: progressEventsMerged(Array.isArray(value.progress) ? value.progress : []).slice(-30),
    failedAttemptCount: Math.max(0, Number(value.failedAttemptCount || 0)),
    verifiedProgressCount: Math.max(0, Number(value.verifiedProgressCount || 0)),
    nextStep: clean(value.nextStep, 900) || null,
    completion: value.completion && typeof value.completion === "object"
      ? value.completion
      : { verified: false, evidence: [] },
    createdAt: validIso(value.createdAt) || new Date().toISOString(),
    updatedAt: validIso(value.updatedAt) || new Date().toISOString(),
    lastTurnId: clean(value.lastTurnId, 200) || null,
    lastSurface: clean(value.lastSurface, 200) || null,
    resumeCount: Math.max(0, Number(value.resumeCount || 0)),
    hiddenChainOfThoughtStored: false
  };
}

function progressEventsMerged(values = []) {
  return compactUnique(values.filter(item => item?.id && EXECUTION_PROGRESS_STATES.includes(item?.state)), "id", 30);
}

function compactUnique(values = [], key = "id", limit = 20) {
  const map = new Map();
  for (const item of values) {
    if (!item || typeof item !== "object") continue;
    const id = clean(item?.[key], 220);
    if (!id) continue;
    map.set(id, item);
  }
  return [...map.values()].slice(-limit);
}

function compactObject(value) {
  try {
    const text = JSON.stringify(value);
    if (text.length <= 1800) return value;
    return { summary: text.slice(0, 1750) };
  } catch {
    return null;
  }
}

function arrayText(values, limit = 6, max = 260) {
  const input = Array.isArray(values) ? values : values ? [values] : [];
  return input.map(item => clean(typeof item === "string" ? item : item?.reason || item?.label || item?.summary || JSON.stringify(item), max)).filter(Boolean).slice(0, limit);
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validIso(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function stableId(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 32);
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
