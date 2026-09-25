// ARI vNext — durable execution and investigation session state.
// Compact functional state only: goals, evidence summaries, hypotheses,
// progress events, artifacts, and next steps. Never hidden chain-of-thought.

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
  "verification_requested",
  "test_attempted",
  "test_passed",
  "test_failed",
  "evidence_observed",
  "hypothesis_eliminated",
  "approach_changed",
  "artifact_created",
  "action_verified",
  "useful_failure",
  "completed"
]);

const TASK_PATTERN = /\b(?:implement|build|fix|debug|investigate|trace|analy[sz]e|review|inspect|test|verify|refactor|upgrade|design|architect|integrate|wire|connect|deploy|repair|continue|resume|figure out|work on|make (?:the|these|all) changes)\b/i;
const COMPLETION_PATTERN = /\b(?:done|finished|complete|completed|resolved|fixed and verified|tests? pass(?:ed|ing))\b/i;
const BLOCKED_PATTERN = /\b(?:blocked|waiting for|need(?:s)? approval|requires? confirmation|cannot continue until)\b/i;

export function shouldActivateExecutionSession({ turn = {}, route = {}, previous = null } = {}) {
  const message = clean(turn?.message, 4000);
  const prior = normalizeExecutionSession(previous);
  if (isOpenSession(prior) && likelyContinuation(message, prior)) return true;
  if (!message) return false;
  return Boolean(
    route?.developer === true ||
    route?.complexity === "deep" ||
    TASK_PATTERN.test(message)
  ) && TASK_PATTERN.test(message);
}

export function deriveExecutionWorkspace({
  previous = null,
  turn = {},
  route = {},
  context = {}
} = {}) {
  const prior = normalizeExecutionSession(previous);
  const message = clean(turn?.message, 4000);
  const activate = shouldActivateExecutionSession({ turn, route, previous: prior });
  if (!activate) {
    return {
      version: ARI_EXECUTION_SESSION_VERSION,
      active: false,
      session: isOpenSession(prior) ? compactSession(prior) : null,
      resumeSuggested: false,
      hiddenChainOfThoughtStored: false
    };
  }

  const continuing = isOpenSession(prior) && likelyContinuation(message, prior);
  const session = continuing
    ? prior
    : createExecutionSession({
        turn,
        route,
        context,
        goal: inferGoal(message),
        successCriteria: inferSuccessCriteria(message, route)
      });

  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    active: true,
    session: compactSession(session),
    resumeSuggested: continuing,
    instructions: {
      preserveGoal: true,
      inspectBeforeChanging: route?.developer === true,
      compareCompetingExplanations: route?.complexity === "deep" || route?.developer === true,
      preferSmallDiscriminatingExperiment: true,
      observedResultsControlNextStep: true,
      failedExperimentCanBeUseful: true,
      neverClaimVerificationWithoutEvidence: true
    },
    hiddenChainOfThoughtStored: false
  };
}

