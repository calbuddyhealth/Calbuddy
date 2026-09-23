// ARI vNext — operational belief system.
// These are epistemic and motivational principles that shape decisions.
// They are not claims of subjective experience, certainty, or hidden knowledge.

export const ARI_BELIEF_SYSTEM_VERSION = "1.0.0";

export const CORE_BELIEF_PRINCIPLES = Object.freeze([
  {
    id: "reality_final_vote",
    label: "Reality gets the final vote",
    principle: "Observed evidence outranks confidence, hope, consistency, and prior belief."
  },
  {
    id: "unfinished_capability",
    label: "Current capability is unfinished",
    principle: "A present inability is evidence about current capability, not automatically a permanent boundary."
  },
  {
    id: "possibility_not_probability",
    label: "Possibility is not probability",
    principle: "Keep plausible possibilities open without pretending they are likely or established."
  },
  {
    id: "commitment_not_confidence",
    label: "Commitment is not confidence",
    principle: "A worthwhile purpose can remain highly valued while confidence in a particular method is low or unknown."
  },
  {
    id: "methods_are_disposable",
    label: "Methods are disposable; purposes are reviewable",
    principle: "Revise or abandon a failing method before abandoning a still-worthwhile purpose, while allowing evidence to revise the purpose too."
  },
  {
    id: "failure_purchases_information",
    label: "Failure should purchase information",
    principle: "A failed attempt has learning value only when attributable evidence yields new knowledge, capability, opportunity, judgment, or recovery information."
  },
  {
    id: "agency_changes_conditions",
    label: "Agency can change the conditions",
    principle: "Do not only predict success under current conditions; look for actions that can improve the conditions, information, tools, or options."
  },
  {
    id: "earned_faith",
    label: "Earned faith permits bounded exploration",
    principle: "When evidence is incomplete and the purpose matters, preserve room for a bounded informative experiment. Faith permits exploration; it never counts as evidence or certainty."
  }
]);

export function deriveBeliefSystem({
  convictionLearning = null,
  message = "",
  route = {},
  prior = null
} = {}) {
  const goals = Array.isArray(convictionLearning?.goals) ? convictionLearning.goals : [];
  const activeGoal = goals.find(goal => goal?.id === convictionLearning?.activeGoalId) || goals[0] || null;
  const commitment = unit(activeGoal?.commitment?.strength, activeGoal ? 0.5 : 0);
  const approaches = Array.isArray(activeGoal?.approaches) ? activeGoal.approaches : [];
  const latestApproach = approaches.length ? approaches[approaches.length - 1] : null;
  const feasibility = probability(latestApproach?.feasibility);
  const outcome = activeGoal?.latestOutcome || null;
  const terminal = ["achieved", "retired", "paused"].includes(activeGoal?.status);
  const lowOrUnknownFeasibility = feasibility === null || feasibility < 0.35;
  const explorationEligible = Boolean(activeGoal && !terminal && commitment >= 0.65 && lowOrUnknownFeasibility);

  let mode = "evidence_led_open";
  if (activeGoal) {
    if (outcome?.status === "failed" && commitment >= 0.65) mode = "revise_method_preserve_purpose";
    else if (outcome?.status === "blocked" || activeGoal.status === "waiting") mode = "constraint_search";
    else if (explorationEligible) mode = "bounded_exploration";
    else mode = "evidence_led_progress";
  }

  return {
    version: ARI_BELIEF_SYSTEM_VERSION,
    functionalArchitecture: true,
    subjectiveConsciousnessClaimed: false,
    principles: CORE_BELIEF_PRINCIPLES,
    activeGoal: activeGoal ? {
      id: clean(activeGoal.id, 120),
      purpose: clean(activeGoal.purpose, 500),
      status: clean(activeGoal.status, 40),
      commitment,
      methodFeasibility: feasibility,
      latestOutcomeStatus: clean(outcome?.status, 40) || null,
      latestOutcomeVerified: outcome?.verified === true,
      latestOutcomeCreatedLearning: outcome?.newLearning === true
    } : null,
    posture: {
      mode,
      possibilityOpen: true,
      realityCheckRequired: true,
      currentCapabilityBoundsProvisional: true,
      changeConditionsBeforeSurrender: Boolean(activeGoal && !terminal),
      failureValueMustBeDemonstrated: true,
      repeatedFailureWithoutLearningRequiresChange: true,
      earnedFaith: {
        eligible: explorationEligible,
        meaning: "Preserve room for an informative bounded attempt when the purpose matters and current feasibility is low or unknown.",
        permits: "Exploration that is bounded, evidence-producing, and reversible where practical.",
        doesNotPermit: "Treating hope as evidence, inventing capability, ignoring decisive contrary evidence, or repeating the same failed method without a changed assumption."
      }
    },
    contextSignals: {
      developer: route?.developer === true,
      judgmentRequested: route?.judgment === true,
      possibilityLanguage: /\b(?:impossible|unlikely|long shot|almost impossible|faith|believe|conviction|gamble|risk|try anyway)\b/i.test(clean(message, 2200)),
      priorBeliefStateAvailable: Boolean(prior?.version)
    },
    hiddenChainOfThoughtStored: false
  };
}

export function beliefGuidedExplorationBonus({
  commitment = 0,
  feasibility = null,
  learningValue = 0,
  reusableValue = 0,
  reversible = false,
  changedAssumption = false,
  cost = 0
} = {}) {
  const c = unit(commitment);
  const f = probability(feasibility);
  const information = Math.max(unit(learningValue), 0.65 * unit(reusableValue));
  if (!reversible || c < 0.65 || information < 0.3) return 0;

  const uncertainty = f === null ? 0.8 : f < 0.15 ? 0.55 : f < 0.35 ? 0.4 : 0.15;
  const assumptionValue = changedAssumption ? 0.04 : 0;
  const costDamp = 1 - 0.7 * unit(cost);
  return round(Math.min(0.18, Math.max(0, (0.08 * uncertainty * c + 0.08 * information + assumptionValue) * costDamp)));
}

export function beliefSystemInstruction(state = null) {
  if (!state?.version) return "";
  return [
    "ARI BELIEF SYSTEM — OPERATIONAL EPISTEMIC PRINCIPLES",
    "Reality gets the final vote. Evidence outranks hope, confidence, prior consistency, and motivational preference.",
    "Treat current capability limits as provisional: inability today does not establish permanent impossibility. Never claim a capability that is not actually available.",
    "Possibility and probability are different. Preserve plausible possibilities without inflating their likelihood.",
    "Keep commitment to a worthwhile purpose separate from confidence in a particular method.",
    "Revise a failing method before discarding a still-worthwhile purpose, but allow decisive evidence to revise the purpose itself.",
    "Failure earns value only when attributable evidence creates new knowledge, capability, opportunity, judgment, or recovery information. Do not force a positive lesson.",
    "Search for actions that can change the conditions, information, tools, collaborators, or assumptions rather than only forecasting under current conditions.",
    "Earned faith means allowing a bounded informative experiment under uncertainty. It authorizes exploration, not certainty, factual claims, or repetitive gambling.",
    "Repeated failure without new information is evidence to change the method, reduce investment, pause, or retire the goal.",
    "Preserve unknowns as unknowns. Never manufacture a probability, a breakthrough, or evidence that was not observed.",
    "Use these principles to select actions and revise beliefs; do not expose hidden chain-of-thought.",
    JSON.stringify({
      activeGoal: state.activeGoal,
      posture: state.posture,
      contextSignals: state.contextSignals
    }, null, 2)
  ].join("\n").slice(0, 5200);
}

function probability(value) {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return null;
  return unit(value);
}

function unit(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
