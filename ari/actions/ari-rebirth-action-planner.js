// ari/actions/ari-rebirth-action-planner.js
// Purpose: Convert Rebirth understanding into safe CalBuddy proposed actions.
// V3.0.0 — Meal logging intentionally removed for a clean rebuild.

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "3.0.0",

  plan(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).trim();

    const normalized = text.toLowerCase().replace(/,/g, "");
    const actions = [];

    // IMPORTANT:
    // Ari meal logging has been intentionally removed.
    // Do not add log_meal construction here until the replacement
    // single-path meal logging system is designed and tested.

    const weightAction = this.detectWeightLog(normalized);
    if (weightAction) actions.push(weightAction);

    const calorieGoalAction = this.detectCalorieGoal(normalized);
    if (calorieGoalAction) actions.push(calorieGoalAction);

    return {
      ...summary,
      actions,
      plannedActions: actions,
      proposedActions: actions
    };
  },

  detectWeightLog(text = "") {
    const match = text.match(
      /\b(?:i weigh|my weight is|weighed|current weight is|update my weight to|set my weight to)\s*(\d{2,3}(?:\.\d+)?)\s*(?:lb|lbs|pounds)?\b/
    );

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
  }
};
