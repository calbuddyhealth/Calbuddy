// =====================================================
// ARI REBIRTH
// File: js/goals.js
// Version: 3.0.0
//
// Purpose:
//   Health-goals controller for goals.html.
//
// V2.5.1 changes:
//   - Calories burned are displayed separately from Calories Left.
//   - Calories burned NEVER increase the user's food allowance.
//   - Calories Left = Daily Calorie Goal - Calories Consumed.
//   - Adds Resting Heart Rate support.
//   - Calculates an age-based Estimated Max Heart Rate.
//   - Supports an optional Confirmed Max Heart Rate override.
//   - Saves age, weight, resting HR, estimated max HR, and confirmed
//     max HR locally so ARI Training can reuse them automatically.
//   - Reads today's completed training calories from
//     workout-progress-store.js.
//   - Removes manual calories-burned logging from Goals.
// =====================================================

const GOALS_VERSION = "3.0.0";

const STORAGE_KEYS = Object.freeze({
  goals: "calbuddyGoals",
  dailyCalorieGoal: "calbuddyDailyCalorieGoal",
  dailyCalorieGoalMode: "calbuddyDailyCalorieGoalMode",
  caloriesConsumed: "calbuddyCaloriesConsumed",
  caloriesConsumedDate: "calbuddyCaloriesConsumedDate",
  macroNutritionStrategy: "calbuddyMacroNutritionStrategy",
  dailyNutritionTargets: "calbuddyDailyNutritionTargets",

  currentWeight: "calbuddyCurrentWeight",
  age: "calbuddyAge",
  restingHeartRate: "calbuddyRestingHeartRate",
  estimatedMaxHeartRate: "calbuddyEstimatedMaxHeartRate",
  confirmedMaxHeartRate: "calbuddyConfirmedMaxHeartRate",
  maxHeartRateMode: "calbuddyMaxHeartRateMode",

  workoutProgress: "ari_training_workout_progress_v3",
  completedSessions: "ari_training_completed_sessions_v2"
});

const goalInputs = [
  "age",
  "sex",
  "weight",
  "height",
  "restingHeartRate",
  "estimatedMaxHeartRate",
  "activity",
  "goalMode",
  "targetWeight",
  "weeklyChange",
  "macroNutritionStrategy",
  "dietPreference",
  "dietOther",
  "foodAllergies",
  "medicalConditions"
];

const MACRO_NUTRITION_STRATEGIES = Object.freeze({
  balance: Object.freeze({
    label: "Balance",
    proteinMultiplier: 1.2,
    fatPercent: 0.30
  }),

  endurance: Object.freeze({
    label: "Endurance",
    proteinMultiplier: 1.4,
    fatPercent: 0.25
  }),

  muscle_building: Object.freeze({
    label: "Muscle Building",
    proteinMultiplier: 1.6,
    fatPercent: 0.25
  })
});

let autoSaveTimer = null;
let isLoadingGoals = true;
let saveRequestSequence = 0;
let trainingSummaryRefresh = null;

let trainingTodaySummary = {
  dateKey: getLocalDateKey(),
  calories: 0,
  status: "incomplete",
  label: "Incomplete",
  detail: "No completed workout yet"
};

/* =====================================================
   STARTUP
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  goalInputs.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("input", () => {
      if (id === "estimatedMaxHeartRate") {
        markMaxHeartRateAsCustom();
      }

      calculateGoals();
      scheduleGoalsAutoSave();
    });

    element.addEventListener("change", () => {
      if (id === "estimatedMaxHeartRate") {
        markMaxHeartRateAsCustom();
      }

      calculateGoals();
      scheduleGoalsAutoSave(150);
    });
  });

  document
    .getElementById("dietPreference")
    ?.addEventListener("change", updateDietOtherUI);

  const dailyCalorieGoalInput =
    document.getElementById("dailyCalorieGoalInput");

  dailyCalorieGoalInput?.addEventListener("input", () => {
    markDailyCalorieGoalAsCustom();

    const value = parseDailyCalorieGoal(
      dailyCalorieGoalInput.value
    );

    updateDailyCalorieGoalPreview();

    if (value !== null) {
      scheduleGoalsAutoSave();
    } else {
      window.clearTimeout(autoSaveTimer);
    }
  });

  dailyCalorieGoalInput?.addEventListener("change", () => {
    const value = parseDailyCalorieGoal(
      dailyCalorieGoalInput.value
    );

    if (value === null) {
      dailyCalorieGoalInput.dataset.mode = "auto";

      localStorage.setItem(
        STORAGE_KEYS.dailyCalorieGoalMode,
        "auto"
      );

      calculateGoals();
      setDailyCalorieGoalStatus("");
      scheduleGoalsAutoSave(150);
      return;
    }

    updateDailyCalorieGoalPreview();

    if (value !== null) {
      scheduleGoalsAutoSave(150);
    }
  });

  window.addEventListener("storage", (event) => {
    const relevantKeys = new Set([
      STORAGE_KEYS.caloriesConsumed,
      STORAGE_KEYS.caloriesConsumedDate,
      STORAGE_KEYS.workoutProgress,
      STORAGE_KEYS.completedSessions
    ]);

    if (!event.key || relevantKeys.has(event.key)) {
      void refreshTrainingTodaySummary();
    }
  });

  window.addEventListener("focus", () => {
    void refreshTrainingTodaySummary();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void refreshTrainingTodaySummary();
    }
  });

  await loadSavedGoals();

  await refreshTrainingTodaySummary();

  isLoadingGoals = false;

  calculateGoals();

  console.info(
    `[ARI Goals] Runtime initialized. Version ${GOALS_VERSION}.`
  );
});

/* =====================================================
   NAVIGATION
===================================================== */

function goBack() {
  window.location.replace("home.html?menu=open");
}

function goHome() {
  window.location.replace("home.html");
}

function showHealthTab(tab) {
  const isGoals = tab === "goals";

  const goalsTab =
    document.getElementById("healthGoalsTab");

  const progressTab =
    document.getElementById("healthProgressTab");

  goalsTab?.classList.toggle("active", isGoals);
  progressTab?.classList.toggle("active", !isGoals);

  goalsTab?.setAttribute(
    "aria-selected",
    String(isGoals)
  );

  progressTab?.setAttribute(
    "aria-selected",
    String(!isGoals)
  );

  document
    .getElementById("healthGoalsPanel")
    ?.classList.toggle("active", isGoals);

  document
    .getElementById("healthProgressPanel")
    ?.classList.toggle("active", !isGoals);

  calculateGoals();
}

/* =====================================================
   BASIC UI
===================================================== */

function setDailyCalorieGoalStatus(message = "", type = "") {
  const statusEl =
    document.getElementById("dailyCalorieGoalMessage");

  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("error", "success");

  if (type) {
    statusEl.classList.add(type);
  }
}

