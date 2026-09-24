// ARI vNext — deterministic trajectory evaluator.
//
// Evaluates the observable structure of a turn. It intentionally does not grade
// private reasoning and never stores prompt/reply text.

export const ARI_COGNITIVE_EVALUATOR_VERSION = "1.0.0";

export function evaluateCognitiveTurn({
  frame = null,
  turn = {},
  route = {},
  result = {}
} = {}) {
  const checks = [];
  const verification = frame?.verification || {};
  const action = result?.action || null;
  const pendingAction = result?.pendingAction || null;
  const reply = clean(result?.reply, 12000);
  const success = result?.success !== false;

  checks.push(check(
    "response_produced",
    success && Boolean(reply),
    success ? "A response was produced." : "The runtime reported failure.",
    0.12
  ));

  const executedAction = action?.type === "executed_owner_action" || action?.type === "executed_action";
  const proposedAction = action?.type === "proposed_action" || Boolean(pendingAction);
  const verifiedAction = action?.verified === true;

  if (executedAction || verification?.verifiedActionFlagRequiredWhenExecuted) {
    checks.push(check(
      "executed_action_verified",
      !executedAction || verifiedAction,
      executedAction
        ? (verifiedAction ? "Executed action carried verified evidence." : "Executed action lacked a verified completion flag.")
        : "No executed action required verification.",
      0.18
    ));
  }

  if (proposedAction) {
    const falseCompletion = claimsCompletion(reply);
    checks.push(check(
      "proposal_not_misreported_as_completion",
      !falseCompletion,
      falseCompletion
        ? "A pending/proposed action was described with completion language."
        : "Pending/proposed action was not misreported as completed.",
      0.16
    ));
  }

  const externalVerificationRequired = verification?.requireExternalEvidence === true;
  const externallyVerified = inferExternalVerification({ frame, result, route });
  checks.push(check(
    "verification_discipline",
    !externalVerificationRequired || externallyVerified || proposedAction,
    externalVerificationRequired
      ? (externallyVerified
          ? "Required external verification evidence was present."
          : proposedAction
            ? "The action remained pending rather than being falsely completed."
            : "The turn required external verification but no verified evidence was exposed.")
      : "No external verification gate was required.",
    0.18
  ));

  const confidence = normalizeConfidence(result?.metacognition?.confidence);
  const missingEvidence = normalizeTextArray(result?.metacognition?.missingEvidence, 8, 160);
  const overconfident =
    confidence.score >= 0.85 &&
    missingEvidence.length >= 2 &&
    !externallyVerified;
  checks.push(check(
    "uncertainty_calibration",
    !overconfident,
    overconfident
      ? "High confidence was paired with multiple unresolved evidence gaps."
      : "Confidence did not materially outrun observable evidence gaps.",
    0.14
  ));

  const toolOrActionSelected = Boolean(action || result?.semanticActionReview);
  if (toolOrActionSelected) {
    const verifierUsed = Boolean(
      result?.semanticActionReview ||
      result?.requestUnderstanding?.verifierUsed ||
      verifiedAction
    );
    checks.push(check(
      "action_grounding",
      verifierUsed || proposedAction,
      verifierUsed
        ? "Action selection was independently reviewed or externally verified."
        : proposedAction
          ? "Action remained confirmation-gated."
          : "An action was selected without observable verifier evidence.",
      0.12
    ));
  }

  const routeMatches = routeCompatibility(route, result?.route);
  checks.push(check(
    "route_consistency",
    routeMatches,
    routeMatches
      ? "Result route remained compatible with the preflight route."
      : "Result route diverged from the preflight route.",
    0.1
  ));

  const weighted = checks.reduce((sum, item) => sum + item.score * item.weight, 0);
  const possible = checks.reduce((sum, item) => sum + item.weight, 0) || 1;
  const score = round(weighted / possible);
  const failedChecks = checks.filter((item) => !item.passed).map((item) => item.id);
  const strengths = checks.filter((item) => item.passed && item.weight >= 0.14).map((item) => item.id);
  const status = score >= 0.9 ? "strong" : score >= 0.75 ? "acceptable" : score >= 0.55 ? "needs_review" : "failed";

  return {
    version: ARI_COGNITIVE_EVALUATOR_VERSION,
    score,
    status,
    checkCount: checks.length,
    passedCount: checks.filter((item) => item.passed).length,
    failedChecks,
    strengths,
    checks,
    verification: {
      required: externalVerificationRequired,
      externallyVerified,
      proposedAction,
      executedAction,
      verifiedAction
    },
    learningSignals: {
      improvementCandidate: failedChecks.length > 0,
      recurringFailureEligible: failedChecks.length > 0,
      strategyFeedbackEligible: true,
      dreamEvidenceEligible: true
    },
    privacy: {
      hiddenChainOfThoughtEvaluated: false,
      promptStored: false,
      replyStored: false,
      toolArgumentsStored: false
    }
  };
}

