// =====================================================
// ARI REBIRTH
// File: js/goals.js
// Version: 2.5.1
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

const GOALS_VERSION = "2.5.1";

const STORAGE_KEYS = Object.freeze({
  goals: "calbuddyGoals",
  dailyCalorieGoal: "calbuddyDailyCalorieGoal",
  caloriesConsumed: "calbuddyCaloriesConsumed",
  macroNutritionStrategy: "calbuddyMacroNutritionStrategy",
  dailyNutritionTargets: "calbuddyDailyNutritionTargets",

  currentWeight: "calbuddyCurrentWeight",
  age: "calbuddyAge",
  restingHeartRate: "calbuddyRestingHeartRate",
  estimatedMaxHeartRate: "calbuddyEstimatedMaxHeartRate",
  confirmedMaxHeartRate: "calbuddyConfirmedMaxHeartRate",

  workoutProgress: "ari_training_workout_progress_v1"
});

const goalInputs = [
  "age",
  "sex",
  "weight",
  "height",
  "restingHeartRate",
  "confirmedMaxHeartRate",
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

/* =====================================================
   STARTUP
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  goalInputs.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("input", () => {
      calculateGoals();
      scheduleGoalsAutoSave();
    });

    element.addEventListener("change", () => {
      calculateGoals();
      scheduleGoalsAutoSave(150);
    });
  });

  document
    .getElementById("dietPreference")
    ?.addEventListener("change", updateDietOtherUI);

  document
    .getElementById("confirmedMaxHeartRateToggle")
    ?.addEventListener("click", toggleConfirmedMaxHeartRate);

  document
    .getElementById("clearConfirmedMaxHeartRateButton")
    ?.addEventListener("click", clearConfirmedMaxHeartRate);

  const dailyCalorieGoalInput =
    document.getElementById("dailyCalorieGoalInput");

  dailyCalorieGoalInput?.addEventListener("input", () => {
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

    updateDailyCalorieGoalPreview();

    if (value !== null) {
      scheduleGoalsAutoSave(150);
    }
  });

  window.addEventListener("storage", (event) => {
    const relevantKeys = new Set([
      STORAGE_KEYS.caloriesConsumed,
      STORAGE_KEYS.workoutProgress
    ]);

    if (!event.key || relevantKeys.has(event.key)) {
      calculateGoals();
    }
  });

  window.addEventListener("focus", () => {
    calculateGoals();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      calculateGoals();
    }
  });

  await loadSavedGoals();

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
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.replace("home.html");
}

function goHome() {
  window.location.replace("home.html");
}

function showHealthTab(tab) {
  const isGoals = tab === "goals";

  document
    .getElementById("healthGoalsTab")
    ?.classList.toggle("active", isGoals);

  document
    .getElementById("healthProgressTab")
    ?.classList.toggle("active", !isGoals);

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

  group.style.display =
    preference === "other"
      ? "block"
      : "none";
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

function parseConfirmedMaxHeartRate(value) {
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

  const estimatedMaxHeartRate =
    estimateMaxHeartRate(age);

  const confirmedMaxHeartRate =
    parseConfirmedMaxHeartRate(
      document.getElementById("confirmedMaxHeartRate")?.value
    );

  const effectiveMaxHeartRate =
    confirmedMaxHeartRate ??
    estimatedMaxHeartRate;

  return {
    restingHeartRate,
    estimatedMaxHeartRate,
    confirmedMaxHeartRate,
    effectiveMaxHeartRate,

    maxHeartRateSource:
      confirmedMaxHeartRate !== null
        ? "confirmed"
        : estimatedMaxHeartRate !== null
          ? "estimated"
          : null
  };
}

function updateHeartRateUI(age) {
  const profile =
    getHeartRateProfile(age);

  const estimatedEl =
    document.getElementById("estimatedMaxHeartRate");

  const sourceEl =
    document.getElementById("maxHeartRateSource");

  const statusEl =
    document.getElementById("effectiveMaxHeartRateStatus");

  const confirmedGroup =
    document.getElementById("confirmedMaxHeartRateGroup");

  const confirmedToggle =
    document.getElementById("confirmedMaxHeartRateToggle");

  if (estimatedEl) {
    estimatedEl.textContent =
      profile.estimatedMaxHeartRate !== null
        ? `${profile.estimatedMaxHeartRate} bpm`
        : "\u2014 bpm";
  }

  if (sourceEl) {
    sourceEl.textContent =
      profile.estimatedMaxHeartRate !== null
        ? "Age-based estimate used unless you enter a confirmed maximum."
        : "Enter a valid age so ARI can estimate your maximum heart rate.";
  }

  if (profile.confirmedMaxHeartRate !== null) {
    if (confirmedGroup) {
      confirmedGroup.hidden = false;
    }

    confirmedToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    if (statusEl) {
      statusEl.textContent =
        `ARI Training will use your confirmed max heart rate of ${profile.confirmedMaxHeartRate} bpm.`;

      statusEl.classList.remove("error");
      statusEl.classList.add("success");
    }
  } else {
    if (statusEl) {
      statusEl.classList.remove(
        "error",
        "success"
      );

      statusEl.textContent =
        profile.estimatedMaxHeartRate !== null
          ? `ARI Training will use the estimated max of ${profile.estimatedMaxHeartRate} bpm unless you provide a confirmed value.`
          : "";
    }
  }

  return profile;
}

function toggleConfirmedMaxHeartRate() {
  const group =
    document.getElementById("confirmedMaxHeartRateGroup");

  const button =
    document.getElementById("confirmedMaxHeartRateToggle");

  if (!group) return;

  const willOpen =
    group.hidden;

  group.hidden =
    !willOpen;

  button?.setAttribute(
    "aria-expanded",
    String(willOpen)
  );

  if (willOpen) {
    document
      .getElementById("confirmedMaxHeartRate")
      ?.focus();
  }
}

function clearConfirmedMaxHeartRate() {
  const input =
    document.getElementById("confirmedMaxHeartRate");

  const group =
    document.getElementById("confirmedMaxHeartRateGroup");

  const button =
    document.getElementById("confirmedMaxHeartRateToggle");

  if (input) {
    input.value = "";
  }

  localStorage.removeItem(
    STORAGE_KEYS.confirmedMaxHeartRate
  );

  if (group) {
    group.hidden = true;
  }

  button?.setAttribute(
    "aria-expanded",
    "false"
  );

  calculateGoals();
  scheduleGoalsAutoSave(150);
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
    timeline
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
      "goals-nutrition-targets-v2.5.1"
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

  const isActivelyEditing =
    input &&
    document.activeElement === input;

  const inputValue =
    parseDailyCalorieGoal(
      input?.value
    );

  if (inputValue !== null) {
    return inputValue;
  }

  const savedValue =
    parseDailyCalorieGoal(
      localStorage.getItem(
        STORAGE_KEYS.dailyCalorieGoal
      )
    );

  if (isActivelyEditing) {
    return (
      savedValue ??
      calculatedCalorieEstimate
    );
  }

  if (savedValue !== null) {
    if (input) {
      input.value =
        String(savedValue);
    }

    return savedValue;
  }

  if (input) {
    input.value =
      String(calculatedCalorieEstimate);
  }

  return calculatedCalorieEstimate;
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

    activity: calculated.activity,
    goalMode: calculated.goalMode,
    targetWeight: calculated.targetWeight,
    weeklyChange: calculated.weeklyChange,
    calorieGoal: calculated.dailyCalorieGoal,

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
   * Heart-rate values stay in the ARI local training profile
   * for now so this remains compatible with the current
   * Supabase profiles schema.
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
  const firstAttempt =
    await window.calbuddySupabase
      .from("profiles")
      .upsert(
        profilePayload,
        { onConflict: "id" }
      );

  if (
    !firstAttempt.error ||
    !isMissingColumnError(
      firstAttempt.error,
      "macro_nutrition_strategy"
    )
  ) {
    return firstAttempt;
  }

  const fallbackPayload = {
    ...profilePayload
  };

  delete fallbackPayload
    .macro_nutrition_strategy;

  console.warn(
    "profiles.macro_nutrition_strategy is not available yet. " +
    "The strategy remains saved on this device."
  );

  return window.calbuddySupabase
    .from("profiles")
    .upsert(
      fallbackPayload,
      { onConflict: "id" }
    );
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
    readStoredNumber(
      STORAGE_KEYS.caloriesConsumed
    ) || 0;

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
    readTrainingCaloriesBurnedToday();

  setText(
    "caloriesBurnedText",
    Math.round(burned).toLocaleString()
  );

  return burned;
}

function readTrainingCaloriesBurnedToday() {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEYS.workoutProgress
      );

    if (!raw) {
      return 0;
    }

    const parsed =
      JSON.parse(raw);

    /*
     * Do not display a stale weekday from a previous week.
     */
    const expectedWeekKey =
      getCurrentWeekKey();

    if (
      parsed?.weekKey &&
      parsed.weekKey !== expectedWeekKey
    ) {
      return 0;
    }

    const day =
      getCurrentWeekdayId();

    const exercises =
      parsed?.days?.[day]
        ?.exercises;

    if (
      !exercises ||
      typeof exercises !== "object"
    ) {
      return 0;
    }

    let total = 0;

    for (
      const progress
      of Object.values(exercises)
    ) {
      if (
        !progress ||
        typeof progress !== "object"
      ) {
        continue;
      }

      const direct =
        Number(
          progress.estimatedCalories
        );

      if (
        Number.isFinite(direct) &&
        direct > 0
      ) {
        total += direct;
        continue;
      }

      /*
       * Backward-compatible fallback for set-level records.
       */
      const completedSets =
        progress.completedSets;

      if (
        !completedSets ||
        typeof completedSets !== "object"
      ) {
        continue;
      }

      for (
        const setRecord
        of Object.values(completedSets)
      ) {
        if (
          !setRecord ||
          typeof setRecord !== "object" ||
          !setRecord.completed
        ) {
          continue;
        }

        const calories =
          Number(
            setRecord.estimatedCalories
          );

        if (
          Number.isFinite(calories) &&
          calories > 0
        ) {
          total += calories;
        }
      }
    }

    return Math.max(total, 0);
  } catch (error) {
    console.warn(
      "Could not read ARI Training calories:",
      error
    );

    return 0;
  }
}