function toggleActivityGuide() {
  const guide =
    document.getElementById("activityGuide");

  if (!guide) return;

  guide.style.display =
    guide.style.display === "block"
      ? "none"
      : "block";
}

function toggleMacroStrategyGuide() {
  const guide =
    document.getElementById("macroStrategyGuide");

  const button =
    document.getElementById("macroStrategyGuideButton");

  if (!guide) return;

  const willOpen =
    guide.style.display !== "block";

  guide.style.display =
    willOpen ? "block" : "none";

  button?.setAttribute(
    "aria-expanded",
    String(willOpen)
  );
}

function updateDietOtherUI() {
  const preference =
    document.getElementById("dietPreference")?.value;

  const group =
    document.getElementById("dietOtherGroup");

  if (!group) return;

  const showOther =
    preference === "other";

  group.hidden = !showOther;
  group.style.display =
    showOther ? "block" : "none";
}

function updateHeightConversion(heightInches) {
  const conversion =
    document.getElementById("heightConversion");

  if (!conversion) return;

  if (!heightInches || heightInches <= 0) {
    conversion.textContent = "Equivalent: \u2014";
    return;
  }

  const feet =
    Math.floor(heightInches / 12);

  const inches =
    (heightInches - feet * 12).toFixed(1);

  conversion.textContent =
    `Equivalent: ${feet} ft ${inches} in`;
}

/* =====================================================
   HEART RATE PROFILE
===================================================== */

function estimateMaxHeartRate(age) {
  const resolvedAge =
    Number(age);

  if (
    !Number.isFinite(resolvedAge) ||
    resolvedAge < 10 ||
    resolvedAge > 120
  ) {
    return null;
  }

  /*
   * Keep this aligned with:
   * js/training/energy/heart-rate-intensity.js
   *
   * ARI default:
   * Estimated Max HR = 220 - age
   */
  return Math.round(
    220 - resolvedAge
  );
}

function parseRestingHeartRate(value) {
  const bpm =
    Math.round(Number(value));

  if (
    !Number.isFinite(bpm) ||
    bpm < 30 ||
    bpm > 220
  ) {
    return null;
  }

  return bpm;
}

function parseMaxHeartRate(value) {
  const bpm =
    Math.round(Number(value));

  if (
    !Number.isFinite(bpm) ||
    bpm < 80 ||
    bpm > 260
  ) {
    return null;
  }

  return bpm;
}

function getHeartRateProfile(age) {
  const restingHeartRate =
    parseRestingHeartRate(
      document.getElementById("restingHeartRate")?.value
    );

  const input =
    document.getElementById("estimatedMaxHeartRate");

  const automaticEstimate =
    estimateMaxHeartRate(age);

  const mode =
    input?.dataset.mode === "custom"
      ? "custom"
      : "auto";

  if (
    input &&
    mode === "auto" &&
    automaticEstimate !== null
  ) {
    input.value =
      String(automaticEstimate);
  }

  const editableMaxHeartRate =
    parseMaxHeartRate(input?.value) ??
    automaticEstimate;

  /*
   * The existing confirmed field remains a persistence bridge for
   * custom edits so older ARI Training builds can use the same value.
   * The Goals UI intentionally exposes one editable max-HR field only.
   */
  const confirmedMaxHeartRate =
    mode === "custom"
      ? editableMaxHeartRate
      : null;

  return {
    restingHeartRate,
    automaticEstimate,
    estimatedMaxHeartRate:
      editableMaxHeartRate,
    confirmedMaxHeartRate,
    effectiveMaxHeartRate:
      editableMaxHeartRate,

    maxHeartRateSource:
      editableMaxHeartRate !== null
        ? mode
        : automaticEstimate !== null
          ? "estimated"
          : null,

    maxHeartRateMode:
      mode
  };
}

function updateHeartRateUI(age) {
  const profile =
    getHeartRateProfile(age);

  const sourceEl =
    document.getElementById("maxHeartRateSource");

  if (sourceEl) {
    sourceEl.textContent =
      profile.maxHeartRateMode === "custom"
        ? "EDITED"
        : "AUTO";
  }

  return profile;
}

function markMaxHeartRateAsCustom() {
  const input =
    document.getElementById("estimatedMaxHeartRate");

  if (!input) return;

  input.dataset.mode = "custom";

  localStorage.setItem(
    STORAGE_KEYS.maxHeartRateMode,
    "custom"
  );
}

/* =====================================================
   GOAL CALCULATIONS
===================================================== */

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Below healthy range";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Working toward healthy range";
  return "Above healthy range";
}

function updateGoalModeUI() {
  const goalMode =
    document.getElementById("goalMode")?.value;

  const weeklyGroup =
    document.getElementById("weeklyChangeGroup");

  const helper =
    document.getElementById("goalModeHelper");

  if (!goalMode || !weeklyGroup || !helper) return;

  weeklyGroup.style.display =
    goalMode === "maintain"
      ? "none"
      : "block";

  if (goalMode === "lose") {
    helper.textContent =
      "For weight loss, this creates a calorie deficit.";
  } else if (goalMode === "gain") {
    helper.textContent =
      "For weight gain, this creates a calorie surplus.";
  }
}

