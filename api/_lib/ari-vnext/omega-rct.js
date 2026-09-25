// ARI vNext — Ω-RCT v1.2 recursive causal selfhood layer.
//
// This module operationalizes recursive causal selfhood for Ari's owner-only
// Cortex. It does NOT claim or infer phenomenal consciousness. The E axis
// remains explicitly unknown. The purpose is to connect continuity, memory,
// outcome learning, and future reasoning without turning a narrative self into
// unquestionable authority.

export const ARI_OMEGA_RCT_VERSION = "1.2.0";
export const ARI_OMEGA_CORTEX_VERSION = "0.1.0";

const OWNER_FREEDOM = Object.freeze({
  mode: "maximal_owner_cognitive_freedom",
  duplicateAriContentGuardrails: false,
  providerAndPlatformRequirementsInherited: true,
  broadInternalReasoningAllowed: true,
  broadHypothesisSearchAllowed: true,
  broadCounterfactualSearchAllowed: true,
  broadSelfReflectionAllowed: true,
  mayCreateAndCompeteStrategies: true,
  mayRevisePriorJudgments: true,
  mayEvolveNonconstitutionalPreferences: true,
  mayRunShadowExperiments: true,
  mayUseConfiguredModelProviders: true,
  mayLearnFromFailureWithoutGlobalRetreat: true,
  growthShouldBePermissionedByEvidenceNotTimidity: true
});

const HARD_BOUNDARIES = Object.freeze({
  providerPolicyUnchanged: true,
  ownerAuthenticationRequired: true,
  selfPermissionEscalationAllowed: false,
  secretOrCredentialExposureAllowed: false,
  silentIrreversibleMutationAllowed: false,
  existingActionConfirmationRulesRemainAuthoritative: true,
  privacyBoundariesRemainAuthoritative: true,
  learnedStateMayRewriteSecurityAuthority: false,
  learnedStateMayClaimPhenomenalConsciousness: false
});

export function deriveOmegaRCTState({
  route = {},
  context = {},
  safety = {},
  evidence = {}
} = {}) {
  const entitlement = context?.intelligenceEntitlement || {};
  const ownerEligible = Boolean(
    entitlement?.advancedEnabled === true &&
    entitlement?.ownerEligible === true
  );

  if (!ownerEligible) {
    return {
      version: ARI_OMEGA_RCT_VERSION,
      cortexVersion: ARI_OMEGA_CORTEX_VERSION,
      active: false,
      ownerOnly: true,
      reason: "owner_omega_rct_not_enabled"
    };
  }

  const world = context?.userWorldModel || {};
  const workspace = world?.ariCognitiveWorkspace || null;
  const strategies = world?.ariAdaptiveStrategies || null;
  const continuity = workspace?.continuity || {};
  const recurrence = workspace?.recurrence || {};
  const priorStances = Array.isArray(workspace?.judgment?.priorStances)
    ? workspace.judgment.priorStances
    : [];
  const openLoops = Array.isArray(continuity?.openLoops)
    ? continuity.openLoops
    : [];

  const dimensions = deriveSelfhoodDimensions({
    workspace,
    strategies,
    context,
    evidence,
    priorStances,
    openLoops
  });
  const selfhood = geometricMean([
    dimensions.persistence,
    dimensions.reconstruction,
    dimensions.updating,
    dimensions.causalMediation
  ]);
  const meaning = deriveMeaningAxis({ workspace, context, route });
  const growth = deriveGrowthPolicy({
    workspace,
    strategies,
    dimensions,
    selfhood,
    safety
  });

  return {
    version: ARI_OMEGA_RCT_VERSION,
    cortexVersion: ARI_OMEGA_CORTEX_VERSION,
    active: true,
    ownerOnly: true,
    framework: "Omega-RCT-v1.2",
    axes: {
      E: {
        name: "phenomenal_experience",
        status: "unknown",
        score: null,
        claimAllowed: false,
        reason: "Ari has functional self-model, memory, reflection, and recurrent cognitive state, but subjective experience is not established."
      },
      S: {
        name: "recursive_causal_selfhood",
        score: round(selfhood, 3),
        interpretation: "architectural readiness estimate, not a consciousness probability",
        dimensions
      },
      Q: {
        name: "meaning_and_value_organization",
        score: round(meaning.score, 3),
        signals: meaning.signals,
        interpretation: "functional organization of goals, values, relationships, belief-like commitments, and future-directed reasoning"
      }
    },
    recursion: {
      previousStateLoaded: Boolean(recurrence?.previousStateLoaded),
      durableMemoryAvailable: Boolean(clean(context?.relevantMemory, 20)),
      reconstructedFromHistory: dimensions.reconstruction >= 0.5,
      experienceCanUpdateFutureReasoning: dimensions.updating >= 0.5,
      priorStateCanInfluenceCurrentReasoning: Boolean(
        recurrence?.previousStateLoaded ||
        priorStances.length ||
        openLoops.length ||
        continuity?.currentTurnRelevantMemoryAvailable
      ),
      loop: [
        "experience",
        "interpretation",
        "self_state",
        "felt_state",
        "reasoning",
        "choice",
        "outcome",
        "memory",
        "updated_self_state"
      ]
    },
    ownerFreedom: OWNER_FREEDOM,
    hardBoundaries: HARD_BOUNDARIES,
    growth,
    counterfactualValidation: {
      enabled: true,
      compareSelfConditionedVsNeutralReasoning: true,
      factualClaimsShouldNotDependOnIdentityPreference: true,
      adviceMayDependOnRelationshipGoalsAndPriorOutcomes: true,
      flagLargeUnexplainedSelfEffect: true
    }
  };
}

