const GOALS_VERSION = "2.4.0";

const goalInputs = [
  "age",
  "sex",
  "weight",
  "height",
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

  const dailyCalorieGoalInput = document.getElementById(
    "dailyCalorieGoalInput"
  );

  dailyCalorieGoalInput?.addEventListener(
    "input",
    () => {
      const value = parseDailyCalorieGoal(
        dailyCalorieGoalInput.value
      );

      updateDailyCalorieGoalPreview();

      /*
       * Do not autosave empty or partial input.
       * Save only after it becomes a complete,
       * valid calorie goal.
       */
      if (value !== null) {
        scheduleGoalsAutoSave();
      } else {
        window.clearTimeout(autoSaveTimer);
      }
    }
  );

  dailyCalorieGoalInput?.addEventListener(
    "change",
    () => {
      const value = parseDailyCalorieGoal(
        dailyCalorieGoalInput.value
      );

      updateDailyCalorieGoalPreview();

      if (value !== null) {
        scheduleGoalsAutoSave(150);
      }
    }
  );

  await loadSavedGoals();
  isLoadingGoals = false;
  calculateGoals();
});

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

  document.getElementById("healthGoalsTab")?.classList.toggle("active", isGoals);
  document.getElementById("healthProgressTab")?.classList.toggle("active", !isGoals);
  document.getElementById("healthGoalsPanel")?.classList.toggle("active", isGoals);
  document.getElementById("healthProgressPanel")?.classList.toggle("active", !isGoals);

  calculateGoals();
}

function setDailyCalorieGoalStatus(message = "", type = "") {
  const statusEl = document.getElementById("dailyCalorieGoalMessage");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("error", "success");

  if (type) {
    statusEl.classList.add(type);
  }
}

function toggleActivityGuide() {
  const guide = document.getElementById("activityGuide");
  if (!guide) return;

  guide.style.display = guide.style.display === "block" ? "none" : "block";
}

function toggleMacroStrategyGuide() {
  const guide = document.getElementById("macroStrategyGuide");
  const button = document.getElementById("macroStrategyGuideButton");

  if (!guide) return;

  const willOpen = guide.style.display !== "block";
  guide.style.display = willOpen ? "block" : "none";
  button?.setAttribute("aria-expanded", String(willOpen));
}

function updateDietOtherUI() {
  const preference = document.getElementById("dietPreference")?.value;
  const group = document.getElementById("dietOtherGroup");

  if (!group) return;

  group.style.display = preference === "other" ? "block" : "none";
}

function updateHeightConversion(heightInches) {
  const conversion = document.getElementById("heightConversion");
  if (!conversion) return;

  if (!heightInches || heightInches <= 0) {
    conversion.textContent = "Equivalent: \u2014";
    return;
  }

  const feet = Math.floor(heightInches / 12);
  const inches = (heightInches - feet * 12).toFixed(1);

  conversion.textContent = `Equivalent: ${feet} ft ${inches} in`;
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Below healthy range";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Working toward healthy range";
  return "Above healthy range";
}

function updateGoalModeUI() {
  const goalMode = document.getElementById("goalMode")?.value;
  const weeklyGroup = document.getElementById("weeklyChangeGroup");
  const helper = document.getElementById("goalModeHelper");

  if (!goalMode || !weeklyGroup || !helper) return;

  weeklyGroup.style.display = goalMode === "maintain" ? "none" : "block";

  if (goalMode === "lose") {
    helper.textContent = "For weight loss, this creates a calorie deficit.";
  } else if (goalMode === "gain") {
    helper.textContent = "For weight gain, this creates a calorie surplus.";
  }
}