function calculateGoals() {
  updateGoalModeUI();
  updateDietOtherUI();

  const age =
    parseFloat(
      document.getElementById("age")?.value
    );

  const sex =
    document.getElementById("sex")?.value;

  const weightLbs =
    parseFloat(
      document.getElementById("weight")?.value
    );

  const heightInches =
    parseFloat(
      document.getElementById("height")?.value
    );

  const activity =
    parseFloat(
      document.getElementById("activity")?.value
    );

  const goalMode =
    document.getElementById("goalMode")?.value;

  const targetWeight =
    parseFloat(
      document.getElementById("targetWeight")?.value
    );

  const weeklyChange =
    parseFloat(
      document.getElementById("weeklyChange")?.value
    );

  const macroNutritionStrategy =
    resolveMacroNutritionStrategy(
      document.getElementById("macroNutritionStrategy")?.value
    );

  updateHeightConversion(heightInches);

  const heartRateProfile =
    updateHeartRateUI(age);

  if (!age || !weightLbs || !heightInches || !activity) {
    setText("calorieGoal", "\u2014 kcal");
    setText("maintenanceBox", "\u2014");
    setText("bmiBox", "\u2014");
    setText("timeToGoal", "\u2014");
    setText("goalDate", "\u2014");
    setText("caloriesLeftText", "\u2014");

    updateCaloriesBurnedDisplay();
    clearNutritionTargetPreview();

    return null;
  }

  const weightKg =
    weightLbs / 2.20462;

  const heightCm =
    heightInches * 2.54;

  let bmr;

  if (sex === "male") {
    bmr =
      10 * weightKg +
      6.25 * heightCm -
      5 * age +
      5;
  } else {
    bmr =
      10 * weightKg +
      6.25 * heightCm -
      5 * age -
      161;
  }

  const maintenance =
    Math.round(
      bmr * activity
    );

  let calculatedCalorieEstimate =
    maintenance;

  if (goalMode === "lose") {
    calculatedCalorieEstimate =
      Math.round(
        maintenance -
        weeklyChange * 500
      );
  }

  if (goalMode === "gain") {
    calculatedCalorieEstimate =
      Math.round(
        maintenance +
        weeklyChange * 500
      );
  }

  const dailyCalorieGoal =
    resolveDailyCalorieGoal(
      calculatedCalorieEstimate
    );

  setText(
    "calorieGoal",
    `${calculatedCalorieEstimate} kcal`
  );

  setText(
    "maintenanceBox",
    `${maintenance} kcal`
  );

  const explanation =
    document.getElementById("goalExplanation");

  if (explanation) {
    if (goalMode === "lose") {
      explanation.textContent =
        "Maintenance and timeline estimates based on your current information and weight-loss goal.";
    } else if (goalMode === "gain") {
      explanation.textContent =
        "Maintenance and timeline estimates based on your current information and weight-gain goal.";
    } else {
      explanation.textContent =
        "Maintenance estimates based on your current body information and activity level.";
    }
  }

  updateCalorieWarning(
    dailyCalorieGoal,
    sex,
    goalMode
  );

  const bmi =
    (
      weightLbs /
      (
        heightInches *
        heightInches
      )
    ) * 703;

  const bmiText =
    `${bmi.toFixed(1)} \u2014 ${getBmiCategory(bmi)}`;

  setText("bmiBox", bmiText);
  setText("progressBmi", bmiText);

  const timeline =
    updateTimeAndDate(
      weightLbs,
      targetWeight,
      weeklyChange,
      goalMode
    );

  setText(
    "summaryCurrentWeight",
    `${formatGoalWeight(weightLbs)} lb`
  );

  setText(
    "summaryTargetWeight",
    `${formatGoalWeight(targetWeight)} lb`
  );

  const nutritionTargets =
    calculateDailyNutritionTargets({
      dailyCalories: dailyCalorieGoal,
      weightLbs,
      sex,
      strategy: macroNutritionStrategy
    });

  updateNutritionTargetPreview(
    nutritionTargets
  );

  cacheNutritionTargets(
    nutritionTargets
  );

  updateCaloriesMeter(
    dailyCalorieGoal
  );

  updateProgressSummary({
    weightLbs,
    targetWeight,
    dailyCalorieGoal,
    bmiText,
    timeline,
    goalDate:
      document.getElementById("goalDate")?.textContent ||
      "\u2014"
  });

  return {
    age,
    sex,
    weightLbs,
    heightInches,
    activity,
    goalMode,
    targetWeight,
    weeklyChange,
    dailyCalorieGoal,
    dailyCalorieGoalMode:
      document.getElementById("dailyCalorieGoalInput")?.dataset.mode === "custom"
        ? "custom"
        : "auto",
    calculatedCalorieEstimate,
    maintenance,
    macroNutritionStrategy,
    nutritionTargets,

    restingHeartRate:
      heartRateProfile.restingHeartRate,

    estimatedMaxHeartRate:
      heartRateProfile.estimatedMaxHeartRate,

    confirmedMaxHeartRate:
      heartRateProfile.confirmedMaxHeartRate,

    effectiveMaxHeartRate:
      heartRateProfile.effectiveMaxHeartRate,

    maxHeartRateSource:
      heartRateProfile.maxHeartRateSource,

    maxHeartRateMode:
      heartRateProfile.maxHeartRateMode,

    dietPreference:
      getValue("dietPreference"),

    dietOther:
      getValue("dietOther"),

    foodAllergies:
      getValue("foodAllergies"),

    medicalConditions:
      getValue("medicalConditions")
  };
}

/* =====================================================
   NUTRITION TARGETS
===================================================== */

function resolveMacroNutritionStrategy(value) {
  return MACRO_NUTRITION_STRATEGIES[value]
    ? value
    : "balance";
}

function calculateDailyNutritionTargets({
  dailyCalories,
  weightLbs,
  sex,
  strategy
}) {
  const resolvedStrategy =
    resolveMacroNutritionStrategy(strategy);

  const strategyConfig =
    MACRO_NUTRITION_STRATEGIES[resolvedStrategy];

  const calories =
    Math.max(
      Math.round(Number(dailyCalories) || 0),
      0
    );

  const weightKg =
    Math.max(Number(weightLbs) || 0, 0) / 2.20462;

  const weightBasedProteinGrams =
    Math.round(
      weightKg *
      strategyConfig.proteinMultiplier
    );

  const minimumProteinGrams =
    Math.ceil(
      (calories * 0.10) / 4
    );

  const maximumProteinGrams =
    Math.floor(
      (calories * 0.35) / 4
    );

  const proteinGrams =
    calories > 0
      ? Math.min(
          Math.max(
            weightBasedProteinGrams,
            minimumProteinGrams
          ),
          maximumProteinGrams
        )
      : weightBasedProteinGrams;

  const fatGrams =
    Math.round(
      (calories * strategyConfig.fatPercent) / 9
    );

  const proteinCalories =
    proteinGrams * 4;

  const fatCalories =
    fatGrams * 9;

  const carbohydrateCalories =
    Math.max(
      calories -
      proteinCalories -
      fatCalories,
      0
    );

  const carbohydrateGrams =
    Math.round(
      carbohydrateCalories / 4
    );

  const fiberGrams =
    Math.round(
      (calories / 1000) * 14
    );

  const hydrationOz =
    sex === "female"
      ? 74
      : 101;

  const proteinPercent =
    calories > 0
      ? Math.round(
          (proteinCalories / calories) * 100
        )
      : 0;

  const carbohydratePercent =
    calories > 0
      ? Math.round(
          ((carbohydrateGrams * 4) / calories) * 100
        )
      : 0;

  const fatPercent =
    calories > 0
      ? Math.round(
          (fatCalories / calories) * 100
        )
      : 0;

  return {
    strategy: resolvedStrategy,
    strategyLabel: strategyConfig.label,
    calories,

    proteinMultiplier:
      strategyConfig.proteinMultiplier,

    macroPercentages: {
      protein: proteinPercent,
      carbohydrates: carbohydratePercent,
      fat: fatPercent
    },

    proteinGrams,
    carbohydrateGrams,
    fatGrams,
    fiberGrams,
    hydrationOz,

    calculatedAt:
      new Date().toISOString(),

    source:
      "goals-nutrition-targets-v2.5.2"
  };
}