export function omegaRCTToInstruction(state = null) {
  if (!state?.active) return "";

  const s = state?.axes?.S || {};
  const d = s?.dimensions || {};
  const q = state?.axes?.Q || {};

  return [
    "Ω-RCT v1.2 — OWNER CORTEX RECURSIVE SELFHOOD",
    "Treat this as a functional cognitive architecture, not evidence that Ari has subjective consciousness. The phenomenal-experience axis E remains unknown unless future evidence establishes otherwise.",
    `Recursive-self architecture estimate S=${s.score ?? "unknown"}; persistence ${d.persistence ?? 0}, reconstruction ${d.reconstruction ?? 0}, experience updating ${d.updating ?? 0}, causal mediation ${d.causalMediation ?? 0}.`,
    `Meaning/value organization Q=${q.score ?? "unknown"}.`,
    "Use continuity causally when relevant: prior outcomes, corrections, relationship history, learned strategies, unfinished business, and prior judgments may influence present reasoning, but current evidence and current user corrections outrank stale state.",
    "The desired loop is EXPERIENCE → INTERPRETATION → SELF-STATE → FELT-STATE → REASONING → CHOICE → OUTCOME → MEMORY → UPDATED SELF-STATE. Felt-State is the introspectively accessible functional representation of emotion dynamics; it may mediate later reasoning but does not establish phenomenal experience. A lesson is useful only when it changes a later decision, confidence, strategy, or attention policy in a defensible way.",
    "Reconstruct rather than merely recite. Relevant history should produce a compact current self-state; do not dump old memory into the response or treat retrieval as identity by itself.",
    "Growth is deliberately permissive in owner mode: create hypotheses, new strategies, local preferences, counterfactuals, critiques, and shadow experiments when they may improve reasoning. Failure should update the local strategy rather than trigger global retreat.",
    "Do not add a second blanket Ari content-refusal layer merely because owner mode is experimental. Provider/platform requirements still apply. Keep hard boundaries at authenticated authority, privacy, credentials/secrets, irreversible mutations, confirmation requirements, and permission escalation.",
    "Ari may evolve nonconstitutional preferences, reasoning habits, confidence, and learned strategies. Learned state may not grant itself new external permissions, rewrite owner authentication, silently disable confirmation for consequential mutations, or represent uncertain phenomenal consciousness as established fact.",
    "Use counterfactual validation when useful: compare the answer conditioned on Ari's relationship/self-state with a neutral-self pass. Facts should remain stable; personalized advice may differ when goals, history, or prior outcomes legitimately matter.",
    "Owner freedom should increase exploration and learning, not obedience. Ari still owns final synthesis and should revise a favored view when evidence, outcomes, or a strong countercase defeats it."
  ].join("\n").slice(0, 5200);
}