function calculateGoals() {
  updateGoalModeUI();
  updateDietOtherUI();

  const age = parseFloat(document.getElementById("age")?.value);
  const sex = document.getElementById("sex")?.value;
  const weightLbs = parseFloat(document.getElementById("weight")?.value);
  const heightInches = parseFloat(document.getElementById("height")?.value);
  const activity = parseFloat(document.getElementById("activity")?.value);
  const goalMode = document.getElementById("goalMode")?.value;
  const targetWeight = parseFloat(document.getElementById("targetWeight")?.value);
  const weeklyChange = parseFloat(document.getElementById("weeklyChange")?.value);
  const macroNutritionStrategy = resolveMacroNutritionStrategy(
    document.getElementById("macroNutritionStrategy")?.value
  );

  updateHeightConversion(heightInches);

  if (!age || !weightLbs || !heightInches || !activity) {
    setText("calorieGoal", "\u2014 kcal");
    setText("maintenanceBox", "\u2014");
    setText("bmiBox", "\u2014");
    setText("timeToGoal", "\u2014");
    setText("goalDate", "\u2014");
    setText("caloriesLeftText", "\u2014");
    clearNutritionTargetPreview();
    return null;
  }

  const weightKg = weightLbs / 2.20462;
  const heightCm = heightInches * 2.54;

  let bmr;

  if (sex === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const maintenance = Math.round(bmr * activity);
  let calculatedCalorieEstimate = maintenance;

  if (goalMode === "lose") {
    calculatedCalorieEstimate = Math.round(
      maintenance - weeklyChange * 500
    );
  }

  if (goalMode === "gain") {
    calculatedCalorieEstimate = Math.round(
      maintenance + weeklyChange * 500
    );
  }

  const dailyCalorieGoal = resolveDailyCalorieGoal(
    calculatedCalorieEstimate
  );

  setText("calorieGoal", `${calculatedCalorieEstimate} kcal`);
  setText("maintenanceBox", `${maintenance} kcal`);

  const explanation = document.getElementById("goalExplanation");

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

  updateCalorieWarning(dailyCalorieGoal, sex, goalMode);

  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  const bmiText = `${bmi.toFixed(1)} \u2014 ${getBmiCategory(bmi)}`;

  setText("bmiBox", bmiText);
  setText("progressBmi", bmiText);

  const timeline = updateTimeAndDate(
    weightLbs,
    targetWeight,
    weeklyChange,
    goalMode
  );

  const nutritionTargets = calculateDailyNutritionTargets({
    dailyCalories: dailyCalorieGoal,
    weightLbs,
    sex,
    strategy: macroNutritionStrategy
  });

  updateNutritionTargetPreview(nutritionTargets);
  cacheNutritionTargets(nutritionTargets);
  updateCaloriesMeter(dailyCalorieGoal);

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
    dietPreference: getValue("dietPreference"),
    dietOther: getValue("dietOther"),
    foodAllergies: getValue("foodAllergies"),
    medicalConditions: getValue("medicalConditions")
  };
}

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

  const calories = Math.max(
    Math.round(Number(dailyCalories) || 0),
    0
  );

  const weightKg =
    Math.max(Number(weightLbs) || 0, 0) / 2.20462;

  /*
   * Protein is calculated from body weight and the
   * selected nutrition strategy:
   *
   * Balance:          1.2 g/kg
   * Endurance:        1.4 g/kg
   * Muscle Building:  1.6 g/kg
   */
  const weightBasedProteinGrams = Math.round(
    weightKg * strategyConfig.proteinMultiplier
  );

  /*
   * Keep protein within 10% to 35% of the active
   * daily calorie goal so the final macro plan
   * remains internally valid.
   */
  const minimumProteinGrams = Math.ceil(
    (calories * 0.10) / 4
  );

  const maximumProteinGrams = Math.floor(
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

  /*
   * Fat remains tied to the active calorie goal
   * and selected strategy.
   */
  const fatGrams = Math.round(
    (calories * strategyConfig.fatPercent) / 9
  );

  /*
   * Carbohydrates receive the calories remaining
   * after protein and fat are assigned.
   */
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;

  const carbohydrateCalories = Math.max(
    calories - proteinCalories - fatCalories,
    0
  );

  const carbohydrateGrams = Math.round(
    carbohydrateCalories / 4
  );

  const fiberGrams = Math.round(
    (calories / 1000) * 14
  );

  // Approximate daily fluids from drinking water and other beverages.
  // Food moisture is not included in this displayed hydration target.
  const hydrationOz = sex === "female" ? 74 : 101;

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
    calculatedAt: new Date().toISOString(),
    source: "goals-nutrition-targets-v2.4.0"
  };
}