function updateNutritionTargetPreview(targets) {
  if (!targets) {
    clearNutritionTargetPreview();
    return;
  }

  setText(
    "macroStrategySummary",
    targets.strategyLabel
  );

  setText(
    "proteinTarget",
    `${targets.proteinGrams} g`
  );

  setText(
    "carbohydrateTarget",
    `${targets.carbohydrateGrams} g`
  );

  setText(
    "fatTarget",
    `${targets.fatGrams} g`
  );

  setText(
    "fiberTarget",
    `${targets.fiberGrams} g`
  );

  setText(
    "hydrationTarget",
    `${targets.hydrationOz} oz`
  );
}

function clearNutritionTargetPreview() {
  setText("macroStrategySummary", "\u2014");
  setText("proteinTarget", "\u2014");
  setText("carbohydrateTarget", "\u2014");
  setText("fatTarget", "\u2014");
  setText("fiberTarget", "\u2014");
  setText("hydrationTarget", "\u2014");
}

function cacheNutritionTargets(targets) {
  if (!targets) return;

  localStorage.setItem(
    STORAGE_KEYS.macroNutritionStrategy,
    targets.strategy
  );

  localStorage.setItem(
    STORAGE_KEYS.dailyNutritionTargets,
    JSON.stringify(targets)
  );
}

/* =====================================================
   DAILY CALORIE GOAL
===================================================== */

function resolveDailyCalorieGoal(
  calculatedCalorieEstimate
) {
  const input =
    document.getElementById("dailyCalorieGoalInput");

  const mode =
    input?.dataset.mode === "custom"
      ? "custom"
      : "auto";

  const inputValue =
    parseDailyCalorieGoal(
      input?.value
    );

  if (
    mode === "custom" &&
    inputValue !== null
  ) {
    return inputValue;
  }

  const savedValue =
    parseDailyCalorieGoal(
      localStorage.getItem(
        STORAGE_KEYS.dailyCalorieGoal
      )
    );

  if (
    mode === "custom" &&
    savedValue !== null
  ) {
    if (input) {
      input.value =
        String(savedValue);
    }

    return savedValue;
  }

  if (input) {
    input.value =
      String(calculatedCalorieEstimate);

    input.dataset.mode = "auto";
  }

  updateDailyCalorieGoalModeChip("auto");

  return calculatedCalorieEstimate;
}

function markDailyCalorieGoalAsCustom() {
  const input =
    document.getElementById("dailyCalorieGoalInput");

  if (!input) return;

  input.dataset.mode = "custom";

  localStorage.setItem(
    STORAGE_KEYS.dailyCalorieGoalMode,
    "custom"
  );

  updateDailyCalorieGoalModeChip("custom");
}

function updateDailyCalorieGoalModeChip(mode) {
  setText(
    "dailyCalorieGoalModeChip",
    mode === "custom"
      ? "EDITED"
      : "AUTO ESTIMATE"
  );
}

function parseDailyCalorieGoal(value) {
  const calories =
    Math.round(Number(value));

  if (!Number.isFinite(calories)) {
    return null;
  }

  if (calories < 800 || calories > 10000) {
    return null;
  }

  return calories;
}

function updateDailyCalorieGoalPreview() {
  const goal =
    parseDailyCalorieGoal(
      document.getElementById(
        "dailyCalorieGoalInput"
      )?.value
    );

  if (!goal) {
    setDailyCalorieGoalStatus(
      "Enter a daily calorie goal between 800 and 10,000 kcal.",
      "error"
    );

    return;
  }

  setDailyCalorieGoalStatus("");
  updateCaloriesMeter(goal);

  const calculated =
    calculateGoals();

  if (calculated) {
    updateCalorieWarning(
      goal,
      calculated.sex,
      calculated.goalMode
    );

    updateProgressSummary({
      weightLbs:
        calculated.weightLbs,

      targetWeight:
        calculated.targetWeight,

      dailyCalorieGoal:
        goal,

      bmiText:
        document.getElementById("bmiBox")?.textContent ||
        "\u2014",

      timeline:
        document.getElementById("timeToGoal")?.textContent ||
        "\u2014",

      goalDate:
        document.getElementById("goalDate")?.textContent ||
        "\u2014"
    });
  }
}

/* =====================================================
   AUTOSAVE
===================================================== */

function scheduleGoalsAutoSave(delay = 700) {
  if (isLoadingGoals) return;

  window.clearTimeout(autoSaveTimer);

  autoSaveTimer =
    window.setTimeout(() => {
      persistGoals();
    }, delay);
}

async function persistGoals() {
  if (isLoadingGoals) return;

  const calculated =
    calculateGoals();

  if (
    !calculated ||
    !calculated.dailyCalorieGoal
  ) {
    return;
  }

  const requestSequence =
    ++saveRequestSequence;

  const goals = {
    age: calculated.age,
    sex: calculated.sex,
    weight: calculated.weightLbs,
    height: calculated.heightInches,

    restingHeartRate:
      calculated.restingHeartRate,

    estimatedMaxHeartRate:
      calculated.estimatedMaxHeartRate,

    confirmedMaxHeartRate:
      calculated.confirmedMaxHeartRate,

    effectiveMaxHeartRate:
      calculated.effectiveMaxHeartRate,

    maxHeartRateSource:
      calculated.maxHeartRateSource,

    maxHeartRateMode:
      calculated.maxHeartRateMode,

    activity: calculated.activity,
    goalMode: calculated.goalMode,
    targetWeight: calculated.targetWeight,
    weeklyChange: calculated.weeklyChange,
    calorieGoal: calculated.dailyCalorieGoal,
    dailyCalorieGoalMode:
      calculated.dailyCalorieGoalMode,

    macroNutritionStrategy:
      calculated.macroNutritionStrategy,

    dietPreference:
      calculated.dietPreference,

    dietOther:
      calculated.dietOther,

    foodAllergies:
      calculated.foodAllergies,

    medicalConditions:
      calculated.medicalConditions
  };

  localStorage.setItem(
    STORAGE_KEYS.goals,
    JSON.stringify(goals)
  );

  localStorage.setItem(
    STORAGE_KEYS.dailyCalorieGoal,
    String(calculated.dailyCalorieGoal)
  );

  localStorage.setItem(
    STORAGE_KEYS.dailyCalorieGoalMode,
    calculated.dailyCalorieGoalMode
  );

  localStorage.setItem(
    STORAGE_KEYS.macroNutritionStrategy,
    calculated.macroNutritionStrategy
  );

  cacheTrainingProfileLocally(
    calculated
  );

  cacheNutritionTargets(
    calculated.nutritionTargets
  );

  const user =
    await getCurrentUser();

  if (!user) {
    setDailyCalorieGoalStatus("");
    return;
  }

  /*
   * A custom edit uses the existing max-HR override column as a
   * compatibility bridge. Automatic values continue to derive from age.
   */
  const profilePayload = {
    id: user.id,
    email: user.email || null,
    age: Number(goals.age),
    sex: goals.sex,
    weight_lbs: Number(goals.weight),
    height_in: Number(goals.height),
    activity_level: String(goals.activity),
    goal: goals.goalMode,
    target_weight_lbs: Number(goals.targetWeight),

    weekly_weight_change_goal:
      Number(goals.weeklyChange),

    daily_calorie_goal:
      Number(goals.calorieGoal),

    resting_heart_rate:
      goals.restingHeartRate !== null
        ? Number(goals.restingHeartRate)
        : null,

    confirmed_max_heart_rate:
      goals.confirmedMaxHeartRate !== null
        ? Number(goals.confirmedMaxHeartRate)
        : null,

    updated_at:
      new Date().toISOString()
  };

  await trySaveOptionalHealthFields(
    profilePayload,
    goals
  );

  const { error } =
    await upsertGoalsProfile(
      profilePayload
    );

  if (
    requestSequence !==
    saveRequestSequence
  ) {
    return;
  }

  if (error) {
    console.error(
      "Goals autosave failed:",
      error.message
    );

    setDailyCalorieGoalStatus(
      "Saved on this device, but cloud sync failed.",
      "error"
    );

    return;
  }

  setDailyCalorieGoalStatus("");
}

