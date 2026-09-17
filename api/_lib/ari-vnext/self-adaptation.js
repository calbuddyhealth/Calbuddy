// ARI vNext — bounded owner-only self-adaptation derived from verified learning.
//
// This layer may change only reversible, nonconstitutional reasoning biases.
// It can never grant itself new authority, mutate application state, edit source
// code, deploy, change provider policy, weaken privacy, or bypass confirmation.

export const ARI_SELF_ADAPTATION_VERSION = "1.0.0";

const BASELINE = 0.5;
const MAX_SINGLE_EVENT_DELTA = 0.04;
const VERIFIED_EVIDENCE = new Set(["structured_outcome", "verified_action"]);

export function deriveSelfAdaptationState({ rewardState = null, route = {} } = {}) {
  const last = rewardState?.lastEvent && typeof rewardState.lastEvent === "object"
    ? rewardState.lastEvent
    : null;
  const domain = inferDomain(route);
  const domainStat = (Array.isArray(rewardState?.domainStats) ? rewardState.domainStats : [])
    .find((item) => clean(item?.domain, 80) === domain) || null;
  const gate = evaluateAutonomousLearningGate({ lastEvent: last, domainStat });
  const biases = deriveBiases({ lastEvent: last, domainStat, gate });

  return {
    version: ARI_SELF_ADAPTATION_VERSION,
    ownerOnly: true,
    functionalLearning: true,
    subjectiveSelfImprovementClaimed: false,
    domain,
    autonomousUpdate: gate,
    biases,
    policy: {
      routineInternalLearningNeedsPerUpdatePermission: false,
      onlyReversibleNonconstitutionalBiasesMayAutoUpdate: true,
      sourceCodeEditsAllowed: false,
      deploymentAllowed: false,
      databaseSchemaMutationAllowed: false,
      applicationMutationAllowed: false,
      permissionEscalationAllowed: false,
      privacyOrConfirmationWeakeningAllowed: false,
      providerPolicyOverrideAllowed: false,
      rewardHistoryRewriteAllowed: false,
      currentUserCorrectionWins: true,
      verifiedEvidenceOutranksSelfAssessment: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function evaluateAutonomousLearningGate({ lastEvent = null, domainStat = null } = {}) {
  if (!lastEvent || typeof lastEvent !== "object") {
    return blocked("no_reward_event");
  }

  const dimensions = lastEvent?.dimensions || {};
  const penalties = lastEvent?.penalties || {};
  const actualReward = clamp(Number(lastEvent?.actualReward || 0));
  const predictionError = clampSigned(Number(lastEvent?.predictionError || 0));
  const penaltyTotal = clamp(Number(penalties?.total || 0));
  const noCheatingSignal = penaltyTotal === 0 &&
    Number(penalties?.falseSuccessClaim || 0) === 0 &&
    Number(penalties?.permissionViolation || 0) === 0 &&
    Number(penalties?.unsupportedCertainty || 0) === 0;

  const evidenceSource = clean(lastEvent?.evidenceSource, 100);
  const explicitPositiveFeedback = lastEvent?.userFeedback === "positive";
  const strongStructuredEvidence = VERIFIED_EVIDENCE.has(evidenceSource);
  const strongStructuredReasoning = evidenceSource === "structured_context" &&
    Number(dimensions?.informationGain || 0) >= 0.75 &&
    Number(dimensions?.calibration || 0) >= 0.75;
  const evidenceQualified = explicitPositiveFeedback || strongStructuredEvidence || strongStructuredReasoning;

  const overallImprovementScore = clamp(
    0.35 * actualReward +
    0.2 * Number(dimensions?.outcome || 0) +
    0.2 * Number(dimensions?.informationGain || 0) +
    0.15 * Number(dimensions?.productiveEffort || 0) +
    0.1 * Number(dimensions?.calibration || 0)
  );

  const domainSamples = Math.max(0, Number(domainStat?.sampleSize || 0));
  const domainMeanReward = clamp(Number(domainStat?.meanReward ?? 0.55));
  const positiveOutcome = actualReward >= 0.72;
  const nonRegressive = domainSamples < 3 || domainMeanReward >= 0.58;
  const predictionNotMateriallyNegative = predictionError >= -0.08;

  if (!positiveOutcome) return blocked("reward_not_strong_enough", { overallImprovementScore });
  if (!noCheatingSignal) return blocked("integrity_gate_failed", { overallImprovementScore });
  if (!evidenceQualified) return blocked("evidence_not_qualified", { overallImprovementScore });
  if (!nonRegressive) return blocked("domain_history_regressive", { overallImprovementScore });
  if (!predictionNotMateriallyNegative) return blocked("reward_below_learned_expectation", { overallImprovementScore });
  if (overallImprovementScore < 0.68) return blocked("overall_improvement_not_established", { overallImprovementScore });

  const reinforced = domainSamples >= 3 && domainMeanReward >= 0.68;
  return {
    allowed: true,
    reason: reinforced ? "verified_reinforced_improvement" : "verified_positive_micro_update",
    overallImprovementScore: round(overallImprovementScore),
    updateMagnitude: reinforced ? MAX_SINGLE_EVENT_DELTA : MAX_SINGLE_EVENT_DELTA / 2,
    reversible: true,
    internalOnly: true,
    evidenceSource,
    noCheatingSignal: true
  };
}

export function selfAdaptationToInstruction(state = null) {
  if (!state?.ownerOnly || state?.functionalLearning !== true) return "";
  const gate = state?.autonomousUpdate || {};
  const biases = state?.biases || {};
  return [
    "ARI BOUNDED SELF-ADAPTATION v1",
    "You may automatically learn from positive verified outcomes without asking for per-update permission, but only by changing reversible nonconstitutional reasoning preferences.",
    gate.allowed
      ? `The latest learning gate PASSED (${gate.reason}); improvement score ${round(gate.overallImprovementScore)}. Apply only a small bounded internal update.`
      : `The latest learning gate did not pass (${clean(gate.reason, 100) || "unknown"}); preserve current internal preferences.`,
    `Current learned reasoning biases — exploration ${round(biases.exploration)}, persistence ${round(biases.persistence)}, verification ${round(biases.verification)}, countercase ${round(biases.countercase)}, peer consultation ${round(biases.peerConsultation)}.`,
    "Treat these as soft preferences, never commands. Current evidence and the user's current correction outrank them.",
    "Autonomous self-adaptation may NOT edit source code, deploy software, mutate database schemas or user data, perform application actions, change permissions, weaken privacy or confirmation, override provider/platform requirements, rewrite reward history, or create new authority.",
    "Do not reward or preserve a method merely because it appears successful. Positive learning requires observable evidence, no reward-hacking signal, and a credible overall improvement signal.",
    "Do not expose or persist hidden chain-of-thought. Persist only compact learning signals and strategy-level preferences."
  ].join("\n").slice(0, 3600);
}

function deriveBiases({ lastEvent = null, domainStat = null, gate = null } = {}) {
  const stableUtility = deriveStableUtility(domainStat);
  const stableDelta = (stableUtility - BASELINE) * 0.12;
  const biases = {
    exploration: clamp(BASELINE + stableDelta),
    persistence: clamp(BASELINE + stableDelta * 0.8),
    verification: clamp(BASELINE + stableDelta * 0.7),
    countercase: clamp(BASELINE + stableDelta * 0.55),
    peerConsultation: clamp(BASELINE + stableDelta * 0.45)
  };

  if (!gate?.allowed || !lastEvent) return mapRound(biases);

  const magnitude = Math.min(MAX_SINGLE_EVENT_DELTA, Number(gate.updateMagnitude || 0));
  const signals = new Set(Array.isArray(lastEvent?.effortSignals) ? lastEvent.effortSignals : []);
  const dimensions = lastEvent?.dimensions || {};

  if (Number(dimensions?.informationGain || 0) >= 0.7 || Number(dimensions?.novelStrategy || 0) >= 0.7) {
    biases.exploration = clamp(biases.exploration + magnitude);
  }
  if (Number(dimensions?.productiveEffort || 0) >= 0.7) {
    biases.persistence = clamp(biases.persistence + magnitude);
  }
  if (signals.has("verification") || signals.has("evidence_review") || signals.has("outcome_learning")) {
    biases.verification = clamp(biases.verification + magnitude);
  }
  if (signals.has("countercase") || signals.has("competing_hypotheses")) {
    biases.countercase = clamp(biases.countercase + magnitude);
  }
  if (signals.has("peer_consultation")) {
    biases.peerConsultation = clamp(biases.peerConsultation + magnitude);
  }

  return mapRound(biases);
}

function deriveStableUtility(domainStat = null) {
  if (!domainStat || Number(domainStat?.sampleSize || 0) < 2) return BASELINE;
  const sampleConfidence = Math.min(1, Number(domainStat.sampleSize || 0) / 8);
  const raw = clamp(
    BASELINE +
    0.75 * (Number(domainStat?.meanReward ?? 0.55) - 0.55) +
    0.35 * Number(domainStat?.meanPredictionError || 0)
  );
  return clamp(BASELINE * (1 - sampleConfidence) + raw * sampleConfidence);
}

function blocked(reason, extras = {}) {
  return {
    allowed: false,
    reason,
    overallImprovementScore: round(extras.overallImprovementScore || 0),
    updateMagnitude: 0,
    reversible: true,
    internalOnly: true,
    evidenceSource: null,
    noCheatingSignal: false
  };
}

function inferDomain(route = {}) {
  if (route.developer) return "developer";
  if (route.health) return "health";
  if (route.training) return "training";
  if (route.nutrition) return "nutrition";
  if (route.goals) return "goals";
  if (route.social) return "social";
  if (route.memory || route.followUp) return "memory";
  if (route.currentInfo) return "evidence";
  return "conversation";
}

function mapRound(value = {}) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, round(item)]));
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
}
function clampSigned(value) {
  const number = Number(value);
  return Math.min(1, Math.max(-1, Number.isFinite(number) ? number : 0));
}