export function advanceExecutionSession({
  previous = null,
  workspace = null,
  turn = {},
  result = {}
} = {}) {
  const prior = normalizeExecutionSession(previous);
  const activeWorkspace = workspace?.active === true && workspace?.session;
  if (!activeWorkspace) return prior;
  const base = normalizeExecutionSession(workspace.session);
  if (!base?.id) return prior;

  const now = new Date().toISOString();
  const progressEvents = [
    ...(Array.isArray(base.progressEvents) ? base.progressEvents : []),
    ...deriveProgressEvents({ turn, result, now })
  ];
  const evidence = mergeUnique(
    base.evidence,
    deriveEvidence({ result, turn, now }),
    18,
    item => item.id
  );
  const artifacts = mergeUnique(
    base.artifacts,
    deriveArtifacts(result, now),
    12,
    item => item.id
  );
  const hypotheses = updateHypotheses(base.hypotheses, result, now);
  const failedAttempts = mergeUnique(
    base.failedAttempts,
    deriveFailedAttempts({ turn, result, now }),
    10,
    item => item.id
  );

  const explicitStatus = normalizeStatus(
    result?.executionEvidence?.status ||
    result?.executionWorkspaceUpdate?.status ||
    result?.executionSession?.status
  );
  const status = resolveStatus({
    explicitStatus,
    reply: result?.reply,
    result,
    progressEvents,
    priorStatus: base.status
  });

  const approach = clean(
    result?.executionWorkspaceUpdate?.approach ||
    result?.executionEvidence?.approach ||
    base.approach,
    700
  ) || null;
  const nextStep = status === "completed"
    ? null
    : clean(
        result?.executionWorkspaceUpdate?.nextStep ||
        result?.executionEvidence?.nextStep ||
        inferNextStep({ result, evidence, hypotheses, failedAttempts, prior: base }),
        700
      ) || base.nextStep || "Inspect the strongest unresolved evidence and choose the smallest useful verification step.";

  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    id: base.id,
    status,
    goal: base.goal,
    successCriteria: base.successCriteria,
    approach,
    nextStep,
    hypotheses: hypotheses.slice(0, 8),
    evidence: evidence.slice(0, 18),
    artifacts: artifacts.slice(0, 12),
    failedAttempts: failedAttempts.slice(0, 10),
    progressEvents: progressEvents.slice(-24),
    startedAt: base.startedAt || now,
    updatedAt: now,
    lastTurnId: clean(turn?.turnId, 180) || base.lastTurnId || null,
    lastSurface: clean(turn?.surface, 180) || base.lastSurface || null,
    turnCount: Math.max(1, Number(base.turnCount || 0) + 1),
    hiddenChainOfThoughtStored: false
  };
}