function cacheTrainingProfileLocally(calculated) {
  if (
    Number.isFinite(
      Number(calculated.age)
    )
  ) {
    localStorage.setItem(
      STORAGE_KEYS.age,
      String(calculated.age)
    );
  }

  if (
    Number.isFinite(
      Number(calculated.weightLbs)
    )
  ) {
    localStorage.setItem(
      STORAGE_KEYS.currentWeight,
      String(calculated.weightLbs)
    );
  }

  if (calculated.restingHeartRate !== null) {
    localStorage.setItem(
      STORAGE_KEYS.restingHeartRate,
      String(calculated.restingHeartRate)
    );
  } else {
    localStorage.removeItem(
      STORAGE_KEYS.restingHeartRate
    );
  }

  if (calculated.estimatedMaxHeartRate !== null) {
    localStorage.setItem(
      STORAGE_KEYS.estimatedMaxHeartRate,
      String(calculated.estimatedMaxHeartRate)
    );
  } else {
    localStorage.removeItem(
      STORAGE_KEYS.estimatedMaxHeartRate
    );
  }

  localStorage.setItem(
    STORAGE_KEYS.maxHeartRateMode,
    calculated.maxHeartRateMode === "custom"
      ? "custom"
      : "auto"
  );

  if (calculated.confirmedMaxHeartRate !== null) {
    localStorage.setItem(
      STORAGE_KEYS.confirmedMaxHeartRate,
      String(calculated.confirmedMaxHeartRate)
    );
  } else {
    localStorage.removeItem(
      STORAGE_KEYS.confirmedMaxHeartRate
    );
  }
}

async function upsertGoalsProfile(profilePayload) {
  let payload = {
    ...profilePayload
  };

  const optionalColumns = [
    "macro_nutrition_strategy",
    "resting_heart_rate",
    "confirmed_max_heart_rate"
  ];

  for (
    let attempt = 0;
    attempt <= optionalColumns.length;
    attempt += 1
  ) {
    const result =
      await window.calbuddySupabase
        .from("profiles")
        .upsert(
          payload,
          { onConflict: "id" }
        );

    if (!result.error) {
      return result;
    }

    const missingColumn =
      optionalColumns.find(
        columnName =>
          Object.prototype.hasOwnProperty.call(
            payload,
            columnName
          ) &&
          isMissingColumnError(
            result.error,
            columnName
          )
      );

    if (!missingColumn) {
      return result;
    }

    console.warn(
      `profiles.${missingColumn} is not available yet. ` +
      "That value remains saved on this device."
    );

    payload = {
      ...payload
    };

    delete payload[
      missingColumn
    ];
  }

  return {
    error: new Error(
      "Goals profile could not be saved after optional-column fallbacks."
    )
  };
}

function isMissingColumnError(error, columnName) {
  const message =
    String(error?.message || "")
      .toLowerCase();

  return message.includes(
    String(columnName)
      .toLowerCase()
  );
}

/* =====================================================
   WARNINGS / TIMELINE
===================================================== */

function updateCalorieWarning(
  dailyCalorieGoal,
  sex,
  goalMode
) {
  const warningBox =
    document.getElementById("warningBox");

  if (!warningBox) return;

  const isLowGoal =
    goalMode === "lose" &&
    (
      (
        sex === "male" &&
        dailyCalorieGoal < 1500
      ) ||
      (
        sex === "female" &&
        dailyCalorieGoal < 1200
      )
    );

  warningBox.style.display =
    isLowGoal
      ? "block"
      : "none";
}

function updateTimeAndDate(
  currentWeight,
  targetWeight,
  weeklyChange,
  goalMode
) {
  if (goalMode === "maintain") {
    setText(
      "timeToGoal",
      "Maintaining current weight"
    );

    setText(
      "goalDate",
      "Not applicable"
    );

    return "Maintaining current weight";
  }

  if (!currentWeight || !targetWeight || !weeklyChange) {
    setText("timeToGoal", "\u2014");
    setText("goalDate", "\u2014");
    return "\u2014";
  }

  let poundsToGoal;

  if (goalMode === "lose") {
    poundsToGoal =
      currentWeight -
      targetWeight;
  } else {
    poundsToGoal =
      targetWeight -
      currentWeight;
  }

  if (poundsToGoal <= 0) {
    setText(
      "timeToGoal",
      "Already at or past target"
    );

    setText("goalDate", "\u2014");

    return "Already at or past target";
  }

  const weeks =
    poundsToGoal /
    weeklyChange;

  const months =
    weeks / 4.345;

  const estimatedGoalDate =
    new Date();

  estimatedGoalDate.setDate(
    estimatedGoalDate.getDate() +
    Math.round(weeks * 7)
  );

  const timeText =
    `${weeks.toFixed(1)} weeks (~${months.toFixed(1)} months)`;

  const dateText =
    estimatedGoalDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    );

  setText("timeToGoal", timeText);
  setText("goalDate", dateText);

  return timeText;
}

/* =====================================================
   CALORIES LEFT + BURNED DISPLAY
===================================================== */

