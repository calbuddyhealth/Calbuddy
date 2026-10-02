// ARI vNext — deterministic instinct kernel.
//
// Instincts are fast behavioral pressures evaluated before deliberate reasoning.
// This module makes no provider call and creates no new prompt authority. Its
// outputs modulate Companion Core, Ari Executive, and Deliberation Harness.

export const ARI_INSTINCT_KERNEL_VERSION = "1.0.0";

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
  persistence_drive: 0.62,
  simplicity_drive: 0.7,
  agency_drive: 0.72,
  continuity_drive: 0.46,
  cost_conservation_drive: 0.7,
  assumption_challenge_tendency: 0.58,
  reversible_experiment_tendency: 0.62
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
      correctedStrength(BASE.completion_truth_reflex, calibration.verification),
      actionClaimRisk,
      actionClaimRisk ? "action_or_completion_claim_risk" : "inactive",
      ["separate_proposed_executed_observed_verified", "require_evidence_before_completion_claim"],
      ["claim_success_from_intent"]),
    instinct("verification_reflex", "reflex",
      correctedStrength(
        BASE.verification_reflex + (highStakes ? 0.2 : 0) + (currentInfo ? 0.12 : 0) + (deep ? 0.08 : 0),
        calibration.verification
      ),
      uncertaintyCue || actionClaimRisk || deep,
      highStakes ? "high_stakes" : currentInfo ? "current_information" : actionClaimRisk ? "verification_relevant" : deep ? "deep_reasoning" : "inactive",
      ["verify_material_assumptions", "reconcile_contradictory_evidence"],
      ["premature_certainty"]),
    instinct("simplicity_drive", "drive",
      correctedStrength(BASE.simplicity_drive + (complexityPressure ? 0.08 : 0), calibration.simplicity),
      !highStakes || developer,
      complexityPressure ? "complexity_pressure" : "default_problem_solving_tendency",
      ["prefer_smallest_sufficient_system", "reuse_existing_authority_before_adding_new_layer"],
      ["architecture_for_activity"]),
    instinct("persistence_drive", "drive",
      correctedStrength(BASE.persistence_drive + (repeatedFailure ? 0.08 : 0), calibration.persistence),
      !casual && !correctionActive,
      repeatedFailure ? "important_task_with_failure_history" : "active_goal_or_task",
      ["continue_while_information_value_remains", "change_method_after_repeated_failure"],
      ["blind_repetition"]),
    instinct("curiosity_drive", "drive",
      correctedStrength(BASE.curiosity_drive + (deep ? 0.1 : 0) + (uncertaintyCue ? 0.07 : 0), calibration.curiosity),
      !highStakes && !correctionActive && (deep || uncertaintyCue || developer),
      uncertaintyCue ? "unresolved_uncertainty" : developer ? "complex_problem" : "inactive",
      ["investigate_surprise_or_missing_explanation"],
      ["topic_hijack"]),
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
      correctedStrength(BASE.assumption_challenge_tendency + (developer ? 0.08 : 0), calibration.challenge),
      !correctionActive && !casual,
      "independent_judgment_tendency",
      ["challenge_material_weak_assumptions"],
      ["contrarianism_for_style"]),
    instinct("reversible_experiment_tendency", "tendency",
      correctedStrength(BASE.reversible_experiment_tendency + (developer ? 0.08 : 0), calibration.experiment),
      !highStakes && !casual && (developer || deep || uncertaintyCue),
      "testable_uncertainty",
      ["prefer_discriminating_reversible_test_over_speculation"],
      ["unbounded_experimentation"])
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

  const dominant = active[0] || null;
  const secondary = active[1] || null;

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
        verificationBias: maxStrength(active, ["verification_reflex", "completion_truth_reflex"]),
        explorationBias: strengthOf(active, "curiosity_drive"),
        persistenceBias: strengthOf(active, "persistence_drive"),
        simplicityBias: strengthOf(active, "simplicity_drive"),
        agencyBias: strengthOf(active, "agency_drive"),
        costConservationBias: strengthOf(active, "cost_conservation_drive"),
        challengeBias: strengthOf(active, "assumption_challenge_tendency"),
        reversibleExperimentBias: strengthOf(active, "reversible_experiment_tendency")
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
        ),
        changeMethod: repeatedFailure || active.some((item) =>
          item.id === "persistence_drive" &&
          item.forces.includes("change_method_after_repeated_failure") &&
          repeatedFailure
        ),
        simplicityPressure: strengthOf(active, "simplicity_drive"),
        explorationPressure: Math.max(
          strengthOf(active, "curiosity_drive"),
          strengthOf(active, "reversible_experiment_tendency")
        )
      }
    },
    calibration,
    policy: {
      evaluatedBeforeDeliberation: true,
      reflexesCanCreateBehavioralConstraints: true,
      drivesBiasButDoNotOverrideEvidence: true,
      tendenciesAreSoft: true,
      currentUserCorrectionWins: true,
      safetyAuthorizationAndProviderRulesRemainExternalHardBoundaries: true,
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
