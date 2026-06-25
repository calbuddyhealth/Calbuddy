// ari/actions/ari-rebirth-action-planner.js
// Purpose: Convert Rebirth understanding into safe CalBuddy proposed actions.
// V1.2.0 — Universal Action Planner / No Food Keyword Estimation

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "1.2.0",

  plan(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).trim();

    const normalized = text.toLowerCase().replace(/,/g, "");
    const actions = [];

    const mealAction = this.detectMealLog(normalized, summary);
    if (mealAction) actions.push(mealAction);

    const weightAction = this.detectWeightLog(normalized);
    if (weightAction) actions.push(weightAction);

    const calorieGoalAction = this.detectCalorieGoal(normalized);
    if (calorieGoalAction) actions.push(calorieGoalAction);

    return {
      ...summary,
      proposedActions: actions
    };
  },

  detectMealLog(text = "", summary = {}) {
    const wantsMealLog = this.userWantsMealLog(text);
    if (!wantsMealLog) return null;

    const calories = this.resolveMealTotalCalories(summary, text);
    const foodName = this.resolveMealDescription(summary, text);

    if (!calories || !foodName) return null;

    return this.makeMealAction(foodName, calories, "Estimated by Ari Rebirth");
  },

  userWantsMealLog(text = "") {
    return (
      /\b(log|add|save|track)\b/.test(text) &&
      (
        text.includes("meal") ||
        text.includes("food") ||
        text.includes("calories") ||
        text.includes("calorie") ||
        text.includes("kcal") ||
        text.includes("cals") ||
        text.includes("that") ||
        text.includes("it") ||
        text.includes("total")
      )
    );
  },

  resolveMealTotalCalories(summary = {}, text = "") {
    const structuredCandidates = [
      summary.mealEstimate?.totalCalories,
      summary.foodAnalysis?.totalCalories,
      summary.nutritionEstimate?.totalCalories,
      summary.calorieEstimate?.totalCalories,
      summary.totalCalories,
      summary.appContext?.lastMealEstimate?.totalCalories,
      summary.appContext?.mealEstimate?.totalCalories
    ];

    for (const value of structuredCandidates) {
      const number = Number(value);
      if (Number.isFinite(number) && number >= 10 && number <= 5000) {
        return Math.round(number);
      }
    }

    const directCalories = this.extractTotalCaloriesFromText(text);
    if (directCalories) return directCalories;

    const history = Array.isArray(summary.appContext?.history)
      ? summary.appContext.history
      : [];

    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i] || {};
      const historyText = String(
        item.reply ||
        item.content ||
        item.message ||
        item.assistantMessage ||
        ""
      );

      const calories = this.extractTotalCaloriesFromText(historyText);
      if (calories) return calories;
    }

    return null;
  },

  resolveMealDescription(summary = {}, text = "") {
    const structuredCandidates = [
      summary.mealEstimate?.description,
      summary.foodAnalysis?.description,
      summary.nutritionEstimate?.description,
      summary.calorieEstimate?.description,
      summary.appContext?.lastMealEstimate?.description,
      summary.appContext?.mealEstimate?.description
    ];

    for (const value of structuredCandidates) {
      const clean = this.cleanFoodName(value);
      if (clean) return clean;
    }

    const directFood = this.extractFoodFromDirectLog(text);
    if (directFood) return directFood;

    const history = Array.isArray(summary.appContext?.history)
      ? summary.appContext.history
      : [];

    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i] || {};
      const historyText = String(
        item.userMessage ||
        item.message ||
        item.content ||
        ""
      );

      const food = this.extractFoodFromEatingText(historyText);
      if (food) return food;
    }

    return "Meal estimated by Ari";
  },

  extractFoodFromDirectLog(text = "") {
    const match =
      text.match(/\b(?:log|add|save|track)\s+(.{2,120}?)\s+(?:for\s+)?\d{2,5}\s*(?:calories|calorie|kcal|cals)?\b/) ||
      text.match(/\b(?:log|add|save|track)\s+\d{2,5}\s*(?:calories|calorie|kcal|cals)\s+(?:for\s+)?(.{2,120})\b/);

    if (!match) return null;

    return this.cleanFoodName(match[1] || match[2]);
  },

  extractFoodFromEatingText(text = "") {
    const match = String(text || "").match(/\b(?:i ate|i had|ate|had)\s+(.{2,180})\b/i);
    if (!match) return null;

    return this.cleanFoodName(match[1]);
  },

  extractTotalCaloriesFromText(text = "") {
    const clean = String(text || "").replace(/,/g, "").toLowerCase();

    const patterns = [
      /total:\s*(?:approximately|about|around)?\s*(\d{2,5})\s*(?:calories|kcal|cals)/i,
      /total\s*(?:is|would be|comes to)?\s*(?:approximately|about|around)?\s*(\d{2,5})\s*(?:calories|kcal|cals)/i,
      /approximately\s*(\d{2,5})\s*(?:calories|kcal|cals)\s*(?:total|for the whole meal)/i,
      /about\s*(\d{2,5})\s*(?:calories|kcal|cals)\s*(?:total|for the whole meal)/i,
      /\b(\d{2,5})\s*(?:calories|kcal|cals)\b/i
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (!match) continue;

      const calories = Number(match[1]);
      if (Number.isFinite(calories) && calories >= 10 && calories <= 5000) {
        return Math.round(calories);
      }
    }

    return null;
  },

  makeMealAction(foodName, calories, servingSize = "Estimated by Ari Rebirth") {
    return {
      action_type: "log_meal",
      payload: {
        name: foodName,
        calories,
        category: "Meal",
        serving_size: servingSize
      },
      confirmation_text: `Log ${foodName} for about ${calories.toLocaleString()} calories?`
    };
  },

  detectWeightLog(text = "") {
    const match =
      text.match(/\b(?:i weigh|my weight is|weighed|current weight is|update my weight to|set my weight to)\s*(\d{2,3}(?:\.\d+)?)\s*(?:lb|lbs|pounds)?\b/);

    if (!match) return null;

    const weight = Number(match[1]);
    if (!weight || weight < 70 || weight > 700) return null;

    return {
      action_type: "log_weight",
      payload: {
        weight,
        notes: "Logged through Ari Rebirth"
      },
      confirmation_text: `Log your current weight as ${weight} lb?`
    };
  },

  detectCalorieGoal(text = "") {
    const match =
      text.match(/\b(?:set|change|update)?\s*(?:my)?\s*(?:daily)?\s*(?:calorie|calories|kcal)\s*(?:goal|target)?\s*(?:to|is|at)?\s*(\d{4,5})\b/) ||
      text.match(/\b(\d{4,5})\s*(?:calories|kcal)\b/);

    if (!match) return null;

    const calorieGoal = Number(match[1]);
    if (!calorieGoal || calorieGoal < 1000 || calorieGoal > 6000) return null;

    return {
      action_type: "update_profile",
      payload: {
        daily_calorie_goal: calorieGoal,
        calorieGoal
      },
      confirmation_text: `Change your daily calorie goal to ${calorieGoal.toLocaleString()} kcal?`
    };
  },

  cleanFoodName(foodName = "") {
    return String(foodName || "")
      .replace(/\b(calories|calorie|kcal|cals)\b/g, "")
      .replace(/\b(total|approximately|about|around)\b/g, "")
      .replace(/[.!?]+$/g, "")
      .trim();
  }
};