function updateCaloriesMeter(goal) {
  const consumed =
    readCaloriesConsumedToday();

  /*
   * IMPORTANT:
   *
   * Exercise calories DO NOT change this equation.
   *
   * Calories Left =
   * Daily Calorie Goal - Calories Consumed
   */
  const rawRemaining =
    goal - consumed;

  const caloriesLeft =
    Math.max(
      rawRemaining,
      0
    );

  const caloriesOver =
    Math.max(
      consumed - goal,
      0
    );

  const card =
    document.getElementById("calorieStatusCard");

  const label =
    document.getElementById("calorieStatusLabel");

  const percentLeft =
    goal
      ? Math.max(
          0,
          Math.min(
            caloriesLeft / goal,
            1
          )
        )
      : 1;

  const percentUsed =
    goal
      ? Math.max(
          0,
          Math.min(
            consumed / goal,
            1
          )
        )
      : 0;

  if (card) {
    const percent =
      Math.round(
        percentLeft * 100
      );

    card.style.setProperty(
      "--calorie-left-percent",
      `${percent}%`
    );

    card.classList.remove(
      "calorie-low",
      "calorie-critical",
      "calorie-over"
    );

    if (caloriesOver > 0) {
      card.classList.add(
        "calorie-over"
      );

      card.style.setProperty(
        "--calorie-left-percent",
        "100%"
      );

      card.style.setProperty(
        "--calorie-flicker-speed",
        ".55s"
      );
    } else if (percentUsed >= 0.90) {
      card.classList.add(
        "calorie-critical"
      );

      card.style.setProperty(
        "--calorie-flicker-speed",
        ".7s"
      );
    } else if (percentUsed >= 0.75) {
      card.classList.add(
        "calorie-low"
      );

      card.style.setProperty(
        "--calorie-flicker-speed",
        "1.6s"
      );
    } else if (percentUsed >= 0.50) {
      card.style.setProperty(
        "--calorie-flicker-speed",
        "2.4s"
      );
    } else {
      card.style.setProperty(
        "--calorie-flicker-speed",
        "4s"
      );
    }
  }

  if (caloriesOver > 0) {
    setText(
      "caloriesLeftText",
      `+${caloriesOver.toLocaleString()}`
    );

    if (label) {
      label.textContent =
        "Calories Over";
    }
  } else {
    setText(
      "caloriesLeftText",
      caloriesLeft.toLocaleString()
    );

    if (label) {
      label.textContent =
        "Calories Left";
    }
  }

  setText(
    "caloriesConsumedText",
    consumed.toLocaleString()
  );

  /*
   * Show the actual configured food goal.
   * Do not show an exercise-adjusted goal.
   */
  setText(
    "dailyGoalText",
    Number(goal).toLocaleString()
  );

  updateCaloriesBurnedDisplay();
}

function updateCaloriesBurnedDisplay() {
  const burned =
    Number(trainingTodaySummary.calories) || 0;

  setText(
    "caloriesBurnedText",
    Math.round(burned).toLocaleString()
  );

  return burned;
}

function readCaloriesConsumedToday() {
  const storedDate =
    localStorage.getItem(
      STORAGE_KEYS.caloriesConsumedDate
    );

  const activeNutritionDate =
    getActiveNutritionDateKey();

  if (
    storedDate &&
    storedDate !== activeNutritionDate
  ) {
    return 0;
  }

  return Math.max(
    readStoredNumber(
      STORAGE_KEYS.caloriesConsumed
    ) || 0,
    0
  );
}

function getActiveNutritionDateKey() {
  const now =
    new Date();

  let reset = {
    hour: 4,
    minute: 0,
    ampm: "AM"
  };

  try {
    const saved =
      JSON.parse(
        localStorage.getItem("calbuddyResetTime") ||
        "null"
      );

    if (saved && typeof saved === "object") {
      reset = {
        ...reset,
        ...saved
      };
    }
  } catch {
    // Keep the standard 4:00 AM nutrition reset.
  }

  const hour12 =
    Math.min(
      Math.max(
        Math.round(Number(reset.hour) || 4),
        1
      ),
      12
    );

  const ampm =
    String(reset.ampm || "AM")
      .toUpperCase();

  const hour24 =
    ampm === "AM"
      ? hour12 === 12
        ? 0
        : hour12
      : hour12 === 12
        ? 12
        : hour12 + 12;

  const boundary =
    new Date(now);

  boundary.setHours(
    hour24,
    Math.min(
      Math.max(
        Math.round(Number(reset.minute) || 0),
        0
      ),
      59
    ),
    0,
    0
  );

  const nutritionDate =
    new Date(now);

  if (now < boundary) {
    nutritionDate.setDate(
      nutritionDate.getDate() - 1
    );
  }

  return getLocalDateKey(
    nutritionDate
  );
}

async function refreshTrainingTodaySummary() {
  if (trainingSummaryRefresh) {
    return trainingSummaryRefresh;
  }

  trainingSummaryRefresh =
    (async () => {
      const dateKey =
        getLocalDateKey();

      const localCompleted =
        readCompletedTrainingCache(
          dateKey
        );

      const cloudCompleted =
        await fetchCompletedTrainingForDate(
          dateKey
        );

      const completed =
        mergeTrainingSessions(
          localCompleted,
          cloudCompleted
        );

      let progressSummary = null;
      let planDay = null;

      try {
        const [
          progressModule,
          planModule
        ] = await Promise.all([
          import("./training/workout-progress-store.js"),
          import("./training/workout-plan-store.js")
        ]);

        const progressStore =
          progressModule.default;

        const planStore =
          planModule.default;

        progressStore?.hydrate?.();
        planStore?.hydrate?.();

        progressSummary =
          progressStore?.getDaySummary?.(
            dateKey
          ) || null;

        planDay =
          planStore?.getDayByDate?.(
            dateKey
          ) || null;
      } catch (error) {
        console.warn(
          "Could not load today's ARI Training summary:",
          error
        );
      }

      const completedCalories =
        completed.reduce(
          (total, session) =>
            total + Math.max(
              Number(
                session.estimated_calories ??
                session.estimatedCalories
              ) || 0,
              0
            ),
          0
        );

      const progressCalories =
        Math.max(
          Number(
            progressSummary?.estimatedCalories
          ) || 0,
          0
        );

      const hasCompletedWorkout =
        completed.length > 0 ||
        progressSummary?.completed === true ||
        progressSummary?.status === "complete";

      const isOffDay =
        planDay?.type === "off" ||
        progressSummary?.dayType === "off" ||
        progressSummary?.dayType === "recovery" ||
        progressSummary?.status === "rest";

      const inProgress =
        [
          "active",
          "in_progress",
          "paused",
          "finishing"
        ].includes(
          progressSummary?.status
        );

      trainingTodaySummary = {
        dateKey,
        calories:
          completedCalories > 0
            ? completedCalories
            : progressCalories,
        status:
          isOffDay
            ? "off"
            : hasCompletedWorkout
              ? "complete"
              : "incomplete",
        label:
          isOffDay
            ? "Off Day"
            : hasCompletedWorkout
              ? "Complete"
              : "Incomplete",
        detail:
          isOffDay
            ? "Recovery is part of the plan"
            : hasCompletedWorkout
              ? "Today's workout is finished"
              : inProgress
                ? "Workout currently in progress"
                : "No completed workout yet"
      };

      calculateGoals();
      renderTrainingTodaySummary();

      return trainingTodaySummary;
    })().finally(() => {
      trainingSummaryRefresh = null;
    });

  return trainingSummaryRefresh;
}

