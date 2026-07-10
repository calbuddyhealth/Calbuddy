const GOALS_VERSION = "2.0.0";

const goalInputs = [
  "age",
  "sex",
  "weight",
  "height",
  "activity",
  "goalMode",
  "targetWeight",
  "weeklyChange",
  "dietPreference",
  "dietOther",
  "foodAllergies",
  "medicalConditions"
];

document.addEventListener("DOMContentLoaded", async () => {
  goalInputs.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("input", calculateGoals);
    element.addEventListener("change", calculateGoals);
  });

  document.getElementById("dietPreference")?.addEventListener("change", updateDietOtherUI);
  document.getElementById("saveGoalsBtn")?.addEventListener("click", saveGoals);

  await loadSavedGoals();
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

function setStatus(message = "", type = "") {
  const statusEl = document.getElementById("saveMessage");
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
    conversion.textContent = "Equivalent: —";
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

  updateHeightConversion(heightInches);

  if (!age || !weightLbs || !heightInches || !activity) {
    setText("calorieGoal", "— kcal");
    setText("maintenanceBox", "—");
    setText("bmiBox", "—");
    setText("timeToGoal", "—");
    setText("goalDate", "—");
    setText("caloriesLeftText", "—");
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
  let calorieGoal = maintenance;

  if (goalMode === "lose") {
    calorieGoal = Math.round(maintenance - weeklyChange * 500);
  }

  if (goalMode === "gain") {
    calorieGoal = Math.round(maintenance + weeklyChange * 500);
  }

  setText("calorieGoal", `${calorieGoal} kcal`);
  setText("maintenanceBox", `${maintenance} kcal`);

  const explanation = document.getElementById("goalExplanation");

  if (explanation) {
    if (goalMode === "lose") {
      explanation.textContent = "This target helps create a calorie deficit for gradual weight loss.";
    } else if (goalMode === "gain") {
      explanation.textContent = "This target helps create a calorie surplus for gradual weight gain.";
    } else {
      explanation.textContent = "This target is estimated to help maintain your current weight.";
    }
  }

  const warningBox = document.getElementById("warningBox");

  if (warningBox) {
    if (
      goalMode === "lose" &&
      ((sex === "male" && calorieGoal < 1500) ||
        (sex === "female" && calorieGoal < 1200))
    ) {
      warningBox.style.display = "block";
    } else {
      warningBox.style.display = "none";
    }
  }

  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  const bmiText = `${bmi.toFixed(1)} — ${getBmiCategory(bmi)}`;

  setText("bmiBox", bmiText);
  setText("progressBmi", bmiText);

  const timeline = updateTimeAndDate(weightLbs, targetWeight, weeklyChange, goalMode);

  updateCaloriesMeter(calorieGoal);

  updateProgressSummary({
    weightLbs,
    targetWeight,
    calorieGoal,
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
    calorieGoal,
    maintenance,
    dietPreference: getValue("dietPreference"),
    dietOther: getValue("dietOther"),
    foodAllergies: getValue("foodAllergies"),
    medicalConditions: getValue("medicalConditions")
  };
}

function updateTimeAndDate(currentWeight, targetWeight, weeklyChange, goalMode) {
  if (goalMode === "maintain") {
    setText("timeToGoal", "Maintaining current weight");
    setText("goalDate", "Not applicable");
    return "Maintaining current weight";
  }

  if (!currentWeight || !targetWeight || !weeklyChange) {
    setText("timeToGoal", "—");
    setText("goalDate", "—");
    return "—";
  }

  let poundsToGoal;

  if (goalMode === "lose") {
    poundsToGoal = currentWeight - targetWeight;
  } else {
    poundsToGoal = targetWeight - currentWeight;
  }

  if (poundsToGoal <= 0) {
    setText("timeToGoal", "Already at or past target");
    setText("goalDate", "—");
    return "Already at or past target";
  }

  const weeks = poundsToGoal / weeklyChange;
  const months = weeks / 4.345;

  const estimatedGoalDate = new Date();
  estimatedGoalDate.setDate(estimatedGoalDate.getDate() + Math.round(weeks * 7));

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
  const consumed = Number(localStorage.getItem("calbuddyCaloriesConsumed") || 0);
  const burned = Number(localStorage.getItem("calbuddyCaloriesBurned") || 0);
  const netConsumed = Math.max(consumed - burned, 0);

  const rawRemaining = goal - netConsumed;
  const caloriesLeft = Math.max(rawRemaining, 0);
  const caloriesOver = Math.max(netConsumed - goal, 0);

  const card = document.getElementById("calorieStatusCard");
  const label = document.getElementById("calorieStatusLabel");

  const percentLeft = goal
    ? Math.max(0, Math.min(caloriesLeft / goal, 1))
    : 1;

  const percentUsed = goal
    ? Math.max(0, Math.min(netConsumed / goal, 1))
    : 0;

  if (card) {
    const percent = Math.round(percentLeft * 100);

    card.style.setProperty("--calorie-left-percent", `${percent}%`);
    card.classList.remove("calorie-low", "calorie-critical", "calorie-over");

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
    setText("caloriesLeftText", `+${caloriesOver.toLocaleString()}`);
    if (label) label.textContent = "Calories Over";
  } else {
    setText("caloriesLeftText", caloriesLeft.toLocaleString());
    if (label) label.textContent = "Calories Left";
  }

  setText("caloriesConsumedText", netConsumed.toLocaleString());
  setText("dailyGoalText", goal.toLocaleString());
}

function updateProgressSummary(summary = {}) {
  const { weightLbs, targetWeight, calorieGoal, bmiText, timeline } = summary;

  setText("progressWeight", weightLbs ? `${weightLbs} lb` : "—");
  setText("progressTargetWeight", targetWeight ? `${targetWeight} lb` : "—");
  setText("progressBmi", bmiText || "—");
  setText("progressCalories", calorieGoal ? `${calorieGoal} kcal/day` : "—");
  setText("progressTimeline", timeline || "—");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? String(element.value || "").trim() : "";
}


async function saveGoals() {
  const calculated = calculateGoals();

  if (!calculated || !calculated.calorieGoal) {
    setStatus("Please complete your health goal information first.", "error");
    return;
  }

  const goals = {
    age: calculated.age,
    sex: calculated.sex,
    weight: calculated.weightLbs,
    height: calculated.heightInches,
    activity: calculated.activity,
    goalMode: calculated.goalMode,
    targetWeight: calculated.targetWeight,
    weeklyChange: calculated.weeklyChange,
    calorieGoal: calculated.calorieGoal,
    dietPreference: calculated.dietPreference,
    dietOther: calculated.dietOther,
    foodAllergies: calculated.foodAllergies,
    medicalConditions: calculated.medicalConditions
  };

  localStorage.setItem("calbuddyGoals", JSON.stringify(goals));
  localStorage.setItem("calbuddyDailyCalorieGoal", calculated.calorieGoal);

  const user = await getCurrentUser();

  if (user) {
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
      daily_calorie_goal: Number(calculated.calorieGoal),
      updated_at: new Date().toISOString()
    };

    await trySaveOptionalHealthFields(profilePayload, goals);

    const { error } = await window.calbuddySupabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (error) {
      setStatus("Saved on this device, but cloud profile did not save: " + error.message, "error");
      return;
    }

    setStatus(`Health goals saved. Daily target: ${calculated.calorieGoal} kcal`, "success");
  } else {
    setStatus("Health goals saved on this device. Sign in to save them to your profile.", "success");
  }
}

async function trySaveOptionalHealthFields(profilePayload, goals) {
  profilePayload.diet_preference = goals.dietPreference || null;
  profilePayload.diet_other = goals.dietOther || null;
  profilePayload.food_allergies = goals.foodAllergies || null;
  profilePayload.medical_conditions = goals.medicalConditions || null;
}

async function loadSavedGoals() {
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
        dietPreference: data.diet_preference,
        dietOther: data.diet_other,
        foodAllergies: data.food_allergies,
        medicalConditions: data.medical_conditions
      });

      if (data.daily_calorie_goal) {
        localStorage.setItem("calbuddyDailyCalorieGoal", data.daily_calorie_goal);
      }

      calculateGoals();
      return;
    }
  }

  const savedGoals = localStorage.getItem("calbuddyGoals");

  if (!savedGoals) {
    calculateGoals();
    return;
  }

  try {
    applyGoals(JSON.parse(savedGoals));
  } catch (error) {
    console.warn("Could not parse saved goals:", error.message);
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
  setInputValue("targetWeight", goals.targetWeight || "175.0");
  setInputValue("weeklyChange", goals.weeklyChange || "1");
  setInputValue("dietPreference", goals.dietPreference || "none");
  setInputValue("dietOther", goals.dietOther || "");
  setInputValue("foodAllergies", goals.foodAllergies || "");
  setInputValue("medicalConditions", goals.medicalConditions || "");

  updateDietOtherUI();

  if (goals.calorieGoal) {
    localStorage.setItem("calbuddyDailyCalorieGoal", goals.calorieGoal);
  }
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function logWeightQuick() {
  const current = document.getElementById("weight")?.value || "";
  const next = prompt("Enter today's weight:", current);

  if (!next) return;

  setInputValue("weight", next);
  calculateGoals();
  setStatus("Weight updated. Press Save Health Goals to save it.", "");
}

function logCaloriesBurnedQuick() {
  const current = localStorage.getItem("calbuddyCaloriesBurned") || "0";
  const burned = prompt("Calories burned today:", current);

  if (burned === null) return;

  localStorage.setItem("calbuddyCaloriesBurned", Number(burned) || 0);
  calculateGoals();
  setStatus("Calories burned updated.", "success");
}
