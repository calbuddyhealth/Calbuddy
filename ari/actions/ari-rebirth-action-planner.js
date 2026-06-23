// ari/actions/ari-rebirth-action-planner.js
// Purpose: Convert Rebirth understanding into safe CalBuddy proposed actions.
// V1.0.0

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "1.0.0",

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
    const directCalorieMatch =
      text.match(/\b(?:log|add|ate|i ate|had|i had)\s+(.{2,60}?)\s+(?:for\s+)?(\d{2,5})\s*(?:calories|calorie|kcal|cals)?\b/) ||
      text.match(/\b(?:log|add)\s+(\d{2,5})\s*(?:calories|calorie|kcal|cals)\s+(?:for\s+)?(.{2,60})\b/);

    if (directCalorieMatch) {
      let foodName;
      let calories;

      if (Number(directCalorieMatch[1])) {
        calories = Number(directCalorieMatch[1]);
        foodName = directCalorieMatch[2];
      } else {
        foodName = directCalorieMatch[1];
        calories = Number(directCalorieMatch[2]);
      }

      foodName = this.cleanFoodName(foodName);

      if (foodName && calories >= 10 && calories <= 5000) {
        return {
          action_type: "log_meal",
          payload: {
            name: foodName,
            calories,
            category: "Meal",
            serving_size: "Logged through Ari Rebirth"
          },
          confirmation_text: `Log ${foodName} for ${calories} calories?`
        };
      }
    }

    const eatenMatch =
      text.match(/\b(?:i ate|i had|ate|had)\s+(.{2,80})\b/);

    if (eatenMatch) {
      const foodName = this.cleanFoodName(eatenMatch[1]);
      const estimatedCalories = this.estimateKnownFood(foodName);

      if (foodName && estimatedCalories) {
        return {
          action_type: "log_meal",
          payload: {
            name: foodName,
            calories: estimatedCalories,
            category: "Meal",
            serving_size: "Estimated by Ari Rebirth"
          },
          confirmation_text: `That sounds like about ${estimatedCalories} calories. Log ${foodName}?`
        };
      }
    }

    return null;
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

  estimateKnownFood(foodName = "") {
    const food = String(foodName).toLowerCase();

    if (food.includes("big mac") && food.includes("large fries")) return 1050;
    if (food.includes("big mac")) return 590;
    if (food.includes("large fries")) return 480;
    if (food.includes("medium fries")) return 320;
    if (food.includes("small fries")) return 230;

    return null;
  },

  cleanFoodName(foodName = "") {
    return String(foodName || "")
      .replace(/\b(calories|calorie|kcal|cals)\b/g, "")
      .replace(/[.!?]+$/g, "")
      .trim();
  }
};