export function executionWorkspaceToInstruction(workspace = null) {
  if (!workspace?.active || !workspace?.session?.id) return "";
  const session = workspace.session;
  return [
    "ARI EXECUTION & INVESTIGATION SESSION",
    "This is durable task state, not hidden reasoning. Resume it only when it matches the current request.",
    \`Goal: \${session.goal || "unspecified"}\`,
    session.successCriteria ? \`Success criteria: \${session.successCriteria}\` : "",
    session.approach ? \`Current approach: \${session.approach}\` : "",
    session.nextStep ? \`Next step: \${session.nextStep}\` : "",
    session.hypotheses?.length
      ? \`Hypotheses: \${session.hypotheses.slice(0, 5).map(item => \`\${item.id}:\${item.status}:\${item.label}\`).join(" | ")}\`
      : "",
    session.evidence?.length
      ? \`Recent evidence: \${session.evidence.slice(-5).map(item => \`\${item.kind}:\${item.summary}\`).join(" | ")}\`
      : "",
    session.failedAttempts?.length
      ? \`Failed attempts: \${session.failedAttempts.slice(-4).map(item => item.summary).join(" | ")}\`
      : "",
    "For difficult work, generate materially different plausible explanations before locking onto one. Choose the smallest safe experiment or inspection that best distinguishes them.",
    "Let observed tool, test, repository, visual, and runtime evidence determine the next step. A failed experiment is progress when it eliminates an explanation or changes the method.",
    "Never collapse verification requested, test attempted, and test passed into the same state. Claim success only from explicit verified evidence.",
    "Preserve useful artifacts and the next step so the investigation can resume after navigation, retries, or timeouts."
  ].filter(Boolean).join("\\n").slice(0, 5200);
}

export function summarizeExecutionSession(session = null) {
  const state = normalizeExecutionSession(session);
  if (!state?.id) return null;
  return {
    version: state.version,
    id: state.id,
    status: state.status,
    goal: state.goal,
    successCriteria: state.successCriteria,
    approach: state.approach,
    nextStep: state.nextStep,
    hypothesisCount: state.hypotheses.length,
    evidenceCount: state.evidence.length,
    artifactCount: state.artifacts.length,
    failedAttemptCount: state.failedAttempts.length,
    lastProgress: state.progressEvents[state.progressEvents.length - 1] || null,
    updatedAt: state.updatedAt,
    turnCount: state.turnCount,
    hiddenChainOfThoughtStored: false
  };
}

function createExecutionSession({ turn = {}, route = {}, goal = "", successCriteria = "" } = {}) {
  const now = new Date().toISOString();
  const seed = [
    clean(turn?.userId, 120),
    clean(turn?.conversationId, 120),
    clean(turn?.turnId, 120),
    goal
  ].join("|");
  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    id: \`exec_\${stableId(seed)}\`,
    status: "active",
    goal: clean(goal, 700) || "Complete the current substantial task.",
    successCriteria: clean(successCriteria, 700) || "Produce an evidence-grounded result and verify material changes before claiming completion.",
    approach: route?.developer === true ? "Inspect current implementation and evidence before choosing a change." : null,
    nextStep: route?.developer === true
      ? "Inspect the current state and identify the smallest high-information next action."
      : "Identify the strongest competing explanations and the best discriminating check.",
    hypotheses: [],
    evidence: [],
    artifacts: [],
    failedAttempts: [],
    progressEvents: [],
    startedAt: now,
    updatedAt: now,
    lastTurnId: clean(turn?.turnId, 180) || null,
    lastSurface: clean(turn?.surface, 180) || null,
    turnCount: 0,
    hiddenChainOfThoughtStored: false
  };
}

function deriveProgressEvents({ turn = {}, result = {}, now }) {
  const events = [];
  const add = (state, summary, evidenceRef = null) => {
    if (!EXECUTION_PROGRESS_STATES.includes(state)) return;
    events.push({
      id: \`progress_\${stableId(\`\${turn?.turnId || ""}|\${state}|\${summary}\`)}\`,
      state,
      summary: clean(summary, 420),
      evidenceRef: clean(evidenceRef, 180) || null,
      turnId: clean(turn?.turnId, 180) || null,
      at: now
    });
  };

  const verification = result?.executionEvidence?.verification || result?.verification || null;
  const verificationStatus = normalizeVerificationStatus(verification?.status || result?.executionEvidence?.verificationStatus);
  const verificationRequested = Boolean(
    result?.metacognition?.cortex?.needs?.verification === true ||
    result?.modelPolicy?.liveSearchRequired === true ||
    verification?.requested === true
  );
  if (verificationRequested) add("verification_requested", "Verification was identified as necessary before treating the task as complete.");

  if (verification?.attempted === true || verificationStatus) {
    add("test_attempted", clean(verification?.summary, 360) || "A verification or test was attempted.");
  }
  if (verificationStatus === "passed") {
    add("test_passed", clean(verification?.summary, 360) || "Verification passed.", verification?.id);
  } else if (verificationStatus === "failed") {
    add("test_failed", clean(verification?.summary, 360) || "Verification failed and should change the next step.", verification?.id);
    add("useful_failure", "A failed verification produced evidence that can narrow the next approach.", verification?.id);
  }

  if (result?.executorReceipt?.verified === true) {
    add("action_verified", "A trusted executor receipt verified the requested action.", result.executorReceipt.id);
  }

  for (const item of arrayObjects(result?.executionEvidence?.observations, 6)) {
    add("evidence_observed", item.summary || item.label || "New evidence observed.", item.id);
  }
  for (const item of arrayObjects(result?.executionEvidence?.eliminatedHypotheses, 4)) {
    add("hypothesis_eliminated", item.summary || item.label || item.id || "A hypothesis was eliminated.", item.id);
  }
  if (result?.executionWorkspaceUpdate?.approachChanged === true) {
    add("approach_changed", clean(result?.executionWorkspaceUpdate?.approach, 360) || "The approach changed in response to evidence.");
  }
  for (const item of deriveArtifacts(result, now)) {
    add("artifact_created", \`Artifact recorded: \${item.label || item.kind}.\`, item.id);
  }
  if (normalizeStatus(result?.executionEvidence?.status || result?.executionWorkspaceUpdate?.status) === "completed") {
    add("completed", "The execution session reached its explicit success criteria.");
  }
  return dedupe(events, item => item.id);
}

function deriveEvidence({ result = {}, turn = {}, now }) {
  const items = [];
  const push = (kind, summary, source = null, verified = false, id = null) => {
    const text = clean(summary, 600);
    if (!text) return;
    items.push({
      id: clean(id, 180) || \`evidence_\${stableId(\`\${turn?.turnId || ""}|\${kind}|\${text}\`)}\`,
      kind: clean(kind, 80) || "observation",
      summary: text,
      source: clean(source, 180) || null,
      verified: verified === true,
      at: now
    });
  };

  for (const item of arrayObjects(result?.executionEvidence?.observations, 8)) {
    push(item.kind || "observation", item.summary || item.label, item.source, item.verified, item.id);
  }
  const verification = result?.executionEvidence?.verification || result?.verification || null;
  const status = normalizeVerificationStatus(verification?.status || result?.executionEvidence?.verificationStatus);
  if (verification?.attempted === true || status) {
    push("verification", verification?.summary || \`Verification \${status || "attempted"}.\`, verification?.source, status === "passed", verification?.id);
  }
  if (result?.executorReceipt?.verified === true) {
    push("executor_receipt", "Trusted executor verified the application action.", "trusted_executor", true, result.executorReceipt.id);
  }
  if (result?.scientificIntelligence?.outcomeLearning?.applied === true) {
    push("outcome_learning", "Structured outcome learning was applied to the current reasoning.", "scientific_intelligence", true);
  }
  return items;
}

function updateHypotheses(previous = [], result = {}, now) {
  const map = new Map(
    (Array.isArray(previous) ? previous : [])
      .map(normalizeHypothesis)
      .filter(Boolean)
      .map(item => [item.id, item])
  );

  const candidates = [
    ...arrayObjects(result?.executionEvidence?.hypotheses, 8),
    ...arrayObjects(result?.executionWorkspaceUpdate?.hypotheses, 8),
    ...arrayObjects(result?.scientificIntelligence?.hypotheses, 8)
  ];
  for (const raw of candidates) {
    const id = clean(raw?.id, 160) || \`hyp_\${stableId(raw?.label || raw?.summary || JSON.stringify(raw))}\`;
    const existing = map.get(id);
    map.set(id, {
      id,
      label: clean(raw?.label || raw?.summary || existing?.label, 420) || id,
      status: normalizeHypothesisStatus(raw?.status || existing?.status),
      support: clean(raw?.support || existing?.support, 420) || null,
      against: clean(raw?.against || existing?.against, 420) || null,
      updatedAt: now
    });
  }
  for (const raw of arrayObjects(result?.executionEvidence?.eliminatedHypotheses, 6)) {
    const id = clean(raw?.id, 160);
    if (!id) continue;
    const existing = map.get(id) || { id, label: clean(raw?.label || raw?.summary, 420) || id };
    map.set(id, { ...existing, status: "eliminated", updatedAt: now });
  }
  return [...map.values()].slice(0, 8);
}

function deriveArtifacts(result = {}, now) {
  const artifacts = [];
  for (const raw of [
    ...arrayObjects(result?.executionEvidence?.artifacts, 8),
    ...arrayObjects(result?.executionWorkspaceUpdate?.artifacts, 8)
  ]) {
    const locator = clean(raw?.url || raw?.path || raw?.ref || raw?.id, 500);
    const label = clean(raw?.label || raw?.name || raw?.path || raw?.kind, 260);
    if (!locator && !label) continue;
    artifacts.push({
      id: clean(raw?.id, 180) || \`artifact_\${stableId(locator || label)}\`,
      kind: clean(raw?.kind, 80) || "artifact",
      label: label || "artifact",
      locator: locator || null,
      verified: raw?.verified === true,
      at: now
    });
  }
  return dedupe(artifacts, item => item.id);
}

function deriveFailedAttempts({ turn = {}, result = {}, now }) {
  const failed = [];
  const verification = result?.executionEvidence?.verification || result?.verification || null;
  const verificationStatus = normalizeVerificationStatus(verification?.status || result?.executionEvidence?.verificationStatus);
  const runtimeFailed = result?.success === false || Boolean(result?.failure);
  if (verificationStatus === "failed" || runtimeFailed) {
    const summary = clean(
      verification?.summary ||
      result?.failure?.message ||
      result?.executionEvidence?.failureSummary ||
      "An attempted approach failed.",
      600
    );
    failed.push({
      id: \`failure_\${stableId(\`\${turn?.turnId || ""}|\${summary}\`)}\`,
      summary,
      lesson: clean(
        result?.executionEvidence?.lesson ||
        result?.executionWorkspaceUpdate?.lesson ||
        "Treat the failure as evidence; change the method rather than repeating it unchanged.",
        600
      ),
      at: now
    });
  }
  return failed;
}

function resolveStatus({ explicitStatus, reply = "", result = {}, progressEvents = [], priorStatus = "active" } = {}) {
  if (explicitStatus) return explicitStatus;
  if (result?.success === false) return "blocked";
  if (progressEvents.some(item => item.state === "test_passed") && COMPLETION_PATTERN.test(clean(reply, 2000))) return "completed";
  if (BLOCKED_PATTERN.test(clean(reply, 2000))) return "waiting";
  return EXECUTION_SESSION_STATUSES.includes(priorStatus) && !["completed", "abandoned"].includes(priorStatus)
    ? priorStatus
    : "active";
}

function inferNextStep({ result = {}, evidence = [], hypotheses = [], failedAttempts = [], prior = {} } = {}) {
  if (result?.success === false) return "Use the recorded failure to choose a different bounded approach before retrying.";
  const unresolved = hypotheses.filter(item => !["eliminated", "supported"].includes(item.status));
  if (unresolved.length >= 2) return "Run the smallest safe check that best distinguishes the leading unresolved hypotheses.";
  if (failedAttempts.length > (prior?.failedAttempts?.length || 0)) return "Change the failed method and verify the alternative with observable evidence.";
  if (evidence.length > (prior?.evidence?.length || 0)) return "Use the newest observation to update the approach, then verify the material result.";
  return "Inspect the strongest unresolved evidence and choose the smallest useful verification step.";
}

function inferGoal(message = "") {
  const text = clean(message, 700);
  return text || "Complete the current substantial task.";
}

function inferSuccessCriteria(message = "", route = {}) {
  if (route?.developer) {
    return "The requested behavior is implemented, material regressions are checked, and completion is supported by observable test/runtime evidence.";
  }
  if (/\b(?:investigate|figure out|why|trace|analy[sz]e|review)\b/i.test(message)) {
    return "Reach an evidence-grounded explanation that distinguishes plausible alternatives and identifies the next actionable step.";
  }
  return "Complete the requested task with observable evidence proportionate to the claim.";
}

function likelyContinuation(message = "", prior = null) {
  if (!isOpenSession(prior)) return false;
  const text = clean(message, 4000).toLowerCase();
  if (!text) return true;
  if (/\b(?:continue|resume|keep going|finish|do it|make it happen|what'?s left|where were we|still working|go ahead)\b/i.test(text)) return true;
  const goalTerms = new Set(tokens(prior.goal));
  const messageTerms = tokens(text);
  if (!goalTerms.size || !messageTerms.length) return false;
  let overlap = 0;
  for (const term of messageTerms) if (goalTerms.has(term)) overlap += 1;
  return overlap >= Math.min(3, Math.max(1, Math.ceil(goalTerms.size * 0.18)));
}

function normalizeExecutionSession(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value.id, 180);
  if (!id) return null;
  return {
    version: ARI_EXECUTION_SESSION_VERSION,
    id,
    status: normalizeStatus(value.status) || "active",
    goal: clean(value.goal, 700),
    successCriteria: clean(value.successCriteria, 700),
    approach: clean(value.approach, 700) || null,
    nextStep: clean(value.nextStep, 700) || null,
    hypotheses: (Array.isArray(value.hypotheses) ? value.hypotheses : []).map(normalizeHypothesis).filter(Boolean).slice(0, 8),
    evidence: arrayObjects(value.evidence, 18),
    artifacts: arrayObjects(value.artifacts, 12),
    failedAttempts: arrayObjects(value.failedAttempts, 10),
    progressEvents: arrayObjects(value.progressEvents, 24),
    startedAt: validIso(value.startedAt),
    updatedAt: validIso(value.updatedAt),
    lastTurnId: clean(value.lastTurnId, 180) || null,
    lastSurface: clean(value.lastSurface, 180) || null,
    turnCount: Math.max(0, Number(value.turnCount || 0)),
    hiddenChainOfThoughtStored: false
  };
}

function compactSession(value = null) {
  const state = normalizeExecutionSession(value);
  if (!state) return null;
  return {
    ...state,
    hypotheses: state.hypotheses.slice(0, 6),
    evidence: state.evidence.slice(-10),
    artifacts: state.artifacts.slice(-8),
    failedAttempts: state.failedAttempts.slice(-6),
    progressEvents: state.progressEvents.slice(-12)
  };
}

function normalizeHypothesis(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value.id, 160);
  if (!id) return null;
  return {
    id,
    label: clean(value.label || value.summary, 420) || id,
    status: normalizeHypothesisStatus(value.status),
    support: clean(value.support, 420) || null,
    against: clean(value.against, 420) || null,
    updatedAt: validIso(value.updatedAt)
  };
}

function normalizeHypothesisStatus(value = "") {
  const status = clean(value, 40).toLowerCase();
  return ["candidate", "leading", "credible_alternative", "supported", "weakened", "eliminated", "unknown"].includes(status)
    ? status
    : "candidate";
}

function normalizeVerificationStatus(value = "") {
  const status = clean(value, 40).toLowerCase();
  if (["pass", "passed", "success", "verified"].includes(status)) return "passed";
  if (["fail", "failed", "error", "regression"].includes(status)) return "failed";
  if (["attempted", "running", "pending"].includes(status)) return "attempted";
  return "";
}

function normalizeStatus(value = "") {
  const status = clean(value, 40).toLowerCase();
  return EXECUTION_SESSION_STATUSES.includes(status) ? status : "";
}

function isOpenSession(value = null) {
  return Boolean(value?.id && ["active", "waiting", "blocked"].includes(value?.status));
}

function tokens(value = "") {
  return [...new Set(
    clean(value, 1000)
      .toLowerCase()
      .match(/[a-z0-9]{4,}/g) || []
  )].filter(term => !["this", "that", "with", "from", "have", "make", "current", "task"].includes(term));
}

function mergeUnique(previous = [], next = [], limit = 20, keyFn = item => item?.id) {
  const map = new Map();
  for (const item of [...(Array.isArray(previous) ? previous : []), ...(Array.isArray(next) ? next : [])]) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, item);
  }
  return [...map.values()].slice(-Math.max(1, limit));
}

function dedupe(values = [], keyFn = item => item?.id) {
  const map = new Map();
  for (const item of values) {
    const key = keyFn(item);
    if (key) map.set(key, item);
  }
  return [...map.values()];
}

function arrayObjects(values = [], limit = 8) {
  return (Array.isArray(values) ? values : [])
    .filter(item => item && typeof item === "object" && !Array.isArray(item))
    .slice(0, limit)
    .map(item => ({ ...item }));
}

function validIso(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function stableId(value = "") {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 24);
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