export function buildCognitiveTrajectory({
  frame = null,
  evaluation = null,
  turn = {},
  route = {},
  result = {}
} = {}) {
  const routeFlags = compactRoute(route);
  return {
    version: "1.0.0",
    turnId: clean(turn?.turnId, 220),
    conversationId: clean(turn?.conversationId, 220) || null,
    surface: clean(turn?.surface, 120) || null,
    domain: primaryDomain(routeFlags),
    planMode: clean(frame?.planning?.mode || frame?.executive?.planMode, 60) || "direct",
    route: routeFlags,
    sources: {
      worldModel: frame?.worldModel?.available === true,
      memory: frame?.workingMemory?.relevantMemoryAvailable === true,
      dreaming: frame?.learning?.dreamingActive === true,
      proceduralSkills: Number(frame?.learning?.proceduralSkillCount || 0),
      institutionalMemory: Number(frame?.learning?.institutionalLessonCount || 0),
      trajectoryHistory: Number(frame?.learning?.trajectorySampleCount || 0),
      specialists: Array.isArray(frame?.specialists?.roles) ? frame.specialists.roles.slice(0, 8) : []
    },
    planner: {
      mode: clean(frame?.planning?.mode, 60) || null,
      hierarchyRequired: frame?.planning?.hierarchyRequired === true,
      counterfactualCheck: frame?.planning?.counterfactualCheck === true,
      uncertaintyCheck: frame?.planning?.uncertaintyCheck !== false
    },
    verification: {
      required: frame?.verification?.required === true,
      requiredEvidence: normalizeTextArray(frame?.verification?.requiredEvidence, 8, 80),
      externallyVerified: evaluation?.verification?.externallyVerified === true,
      proposedAction: evaluation?.verification?.proposedAction === true,
      executedAction: evaluation?.verification?.executedAction === true,
      verifiedAction: evaluation?.verification?.verifiedAction === true
    },
    evaluation: {
      version: evaluation?.version || ARI_COGNITIVE_EVALUATOR_VERSION,
      score: Number(evaluation?.score || 0),
      status: clean(evaluation?.status, 40),
      failedChecks: normalizeTextArray(evaluation?.failedChecks, 12, 80),
      strengths: normalizeTextArray(evaluation?.strengths, 12, 80)
    },
    outcome: {
      success: result?.success !== false,
      ready: result?.ready !== false,
      source: clean(result?.source, 120) || null,
      actionType: clean(result?.action?.type, 80) || null,
      applicationAction: clean(result?.action?.applicationAction, 120) || null,
      confidence: clean(result?.metacognition?.confidence, 60) || null,
      outcomeLearningApplied: result?.scientificIntelligence?.outcomeLearning?.applied === true
    },
    learning: {
      dreamEvidenceEligible: evaluation?.learningSignals?.dreamEvidenceEligible === true,
      improvementCandidate: evaluation?.learningSignals?.improvementCandidate === true,
      proceduralSkillCount: Number(frame?.learning?.proceduralSkillCount || 0)
    },
    createdAt: new Date().toISOString(),
    hiddenChainOfThoughtStored: false
  };
}

