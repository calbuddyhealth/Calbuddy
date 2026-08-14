// ari/actions/ari-rebirth-action-planner.js
// Purpose: Convert Rebirth understanding into safe CalBuddy proposed actions.
// V2.0.0 — Single canonical meal-write path. Meal actions are current-turn only.

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "2.0.0",

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
      actions,
      plannedActions: actions,
      proposedActions: actions
    };
  },

  detectMealLog(text = "", summary = {}) {
    if (!this.userWantsMealLog(text)) return null;

    // Meal writes are deliberately stateless between turns.
    // NEVER read lastMealEstimate, appContext history, threadState, or prior replies.
    const currentFood = this.extractCurrentFood(text);
    const estimate = this.getCurrentTurnMealEstimate(summary);

    // A separate-turn pronoun such as "log that" is intentionally not enough.
    // The current message must name the food being logged.
    if (!currentFood || !estimate) return null;

    if (!this.estimateMatchesFood(estimate, currentFood)) return null;

    const calories = this.validCalories(
      estimate.totalCalories ?? estimate.calories ?? estimate.total_calories ?? estimate.kcal
    );

    const protein_g = this.validMacro(
      estimate.protein_g ?? estimate.protein ?? estimate.totalProtein ?? estimate.totalProtein_g
    );
    const carbs_g = this.validMacro(
      estimate.carbs_g ?? estimate.carbs ?? estimate.carbohydrates ?? estimate.totalCarbs ?? estimate.totalCarbs_g
    );
    const fat_g = this.validMacro(
      estimate.fat_g ?? estimate.fat ?? estimate.totalFat ?? estimate.totalFat_g
    );

    // Do not manufacture fake 0g macros when the estimate packet is incomplete.
    if (
      calories === null ||
      protein_g === null ||
      carbs_g === null ||
      fat_g === null
    ) {
      return null;
    }

    const category = this.inferMealCategory(text);

    return {
      action_type: "log_meal",
      requiresApproval: true,
      source: "ari_rebirth_action_planner_v2_current_turn",
      payload: {
        name: currentFood,
        calories,
        category,
        serving_size: "Estimated by Ari before logging",
        protein_g,
        carbs_g,
        fat_g
      },
      confirmation_text:
        `Log ${currentFood} — about ${calories.toLocaleString()} kcal · ` +
        `${protein_g}g protein · ${carbs_g}g carbs · ${fat_g}g fat?`
    };
  },

  userWantsMealLog(text = "") {
    const normalized = this.normalizeText(text);

    const hasWriteVerb = /\b(log|add|save|track)\b/.test(normalized);
    const namesFood = Boolean(this.extractCurrentFood(text));

    // Explicitly block obvious non-nutrition action domains.
    const isOtherDomain =
      /\b(workout|exercise|training|sets?|reps?|weight|weigh|goal|profile|medication|medicine|symptom|code|github|repo|branch|commit)\b/.test(normalized);

    return hasWriteVerb && namesFood && !isOtherDomain;
  },

  getCurrentTurnMealEstimate(summary = {}) {
    // Only fields generated for THIS runtime turn are legal for a meal write.
    // Deliberately excludes lastMealEstimate, appContext, threadState, and history.
    const candidates = [
      summary.mealEstimate,
      summary.foodAnalysis,
      summary.nutritionEstimate,
      summary.calorieEstimate
    ].filter(Boolean);

    return candidates[0] || null;
  },

  extractCurrentFood(text = "") {
    const source = String(text || "").trim();
    const match = source.match(
      /\b(?:i\s+(?:just\s+)?(?:ate|had)|(?:i've|i’ve)\s+had)\s+(.{2,220})/i
    );

    if (!match) return null;

    let food = String(match[1] || "").trim();

    food = food
      .replace(/[.!?]\s*(?:can|could|would|will)\s+you\b[\s\S]*$/i, "")
      .replace(/\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:log|add|save|track)\b[\s\S]*$/i, "")
      .replace(/\b(?:please\s+)?(?:log|add|save|track)\s+(?:that|it|this|the\s+meal)\b[\s\S]*$/i, "")
      .replace(/\b(?:how many|how much)\s+(?:calories|protein|carbs?|carbohydrates?|fat)\b[\s\S]*$/i, "")
      .replace(/\b(?:for|at)\s+(?:breakfast|lunch|dinner|snack)\b/gi, "")
      .replace(/\b(?:this morning|this afternoon|this evening|tonight|today|earlier)\b/gi, "")
      .replace(/^[\s]*(?:a|an|the)\s+/i, "")
      .replace(/[,.!?;:]+$/g, "")
      .trim();

    if (!food || food.length < 2 || food.length > 140) return null;

    return this.titleCase(food);
  },

  estimateMatchesFood(estimate = {}, foodName = "") {
    const targetTokens = this.foodTokens(foodName);
    if (!targetTokens.length) return false;

    const estimatePieces = [
      estimate.description,
      estimate.name,
      estimate.food,
      ...(Array.isArray(estimate.foods)
        ? estimate.foods.flatMap(item => [item?.name, item?.food, item?.description])
        : [])
    ];

    const haystack = this.normalizeText(estimatePieces.filter(Boolean).join(" "));
    if (!haystack) return false;

    const matches = targetTokens.filter(token => haystack.includes(token));
    const required = targetTokens.length === 1
      ? 1
      : Math.max(2, Math.ceil(targetTokens.length / 2));

    return matches.length >= required;
  },

  foodTokens(value = "") {
    const ignored = new Set([
      "a", "an", "the", "and", "with", "of", "for", "meal", "food",
      "breakfast", "lunch", "dinner", "snack", "estimated", "estimate"
    ]);

    return this.normalizeText(value)
      .split(" ")
      .filter(token => token.length >= 2 && !ignored.has(token));
  },

  inferMealCategory(text = "") {
    const normalized = this.normalizeText(text);
    if (/\b(breakfast|morning)\b/.test(normalized)) return "Breakfast";
    if (/\b(lunch|afternoon)\b/.test(normalized)) return "Lunch";
    if (/\b(dinner|evening|tonight|night)\b/.test(normalized)) return "Dinner";
    if (/\bsnack\b/.test(normalized)) return "Snack";
    return "Meal";
  },

  validCalories(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 10 || number > 5000) return null;
    return Math.round(number);
  },

  validMacro(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1000) return null;
    return Math.round(number * 10) / 10;
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

  titleCase(value = "") {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "")
      .join(" ");
  },

  normalizeText(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};