function getCurrentWeekdayId() {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ][new Date().getDay()];
}

function getCurrentWeekKey() {
  const now =
    new Date();

  const monday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const day =
    monday.getDay();

  const daysSinceMonday =
    day === 0
      ? 6
      : day - 1;

  monday.setDate(
    monday.getDate() -
    daysSinceMonday
  );

  return getLocalDateKey(monday);
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
    timeline
  } = summary;

  setText(
    "progressWeight",
    weightLbs
      ? `${weightLbs} lb`
      : "\u2014"
  );

  setText(
    "progressTargetWeight",
    targetWeight
      ? `${targetWeight} lb`
      : "\u2014"
  );

  setText(
    "progressBmi",
    bmiText || "\u2014"
  );

  setText(
    "progressCalories",
    dailyCalorieGoal
      ? `${dailyCalorieGoal} kcal/day`
      : "\u2014"
  );

  setText(
    "progressTimeline",
    timeline || "\u2014"
  );
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
          localTrainingProfile.restingHeartRate,

        confirmedMaxHeartRate:
          localTrainingProfile.confirmedMaxHeartRate
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

      confirmedMaxHeartRate:
        localTrainingProfile.confirmedMaxHeartRate
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

      confirmedMaxHeartRate:
        parsedGoals.confirmedMaxHeartRate ??
        localTrainingProfile.confirmedMaxHeartRate
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

    confirmedMaxHeartRate:
      parseConfirmedMaxHeartRate(
        localStorage.getItem(
          STORAGE_KEYS.confirmedMaxHeartRate
        )
      )
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

  setInputValue(
    "confirmedMaxHeartRate",
    goals.confirmedMaxHeartRate || ""
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

  const confirmedGroup =
    document.getElementById(
      "confirmedMaxHeartRateGroup"
    );

  const confirmedToggle =
    document.getElementById(
      "confirmedMaxHeartRateToggle"
    );

  if (
    parseConfirmedMaxHeartRate(
      goals.confirmedMaxHeartRate
    ) !== null
  ) {
    if (confirmedGroup) {
      confirmedGroup.hidden = false;
    }

    confirmedToggle?.setAttribute(
      "aria-expanded",
      "true"
    );
  } else {
    if (confirmedGroup) {
      confirmedGroup.hidden = true;
    }

    confirmedToggle?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  const savedDailyCalorieGoal =
    parseDailyCalorieGoal(
      goals.calorieGoal
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