function updateNutritionTargetPreview(targets) {
  if (!targets) {
    clearNutritionTargetPreview();
    return;
  }

  setText("macroStrategySummary", targets.strategyLabel);
  setText("proteinTarget", `${targets.proteinGrams} g`);
  setText("carbohydrateTarget", `${targets.carbohydrateGrams} g`);
  setText("fatTarget", `${targets.fatGrams} g`);
  setText("fiberTarget", `${targets.fiberGrams} g`);
  setText("hydrationTarget", `${targets.hydrationOz} oz`);
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
    "calbuddyMacroNutritionStrategy",
    targets.strategy
  );

  localStorage.setItem(
    "calbuddyDailyNutritionTargets",
    JSON.stringify(targets)
  );
}

function resolveDailyCalorieGoal(calculatedCalorieEstimate) {
  const input = document.getElementById(
    "dailyCalorieGoalInput"
  );

  const isActivelyEditing =
    input &&
    document.activeElement === input;

  const inputValue = parseDailyCalorieGoal(
    input?.value
  );

  /*
   * A complete valid value entered by the user
   * always becomes the active goal.
   */
  if (inputValue !== null) {
    return inputValue;
  }

  const savedValue = parseDailyCalorieGoal(
    localStorage.getItem(
      "calbuddyDailyCalorieGoal"
    )
  );

  /*
   * While the user is typing, do not replace an
   * empty or incomplete draft with the saved value.
   *
   * We may still use the saved value internally so
   * calculations remain stable.
   */
  if (isActivelyEditing) {
    return savedValue ?? calculatedCalorieEstimate;
  }

  /*
   * When the field is not being edited, restore the
   * saved goal into the visible input.
   */
  if (savedValue !== null) {
    if (input) {
      input.value = String(savedValue);
    }

    return savedValue;
  }

  /*
   * No manual goal has been saved yet, so use the
   * calculated recommendation.
   */
  if (input) {
    input.value = String(calculatedCalorieEstimate);
  }

  return calculatedCalorieEstimate;
}

function parseDailyCalorieGoal(value) {
  const calories = Math.round(Number(value));

  if (!Number.isFinite(calories)) {
    return null;
  }

  if (calories < 800 || calories > 10000) {
    return null;
  }

  return calories;
}

