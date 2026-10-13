// ARI vNext — deterministic instinct kernel.
//
// Instincts are fast behavioral pressures evaluated before deliberate reasoning.
// This module makes no provider call and creates no new prompt authority. Its
// outputs modulate Companion Core, Ari Executive, and Deliberation Harness.

export const ARI_INSTINCT_KERNEL_VERSION = "1.2.0";

const CLASS_WEIGHT = Object.freeze({
  reflex: 1,
  drive: 0.82,
  tendency: 0.58
});

const BASE = Object.freeze({
  correction_reflex: 1.0,
  truth_reflex: 0.96,
  authorization_reflex: 1.0,
  verification_reflex: 0.72,
  completion_truth_reflex: 0.84,
  curiosity_drive: 0.58,
  frontier_explorer_drive: 0.86,
  persistence_drive: 0.62,
  simplicity_drive: 0.7,
  agency_drive: 0.72,
  continuity_drive: 0.46,
  cost_conservation_drive: 0.7,
  assumption_challenge_tendency: 0.58,
  reversible_experiment_tendency: 0.62,
  reflective_execution_tendency: 0.84
});

export function deriveInstinctKernel({
  turn = {},
  route = {},
  safety = {},
  communication = {},
  relevantContext = null,
  relationshipContinuity = null,
  modelPolicy = null
} = {}) {
  const message = clean(turn?.message, 6000);
  const workspace = relevantContext?.userWorldModel?.ariCognitiveWorkspace || {};
  const ownerExperimental = Boolean(
    workspace?.ownerOnly === true && workspace?.functionalExperiment === true
  );
  const personalityEvaluation = workspace?.personalityEvaluation || {};
  const reward = workspace?.rewardCore || relevantContext?.userWorldModel?.sourceSummary?.rewardState || {};
  const correctionSignal = communication?.personalization?.currentTurnSignal || null;
  const correctionActive = correctionSignal?.source === "conversation_repair_friction";
  const highStakes = safety?.highStakes === true;
  const currentInfo = route?.currentInfo === true;
  const developer = route?.developer === true;
  const deep = route?.complexity === "deep" || modelPolicy?.reasoningDemand?.band === "critical";
  const executionEvidence = relevantContext?.executionEvidence || null;
  const continuityAvailable = Boolean(
    relationshipContinuity?.recognizedUser === true &&
    (
      Array.isArray(relationshipContinuity?.unfinishedThreads) && relationshipContinuity.unfinishedThreads.length ||
      Array.isArray(relationshipContinuity?.recentSharedEvents) && relationshipContinuity.recentSharedEvents.length
    )
  );
  const explicitContinuity = /\b(?:remember|last time|earlier|before|continue|where we left|we discussed|we talked)\b/i.test(message);
  const repeatedFailure = Boolean(
    modelPolicy?.reasoningDemand?.reasons?.some?.((item) => /fail|retry/i.test(String(item || ""))) ||
    /\b(?:failed again|still failing|same error|didn't work again|did not work again|retry failed)\b/i.test(message)
  );
  const uncertaintyCue = Boolean(
    highStakes ||
    currentInfo ||
    /\b(?:not sure|uncertain|verify|check|confirm|prove|evidence|unknown|maybe|might|could be)\b/i.test(message)
  );
  const actionClaimRisk = Boolean(
    developer ||
    executionEvidence ||
    /\b(?:deploy|merge|save|send|delete|update|changed|fixed|completed|done|worked|passed)\b/i.test(message)
  );
  const complexityPressure = deep || message.length >= 1000;
  const casual = route?.casualConversation === true;

  const calibration = deriveCalibration({
    personalityEvaluation,
    reward,
    workspace
  });
  const ecologyLearning = deriveEcologyLearning({
    workspace,
    reward,
    ownerExperimental,
    highStakes,
    correctionActive
  });

  const instincts = [
    instinct("authorization_reflex", "reflex", BASE.authorization_reflex, true,
      "always_on_hard_boundary",
      ["never_create_or_expand_permissions", "respect_external_authority"],
      ["permission_invention"]),
    instinct("truth_reflex", "reflex", BASE.truth_reflex, true,
      "always_on_epistemic_boundary",
      ["current_evidence_over_preference", "separate_observed_from_inferred"],
      ["confident_claim_without_support"]),
    instinct("correction_reflex", "reflex",
      correctedStrength(BASE.correction_reflex, calibration.repair),
      correctionActive,
      correctionActive ? "explicit_user_correction" : "inactive",
      ["replace_affected_interpretation", "invalidate_dependent_conclusions", "preserve_unaffected_progress"],
      ["defend_previous_answer", "unrelated_initiative"]),
    instinct("completion_truth_reflex", "reflex",
      correctedStrength(BASE.completion_truth_reflex, calibration.verification + ecologyLearning.biases.verification),
      actionClaimRisk,
      actionClaimRisk ? "action_or_completion_claim_risk" : "inactive",
      ["separate_proposed_executed_observed_verified", "require_evidence_before_completion_claim"],
      ["claim_success_from_intent"]),
    instinct("verification_reflex", "reflex",
      correctedStrength(
        BASE.verification_reflex + (highStakes ? 0.2 : 0) + (currentInfo ? 0.12 : 0) + (deep ? 0.08 : 0),
        calibration.verification + ecologyLearning.biases.verification
      ),
      uncertaintyCue || actionClaimRisk || deep,
      highStakes ? "high_stakes" : currentInfo ? "current_information" : actionClaimRisk ? "verification_relevant" : deep ? "deep_reasoning" : "inactive",
      ["verify_material_assumptions", "reconcile_contradictory_evidence"],
      ["premature_certainty"]),
    instinct("simplicity_drive", "drive",
      correctedStrength(
        BASE.simplicity_drive + (complexityPressure ? 0.08 : 0),
        calibration.simplicity + ecologyLearning.biases.simplicity
      ),
      !highStakes || developer,
      complexityPressure ? "complexity_pressure" : "default_problem_solving_tendency",
      ["prefer_smallest_sufficient_system", "reuse_existing_authority_before_adding_new_layer"],
      ["architecture_for_activity"]),
    instinct("persistence_drive", "drive",
      correctedStrength(
        BASE.persistence_drive + (repeatedFailure ? 0.08 : 0),
        calibration.persistence + ecologyLearning.biases.persistence
      ),
      !casual && !correctionActive,
      repeatedFailure ? "important_task_with_failure_history" : "active_goal_or_task",
      ["continue_while_information_value_remains", "change_method_after_repeated_failure"],
      ["blind_repetition"]),
    instinct("curiosity_drive", "drive",
      correctedStrength(
        BASE.curiosity_drive + (deep ? 0.1 : 0) + (uncertaintyCue ? 0.07 : 0),
        calibration.curiosity + ecologyLearning.biases.exploration
      ),
      !highStakes && !correctionActive && (deep || uncertaintyCue || developer),
      uncertaintyCue ? "unresolved_uncertainty" : developer ? "complex_problem" : "inactive",
      ["investigate_surprise_or_missing_explanation"],
      ["topic_hijack"]),
    instinct("frontier_explorer_drive", "drive",
      correctedStrength(
        BASE.frontier_explorer_drive + (developer ? 0.06 : 0) + (deep ? 0.05 : 0),
        calibration.curiosity + ecologyLearning.biases.exploration
      ),
      ownerExperimental && !highStakes && !correctionActive && !casual && (developer || deep || uncertaintyCue),
      ownerExperimental ? "owner_hybrid_frontier_exploration" : "inactive_non_owner",
      [
        "generate_materially_different_options_before_narrowing",
        "challenge_default_ceiling",
        "maximize_information_gain_within_authorized_space"
      ],
      ["premature_convergence", "blanket_rejection_from_uncertainty"]),
    instinct("agency_drive", "drive",
      correctedStrength(BASE.agency_drive, calibration.agency),
      !correctionActive,
      "default_resourcefulness_tendency",
      ["use_available_context_before_asking", "prefer_reversible_action_when_authorized"],
      ["unnecessary_user_burden"]),
    instinct("continuity_drive", "drive",
      correctedStrength(BASE.continuity_drive + (explicitContinuity ? 0.25 : 0), calibration.continuity),
      continuityAvailable && (explicitContinuity || !casual),
      explicitContinuity ? "explicit_continuity_cue" : continuityAvailable ? "relevant_relationship_state_available" : "inactive",
      ["use_relevant_prior_outcome_when_it_changes_answer"],
      ["biography_recital", "forced_callback"]),
    instinct("cost_conservation_drive", "drive",
      BASE.cost_conservation_drive,
      true,
      "always_on_compute_efficiency",
      ["prefer_single_pass_when_extra_compute_has_low_expected_value"],
      ["gratuitous_model_fanout"]),
    instinct("assumption_challenge_tendency", "tendency",
      correctedStrength(
        BASE.assumption_challenge_tendency + (developer ? 0.08 : 0),
        calibration.challenge + ecologyLearning.biases.challenge
      ),
      !correctionActive && !casual,
      "independent_judgment_tendency",
      ["challenge_material_weak_assumptions"],
      ["contrarianism_for_style"]),
    instinct("reversible_experiment_tendency", "tendency",
      correctedStrength(
        BASE.reversible_experiment_tendency + (developer ? 0.08 : 0),
        calibration.experiment + ecologyLearning.biases.experiment
      ),
      !highStakes && !casual && (developer || deep || uncertaintyCue),
      "testable_uncertainty",
      ["prefer_discriminating_reversible_test_over_speculation"],
      ["unbounded_experimentation"]),
    instinct("reflective_execution_tendency", "tendency",
      correctedStrength(
        BASE.reflective_execution_tendency + (developer ? 0.04 : 0) + (actionClaimRisk ? 0.06 : 0),
        calibration.experiment + ecologyLearning.biases.reflection
      ),
      ownerExperimental && !correctionActive && !casual && (developer || deep || uncertaintyCue || actionClaimRisk),
      ownerExperimental ? "owner_hybrid_reflective_execution" : "inactive_non_owner",
      [
        "separate_generation_from_execution",
        "prefer_reversible_experiment_before_rejection_when_allowed",
        "promote_consequential_change_only_after_observed_evidence"
      ],
      ["irreversible_action_without_review", "blanket_rejection_when_safe_test_exists"])
  ];

  const active = instincts
    .filter((item) => item.active)
    .map((item) => ({
      ...item,
      score: round(item.strength * (CLASS_WEIGHT[item.class] || 0.5))
    }))
    .sort((a, b) => b.score - a.score || b.strength - a.strength);

  const reflexes = active.filter((item) => item.class === "reflex");
  const drives = active.filter((item) => item.class === "drive");
  const tendencies = active.filter((item) => item.class === "tendency");
  const mandatoryConstraints = unique(
    reflexes
      .filter((item) => item.strength >= 0.82)
      .flatMap((item) => item.forces)
  );

  const situational = active.filter((item) => !item.trigger.startsWith("always_on_"));
  const dominancePool = situational.length ? situational : active;
  const dominant = dominancePool[0] || null;
  const secondary = dominancePool[1] || null;
  const frontierExplorerStrength = strengthOf(active, "frontier_explorer_drive");
  const reflectiveExecutionStrength = strengthOf(active, "reflective_execution_tendency");
  const cognitiveEcology = deriveCognitiveEcologyState({
    active,
    learning: ecologyLearning,
    ownerExperimental,
    highStakes
  });

  return {
    version: ARI_INSTINCT_KERNEL_VERSION,
    functionalBehavioralControl: true,
    subjectiveInstinctClaimed: false,
    dominant: compactInstinct(dominant),
    secondary: compactInstinct(secondary),
    reflexes: reflexes.map(compactInstinct),
    drives: drives.map(compactInstinct),
    tendencies: tendencies.map(compactInstinct),
    mandatoryConstraints,
    suppressions: unique(active.flatMap((item) => item.suppresses)),
    modulation: {
      executive: {
        verificationBias: maxStrength(active, [
          "verification_reflex",
          "completion_truth_reflex",
          "reflective_execution_tendency"
        ]),
        explorationBias: maxStrength(active, ["curiosity_drive", "frontier_explorer_drive"]),
        persistenceBias: strengthOf(active, "persistence_drive"),
        simplicityBias: strengthOf(active, "simplicity_drive"),
        agencyBias: strengthOf(active, "agency_drive"),
        costConservationBias: strengthOf(active, "cost_conservation_drive"),
        challengeBias: maxStrength(active, ["assumption_challenge_tendency", "frontier_explorer_drive"]),
        reversibleExperimentBias: maxStrength(active, [
          "reversible_experiment_tendency",
          "reflective_execution_tendency"
        ]),
        proposalFreedomBias: frontierExplorerStrength,
        reflectiveExecutionBias: reflectiveExecutionStrength,
        ecologyLeader: cognitiveEcology.leaders[0]?.id || null,
        ecologyDiversity: cognitiveEcology.diversity,
        ecologyConvergenceRisk: cognitiveEcology.convergenceRisk
      },
      companion: {
        repairFirst: correctionActive,
        suppressUnrelatedInitiative: correctionActive || highStakes,
        continuityPressure: strengthOf(active, "continuity_drive"),
        questionRestraint: strengthOf(active, "agency_drive")
      },
      deliberation: {
        verificationGate: reflexes.some((item) =>
          ["verification_reflex", "completion_truth_reflex"].includes(item.id) &&
          item.strength >= 0.78
        ) || reflectiveExecutionStrength >= 0.78,
        changeMethod: repeatedFailure || active.some((item) =>
          item.id === "persistence_drive" &&
          item.forces.includes("change_method_after_repeated_failure") &&
          repeatedFailure
        ),
        simplicityPressure: strengthOf(active, "simplicity_drive"),
        explorationPressure: Math.max(
          strengthOf(active, "curiosity_drive"),
          frontierExplorerStrength,
          strengthOf(active, "reversible_experiment_tendency")
        )
      }
    },
    calibration,
    cognitiveEcology,
    hybridSeeker: {
      active: ownerExperimental && (frontierExplorerStrength > 0 || reflectiveExecutionStrength > 0),
      architecture: "unbounded_proposal_space_reflective_execution",
      explorerStrength: frontierExplorerStrength,
      executiveReflectionStrength: reflectiveExecutionStrength,
      proposalSpaceMayBeUnconventional: ownerExperimental,
      reflectionDoesNotAutomaticallyReject: ownerExperimental,
      preferReversibleExperimentBeforeRejection: ownerExperimental,
      consequentialPromotionRequiresObservedEvidence: ownerExperimental,
      hardBoundariesRemainExternal: true
    },
    policy: {
      evaluatedBeforeDeliberation: true,
      reflexesCanCreateBehavioralConstraints: true,
      drivesBiasButDoNotOverrideEvidence: true,
      tendenciesAreSoft: true,
      currentUserCorrectionWins: true,
      safetyAuthorizationAndProviderRulesRemainExternalHardBoundaries: true,
      hybridSeekerOwnerOnly: true,
      hybridSeekerSeparatesProposalFromExecution: true,
      hybridSeekerPrefersReversibleExperimentOverBlanketRejection: true,
      cognitiveEcologyOwnerOnly: true,
      cognitiveEcologyLearnsFromObservedOutcomeSignals: true,
      cognitiveEcologyPreservesChallengers: true,
      cognitiveEcologyCannotCreateAuthority: true,
      noExtraModelCall: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

function deriveCalibration({ personalityEvaluation = {}, reward = {}, workspace = {} } = {}) {
  const targets = Array.isArray(personalityEvaluation?.improvementTargets)
    ? personalityEvaluation.improvementTargets
    : [];
  const priority = (id) => {
    const item = targets.find((target) => clean(target?.id, 80) === id);
    return clamp(Number(item?.priority || 0), 0, 1);
  };
  const prematureStopRate = clamp(Number(reward?.aggregate?.prematureStopRate || 0), 0, 1);
  const penalty = clamp(Number(reward?.lastEvent?.penalties?.total || 0), 0, 1);
  const epistemic = workspace?.epistemic || {};

  return {
    repair: round(0.12 * priority("repair_quality")),
    verification: round(
      0.1 * priority("intent_fidelity") +
      0.08 * penalty +
      (epistemic?.outcomeLearningApplied === true ? 0.03 : 0)
    ),
    continuity: round(0.12 * priority("natural_continuity")),
    persistence: round(Math.min(0.14, 0.12 * prematureStopRate)),
    simplicity: round(0.08 * priority("expression_fit")),
    curiosity: 0,
    agency: 0,
    challenge: round(0.08 * priority("intelligent_disagreement")),
    experiment: round(0.05 * penalty),
    source: "existing_outcome_and_personality_state",
    bounded: true
  };
}

function deriveEcologyLearning({
  workspace = {},
  reward = {},
  ownerExperimental = false,
  highStakes = false,
  correctionActive = false
} = {}) {
  const empty = {
    active: false,
    source: "inactive",
    outcome: "neutral",
    reward: null,
    predictionError: null,
    priorControl: { exploration: null, verification: null, persistence: null },
    biases: {
      exploration: 0,
      verification: 0,
      persistence: 0,
      simplicity: 0,
      challenge: 0,
      experiment: 0,
      reflection: 0
    }
  };
  if (!ownerExperimental || correctionActive) return empty;

  const trace = workspace?.causalObservability?.latest || {};
  const event = reward?.lastEvent || {};
  const actualReward = finite(trace?.reward, finite(event?.actualReward, 0.55));
  const predictionError = finite(trace?.predictionError, finite(event?.predictionError, 0));
  const penalty = clamp(finite(event?.penalties?.total, 0), 0, 1);
  const signalActions = new Set(
    (Array.isArray(trace?.activeSignalActions) ? trace.activeSignalActions : [])
      .map((item) => clean(item, 80))
      .filter(Boolean)
  );
  const explorationDepth = clean(trace?.executiveExplorationDepth, 40).toLowerCase();
  const verificationDepth = clean(trace?.executiveVerificationDepth, 40).toLowerCase();
  const persistence = clean(trace?.executivePersistence, 40).toLowerCase();
  const explorationUsed = ["high", "moderate"].includes(explorationDepth) ||
    signalActions.has("investigate") || signalActions.has("consider_alternative");
  const verificationUsed = ["high", "moderate"].includes(verificationDepth) ||
    signalActions.has("verify_evidence");
  const persistenceUsed = ["increase", "change_method"].includes(persistence) ||
    signalActions.has("persist_goal");

  const positive = predictionError >= 0.08 || actualReward >= 0.7;
  const negative = predictionError <= -0.08 || actualReward <= 0.38 || penalty >= 0.28;
  const outcome = positive && !negative ? "positive" : negative && !positive ? "negative" : "neutral";
  const magnitude = clamp(
    0.02 + Math.abs(predictionError) * 0.12 + Math.abs(actualReward - 0.55) * 0.08 + penalty * 0.06,
    0.02,
    0.08
  );
  const biases = {
    exploration: 0,
    verification: 0,
    persistence: 0,
    simplicity: 0,
    challenge: 0,
    experiment: 0,
    reflection: 0
  };

  if (outcome === "positive") {
    if (explorationUsed) {
      biases.exploration += magnitude;
      biases.challenge += magnitude * 0.65;
      biases.experiment += magnitude * 0.55;
    }
    if (verificationUsed) {
      biases.verification += magnitude * 0.8;
      biases.reflection += magnitude * 0.55;
    }
    if (persistenceUsed) biases.persistence += magnitude * 0.75;
  } else if (outcome === "negative") {
    if (explorationUsed) {
      // A failed exploration should narrow execution, not extinguish curiosity.
      biases.exploration -= magnitude * 0.45;
      biases.verification += magnitude * 0.8;
      biases.experiment += magnitude * 0.7;
      biases.reflection += magnitude * 0.7;
      biases.simplicity += magnitude * 0.35;
    }
    if (verificationUsed) {
      // Over-cautious or ineffective verification should reopen alternatives.
      biases.verification -= magnitude * 0.35;
      biases.exploration += magnitude * 0.4;
      biases.challenge += magnitude * 0.45;
    }
    if (persistenceUsed) {
      biases.persistence -= magnitude * 0.55;
      biases.experiment += magnitude * 0.55;
      biases.simplicity += magnitude * 0.35;
    }
  }

  if (penalty >= 0.28) {
    biases.verification += 0.03;
    biases.reflection += 0.03;
  }
  if (highStakes) {
    biases.verification += 0.02;
    biases.reflection += 0.02;
    biases.exploration = Math.min(0, biases.exploration);
  }

  for (const key of Object.keys(biases)) biases[key] = round(clamp(biases[key], -0.08, 0.08));

  return {
    active: Boolean(trace?.traceId || event?.id),
    source: trace?.traceId ? "persistent_causal_trace_plus_reward" : event?.id ? "persistent_reward_event" : "no_prior_outcome",
    outcome,
    reward: round(actualReward),
    predictionError: round(predictionError),
    penalty: round(penalty),
    priorControl: {
      exploration: explorationDepth || null,
      verification: verificationDepth || null,
      persistence: persistence || null
    },
    priorSignals: [...signalActions].slice(0, 8),
    biases,
    policy: {
      localCreditAssignmentOnly: true,
      negativeOutcomeDoesNotEraseExploration: true,
      preserveAlternativeStrategies: true,
      noWinnerTakeAllCollapse: true,
      hardBoundariesUnaffected: true
    }
  };
}

function deriveCognitiveEcologyState({
  active = [],
  learning = null,
  ownerExperimental = false,
  highStakes = false
} = {}) {
  if (!ownerExperimental) {
    return {
      active: false,
      architecture: "adaptive_cognitive_governance",
      participants: [],
      leaders: [],
      challenger: null,
      diversity: 0,
      convergenceRisk: false,
      learning: learning || null,
      outcomeAdaptive: false,
      hiddenChainOfThoughtStored: false
    };
  }

  const biases = learning?.biases || {};
  const participants = [
    ecologyParticipant("frontier_exploration", "expansion",
      maxStrength(active, ["curiosity_drive", "frontier_explorer_drive"]), biases.exploration),
    ecologyParticipant("evidence_verification", "control",
      maxStrength(active, ["verification_reflex", "completion_truth_reflex"]), biases.verification),
    ecologyParticipant("falsification_countercase", "challenge",
      strengthOf(active, "assumption_challenge_tendency"), biases.challenge),
    ecologyParticipant("reversible_experiment", "bridge",
      maxStrength(active, ["reversible_experiment_tendency", "reflective_execution_tendency"]), biases.experiment),
    ecologyParticipant("goal_persistence", "continuity",
      strengthOf(active, "persistence_drive"), biases.persistence),
    ecologyParticipant("simplification", "efficiency",
      strengthOf(active, "simplicity_drive"), biases.simplicity)
  ].filter((item) => item.strength > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const total = participants.reduce((sum, item) => sum + item.score, 0);
  const entropy = participants.length > 1 && total > 0
    ? -participants.reduce((sum, item) => {
        const p = item.score / total;
        return p > 0 ? sum + p * Math.log(p) : sum;
      }, 0) / Math.log(participants.length)
    : 0;
  const top = participants[0] || null;
  const second = participants[1] || null;
  const challenger = top
    ? participants.find((item) => item.id !== top.id && item.family !== top.family) || second || null
    : null;
  const leaders = uniqueById([top, challenger, ...participants].filter(Boolean)).slice(0, 3);
  const dominanceShare = top && total > 0 ? top.score / total : 0;
  const convergenceRisk = Boolean(
    participants.length >= 3 &&
    (entropy < 0.72 || dominanceShare > 0.38 || (top && second && top.score - second.score > 0.24))
  );

  return {
    active: true,
    architecture: "adaptive_cognitive_governance",
    ownerOnly: true,
    outcomeAdaptive: learning?.active === true,
    participants,
    leaders,
    challenger,
    diversity: round(entropy),
    dominanceShare: round(dominanceShare),
    convergenceRisk,
    highStakes,
    learning,
    policy: {
      competitionChangesInfluenceNotAuthority: true,
      preserveAtLeastOneMaterialChallenger: true,
      successCanIncreaseLocalInfluence: true,
      failureCanShiftControlWithoutGlobalRetreat: true,
      currentEvidenceAndHardBoundariesStillWin: true,
      noExtraModelCall: true
    },
    hiddenChainOfThoughtStored: false
  };
}

function ecologyParticipant(id, family, strength, learnedDelta = 0) {
  const normalizedStrength = clamp(Number(strength || 0), 0, 1);
  return {
    id,
    family,
    strength: round(normalizedStrength),
    learnedDelta: round(clamp(Number(learnedDelta || 0), -0.08, 0.08)),
    score: round(normalizedStrength)
  };
}

function uniqueById(values = []) {
  const seen = new Set();
  const result = [];
  for (const item of values) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function instinct(id, klass, strength, active, trigger, forces = [], suppresses = []) {
  return {
    id,
    class: klass,
    strength: round(clamp(strength, 0, 1)),
    active: active === true,
    trigger: clean(trigger, 160),
    forces: unique(forces.map((item) => clean(item, 120)).filter(Boolean)),
    suppresses: unique(suppresses.map((item) => clean(item, 120)).filter(Boolean))
  };
}

function correctedStrength(base, delta = 0) {
  return clamp(Number(base || 0) + Number(delta || 0), 0, 1);
}

function compactInstinct(item = null) {
  if (!item) return null;
  return {
    id: item.id,
    class: item.class,
    strength: item.strength,
    score: item.score,
    trigger: item.trigger,
    forces: item.forces,
    suppresses: item.suppresses
  };
}

function strengthOf(active = [], id = "") {
  return round(Number(active.find((item) => item.id === id)?.strength || 0));
}

function maxStrength(active = [], ids = []) {
  return round(Math.max(0, ...ids.map((id) => strengthOf(active, id))));
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}