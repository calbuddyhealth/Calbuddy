// ari/intent/ari-action-contract.js
// Purpose: Convert classified intent into safe app/developer action permission.
// V2.0.0 — General contract no longer constructs meal or workout actions.
// Domain-specific action services own Nutrition and Training mutations.

window.Ari = window.Ari || {};

window.Ari.actionContract = {
  version: "2.0.0",

  build(input = {}) {
    const intent = input.intent || {};
    const message = String(input.message || intent.originalMessage || "").trim();
    const context = input.context || input.userContext || {};
    const lastCalorieGoalSuggestion = input.lastCalorieGoalSuggestion || null;

    const base = {
      contractRan: true,
      contractVersion: this.version,
      lane: intent.lane || "conversation_only",
      wantsDataChange: intent.wantsDataChange === true,
      requiresApproval: true,
      allowedAction: null,
      action: null,
      shouldCreatePendingAction: false,
      shouldOnlyAnswer: true,
      reason: intent.reason || "No action contract reason."
    };

    if (!intent.wantsDataChange) return base;

    // Nutrition and Training actions are intentionally NOT built here.
    // Their domain services are the only permitted originators.
    if (intent.lane === "explicit_log_request") {
      return {
        ...base,
        shouldOnlyAnswer: true,
        reason: "Meal logging is disabled while the single-path Nutrition action service is rebuilt."
      };
    }

    if (intent.lane === "explicit_workout_plan") {
      return {
        ...base,
        shouldOnlyAnswer: true,
        reason: "Workout mutations are owned exclusively by ari-workout-plan-action.js."
      };
    }

    if (intent.lane === "explicit_goal_update") {
      return this.buildGoalContract(base, message, lastCalorieGoalSuggestion);
    }

    if (intent.lane === "explicit_profile_update") {
      return this.buildProfileContract(base, message);
    }

    if (intent.lane === "developer_action") {
      return this.buildDeveloperContract(base, message, context);
    }

    return base;
  },

  buildGoalContract(base, message, lastCalorieGoalSuggestion) {
    const explicitCalories = this.extractCalorieGoal(message);
    const calories = explicitCalories || lastCalorieGoalSuggestion?.calories;

    if (!calories) {
      return {
        ...base,
        reason: "User asked to update a goal, but no valid calorie goal was found."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: true,
      allowedAction: "update_profile",
      action: {
        action_type: "update_profile",
        payload: {
          daily_calorie_goal: calories,
          calorieGoal: calories
        },
        confirmation_text: `Update your daily calorie goal to ${Number(calories).toLocaleString()} kcal?`
      },
      reason: "User explicitly asked to update calorie goal."
    };
  },

  buildProfileContract(base, message) {
    const weight = this.extractWeight(message);

    if (!weight) {
      return {
        ...base,
        reason: "Profile update intent detected, but no safe structured value was found."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: true,
      allowedAction: "log_weight",
      action: {
        action_type: "log_weight",
        payload: {
          weight,
          notes: "Logged through Ari"
        },
        confirmation_text: `Log your current weight as ${weight} lb?`
      },
      reason: "User explicitly asked to log/update weight."
    };
  },

  buildDeveloperContract(base, message, context) {
    if (context.ownerMode !== true) {
      return {
        ...base,
        reason: "Developer action requested, but Owner Mode is not active."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: false,
      allowedAction: "developer_intent",
      action: {
        type: "developer_investigation",
        enabled: true,
        title: "Owner requested app change",
        summary: message,
        priority: "medium",
        recommended_files: [
          "index.html",
          "style.css",
          "calbuddy-core.js",
          "ari/ari-rebirth-app-bridge.js"
        ],
        ownerCommand: true
      },
      reason: "Owner requested a developer/app layout change."
    };
  },

  extractCalorieGoal(message = "") {
    const text = String(message).toLowerCase().replace(/,/g, "");
    const match =
      text.match(/\b(\d{4,5})\s*(?:calories|kcal)\b/) ||
      text.match(/\b(?:goal|target|daily calories|daily calorie goal).{0,30}?(\d{4,5})\b/);

    const value = match ? Number(match[1]) : null;
    if (!value || value < 1000 || value > 6000) return null;
    return value;
  },

  extractWeight(message = "") {
    const text = String(message).toLowerCase();
    const match = text.match(
      /\b(?:i weigh|my weight is|weight is|log my weight as|update my weight to|set my weight to)\s*(\d{2,3}(?:\.\d+)?)\b/
    );
    const value = match ? Number(match[1]) : null;
    if (!value || value < 70 || value > 700) return null;
    return value;
  }
};