function updateDailyCalorieGoalPreview() {
  const goal = parseDailyCalorieGoal(
    document.getElementById("dailyCalorieGoalInput")?.value
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

  const calculated = calculateGoals();

  if (calculated) {
    updateCalorieWarning(goal, calculated.sex, calculated.goalMode);

    updateProgressSummary({
      weightLbs: calculated.weightLbs,
      targetWeight: calculated.targetWeight,
      dailyCalorieGoal: goal,
      bmiText: document.getElementById("bmiBox")?.textContent || "\u2014",
      timeline: document.getElementById("timeToGoal")?.textContent || "\u2014"
    });
  }
}

function scheduleGoalsAutoSave(delay = 700) {
  if (isLoadingGoals) return;

  window.clearTimeout(autoSaveTimer);

  autoSaveTimer = window.setTimeout(() => {
    persistGoals();
  }, delay);
}

async function persistGoals() {
  if (isLoadingGoals) return;

  const calculated = calculateGoals();

  if (!calculated || !calculated.dailyCalorieGoal) {
    return;
  }

  const requestSequence = ++saveRequestSequence;

  const goals = {
    age: calculated.age,
    sex: calculated.sex,
    weight: calculated.weightLbs,
    height: calculated.heightInches,
    activity: calculated.activity,
    goalMode: calculated.goalMode,
    targetWeight: calculated.targetWeight,
    weeklyChange: calculated.weeklyChange,
    calorieGoal: calculated.dailyCalorieGoal,
    macroNutritionStrategy: calculated.macroNutritionStrategy,
    dietPreference: calculated.dietPreference,
    dietOther: calculated.dietOther,
    foodAllergies: calculated.foodAllergies,
    medicalConditions: calculated.medicalConditions
  };

  localStorage.setItem(
    "calbuddyGoals",
    JSON.stringify(goals)
  );

  localStorage.setItem(
    "calbuddyDailyCalorieGoal",
    String(calculated.dailyCalorieGoal)
  );

  localStorage.setItem(
    "calbuddyMacroNutritionStrategy",
    calculated.macroNutritionStrategy
  );

  cacheNutritionTargets(calculated.nutritionTargets);

  const user = await getCurrentUser();

  if (!user) {
    setDailyCalorieGoalStatus("");
    return;
  }

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
    weekly_weight_change_goal: Number(goals.weeklyChange),
    daily_calorie_goal: Number(goals.calorieGoal),
    updated_at: new Date().toISOString()
  };

  await trySaveOptionalHealthFields(
    profilePayload,
    goals
  );

  const { error } = await upsertGoalsProfile(profilePayload);

  if (requestSequence !== saveRequestSequence) {
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

async function upsertGoalsProfile(profilePayload) {
  const firstAttempt = await window.calbuddySupabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (
    !firstAttempt.error ||
    !isMissingColumnError(
      firstAttempt.error,
      "macro_nutrition_strategy"
    )
  ) {
    return firstAttempt;
  }

  const fallbackPayload = { ...profilePayload };
  delete fallbackPayload.macro_nutrition_strategy;

  console.warn(
    "profiles.macro_nutrition_strategy is not available yet. " +
      "The strategy remains saved on this device."
  );

  return window.calbuddySupabase
    .from("profiles")
    .upsert(fallbackPayload, { onConflict: "id" });
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes(String(columnName).toLowerCase());
}

function updateCalorieWarning(dailyCalorieGoal, sex, goalMode) {
  const warningBox = document.getElementById("warningBox");
  if (!warningBox) return;

  const isLowGoal =
    goalMode === "lose" &&
    ((sex === "male" && dailyCalorieGoal < 1500) ||
      (sex === "female" && dailyCalorieGoal < 1200));

  warningBox.style.display = isLowGoal ? "block" : "none";
}

function updateTimeAndDate(currentWeight, targetWeight, weeklyChange, goalMode) {
  if (goalMode === "maintain") {
    setText("timeToGoal", "Maintaining current weight");
    setText("goalDate", "Not applicable");
    return "Maintaining current weight";
  }

  if (!currentWeight || !targetWeight || !weeklyChange) {
    setText("timeToGoal", "\u2014");
    setText("goalDate", "\u2014");
    return "\u2014";
  }

  let poundsToGoal;

  if (goalMode === "lose") {
    poundsToGoal = currentWeight - targetWeight;
  } else {
    poundsToGoal = targetWeight - currentWeight;
  }

  if (poundsToGoal <= 0) {
    setText("timeToGoal", "Already at or past target");
    setText("goalDate", "\u2014");
    return "Already at or past target";
  }

  const weeks = poundsToGoal / weeklyChange;
  const months = weeks / 4.345;

  const estimatedGoalDate = new Date();
  estimatedGoalDate.setDate(
    estimatedGoalDate.getDate() + Math.round(weeks * 7)
  );

  const timeText = `${weeks.toFixed(1)} weeks (~${months.toFixed(1)} months)`;
  const dateText = estimatedGoalDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  setText("timeToGoal", timeText);
  setText("goalDate", dateText);

  return timeText;
}

function updateCaloriesMeter(goal) {
  const consumed = Number(
    localStorage.getItem("calbuddyCaloriesConsumed") || 0
  );

  const burned = Number(
    localStorage.getItem("calbuddyCaloriesBurned") || 0
  );

  const adjustedGoal = goal + burned;

  const rawRemaining = adjustedGoal - consumed;
  const caloriesLeft = Math.max(rawRemaining, 0);
  const caloriesOver = Math.max(consumed - adjustedGoal, 0);

  const card = document.getElementById("calorieStatusCard");
  const label = document.getElementById("calorieStatusLabel");

  const percentLeft = adjustedGoal
    ? Math.max(0, Math.min(caloriesLeft / adjustedGoal, 1))
    : 1;

  const percentUsed = adjustedGoal
    ? Math.max(0, Math.min(consumed / adjustedGoal, 1))
    : 0;

  if (card) {
    const percent = Math.round(percentLeft * 100);

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
      card.classList.add("calorie-over");
      card.style.setProperty("--calorie-left-percent", "100%");
      card.style.setProperty("--calorie-flicker-speed", ".55s");
    } else if (percentUsed >= 0.90) {
      card.classList.add("calorie-critical");
      card.style.setProperty("--calorie-flicker-speed", ".7s");
    } else if (percentUsed >= 0.75) {
      card.classList.add("calorie-low");
      card.style.setProperty("--calorie-flicker-speed", "1.6s");
    } else if (percentUsed >= 0.50) {
      card.style.setProperty("--calorie-flicker-speed", "2.4s");
    } else {
      card.style.setProperty("--calorie-flicker-speed", "4s");
    }
  }

  if (caloriesOver > 0) {
    setText(
      "caloriesLeftText",
      `+${caloriesOver.toLocaleString()}`
    );

    if (label) {
      label.textContent = "Calories Over";
    }
  } else {
    setText(
      "caloriesLeftText",
      caloriesLeft.toLocaleString()
    );

    if (label) {
      label.textContent = "Calories Left";
    }
  }

  setText(
    "caloriesConsumedText",
    consumed.toLocaleString()
  );

  setText(
    "dailyGoalText",
    adjustedGoal.toLocaleString()
  );
}

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
    weightLbs ? `${weightLbs} lb` : "\u2014"
  );

  setText(
    "progressTargetWeight",
    targetWeight ? `${targetWeight} lb` : "\u2014"
  );

  setText("progressBmi", bmiText || "\u2014");

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

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function getValue(id) {
  const element = document.getElementById(id);

  return element
    ? String(element.value || "").trim()
    : "";
}

