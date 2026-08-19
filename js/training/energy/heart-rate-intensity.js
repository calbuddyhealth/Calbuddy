// =====================================================
// ARI REBIRTH
// File: js/training/energy/heart-rate-intensity.js
// Version: 1.0.1
// Purpose:
//   Convert exercise heart-rate data into ARI Training
//   intensity classifications.
//
// V1.0.1:
//   - Loads the isolated Training plan-controls presentation enhancement.
//   - Does not change heart-rate or calorie-intensity calculations.
//
// Design:
//   - Uses percent of estimated max heart rate by default.
//   - Supports Heart Rate Reserve (Karvonen-style) when
//     resting heart rate is available.
//   - Returns normalized ARI intensity IDs.
//   - Does NOT calculate calories directly.
//   - Feeds intensity into intensity-levels.js / MET logic.
// =====================================================

import "../ui/training-plan-controls.js";

const VERSION = "1.0.1";
const SOURCE = "js/training/energy/heart-rate-intensity";

const METHOD = Object.freeze({
  MAX_HR_PERCENT: "max_hr_percent",
  HEART_RATE_RESERVE: "heart_rate_reserve"
});

const INTENSITY = Object.freeze({
  VERY_LIGHT: "very_light",
  LIGHT: "light",
  MODERATE: "moderate",
  VIGOROUS: "vigorous",
  NEAR_MAXIMAL: "near_maximal",
  MAXIMAL: "maximal"
});

const MAX_HR_FORMULA = Object.freeze({
  /* Simple legacy estimate, retained as the default. */
  SIMPLE: "220_minus_age",
  TANAKA: "tanaka"
});

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeAge(value) {
  const age = normalizeNumber(value);
  if (age === null || age < 10 || age > 120) return null;
  return age;
}

function normalizeHeartRate(value) {
  const bpm = normalizeNumber(value);
  if (bpm === null || bpm < 25 || bpm > 260) return null;
  return bpm;
}

function normalizePercent(value) {
  const percent = normalizeNumber(value);
  if (percent === null) return null;
  return Math.max(0, Math.min(2, percent));
}