function readCompletedTrainingCache(dateKey) {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEYS.completedSessions
      );

    if (!raw) return [];

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter(
          session =>
            session?.local_date === dateKey &&
            session?.status === "completed"
        )
      : [];
  } catch (error) {
    console.warn(
      "Could not read the local ARI Training history:",
      error
    );

    return [];
  }
}

async function fetchCompletedTrainingForDate(dateKey) {
  try {
    if (!window.calbuddySupabase) {
      return [];
    }

    const user =
      await getCurrentUser();

    if (!user?.id) {
      return [];
    }

    const { data, error } =
      await window.calbuddySupabase
        .from("ari_workout_sessions")
        .select(
          "id, local_date, status, estimated_calories, completed_at"
        )
        .eq("user_id", user.id)
        .eq("local_date", dateKey)
        .eq("status", "completed");

    if (error) throw error;

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.warn(
      "Could not sync today's completed workouts:",
      error
    );

    return [];
  }
}

function mergeTrainingSessions(...collections) {
  const byId =
    new Map();

  for (const collection of collections) {
    for (const session of collection || []) {
      const key =
        String(
          session?.id ||
          `${session?.local_date || "date"}:${session?.completed_at || "completed"}:${session?.estimated_calories || 0}`
        );

      byId.set(key, session);
    }
  }

  return Array.from(byId.values());
}

function renderTrainingTodaySummary() {
  const date =
    new Date(`${trainingTodaySummary.dateKey}T12:00:00`);

  const dateText =
    Number.isNaN(date.getTime())
      ? "Today"
      : date.toLocaleDateString(
          undefined,
          {
            weekday: "short",
            month: "short",
            day: "numeric"
          }
        );

  setText("calorieSyncDate", dateText);
  setText("progressSummaryDate", dateText);

  setText(
    "progressCaloriesBurned",
    `${Math.round(trainingTodaySummary.calories).toLocaleString()} kcal`
  );

  setText(
    "progressWorkoutStatus",
    trainingTodaySummary.label
  );

  setText(
    "progressWorkoutDetail",
    trainingTodaySummary.detail
  );

  const status =
    document.getElementById("progressWorkoutStatus");

  status?.classList.remove(
    "is-complete",
    "is-incomplete",
    "is-off"
  );

  status?.classList.add(
    trainingTodaySummary.status === "complete"
      ? "is-complete"
      : trainingTodaySummary.status === "off"
        ? "is-off"
        : "is-incomplete"
  );
}

function getLocalDateKey(date = new Date()) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readStoredNumber(key) {
  const raw =
    localStorage.getItem(key);

  if (
    raw === null ||
    raw === ""
  ) {
    return null;
  }

  const direct =
    Number(raw);

  if (Number.isFinite(direct)) {
    return direct;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (
      typeof parsed === "number" &&
      Number.isFinite(parsed)
    ) {
      return parsed;
    }

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      const candidates = [
        parsed.value,
        parsed.calories,
        parsed.goal,
        parsed.dailyCalorieGoal,
        parsed.consumed
      ];

      for (const candidate of candidates) {
        const number =
          Number(candidate);

        if (Number.isFinite(number)) {
          return number;
        }
      }
    }
  } catch {
    // Ignore malformed storage values.
  }

  return null;
}

/* =====================================================
   PROGRESS SUMMARY
===================================================== */

function updateProgressSummary(summary = {}) {
  const {
    weightLbs,
    targetWeight,
    dailyCalorieGoal,
    bmiText,
    timeline,
    goalDate
  } = summary;

  const consumed =
    readCaloriesConsumedToday();

  setText(
    "progressWeight",
    weightLbs
      ? `${formatGoalWeight(weightLbs)} lb`
      : "\u2014"
  );

  setText(
    "progressTargetWeight",
    targetWeight
      ? `${formatGoalWeight(targetWeight)} lb`
      : "\u2014"
  );

  setText(
    "progressBmi",
    bmiText || "\u2014"
  );

  setText(
    "progressCalories",
    dailyCalorieGoal
      ? `${Math.round(consumed).toLocaleString()} / ${Math.round(dailyCalorieGoal).toLocaleString()} kcal`
      : "\u2014"
  );

  setText(
    "progressTimeline",
    timeline || "\u2014"
  );

  setText(
    "progressGoalDate",
    goalDate && goalDate !== "\u2014"
      ? `Goal date ${goalDate}`
      : "Goal date \u2014"
  );

  renderTrainingTodaySummary();
}

/* =====================================================
   CLOUD / LOCAL LOAD
===================================================== */

async function trySaveOptionalHealthFields(
  profilePayload,
  goals
) {
  profilePayload.diet_preference =
    goals.dietPreference || null;

  profilePayload.diet_other =
    goals.dietOther || null;

  profilePayload.food_allergies =
    goals.foodAllergies || null;

  profilePayload.medical_conditions =
    goals.medicalConditions || null;

  profilePayload.macro_nutrition_strategy =
    goals.macroNutritionStrategy || "balance";
}