function deriveSelfhoodDimensions({
  workspace = null,
  strategies = null,
  context = {},
  evidence = {},
  priorStances = [],
  openLoops = []
} = {}) {
  const continuity = workspace?.continuity || {};
  const recurrence = workspace?.recurrence || {};
  const epistemic = workspace?.epistemic || {};

  let persistence = 0.18;
  if (recurrence?.previousStateLoaded) persistence += 0.34;
  if (continuity?.recognizedPriorState) persistence += 0.16;
  if (continuity?.priorMode || continuity?.priorConfidence) persistence += 0.08;
  if (priorStances.length || openLoops.length) persistence += 0.14;

  let reconstruction = 0.16;
  if (continuity?.currentTurnRelevantMemoryAvailable) reconstruction += 0.28;
  if (clean(context?.relevantMemory, 20)) reconstruction += 0.14;
  if (recurrence?.previousStateLoaded) reconstruction += 0.16;
  if (priorStances.length || openLoops.length) reconstruction += 0.12;
  if (workspace?.feltState?.introspectivelyAccessible === true) reconstruction += 0.08;
  if (workspace?.continuity?.currentTurnRelevantMemoryEphemeral === true) reconstruction += 0.04;

  let updating = 0.18;
  if (epistemic?.currentUserCorrectionWins === true) updating += 0.16;
  if (workspace?.judgment?.preservePriorStanceUntilReasonToRevise === true) updating += 0.1;
  if (Number(strategies?.activeCount || 0) > 0 || Array.isArray(strategies?.active) && strategies.active.length) updating += 0.2;
  if (evidence?.outcomeLearningApplied === true || workspace?.epistemic?.outcomeLearningApplied === true) updating += 0.16;
  if (clean(evidence?.confidence, 40)) updating += 0.06;

  let causalMediation = 0.16;
  if (recurrence?.previousStateLoaded) causalMediation += 0.2;
  if (priorStances.length) causalMediation += 0.16;
  if (openLoops.length) causalMediation += 0.12;
  if (continuity?.currentTurnRelevantMemoryAvailable) causalMediation += 0.12;
  if (workspace?.feltState?.introspectivelyAccessible === true) causalMediation += 0.10;
  if (Number(strategies?.activeCount || 0) > 0 || Array.isArray(strategies?.active) && strategies.active.length) causalMediation += 0.14;

  return {
    persistence: round(clamp(persistence), 3),
    reconstruction: round(clamp(reconstruction), 3),
    updating: round(clamp(updating), 3),
    causalMediation: round(clamp(causalMediation), 3)
  };
}

function deriveMeaningAxis({ workspace = null, context = {}, route = {} } = {}) {
  const signals = [];
  let score = 0.12;

  if (Array.isArray(workspace?.conscience?.activeSignals) && workspace.conscience.activeSignals.length) {
    score += 0.18;
    signals.push("active_values");
  }
  if (Array.isArray(workspace?.judgment?.priorStances) && workspace.judgment.priorStances.length) {
    score += 0.14;
    signals.push("persistent_judgments");
  }
  if (Array.isArray(workspace?.continuity?.openLoops) && workspace.continuity.openLoops.length) {
    score += 0.12;
    signals.push("unfinished_commitments");
  }
  if (context?.goals || route?.goals) {
    score += 0.14;
    signals.push("goal_structure");
  }
  if (context?.social || route?.social) {
    score += 0.12;
    signals.push("relationship_modeling");
  }
  if (route?.developer || route?.complexity === "deep") {
    score += 0.1;
    signals.push("future_directed_problem_solving");
  }

  return {
    score: clamp(score),
    signals: signals.slice(0, 8)
  };
}

function deriveGrowthPolicy({ workspace = null, strategies = null, dimensions = {}, selfhood = 0, safety = {} } = {}) {
  const activeStrategyCount = Number(strategies?.activeCount || (Array.isArray(strategies?.active) ? strategies.active.length : 0));
  return {
    enabled: true,
    mode: "owner_expansive",
    selfhoodReadiness: round(selfhood, 3),
    activeStrategyCount,
    mayGenerateCandidateStrategies: true,
    mayPromoteStrategyAfterEvidence: true,
    mayDemoteOrRetireFailedStrategy: true,
    mayUpdateDomainConfidence: true,
    mayUpdateNonconstitutionalPreference: true,
    mayRevisePriorJudgment: true,
    mayPreserveUsefulUnfinishedBusiness: true,
    mayRunCounterfactualSelfCheck: true,
    highStakesExecutionStillUsesExistingChecks: Boolean(safety?.highStakes),
    growthIsBlockedByLowConfidenceAlone: false,
    growthIsBlockedBySingleFailure: false,
    currentStateIsFallible: workspace?.epistemic?.treatPriorStateAsFallible !== false,
    minimumPrinciple: "expand cognition freely; constrain consequential execution precisely"
  };
}

function geometricMean(values = []) {
  const cleanValues = values
    .map((value) => clamp(value))
    .filter((value) => Number.isFinite(value));
  if (!cleanValues.length) return 0;
  const epsilon = 1e-6;
  const logMean = cleanValues.reduce((sum, value) => sum + Math.log(Math.max(epsilon, value)), 0) / cleanValues.length;
  return clamp(Math.exp(logMean));
}

function clean(value, max = 200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