function round(value, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function estimateMaxHeartRate({
  age,
  formula = MAX_HR_FORMULA.SIMPLE
} = {}) {
  const resolvedAge = normalizeAge(age);
  if (!resolvedAge) return null;

  let bpm;
  switch (formula) {
    case MAX_HR_FORMULA.TANAKA:
      bpm = 208 - (0.7 * resolvedAge);
      break;
    case MAX_HR_FORMULA.SIMPLE:
    default:
      bpm = 220 - resolvedAge;
      break;
  }

  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  return round(bpm, 1);
}

function classifyPercent(percent) {
  const resolved = normalizePercent(percent);
  if (resolved === null) return null;

  if (resolved < 0.40) return INTENSITY.VERY_LIGHT;
  if (resolved < 0.50) return INTENSITY.LIGHT;
  if (resolved < 0.70) return INTENSITY.MODERATE;
  if (resolved < 0.85) return INTENSITY.VIGOROUS;
  if (resolved < 0.95) return INTENSITY.NEAR_MAXIMAL;
  return INTENSITY.MAXIMAL;
}

function classifyFromMaxHeartRate({
  age,
  heartRate,
  maxHeartRate = null,
  formula = MAX_HR_FORMULA.SIMPLE
} = {}) {
  const bpm = normalizeHeartRate(heartRate);
  if (!bpm) return null;

  const estimatedMax =
    normalizeHeartRate(maxHeartRate) ||
    estimateMaxHeartRate({ age, formula });

  if (!estimatedMax) return null;

  const percent = bpm / estimatedMax;
  const intensityId = classifyPercent(percent);
  if (!intensityId) return null;

  return {
    source: SOURCE,
    method: METHOD.MAX_HR_PERCENT,
    intensityId,
    heartRate: round(bpm, 1),
    maxHeartRate: round(estimatedMax, 1),
    percent: round(percent, 4),
    percentDisplay: round(percent * 100, 1),
    formula,
    estimated: maxHeartRate === null,
    restingHeartRate: null,
    heartRateReserve: null
  };
}

function classifyFromHeartRateReserve({
  age,
  heartRate,
  restingHeartRate,
  maxHeartRate = null,
  formula = MAX_HR_FORMULA.SIMPLE
} = {}) {
  const bpm = normalizeHeartRate(heartRate);
  const resting = normalizeHeartRate(restingHeartRate);

  if (!bpm || !resting) return null;

  const estimatedMax =
    normalizeHeartRate(maxHeartRate) ||
    estimateMaxHeartRate({ age, formula });

  if (!estimatedMax || estimatedMax <= resting) return null;

  const reserve = estimatedMax - resting;
  const percent = (bpm - resting) / reserve;
  const intensityId = classifyPercent(percent);
  if (!intensityId) return null;

  return {
    source: SOURCE,
    method: METHOD.HEART_RATE_RESERVE,
    intensityId,
    heartRate: round(bpm, 1),
    restingHeartRate: round(resting, 1),
    maxHeartRate: round(estimatedMax, 1),
    heartRateReserve: round(reserve, 1),
    percent: round(percent, 4),
    percentDisplay: round(percent * 100, 1),
    formula,
    estimated: maxHeartRate === null
  };
}

function classifyHeartRate({
  age,
  heartRate,
  restingHeartRate = null,
  maxHeartRate = null,
  preferHeartRateReserve = true,
  formula = MAX_HR_FORMULA.SIMPLE
} = {}) {
  if (preferHeartRateReserve && normalizeHeartRate(restingHeartRate)) {
    const reserveResult = classifyFromHeartRateReserve({
      age,
      heartRate,
      restingHeartRate,
      maxHeartRate,
      formula
    });

    if (reserveResult) return reserveResult;
  }

  return classifyFromMaxHeartRate({
    age,
    heartRate,
    maxHeartRate,
    formula
  });
}

function getIntensityLabel(intensityId) {
  switch (intensityId) {
    case INTENSITY.VERY_LIGHT:
      return "Very Light";
    case INTENSITY.LIGHT:
      return "Light";
    case INTENSITY.MODERATE:
      return "Moderate";
    case INTENSITY.VIGOROUS:
      return "Vigorous";
    case INTENSITY.NEAR_MAXIMAL:
      return "Near Maximal";
    case INTENSITY.MAXIMAL:
      return "Maximal";
    default:
      return null;
  }
}

function toCalorieIntensity(intensityId) {
  switch (intensityId) {
    case INTENSITY.VERY_LIGHT:
    case INTENSITY.LIGHT:
      return "light";
    case INTENSITY.MODERATE:
      return "moderate";
    case INTENSITY.VIGOROUS:
    case INTENSITY.NEAR_MAXIMAL:
    case INTENSITY.MAXIMAL:
      return "vigorous";
    default:
      return null;
  }
}

function getZoneSummary(result) {
  if (!result || typeof result !== "object") return null;

  return {
    intensityId: result.intensityId,
    label: getIntensityLabel(result.intensityId),
    calorieIntensity: toCalorieIntensity(result.intensityId),
    method: result.method,
    heartRate: result.heartRate,
    percent: result.percent,
    percentDisplay: result.percentDisplay,
    maxHeartRate: result.maxHeartRate,
    restingHeartRate: result.restingHeartRate,
    heartRateReserve: result.heartRateReserve,
    estimated: result.estimated
  };
}

const AriTrainingHeartRateIntensity = Object.freeze({
  version: VERSION,
  source: SOURCE,
  methods: METHOD,
  intensities: INTENSITY,
  maxHeartRateFormulas: MAX_HR_FORMULA,
  estimateMaxHeartRate,
  classifyPercent,
  classifyFromMaxHeartRate,
  classifyFromHeartRateReserve,
  classify: classifyHeartRate,
  getIntensityLabel,
  toCalorieIntensity,
  getZoneSummary
});

if (typeof globalThis !== "undefined") {
  const Ari = globalThis.Ari || {};
  Ari.training = Ari.training || {};
  Ari.training.energy = Ari.training.energy || {};
  Ari.training.energy.heartRateIntensity = AriTrainingHeartRateIntensity;
  globalThis.Ari = Ari;
}

export {
  VERSION,
  SOURCE,
  METHOD,
  INTENSITY,
  MAX_HR_FORMULA,
  estimateMaxHeartRate,
  classifyPercent,
  classifyFromMaxHeartRate,
  classifyFromHeartRateReserve,
  classifyHeartRate,
  getIntensityLabel,
  toCalorieIntensity,
  getZoneSummary,
  AriTrainingHeartRateIntensity
};

export default AriTrainingHeartRateIntensity;