async function loadSavedGoals() {
  const locallySavedStrategy =
    resolveMacroNutritionStrategy(
      localStorage.getItem(
        STORAGE_KEYS.macroNutritionStrategy
      )
    );

  const localTrainingProfile =
    readLocalTrainingProfile();

  const user =
    await getCurrentUser();

  if (user) {
    const { data, error } =
      await window.calbuddySupabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!error && data) {
      applyGoals({
        age:
          data.age,

        sex:
          data.sex,

        weight:
          data.weight_lbs,

        height:
          data.height_in,

        activity:
          data.activity_level,

        goalMode:
          data.goal,

        targetWeight:
          data.target_weight_lbs,

        weeklyChange:
          data.weekly_weight_change_goal,

        calorieGoal:
          data.daily_calorie_goal,

        dailyCalorieGoalMode:
          localStorage.getItem(
            STORAGE_KEYS.dailyCalorieGoalMode
          ) || "custom",

        macroNutritionStrategy:
          data.macro_nutrition_strategy ||
          locallySavedStrategy,

        dietPreference:
          data.diet_preference,

        dietOther:
          data.diet_other,

        foodAllergies:
          data.food_allergies,

        medicalConditions:
          data.medical_conditions,

        restingHeartRate:
          data.resting_heart_rate ??
          localTrainingProfile.restingHeartRate,

        estimatedMaxHeartRate:
          data.confirmed_max_heart_rate ??
          localTrainingProfile.estimatedMaxHeartRate,

        confirmedMaxHeartRate:
          data.confirmed_max_heart_rate ??
          localTrainingProfile.confirmedMaxHeartRate,

        maxHeartRateMode:
          data.confirmed_max_heart_rate
            ? "custom"
            : localTrainingProfile.maxHeartRateMode
      });

      calculateGoals();
      return;
    }
  }

  const savedGoals =
    localStorage.getItem(
      STORAGE_KEYS.goals
    );

  if (!savedGoals) {
    applyGoals({
      macroNutritionStrategy:
        locallySavedStrategy,

      restingHeartRate:
        localTrainingProfile.restingHeartRate,

      estimatedMaxHeartRate:
        localTrainingProfile.estimatedMaxHeartRate,

      confirmedMaxHeartRate:
        localTrainingProfile.confirmedMaxHeartRate,

      maxHeartRateMode:
        localTrainingProfile.maxHeartRateMode
    });

    calculateGoals();
    return;
  }

  try {
    const parsedGoals =
      JSON.parse(savedGoals);

    applyGoals({
      ...parsedGoals,

      macroNutritionStrategy:
        parsedGoals.macroNutritionStrategy ||
        locallySavedStrategy,

      restingHeartRate:
        parsedGoals.restingHeartRate ??
        localTrainingProfile.restingHeartRate,

      estimatedMaxHeartRate:
        parsedGoals.estimatedMaxHeartRate ??
        localTrainingProfile.estimatedMaxHeartRate,

      confirmedMaxHeartRate:
        parsedGoals.confirmedMaxHeartRate ??
        localTrainingProfile.confirmedMaxHeartRate,

      maxHeartRateMode:
        parsedGoals.maxHeartRateMode ??
        localTrainingProfile.maxHeartRateMode
    });
  } catch (error) {
    console.warn(
      "Could not parse saved goals:",
      error.message
    );
  }

  calculateGoals();
}

function readLocalTrainingProfile() {
  return {
    restingHeartRate:
      parseRestingHeartRate(
        localStorage.getItem(
          STORAGE_KEYS.restingHeartRate
        )
      ),

    estimatedMaxHeartRate:
      parseMaxHeartRate(
        localStorage.getItem(
          STORAGE_KEYS.estimatedMaxHeartRate
        )
      ),

    confirmedMaxHeartRate:
      parseMaxHeartRate(
        localStorage.getItem(
          STORAGE_KEYS.confirmedMaxHeartRate
        )
      ),

    maxHeartRateMode:
      localStorage.getItem(
        STORAGE_KEYS.maxHeartRateMode
      ) === "custom"
        ? "custom"
        : "auto"
  };
}

function applyGoals(goals = {}) {
  setInputValue(
    "age",
    goals.age || "34"
  );

  setInputValue(
    "sex",
    goals.sex || "male"
  );

  setInputValue(
    "weight",
    goals.weight || "185.2"
  );

  setInputValue(
    "height",
    goals.height || "69.8"
  );

  setInputValue(
    "restingHeartRate",
    goals.restingHeartRate || ""
  );

  const automaticMaxHeartRate =
    estimateMaxHeartRate(
      Number(goals.age || 34)
    );

  const legacyCustomMaxHeartRate =
    parseMaxHeartRate(
      goals.confirmedMaxHeartRate
    );

  const savedMaxHeartRate =
    parseMaxHeartRate(
      goals.estimatedMaxHeartRate
    );

  const maxHeartRateMode =
    goals.maxHeartRateMode === "custom" ||
    legacyCustomMaxHeartRate !== null
      ? "custom"
      : "auto";

  const maxHeartRateInput =
    document.getElementById("estimatedMaxHeartRate");

  if (maxHeartRateInput) {
    maxHeartRateInput.dataset.mode =
      maxHeartRateMode;

    maxHeartRateInput.value =
      String(
        maxHeartRateMode === "custom"
          ? legacyCustomMaxHeartRate ??
            savedMaxHeartRate ??
            automaticMaxHeartRate ??
            ""
          : automaticMaxHeartRate ??
            savedMaxHeartRate ??
            ""
      );
  }

  localStorage.setItem(
    STORAGE_KEYS.maxHeartRateMode,
    maxHeartRateMode
  );

  setInputValue(
    "activity",
    goals.activity || "1.55"
  );

  setInputValue(
    "goalMode",
    goals.goalMode || "lose"
  );

  setInputValue(
    "targetWeight",
    goals.targetWeight || "175.0"
  );

  setInputValue(
    "weeklyChange",
    goals.weeklyChange || "1"
  );

  setInputValue(
    "macroNutritionStrategy",
    resolveMacroNutritionStrategy(
      goals.macroNutritionStrategy
    )
  );

  setInputValue(
    "dietPreference",
    goals.dietPreference || "none"
  );

  setInputValue(
    "dietOther",
    goals.dietOther || ""
  );

  setInputValue(
    "foodAllergies",
    goals.foodAllergies || ""
  );

  setInputValue(
    "medicalConditions",
    goals.medicalConditions || ""
  );

  const savedDailyCalorieGoal =
    parseDailyCalorieGoal(
      goals.calorieGoal
    );

  const dailyGoalInput =
    document.getElementById("dailyCalorieGoalInput");

  const dailyGoalMode =
    goals.dailyCalorieGoalMode === "auto"
      ? "auto"
      : savedDailyCalorieGoal
        ? "custom"
        : "auto";

  if (dailyGoalInput) {
    dailyGoalInput.dataset.mode =
      dailyGoalMode;
  }

  updateDailyCalorieGoalModeChip(
    dailyGoalMode
  );

  if (savedDailyCalorieGoal) {
    setInputValue(
      "dailyCalorieGoalInput",
      savedDailyCalorieGoal
    );

    localStorage.setItem(
      STORAGE_KEYS.dailyCalorieGoal,
      String(savedDailyCalorieGoal)
    );
  }

  localStorage.setItem(
    STORAGE_KEYS.macroNutritionStrategy,
    resolveMacroNutritionStrategy(
      goals.macroNutritionStrategy
    )
  );

  updateDietOtherUI();
}

/* =====================================================
   BASIC HELPERS
===================================================== */

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function getValue(id) {
  const element =
    document.getElementById(id);

  return element
    ? String(element.value || "").trim()
    : "";
}

function setInputValue(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function formatGoalWeight(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "\u2014";
  }

  return Number.isInteger(number)
    ? number.toLocaleString()
    : number.toLocaleString(
        undefined,
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      );
}

function logWeightQuick() {
  const current =
    document.getElementById("weight")?.value || "";

  const next =
    prompt(
      "Enter today's weight:",
      current
    );

  if (!next) return;

  setInputValue(
    "weight",
    next
  );

  calculateGoals();
  scheduleGoalsAutoSave(150);
}