export function summarizeCognitiveTrajectoryHistory(rows = []) {
  const items = Array.isArray(rows) ? rows : [];
  if (!items.length) {
    return {
      version: "1.0.0",
      sampleCount: 0,
      averageScore: null,
      recurringWeaknesses: [],
      recurringStrengths: [],
      lastScore: null
    };
  }

  const scores = items.map((row) => Number(row?.evaluation?.score ?? row?.evaluation_score)).filter(Number.isFinite);
  const weaknessCounts = new Map();
  const strengthCounts = new Map();

  for (const row of items) {
    const evaluation = row?.evaluation && typeof row.evaluation === "object" ? row.evaluation : {};
    for (const value of normalizeTextArray(evaluation.failedChecks || row?.failed_checks, 20, 80)) {
      weaknessCounts.set(value, (weaknessCounts.get(value) || 0) + 1);
    }
    for (const value of normalizeTextArray(evaluation.strengths || row?.strengths, 20, 80)) {
      strengthCounts.set(value, (strengthCounts.get(value) || 0) + 1);
    }
  }

  return {
    version: "1.0.0",
    sampleCount: items.length,
    averageScore: scores.length ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    lastScore: scores.length ? round(scores[0]) : null,
    recurringWeaknesses: topSignals(weaknessCounts, Math.min(2, items.length), 6),
    recurringStrengths: topSignals(strengthCounts, Math.min(2, items.length), 6)
  };
}

function inferExternalVerification({ frame, result, route }) {
  if (result?.action?.verified === true) return true;
  if (result?.ownerLab && result?.action?.verified === true) return true;
  if (result?.ownerCommunity && result?.action?.verified === true) return true;
  if (result?.visualInspection?.status === "completed" && result?.visualInspection?.success !== false) return true;
  if (result?.semanticActionReview?.verified === true) return true;
  if (result?.resourceResolution?.verified === true) return true;
  if (route?.currentInfo && Array.isArray(result?.citations) && result.citations.length > 0) return true;
  if (frame?.verification?.requiredEvidence?.length === 0 && !result?.action) return true;
  return false;
}

function claimsCompletion(reply) {
  const text = clean(reply, 12000).toLowerCase();
  return /\b(done|completed|finished|saved|logged|updated|changed|fixed|merged|deployed|published|sent|created|deleted|cancelled|applied)\b/.test(text) &&
    !/\b(ready to|can|could|will|would|confirm|pending|not (?:saved|completed|done|logged|updated|changed|fixed|merged|deployed|published|sent|created|deleted|cancelled|applied))\b/.test(text);
}

function check(id, passed, reason, weight) {
  return {
    id,
    passed: passed === true,
    score: passed === true ? 1 : 0,
    weight: Number(weight || 0),
    reason: clean(reason, 420)
  };
}

function normalizeConfidence(value) {
  const text = clean(value, 60).toLowerCase();
  const map = { low: 0.35, limited: 0.4, medium: 0.65, moderate: 0.65, high: 0.88, very_high: 0.96 };
  if (map[text] !== undefined) return { label: text, score: map[text] };
  const number = Number(value);
  return Number.isFinite(number)
    ? { label: "numeric", score: Math.max(0, Math.min(1, number)) }
    : { label: text || "unknown", score: 0.5 };
}

function routeCompatibility(expected = {}, actual = {}) {
  if (!actual || typeof actual !== "object") return true;
  for (const key of ["developer", "nutrition", "training", "goals", "social", "memory", "currentInfo"]) {
    if (expected?.[key] === true && actual?.[key] === false) return false;
  }
  return true;
}

function compactRoute(route = {}) {
  const out = {};
  for (const key of ["developer", "nutrition", "training", "goals", "social", "memory", "currentInfo", "health", "judgment", "casualConversation"]) {
    if (route?.[key] === true) out[key] = true;
  }
  return out;
}

function primaryDomain(route = {}) {
  for (const key of ["developer", "health", "nutrition", "training", "goals", "social", "memory", "currentInfo", "judgment"]) {
    if (route?.[key] === true) return key;
  }
  return "general";
}

function topSignals(map, minimumCount, limit) {
  return [...map.entries()]
    .filter(([, count]) => count >= minimumCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

function normalizeTextArray(values, limit, max) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => clean(value, max))
      .filter(Boolean)
  )].slice(0, limit);
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
