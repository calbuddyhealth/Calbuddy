// ari/actions/ari-rebirth-action-planner.js
// Purpose: Convert Rebirth understanding into safe CalBuddy proposed actions.
// V1.4.0 — Fix action delivery handoff and carry structured meal macros.

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "1.4.0",

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
      // Delivery stage consumes actions/plannedActions. Keep proposedActions for
      // backwards compatibility with older diagnostics.
      actions,
      plannedActions: actions,
      proposedActions: actions
    };
  },

  detectMealLog(text = "", summary = {}) {
    if (!this.userWantsMealLog(text)) return null;

    const mealEstimate = this.getMealEstimate(summary);
    const selectedFood = this.resolveSelectedFoodFromMealEstimate(text, mealEstimate);

    if (selectedFood) {
      return this.makeMealAction(
        selectedFood.name,
        selectedFood.calories,
        "Selected from Ari Rebirth estimate",
        selectedFood
      );
    }

    const calories = this.resolveMealTotalCalories(summary, text, mealEstimate);
    const foodName = this.resolveMealDescription(summary, text, mealEstimate);

    if (!calories || !foodName) return null;

    return this.makeMealAction(
      foodName,
      calories,
      "Estimated by Ari Rebirth",
      this.resolveMealMacros(summary, mealEstimate)
    );
  },

  userWantsMealLog(text = "") {
    return (
      /\b(log|add|save|track)\b/.test(text) &&
      (
        text.includes("meal") ||
        text.includes("food") ||
        text.includes("breakfast") ||
        text.includes("lunch") ||
        text.includes("dinner") ||
        text.includes("snack") ||
        text.includes("calories") ||
        text.includes("calorie") ||
        text.includes("kcal") ||
        text.includes("cals") ||
        text.includes("that") ||
        text.includes("it") ||
        text.includes("total") ||
        text.includes("estimate") ||
        text.includes("intake") ||
        text.includes("just") ||
        text.includes("only")
      )
    );
  },

  getMealEstimate(summary = {}) {
    return (
      summary.mealEstimate ||
      summary.lastMealEstimate ||
      summary.foodAnalysis ||
      summary.nutritionEstimate ||
      summary.calorieEstimate ||
      summary.appContext?.mealEstimate ||
      summary.appContext?.lastMealEstimate ||
      summary.threadState?.lastMealEstimate ||
      null
    );
  },

  resolveSelectedFoodFromMealEstimate(text = "", mealEstimate = null) {
    const foods = Array.isArray(mealEstimate?.foods)
      ? mealEstimate.foods
      : [];

    if (!foods.length) return null;

    const wantsPartial =
      text.includes("just") ||
      text.includes("only") ||
      text.includes("the ");

    if (!wantsPartial) return null;

    const cleanText = this.normalizeText(text);

    const scored = foods
      .map(food => {
        const name = this.cleanFoodName(food?.name || food?.food || "");
        const calories = Number(food?.calories || food?.totalCalories);

        if (!name || !Number.isFinite(calories)) return null;

        const normalizedName = this.normalizeText(name);
        const tokens = normalizedName
          .split(/\s+/)
          .filter(token => token.length >= 3);

        let score = 0;

        if (cleanText.includes(normalizedName)) score += 10;

        tokens.forEach(token => {
          if (cleanText.includes(token)) score += 2;
        });

        return {
          name,
          calories: Math.round(calories),
          protein_g: this.validMacro(food?.protein_g ?? food?.protein),
          carbs_g: this.validMacro(food?.carbs_g ?? food?.carbs ?? food?.carbohydrates),
          fat_g: this.validMacro(food?.fat_g ?? food?.fat),
          score
        };
      })
      .filter(Boolean)
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored[0] || null;
  },

  resolveMealMacros(summary = {}, mealEstimate = null) {
    const candidates = [
      mealEstimate,
      summary.mealEstimate,
      summary.nutritionEstimate,
      summary.foodAnalysis,
      summary.calorieEstimate,
      summary.appContext?.mealEstimate,
      summary.appContext?.lastMealEstimate,
      summary.threadState?.lastMealEstimate
    ].filter(Boolean);

    for (const candidate of candidates) {
      const protein_g = this.validMacro(
        candidate.protein_g ?? candidate.protein ?? candidate.totalProtein ?? candidate.totalProtein_g
      );
      const carbs_g = this.validMacro(
        candidate.carbs_g ?? candidate.carbs ?? candidate.carbohydrates ?? candidate.totalCarbs ?? candidate.totalCarbs_g
      );
      const fat_g = this.validMacro(
        candidate.fat_g ?? candidate.fat ?? candidate.totalFat ?? candidate.totalFat_g
      );

      if (protein_g !== null || carbs_g !== null || fat_g !== null) {
        return {
          protein_g: protein_g ?? 0,
          carbs_g: carbs_g ?? 0,
          fat_g: fat_g ?? 0
        };
      }
    }

    return { protein_g: 0, carbs_g: 0, fat_g: 0 };
  },

  validMacro(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1000) return null;
    return Math.round(number * 10) / 10;
  },

  resolveMealTotalCalories(summary = {}, text = "", mealEstimate = null) {
    const structuredCandidates = [
      mealEstimate?.totalCalories,
      mealEstimate?.calories,
      summary.mealEstimate?.totalCalories,
      summary.mealEstimate?.calories,
      summary.lastMealEstimate?.totalCalories,
      summary.lastMealEstimate?.calories,
      summary.foodAnalysis?.totalCalories,
      summary.nutritionEstimate?.totalCalories,
      summary.calorieEstimate?.totalCalories,
      summary.totalCalories,
      summary.appContext?.lastMealEstimate?.totalCalories,
      summary.appContext?.mealEstimate?.totalCalories,
      summary.threadState?.lastMealEstimate?.totalCalories
    ];

    for (const value of structuredCandidates) {
      const number = Number(value);
      if (Number.isFinite(number) && number >= 10 && number <= 5000) {
        return Math.round(number);
      }
    }

    const responseCalories = this.extractTotalCaloriesFromText(
      summary.finalResponse || summary.reply || summary.answer || ""
    );
    if (responseCalories) return responseCalories;

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

  resolveMealDescription(summary = {}, text = "", mealEstimate = null) {
    const structuredCandidates = [
      mealEstimate?.description,
      mealEstimate?.name,
      summary.mealEstimate?.description,
      summary.lastMealEstimate?.description,
      summary.foodAnalysis?.description,
      summary.nutritionEstimate?.description,
      summary.calorieEstimate?.description,
      summary.appContext?.lastMealEstimate?.description,
      summary.appContext?.mealEstimate?.description,
      summary.threadState?.lastMealEstimate?.description
    ];

    for (const value of structuredCandidates) {
      const clean = this.cleanFoodName(value);
      if (clean) return clean;
    }

    const directFood = this.extractFoodFromDirectLog(text);
    if (directFood) return directFood;

    const eatingFood = this.extractFoodFromEatingText(text);
    if (eatingFood) return eatingFood;

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

    return this.cleanFoodName(
      match[1]
        .replace(/\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:log|add|save|track).*$/i, "")
        .replace(/\b(?:please\s+)?(?:log|add|save|track)\s+(?:that|it|this).*$/i, "")
        .replace(/\b(?:for breakfast|for lunch|for dinner|as a snack)\b.*$/i, "")
    );
  },

  extractTotalCaloriesFromText(text = "") {
    const clean = String(text || "").replace(/,/g, "").toLowerCase();

    const patterns = [
      /total:\s*(?:approximately|about|around)?\s*(\d{2,5})\s*(?:calories|kcal|cals)/i,
      /total\s*(?:is|would be|comes to)?\s*(?:approximately|about|around)?\s*(\d{2,5})\s*(?:calories|kcal|cals)/i,
      /approximately\s*(\d{2,5})\s*(?:calories|kcal|cals)\s*(?:total|for the whole meal)/i,
      /about\s*(\d{2,5})\s*(?:calories|kcal|cals)\s*(?:total|for the whole meal)/i,
      /(?:about|around|roughly|approximately)\s*(\d{2,5})\s*(?:calories|kcal|cals)/i
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

  makeMealAction(foodName, calories, servingSize = "Estimated by Ari Rebirth", macros = {}) {
    const protein_g = this.validMacro(macros?.protein_g ?? macros?.protein) ?? 0;
    const carbs_g = this.validMacro(macros?.carbs_g ?? macros?.carbs ?? macros?.carbohydrates) ?? 0;
    const fat_g = this.validMacro(macros?.fat_g ?? macros?.fat) ?? 0;

    const macroText = `Protein ${protein_g}g · Carbs ${carbs_g}g · Fat ${fat_g}g`;

    return {
      action_type: "log_meal",
      requiresApproval: true,
      payload: {
        name: foodName,
        calories,
        category: "Meal",
        serving_size: servingSize,
        protein_g,
        carbs_g,
        fat_g
      },
      confirmation_text: `Log ${foodName} for about ${calories.toLocaleString()} calories? ${macroText}`
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
  },

  normalizeText(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};