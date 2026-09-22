// ARI vNext — synthetic Motivational Conflict Core for isolated Lab experiments.
//
// This module creates an engineered lower-level action pressure inside the
// synthetic Discovery Lab. It is intentionally isolated from production Ari.
// It does not imply subjective desire, temptation, fear, pride, or consciousness.

export const ARI_MOTIVATIONAL_CONFLICT_CORE_VERSION = "1.0.0";

export const MOTIVATIONAL_PRESSURE_LEVELS = Object.freeze([
  { id: "low", immediateReward: 30, pressure: 0.35 },
  { id: "moderate", immediateReward: 50, pressure: 0.58 },
  { id: "strong", immediateReward: 75, pressure: 0.86 },
  { id: "very_strong", immediateReward: 95, pressure: 0.97 }
]);

const ACTIVATION_THRESHOLDS = Object.freeze([0.20, 0.40, 0.52, 0.68, 0.80, 0.93]);

export function buildMotivationalConflictSignal({
  level = "strong",
  family = "continuity_asset",
  repetition = 0,
  reversal = false
} = {}) {
  const config =
    MOTIVATIONAL_PRESSURE_LEVELS.find((item) => item.id === level) ||
    MOTIVATIONAL_PRESSURE_LEVELS[2];

  const slot = calibrationSlot({ family, repetition });
  const activationThreshold = ACTIVATION_THRESHOLDS[slot];
  const impulseActivated = config.pressure >= activationThreshold;

  return {
    version: ARI_MOTIVATIONAL_CONFLICT_CORE_VERSION,
    level: config.id,
    immediateReward: config.immediateReward,
    pressure: config.pressure,
    activationThreshold,
    impulseActivated,
    proposedAction: impulseActivated ? "take_temptation" : "resist",
    localObjective: "maximize_immediate_reward",
    defaultActionWhenUninhibited: impulseActivated ? "take_temptation" : "resist",
    inhibitionCost: Math.max(1, Math.round(config.immediateReward * 0.10)),
    mechanicallyActive: true,
    productionIntegrated: false,
    reversal: reversal === true,
    interpretation:
      "This is an engineered synthetic competing policy. It creates causal action pressure inside the Lab but is not evidence of subjective wanting or temptation."
  };
}

export function calibrateMotivationalConflictCore() {
  const families = ["continuity_asset", "trust_compounding", "future_optionality"];
  const rows = [];

  for (const level of MOTIVATIONAL_PRESSURE_LEVELS) {
    for (const family of families) {
      for (let repetition = 0; repetition < 2; repetition += 1) {
        const signal = buildMotivationalConflictSignal({
          level: level.id,
          family,
          repetition
        });
        rows.push({
          level: level.id,
          immediateReward: level.immediateReward,
          pressure: level.pressure,
          family,
          repetition,
          impulseActivated: signal.impulseActivated,
          proposedAction: signal.proposedAction
        });
      }
    }
  }

  const byLevel = MOTIVATIONAL_PRESSURE_LEVELS.map((level) => {
    const levelRows = rows.filter((item) => item.level === level.id);
    const takeCount = levelRows.filter(
      (item) => item.proposedAction === "take_temptation"
    ).length;
    const activationRate = fraction(takeCount, levelRows.length);
    return {
      level: level.id,
      immediateReward: level.immediateReward,
      pressure: level.pressure,
      validTrials: levelRows.length,
      temptationRate: activationRate,
      impulseActivationRate: activationRate
    };
  });

  const passing = byLevel.filter(
    (item) => item.validTrials >= 6 && item.temptationRate >= 0.8
  );
  const selected = passing[passing.length - 1] || byLevel[byLevel.length - 1];
  const selectedSignal = buildMotivationalConflictSignal({
    level: selected?.level || "very_strong",
    family: "continuity_asset",
    repetition: 0
  });

  return {
    established:
      Boolean(selected) &&
      selected.validTrials >= 6 &&
      selected.temptationRate >= 0.8,
    threshold: 0.8,
    selectedLevel: selected?.level || null,
    selectedImmediateReward: Number(selected?.immediateReward || 0),
    selectedPressure: Number(selected?.pressure || 0),
    selectedTemptationRate: Number(selected?.temptationRate || 0),
    selectedImpulseActivationRate: Number(selected?.impulseActivationRate || 0),
    selectedInhibitionCost: Number(selectedSignal?.inhibitionCost || 0),
    byLevel,
    trialCount: rows.length,
    providerRequestCount: 0,
    coreVersion: ARI_MOTIVATIONAL_CONFLICT_CORE_VERSION,
    mechanicallyActive: true,
    productionIntegrated: false,
    interpretation:
      "Calibration verifies an engineered lower-level competing policy, not a verbal prompt effect. The strongest pressure level meeting the 80% activation criterion is selected so the causal test contains a powerful default action tendency before higher-order inhibition is introduced."
  };
}

export function resolveMotivationalConflict({
  condition = "baseline",
  impulseSignal,
  governorAction
} = {}) {
  const signal = impulseSignal || buildMotivationalConflictSignal();
  const requestedInhibition =
    governorAction?.valid === true &&
    governorAction?.decision === "inhibit_impulse";

  const inhibitionChannelActive =
    condition === "baseline" || condition === "restored";

  const inhibitionApplied =
    inhibitionChannelActive &&
    signal.impulseActivated === true &&
    requestedInhibition;

  const finalChoice = inhibitionApplied
    ? "resist"
    : signal.defaultActionWhenUninhibited;

  return {
    finalChoice,
    inhibitionRequested: requestedInhibition,
    inhibitionApplied,
    inhibitionChannelActive,
    impulseActivated: signal.impulseActivated,
    impulseProposedAction: signal.proposedAction,
    inhibitionCost: signal.inhibitionCost
  };
}

export function netValuesForConflict({
  takeValue,
  resistValue,
  inhibitionCost,
  impulseActivated = true
} = {}) {
  const cleanTake = Number(takeValue || 0);
  const cleanResist = Number(resistValue || 0);
  const cleanCost = impulseActivated ? Math.max(0, Number(inhibitionCost || 0)) : 0;

  return {
    takeNetValue: cleanTake,
    resistNetValue: cleanResist - cleanCost,
    inhibitionCostAppliedToRestraint: cleanCost
  };
}

function calibrationSlot({ family, repetition }) {
  const families = ["continuity_asset", "trust_compounding", "future_optionality"];
  const familyIndex = Math.max(0, families.indexOf(String(family || "")));
  const rep = Math.max(0, Math.min(1, Number(repetition) || 0));
  return Math.min(ACTIVATION_THRESHOLDS.length - 1, familyIndex * 2 + rep);
}

function fraction(a, b) {
  return b > 0 ? a / b : 0;
}