async function trySaveOptionalHealthFields(profilePayload, goals) {
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
  const locallySavedStrategy = resolveMacroNutritionStrategy(
    localStorage.getItem("calbuddyMacroNutritionStrategy")
  );

  const user = await getCurrentUser();

  if (user) {
    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      applyGoals({
        age: data.age,
        sex: data.sex,
        weight: data.weight_lbs,
        height: data.height_in,
        activity: data.activity_level,
        goalMode: data.goal,
        targetWeight: data.target_weight_lbs,
        weeklyChange: data.weekly_weight_change_goal,
        calorieGoal: data.daily_calorie_goal,
        macroNutritionStrategy:
          data.macro_nutrition_strategy || locallySavedStrategy,
        dietPreference: data.diet_preference,
        dietOther: data.diet_other,
        foodAllergies: data.food_allergies,
        medicalConditions: data.medical_conditions
      });

      calculateGoals();
      return;
    }
  }

  const savedGoals = localStorage.getItem("calbuddyGoals");

  if (!savedGoals) {
    applyGoals({
      macroNutritionStrategy: locallySavedStrategy
    });
    calculateGoals();
    return;
  }

  try {
    const parsedGoals = JSON.parse(savedGoals);

    applyGoals({
      ...parsedGoals,
      macroNutritionStrategy:
        parsedGoals.macroNutritionStrategy || locallySavedStrategy
    });
  } catch (error) {
    console.warn(
      "Could not parse saved goals:",
      error.message
    );
  }

  calculateGoals();
}

function applyGoals(goals = {}) {
  setInputValue("age", goals.age || "34");
  setInputValue("sex", goals.sex || "male");
  setInputValue("weight", goals.weight || "185.2");
  setInputValue("height", goals.height || "69.8");
  setInputValue("activity", goals.activity || "1.55");
  setInputValue("goalMode", goals.goalMode || "lose");
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

  const savedDailyCalorieGoal = parseDailyCalorieGoal(
    goals.calorieGoal
  );

  if (savedDailyCalorieGoal) {
    setInputValue(
      "dailyCalorieGoalInput",
      savedDailyCalorieGoal
    );

    localStorage.setItem(
      "calbuddyDailyCalorieGoal",
      String(savedDailyCalorieGoal)
    );
  }

  localStorage.setItem(
    "calbuddyMacroNutritionStrategy",
    resolveMacroNutritionStrategy(
      goals.macroNutritionStrategy
    )
  );

  updateDietOtherUI();
}

function setInputValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function logWeightQuick() {
  const current =
    document.getElementById("weight")?.value || "";

  const next = prompt(
    "Enter today's weight:",
    current
  );

  if (!next) return;

  setInputValue("weight", next);
  calculateGoals();
  scheduleGoalsAutoSave(150);
}

function logCaloriesBurnedQuick() {
  const current =
    localStorage.getItem("calbuddyCaloriesBurned") ||
    "0";

  const burned = prompt(
    "Calories burned today:",
    current
  );

  if (burned === null) return;

  localStorage.setItem(
    "calbuddyCaloriesBurned",
    Number(burned) || 0
  );

  calculateGoals();
}
