// ARI vNext — durable communication closure lifecycle.
// Stores compact intent/contract/evidence/outcome state only. Never hidden chain-of-thought.

import { createHash } from "node:crypto";

export const ARI_COMMUNICATION_CLOSURE_VERSION = "1.0.0";

export const COMMUNICATION_CLOSURE_STATES = Object.freeze([
  "received",
  "interpreted",
  "contracted",
  "planned",
  "executing",
  "observed",
  "verified",
  "outcome_pending",
  "closed",
  "blocked",
  "failed",
  "partial",
  "superseded",
  "rejected",
  "unknown"
]);

const OPEN_STATES = new Set([
  "received",
  "interpreted",
  "contracted",
  "planned",
  "executing",
  "observed",
  "outcome_pending",
  "blocked",
  "partial",
  "unknown"
]);

const TASK_PATTERN = /\b(?:implement|build|fix|debug|investigate|trace|analy[sz]e|review|inspect|test|verify|refactor|upgrade|design|architect|integrate|wire|connect|deploy|repair|continue|resume|figure out|work on|make (?:the|these|all) changes|log|save|delete|update|create)\b/i;
const CONSEQUENCE_PATTERN = /\b(?:deploy|merge|publish|send|delete|charge|purchase|book|submit|apply|diagnos|medical|legal|financial|security|production|database|schema|migration|background check)\b/i;
const CORRECTION_PATTERN = /\b(?:no[, ]|that's wrong|that is wrong|not what i said|not what i meant|i meant|correction|actually[, ]|you got that wrong|don't assume|do not assume)\b/i;
const ACCEPTANCE_PATTERN = /^(?:yes|yeah|yep|correct|exactly|that's right|that is right|perfect)\b/i;
const REJECTION_PATTERN = /^(?:no|nope|incorrect|wrong|that's wrong|that is wrong)\b/i;
const COMPLETION_PATTERN = /\b(?:done|finished|complete|completed|resolved|fixed|merged|deployed|saved|sent|submitted)\b/i;
const DOWNSTREAM_OUTCOME_PATTERN = /\b(?:experiment|intervention|prediction|predict|recommend|recommendation|try this|trial|expected outcome|real[- ]world outcome|follow[- ]?up|see if|whether .* works?)\b/i;

export function deriveCommunicationClosureWorkspace({
  previous = null,
  turn = {},
  route = {},
  context = {},
  executionWorkspace = null
} = {}) {
  const prior = normalizeCommunicationClosure(previous);
  const message = clean(turn?.message, 6000);
  const continuing = Boolean(prior?.id && OPEN_STATES.has(prior.state) && likelyContinuation(message, prior));
  const level = continuing ? prior.level : classifyClosureLevel({ message, route, executionWorkspace });

  if (level <= 0 && !continuing) {
    return {
      version: ARI_COMMUNICATION_CLOSURE_VERSION,
      active: false,
      level: 0,
      loop: null,
      hiddenChainOfThoughtStored: false
    };
  }

  const loop = continuing
    ? prior
    : createClosureLoop({
        turn,
        level,
        route,
        context,
        executionWorkspace
      });

  return {
    version: ARI_COMMUNICATION_CLOSURE_VERSION,
    active: true,
    level: loop.level,
    loop: compactClosure(loop),
    resumeSuggested: continuing,
    instructions: {
      separateLiteralRequestFromInterpretation: true,
      keepAcceptanceCriteriaObservable: true,
      doNotTreatDeliveryAsClosure: true,
      independentVerificationForConsequentialWork: loop.level >= 3,
      userAcceptanceOnlyWhenMaterial: loop.level >= 2,
      propagateCorrections: true,
      outcomeLearning: true
    },
    hiddenChainOfThoughtStored: false
  };
}

export function communicationClosureToInstruction(workspace = null) {
  if (!workspace?.active || !workspace?.loop?.id) return "";
  const loop = workspace.loop;
  return [
    "ARI COMMUNICATION CLOSURE",
    "This is compact lifecycle state, not hidden reasoning.",
    `Loop: ${loop.id} · level L${loop.level} · state ${loop.state}`,
    `Literal request: ${loop.userRequest || "unspecified"}`,
    `Selected interpretation: ${loop.selectedInterpretation || "not yet established"}`,
    loop.acceptanceCriteria?.length
      ? `Acceptance criteria: ${loop.acceptanceCriteria.map(item => `${item.id}=${item.status}:${item.label}`).join(" | ")}`
      : "",
    "Keep understood, proposed, executed, observed, verified, and accepted states distinct.",
    "Do not claim completion merely because a reply was delivered.",
    "For consequential work, require independent observable evidence before verified/closed.",
    "When the user corrects the interpretation, supersede the affected claim and invalidate dependent conclusions instead of merely appending a note.",
    "If real-world outcome evidence is still pending, use outcome_pending rather than closed."
  ].filter(Boolean).join("\n").slice(0, 4200);
}

export function advanceCommunicationClosure({
  previous = null,
  workspace = null,
  turn = {},
  result = {},
  executionSession = null
} = {}) {
  const prior = normalizeCommunicationClosure(previous);
  const active = workspace?.active === true && workspace?.loop?.id;
  if (!active) return prior;

  const base = normalizeCommunicationClosure(workspace.loop);
  if (!base?.id) return prior;

  const now = new Date().toISOString();
  const interpretation = deriveSelectedInterpretation({ base, result, executionSession });
  const newEvidence = deriveEvidence({ result, executionSession, now });
  const evidence = mergeUnique(base.evidence, newEvidence, 24, item => item.id);
  const verifiedCompletion = hasVerifiedCompletionEvidence({ result, executionSession, evidence });
  const correction = detectCorrection({
    message: turn?.message,
    prior: prior?.id === base.id ? prior : base,
    interpretation,
    turnId: turn?.turnId,
    now
  });

  const claimsResult = updateClaims({
    claims: base.claims,
    interpretation,
    correction,
    evidence,
    result,
    executionSession,
    loopId: base.id,
    turnId: turn?.turnId,
    now
  });

  const acceptanceCriteria = updateAcceptanceCriteria({
    criteria: base.acceptanceCriteria,
    result,
    executionSession,
    verifiedCompletion,
    evidence
  });

  const userAcceptance = deriveUserAcceptance({
    previous: base.userAcceptance,
    message: turn?.message,
    pendingAction: result?.pendingAction,
    level: base.level,
    now
  });

  const state = resolveClosureState({
    base,
    result,
    executionSession,
    verifiedCompletion,
    correction,
    acceptanceCriteria
  });

  const observedOutcome = deriveObservedOutcome({
    base,
    result,
    executionSession,
    verifiedCompletion,
    evidence
  });

  const outcomeDelta = deriveOutcomeDelta({
    expectedOutcome: base.expectedOutcome,
    observedOutcome,
    state
  });
  const learning = deriveClosureLearning({
    base,
    turn,
    result,
    executionSession,
    correction,
    outcomeDelta,
    claimsResult,
    now
  });

  const closedAt = ["closed", "verified", "failed", "rejected", "superseded"].includes(state)
    ? now
    : null;

  return {
    ...base,
    version: ARI_COMMUNICATION_CLOSURE_VERSION,
    state,
    terminalState: terminalStateFor(state),
    selectedInterpretation: interpretation.text,
    interpretationSource: interpretation.source,
    acceptanceCriteria,
    evidence,
    unverifiedClaims: deriveUnverifiedClaims({ result, verifiedCompletion, evidence }),
    corrections: correction
      ? mergeUnique(base.corrections, [correction], 12, item => item.id)
      : base.corrections,
    userAcceptance,
    observedOutcome,
    outcomeDelta,
    lessons: mergeUnique(base.lessons, learning.lessons, 12, item => item.id),
    beliefUpdates: mergeUnique(base.beliefUpdates, learning.beliefUpdates, 12, item => item.id),
    strategyUpdates: mergeUnique(base.strategyUpdates, learning.strategyUpdates, 12, item => item.id),
    dependencyInvalidations: mergeUnique(
      base.dependencyInvalidations,
      claimsResult.invalidations,
      16,
      item => item.id
    ),
    claims: claimsResult.claims,
    lastTurnId: clean(turn?.turnId, 180) || base.lastTurnId,
    updatedAt: now,
    closedAt,
    hiddenChainOfThoughtStored: false
  };
}

export function summarizeCommunicationClosure(value = null) {
  const closure = normalizeCommunicationClosure(value);
  if (!closure?.id) return null;
  return {
    version: closure.version,
    id: closure.id,
    level: closure.level,
    state: closure.state,
    terminalState: closure.terminalState,
    selectedInterpretation: closure.selectedInterpretation,
    criteria: closure.acceptanceCriteria.map(item => ({
      id: item.id,
      status: item.status,
      label: item.label
    })),
    evidenceCount: closure.evidence.length,
    correctionCount: closure.corrections.length,
    dependencyInvalidationCount: closure.dependencyInvalidations.length,
    userAcceptance: closure.userAcceptance,
    expectedOutcome: closure.expectedOutcome,
    observedOutcome: closure.observedOutcome,
    outcomeDelta: closure.outcomeDelta,
    updatedAt: closure.updatedAt,
    closedAt: closure.closedAt,
    hiddenChainOfThoughtStored: false
  };
}

function createClosureLoop({ turn = {}, level = 1, route = {}, executionWorkspace = null } = {}) {
  const now = new Date().toISOString();
  const userRequest = clean(turn?.message, 6000);
  const session = executionWorkspace?.session || null;
  const selectedInterpretation = clean(session?.goal, 1200) || userRequest;
  const id = `closure_${stableId([
    clean(turn?.userId, 120),
    clean(turn?.conversationId, 180),
    clean(turn?.turnId, 180),
    selectedInterpretation
  ].join("|"))}`;
  const acceptanceCriteria = buildAcceptanceCriteria({ level, route, session, userRequest });

  return {
    version: ARI_COMMUNICATION_CLOSURE_VERSION,
    id,
    level: clampInt(level, 1, 3),
    state: "interpreted",
    terminalState: "open",
    userRequest,
    selectedInterpretation,
    interpretationSource: session?.goal ? "execution_goal" : "literal_request",
    acceptanceCriteria,
    componentOwners: {
      interpretation: "ari_primary_runtime",
      contract: "ari_runtime",
      execution: "authorized_tool_or_runtime",
      verification: "independent_evidence",
      acceptance: "user_when_material",
      outcome: "runtime_plus_observed_world"
    },
    evidence: [],
    unverifiedClaims: [],
    corrections: [],
    supersedes: null,
    userAcceptance: {
      status: level >= 2 ? "pending_if_required" : "not_required",
      source: null,
      at: null
    },
    expectedOutcome: {
      summary: acceptanceCriteria.map(item => item.label).join(" "),
      criteriaIds: acceptanceCriteria.map(item => item.id)
    },
    observedOutcome: {
      summary: null,
      verified: false,
      evidenceRefs: []
    },
    outcomeDelta: {
      status: "pending",
      summary: null
    },
    lessons: [],
    beliefUpdates: [],
    strategyUpdates: [],
    dependencyInvalidations: [],
    claims: [{
      id: `claim_${stableId(`${id}|intent|${selectedInterpretation}`)}`,
      claim: selectedInterpretation,
      kind: "selected_interpretation",
      status: "active",
      confidence: session?.goal ? 0.78 : 0.62,
      evidenceIds: [],
      derivedFrom: [],
      supersededBy: null,
      sourceTurnId: clean(turn?.turnId, 180) || null,
      createdAt: now,
      updatedAt: now
    }],
    conversationId: clean(turn?.conversationId, 180) || null,
    rootTurnId: clean(turn?.turnId, 180) || null,
    lastTurnId: clean(turn?.turnId, 180) || null,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    hiddenChainOfThoughtStored: false
  };
}

function buildAcceptanceCriteria({ level, route = {}, session = null, userRequest = "" } = {}) {
  const criteria = [];
  const push = (id, label, required = true) => {
    if (!label || criteria.some(item => item.id === id)) return;
    criteria.push({ id, label: clean(label, 700), required, status: "pending", evidenceRefs: [] });
  };

  if (session?.successCriteria) {
    push("requested_result", session.successCriteria);
  } else {
    push("requested_result", "Answer or perform the user's selected request without silently changing its meaning.");
  }

  if (level >= 2 && TASK_PATTERN.test(userRequest)) {
    push("execution_evidence", "If an action is requested, distinguish proposal from execution and attach observable execution evidence.");
  }

  if (level >= 3 || route?.developer === true || CONSEQUENCE_PATTERN.test(userRequest)) {
    push("verified_result", "Do not mark the material result complete until an independent test, trusted receipt, or equivalent observable evidence verifies it.");
  }

  if (DOWNSTREAM_OUTCOME_PATTERN.test(userRequest)) {
    push("downstream_outcome", "Keep the loop open until downstream real-world evidence resolves whether the intervention, experiment, prediction, or recommendation worked.", true);
  }

  return criteria.slice(0, 6);
}

function classifyClosureLevel({ message = "", route = {}, executionWorkspace = null } = {}) {
  const text = clean(message, 6000);
  if (!text) return 0;
  if (
    route?.developer === true ||
    CONSEQUENCE_PATTERN.test(text) ||
    executionWorkspace?.active === true && /\b(?:deploy|merge|database|migration|production|security)\b/i.test(text)
  ) return 3;
  if (TASK_PATTERN.test(text) || executionWorkspace?.active === true) return 2;
  if (route?.followUp || route?.memory || CORRECTION_PATTERN.test(text) || route?.complexity === "deep") return 1;
  return 0;
}

function deriveSelectedInterpretation({ base, result = {}, executionSession = null } = {}) {
  const action = clean(
    result?.requestUnderstanding?.applicationAction ||
    result?.action?.applicationAction,
    180
  );
  if (action) {
    return {
      text: clean(executionSession?.goal, 1200) || `Perform the current request using the ${action} application action.`,
      source: result?.requestUnderstanding ? "primary_runtime_understanding" : "application_action"
    };
  }

  const executionGoal = clean(executionSession?.goal, 1200);
  if (executionGoal) return { text: executionGoal, source: "execution_goal" };

  return {
    text: clean(base?.selectedInterpretation, 1200) || clean(base?.userRequest, 1200),
    source: clean(base?.interpretationSource, 120) || "literal_request"
  };
}

function deriveEvidence({ result = {}, executionSession = null, now }) {
  const items = [];
  const push = (id, kind, summary, verified = false, source = null) => {
    const text = clean(summary, 700);
    if (!text) return;
    items.push({
      id: clean(id, 180) || `closure_evidence_${stableId(`${kind}|${text}`)}`,
      kind: clean(kind, 80) || "observation",
      summary: text,
      verified: verified === true,
      source: clean(source, 180) || null,
      at: now
    });
  };

  for (const item of Array.isArray(executionSession?.evidence) ? executionSession.evidence.slice(-12) : []) {
    push(item?.id, item?.kind || "execution_evidence", item?.summary, item?.verified === true, item?.source);
  }

  const receipt = result?.executorReceipt || null;
  if (receipt?.id) {
    push(
      receipt.id,
      "trusted_executor_receipt",
      receipt?.summary || "Trusted executor returned a receipt for the requested application action.",
      receipt?.verified === true,
      "trusted_executor"
    );
  }

  const verification = result?.executionEvidence?.verification || result?.verification || null;
  if (verification) {
    const status = normalizeVerificationStatus(verification?.status);
    push(
      verification?.id,
      "verification",
      verification?.summary || `Verification ${status || "attempted"}.`,
      status === "passed",
      verification?.source
    );
  }

  if (result?.closureRuntime?.actionLedger?.stored === true) {
    push(
      result?.pendingAction?.id || result?.action?.pendingActionId,
      "action_contract",
      "The proposed action contract was durably recorded before asking for confirmation.",
      true,
      "ari_action_ledger"
    );
  }

  return dedupe(items, item => item.id);
}

function updateAcceptanceCriteria({
  criteria = [],
  result = {},
  executionSession = null,
  verifiedCompletion = false,
  evidence = []
} = {}) {
  const evidenceRefs = evidence.filter(item => item.verified).map(item => item.id).slice(-8);
  return (Array.isArray(criteria) ? criteria : []).map(item => {
    const next = { ...item, evidenceRefs: Array.isArray(item?.evidenceRefs) ? item.evidenceRefs.slice(0, 8) : [] };
    if (item.id === "verified_result") {
      if (verifiedCompletion) {
        next.status = "passed";
        next.evidenceRefs = evidenceRefs;
      }
      return next;
    }
    if (item.id === "execution_evidence") {
      if (result?.pendingAction?.id) next.status = "partial";
      if (result?.executorReceipt?.verified === true || executionSession?.status === "completed") {
        next.status = "passed";
        next.evidenceRefs = evidenceRefs;
      }
      return next;
    }
    if (item.id === "downstream_outcome") {
      const outcomeResolved =
        result?.closureRuntime?.decisionOutcomeLearning?.resolved === true ||
        result?.decisionOutcomeLearning?.resolved === true;
      if (outcomeResolved) {
        next.status = "passed";
        next.evidenceRefs = evidenceRefs;
      }
      return next;
    }
    if (item.id === "requested_result") {
      if (executionSession?.status === "completed" && verifiedCompletion) {
        next.status = "passed";
        next.evidenceRefs = evidenceRefs;
      } else if (result?.success === false) {
        next.status = "failed";
      } else if (clean(result?.reply, 40)) {
        next.status = result?.pendingAction?.id ? "partial" : "observed";
      }
      return next;
    }
    return next;
  });
}

function resolveClosureState({
  base,
  result = {},
  executionSession = null,
  verifiedCompletion = false,
  correction = null,
  acceptanceCriteria = []
} = {}) {
  if (correction) return "interpreted";
  if (result?.success === false) return "failed";
  if (result?.action?.type === "cancel_pending_action") return "rejected";
  if (result?.pendingAction?.id || result?.action?.type === "proposed_action") return "contracted";

  const execStatus = clean(executionSession?.status, 40).toLowerCase();
  if (execStatus === "blocked") return "blocked";
  if (execStatus === "waiting") return "partial";
  if (execStatus === "active") return "executing";

  if (verifiedCompletion) {
    const downstreamPending = acceptanceCriteria.some(
      item => item?.id === "downstream_outcome" && item?.required !== false && item?.status !== "passed"
    );
    if (downstreamPending) return "outcome_pending";
    const allRequiredPassed = acceptanceCriteria
      .filter(item => item?.required !== false)
      .every(item => ["passed", "observed"].includes(item?.status));
    return allRequiredPassed ? "closed" : "verified";
  }

  if (result?.executionEvidence?.observations?.length) return "observed";
  if (base?.level <= 1 && clean(result?.reply, 20)) return "closed";
  if (clean(result?.reply, 20)) return "partial";
  return "unknown";
}

function deriveUserAcceptance({ previous = null, message = "", pendingAction = null, level = 1, now }) {
  const prior = previous && typeof previous === "object" ? previous : {};
  const text = clean(message, 4000);
  if (pendingAction?.id) {
    return { status: "pending_confirmation", source: "action_contract", at: now };
  }
  if (ACCEPTANCE_PATTERN.test(text)) return { status: "accepted", source: "explicit_user_language", at: now };
  if (REJECTION_PATTERN.test(text)) return { status: "rejected", source: "explicit_user_language", at: now };
  if (prior?.status && prior.status !== "pending_if_required") return prior;
  return {
    status: level >= 2 ? "not_required_unless_material" : "not_required",
    source: null,
    at: null
  };
}

function detectCorrection({ message = "", prior = null, interpretation = null, turnId = null, now }) {
  const text = clean(message, 6000);
  if (!CORRECTION_PATTERN.test(text) || !prior?.selectedInterpretation) return null;
  const replacement = clean(interpretation?.text, 1200) || text;
  return {
    id: `correction_${stableId(`${prior.id}|${turnId || ""}|${text}`)}`,
    supersededClaim: clean(prior.selectedInterpretation, 1200),
    correctedClaim: replacement,
    reason: "explicit_user_correction",
    sourceTurnId: clean(turnId, 180) || null,
    at: now
  };
}

function updateClaims({
  claims = [],
  interpretation,
  correction = null,
  evidence = [],
  result = {},
  executionSession = null,
  loopId,
  turnId,
  now
} = {}) {
  const list = (Array.isArray(claims) ? claims : []).map(item => ({ ...item }));
  const invalidations = [];
  const current = [...list].reverse().find(item => item?.kind === "selected_interpretation" && item?.status === "active");
  const nextText = clean(interpretation?.text, 1200);

  if (correction && current) {
    const replacementId = `claim_${stableId(`${loopId}|intent|${nextText}|${turnId || ""}`)}`;
    current.status = "superseded";
    current.supersededBy = replacementId;
    current.updatedAt = now;

    for (const claim of list) {
      if (!Array.isArray(claim?.derivedFrom) || !claim.derivedFrom.includes(current.id)) continue;
      if (claim.status === "superseded" || claim.status === "invalidated") continue;
      claim.status = "invalidated";
      claim.updatedAt = now;
      invalidations.push({
        id: `invalidation_${stableId(`${current.id}|${claim.id}|${turnId || ""}`)}`,
        invalidatedClaimId: claim.id,
        becauseClaimId: current.id,
        sourceCorrectionId: correction.id,
        at: now
      });
    }

    list.push({
      id: replacementId,
      claim: nextText,
      kind: "selected_interpretation",
      status: "active",
      confidence: 0.9,
      evidenceIds: evidence.filter(item => item.verified).map(item => item.id).slice(-6),
      derivedFrom: [],
      supersededBy: null,
      sourceTurnId: clean(turnId, 180) || null,
      createdAt: now,
      updatedAt: now
    });
  } else if (!current && nextText) {
    list.push({
      id: `claim_${stableId(`${loopId}|intent|${nextText}`)}`,
      claim: nextText,
      kind: "selected_interpretation",
      status: "active",
      confidence: 0.7,
      evidenceIds: [],
      derivedFrom: [],
      supersededBy: null,
      sourceTurnId: clean(turnId, 180) || null,
      createdAt: now,
      updatedAt: now
    });
  }

  const activeInterpretation = [...list]
    .reverse()
    .find(item => item?.kind === "selected_interpretation" && item?.status === "active");
  const action = clean(
    result?.requestUnderstanding?.applicationAction ||
    result?.action?.applicationAction,
    180
  );
  let actionClaim = null;
  if (action && activeInterpretation?.id) {
    const actionClaimId = `claim_${stableId(`${loopId}|action|${action}|${turnId || ""}`)}`;
    actionClaim = list.find(item => item?.id === actionClaimId) || {
      id: actionClaimId,
      claim: `Selected application action: ${action}`,
      kind: "action_selection",
      status: result?.executorReceipt?.verified === true
        ? "verified"
        : result?.pendingAction?.id
          ? "proposed"
          : "observed",
      confidence: Number(result?.requestUnderstanding?.verifierConfidence || 0.8),
      evidenceIds: evidence.filter(item => item?.verified === true).map(item => item.id).slice(-6),
      derivedFrom: [activeInterpretation.id],
      supersededBy: null,
      sourceTurnId: clean(turnId, 180) || null,
      createdAt: now,
      updatedAt: now
    };
    if (!list.some(item => item?.id === actionClaimId)) list.push(actionClaim);
  }

  const verifiedOutcome = hasVerifiedCompletionEvidence({ result, executionSession, evidence });
  if (verifiedOutcome && activeInterpretation?.id) {
    const outcomeClaimId = `claim_${stableId(`${loopId}|verified_outcome|${turnId || ""}`)}`;
    if (!list.some(item => item?.id === outcomeClaimId)) {
      list.push({
        id: outcomeClaimId,
        claim: clean(
          executionSession?.goal
            ? `Verified outcome for: ${executionSession.goal}`
            : "The material outcome was verified against observable evidence.",
          1200
        ),
        kind: "observed_outcome",
        status: "verified",
        confidence: 1,
        evidenceIds: evidence.filter(item => item?.verified === true).map(item => item.id).slice(-8),
        derivedFrom: [
          activeInterpretation.id,
          ...(actionClaim?.id ? [actionClaim.id] : [])
        ],
        supersededBy: null,
        sourceTurnId: clean(turnId, 180) || null,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return {
    claims: list.slice(-20),
    invalidations
  };
}


function deriveClosureLearning({
  base = {},
  turn = {},
  result = {},
  executionSession = null,
  correction = null,
  outcomeDelta = null,
  claimsResult = null,
  now
} = {}) {
  const lessons = [];
  const beliefUpdates = [];
  const strategyUpdates = [];
  const turnId = clean(turn?.turnId, 180);

  if (correction) {
    beliefUpdates.push({
      id: `belief_update_${stableId(`${base.id}|correction|${correction.id}`)}`,
      target: "selected_interpretation",
      operation: "supersede",
      from: clean(correction.supersededClaim, 900),
      to: clean(correction.correctedClaim, 900),
      evidence: "explicit_user_correction",
      at: now
    });
    lessons.push({
      id: `lesson_${stableId(`${base.id}|correction|${correction.id}`)}`,
      kind: "semantic_correction",
      summary: "The prior working interpretation was superseded by an explicit user correction; downstream claims depending on it must be reconsidered.",
      sourceTurnId: turnId || null,
      at: now
    });
  }

  const failedAttempts = Array.isArray(executionSession?.failedAttempts)
    ? executionSession.failedAttempts
    : [];
  const latestFailure = failedAttempts[failedAttempts.length - 1] || null;
  if (latestFailure) {
    lessons.push({
      id: `lesson_${stableId(`${base.id}|failure|${latestFailure.id || latestFailure.summary}`)}`,
      kind: "execution_failure",
      summary: clean(latestFailure.lesson || latestFailure.summary, 700),
      sourceAttemptId: clean(latestFailure.id, 180) || null,
      at: now
    });
    strategyUpdates.push({
      id: `strategy_update_${stableId(`${base.id}|failure|${latestFailure.id || latestFailure.summary}`)}`,
      operation: "avoid_unchanged_retry",
      summary: "Use the failed attempt as evidence and change the method before retrying the same unresolved step.",
      sourceAttemptId: clean(latestFailure.id, 180) || null,
      at: now
    });
  }

  if (result?.executionWorkspaceUpdate?.approachChanged === true) {
    strategyUpdates.push({
      id: `strategy_update_${stableId(`${base.id}|approach|${turnId}`)}`,
      operation: "approach_changed",
      summary: clean(
        result?.executionWorkspaceUpdate?.approach ||
        result?.executionWorkspaceUpdate?.nextStep ||
        "The execution approach changed in response to observed evidence.",
        700
      ),
      sourceTurnId: turnId || null,
      at: now
    });
  }

  const realWorldOutcome = turn?.context?.decisionOutcomeLearning || null;
  if (realWorldOutcome?.resolved === true) {
    beliefUpdates.push({
      id: `belief_update_${stableId(`${base.id}|real_world_outcome|${realWorldOutcome.decisionId || turnId}`)}`,
      target: clean(realWorldOutcome.proposition, 700) || "prior_decision",
      operation: "update_from_outcome",
      outcomeDirection: clean(realWorldOutcome.outcomeDirection, 80) || null,
      source: clean(realWorldOutcome.source, 120) || "explicit_user_real_world_report",
      at: now
    });
    lessons.push({
      id: `lesson_${stableId(`${base.id}|real_world_outcome|${realWorldOutcome.decisionId || turnId}`)}`,
      kind: "real_world_outcome",
      summary: "A previously recorded decision received real-world outcome evidence and is eligible to update future reasoning.",
      sourceDecisionId: clean(realWorldOutcome.decisionId, 180) || null,
      at: now
    });
  }

  if (outcomeDelta?.status === "matched") {
    lessons.push({
      id: `lesson_${stableId(`${base.id}|verified_match|${turnId}`)}`,
      kind: "verified_success",
      summary: "The observed verified outcome matched the current acceptance contract.",
      sourceTurnId: turnId || null,
      at: now
    });
  } else if (outcomeDelta?.status === "mismatch") {
    strategyUpdates.push({
      id: `strategy_update_${stableId(`${base.id}|outcome_mismatch|${turnId}`)}`,
      operation: "reconsider_strategy",
      summary: "The observed result did not match the expected outcome; dependent assumptions and the current strategy should be reconsidered.",
      sourceTurnId: turnId || null,
      at: now
    });
  }

  if (Array.isArray(claimsResult?.invalidations) && claimsResult.invalidations.length) {
    lessons.push({
      id: `lesson_${stableId(`${base.id}|dependency_invalidation|${turnId}`)}`,
      kind: "dependency_invalidation",
      summary: `${claimsResult.invalidations.length} dependent claim(s) were invalidated because an upstream interpretation was superseded.`,
      sourceTurnId: turnId || null,
      at: now
    });
  }

  return { lessons, beliefUpdates, strategyUpdates };
}

function deriveObservedOutcome({ result = {}, executionSession = null, verifiedCompletion = false, evidence = [] } = {}) {
  const verifiedEvidence = evidence.filter(item => item?.verified === true);
  let summary = null;
  if (executionSession?.status === "completed") {
    summary = "Execution session completed with recorded evidence.";
  } else if (result?.executorReceipt?.verified === true) {
    summary = "Trusted executor verified the requested application action.";
  } else if (clean(result?.reply, 80)) {
    summary = verifiedCompletion
      ? "A verified result was produced."
      : "A response was delivered, but real execution or downstream outcome may remain unverified.";
  }

  return {
    summary,
    verified: verifiedCompletion,
    evidenceRefs: verifiedEvidence.map(item => item.id).slice(-10)
  };
}

function deriveOutcomeDelta({ expectedOutcome = null, observedOutcome = null, state = "unknown" } = {}) {
  if (state === "failed" || state === "rejected") {
    return {
      status: "mismatch",
      summary: "The observed result did not satisfy the expected outcome."
    };
  }
  if (state === "closed" && observedOutcome?.verified === true) {
    return {
      status: "matched",
      summary: "The verified observed result satisfied the current closure contract."
    };
  }
  if (state === "verified") {
    return {
      status: "partial",
      summary: "Verification exists, but at least one acceptance criterion or downstream outcome remains open."
    };
  }
  return {
    status: "pending",
    summary: expectedOutcome?.summary ? "Expected outcome is recorded; closure is still awaiting sufficient evidence." : null
  };
}

function deriveUnverifiedClaims({ result = {}, verifiedCompletion = false, evidence = [] } = {}) {
  const claims = [];
  const reply = clean(result?.reply, 3000);
  if (!verifiedCompletion && COMPLETION_PATTERN.test(reply)) {
    claims.push({
      id: `unverified_${stableId(reply)}`,
      claim: "Reply language may imply completion without independent completion evidence.",
      source: "assistant_reply",
      evidenceRefs: evidence.filter(item => item.verified).map(item => item.id).slice(-6)
    });
  }
  for (const item of evidence.filter(item => item?.verified !== true).slice(-6)) {
    claims.push({
      id: `unverified_${stableId(item.id || item.summary)}`,
      claim: clean(item.summary, 700),
      source: item.source || item.kind || "evidence",
      evidenceRefs: item?.id ? [item.id] : []
    });
  }
  return dedupe(claims, item => item.id).slice(0, 8);
}

function hasVerifiedCompletionEvidence({ result = {}, executionSession = null, evidence = [] } = {}) {
  if (result?.executionEvidence?.completionVerified === true) return true;
  if (result?.executorReceipt?.verified === true && Boolean(result?.executorReceipt?.id)) return true;
  if (executionSession?.status === "completed") {
    return evidence.some(item => item?.verified === true);
  }
  const verification = result?.executionEvidence?.verification || result?.verification || null;
  return normalizeVerificationStatus(verification?.status) === "passed";
}

function terminalStateFor(state = "unknown") {
  if (["closed", "verified"].includes(state)) return "verified";
  if (state === "outcome_pending") return "open";
  if (state === "failed") return "failed";
  if (state === "rejected") return "rejected";
  if (state === "superseded") return "superseded";
  if (state === "blocked") return "blocked";
  if (state === "partial") return "partial";
  return "open";
}

function normalizeCommunicationClosure(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 180);
  if (!id) return null;
  const state = COMMUNICATION_CLOSURE_STATES.includes(clean(value?.state, 40).toLowerCase())
    ? clean(value?.state, 40).toLowerCase()
    : "unknown";
  return {
    version: ARI_COMMUNICATION_CLOSURE_VERSION,
    id,
    level: clampInt(value?.level, 1, 3),
    state,
    terminalState: clean(value?.terminalState, 40) || terminalStateFor(state),
    userRequest: clean(value?.userRequest, 6000),
    selectedInterpretation: clean(value?.selectedInterpretation, 1200),
    interpretationSource: clean(value?.interpretationSource, 120) || null,
    acceptanceCriteria: arrayObjects(value?.acceptanceCriteria, 8).map(item => ({
      id: clean(item?.id, 120),
      label: clean(item?.label, 700),
      required: item?.required !== false,
      status: clean(item?.status, 40) || "pending",
      evidenceRefs: arrayText(item?.evidenceRefs, 8, 180)
    })).filter(item => item.id && item.label),
    componentOwners: value?.componentOwners && typeof value.componentOwners === "object" ? { ...value.componentOwners } : {},
    evidence: arrayObjects(value?.evidence, 24),
    unverifiedClaims: arrayObjects(value?.unverifiedClaims, 8),
    corrections: arrayObjects(value?.corrections, 12),
    supersedes: clean(value?.supersedes, 180) || null,
    userAcceptance: value?.userAcceptance && typeof value.userAcceptance === "object"
      ? { ...value.userAcceptance }
      : { status: "unknown", source: null, at: null },
    expectedOutcome: value?.expectedOutcome && typeof value.expectedOutcome === "object" ? { ...value.expectedOutcome } : null,
    observedOutcome: value?.observedOutcome && typeof value.observedOutcome === "object" ? { ...value.observedOutcome } : null,
    outcomeDelta: value?.outcomeDelta && typeof value.outcomeDelta === "object" ? { ...value.outcomeDelta } : null,
    lessons: arrayObjects(value?.lessons, 8),
    beliefUpdates: arrayObjects(value?.beliefUpdates, 8),
    strategyUpdates: arrayObjects(value?.strategyUpdates, 8),
    dependencyInvalidations: arrayObjects(value?.dependencyInvalidations, 16),
    claims: arrayObjects(value?.claims, 20),
    conversationId: clean(value?.conversationId, 180) || null,
    rootTurnId: clean(value?.rootTurnId, 180) || null,
    lastTurnId: clean(value?.lastTurnId, 180) || null,
    createdAt: validIso(value?.createdAt),
    updatedAt: validIso(value?.updatedAt),
    closedAt: validIso(value?.closedAt),
    hiddenChainOfThoughtStored: false
  };
}

function compactClosure(value = null) {
  const state = normalizeCommunicationClosure(value);
  if (!state) return null;
  return {
    ...state,
    userRequest: clean(state.userRequest, 1800),
    selectedInterpretation: clean(state.selectedInterpretation, 900),
    evidence: state.evidence.slice(-10),
    unverifiedClaims: state.unverifiedClaims.slice(-6),
    corrections: state.corrections.slice(-6),
    dependencyInvalidations: state.dependencyInvalidations.slice(-8),
    claims: state.claims.slice(-10)
  };
}

function likelyContinuation(message = "", prior = null) {
  if (!prior?.id) return false;
  const text = clean(message, 4000).toLowerCase();
  if (!text) return true;
  if (/\b(?:continue|resume|keep going|finish|do it|make it happen|what'?s left|where were we|still working|go ahead|yes|no|correct|exactly)\b/i.test(text)) return true;
  if (CORRECTION_PATTERN.test(text)) return true;

  const priorTerms = new Set(tokens(prior.selectedInterpretation || prior.userRequest));
  const messageTerms = tokens(text);
  if (!priorTerms.size || !messageTerms.length) return false;
  let overlap = 0;
  for (const term of messageTerms) if (priorTerms.has(term)) overlap += 1;
  return overlap >= Math.min(3, Math.max(1, Math.ceil(priorTerms.size * 0.2)));
}

function normalizeVerificationStatus(value = "") {
  const status = clean(value, 40).toLowerCase();
  if (["pass", "passed", "success", "verified"].includes(status)) return "passed";
  if (["fail", "failed", "error", "regression"].includes(status)) return "failed";
  if (["attempted", "running", "pending"].includes(status)) return "attempted";
  return "";
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

function arrayText(values = [], limit = 8, max = 180) {
  return (Array.isArray(values) ? values : [])
    .map(item => clean(item, max))
    .filter(Boolean)
    .slice(0, limit);
}

function tokens(value = "") {
  return [...new Set(
    clean(value, 1400)
      .toLowerCase()
      .match(/[a-z0-9]{4,}/g) || []
  )].filter(term => !["this", "that", "with", "from", "have", "make", "current", "task", "please"].includes(term));
}

function stableId(value = "") {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 24);
}

function validIso(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
