// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-meal-context-guard.js
// Version: 1.0.0
// Purpose:
//   Prevent stale meal estimates from being logged when the user names a
//   different food in the current message. Current-turn food always wins.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari/actions/ari-meal-context-guard";
  const MAX_INSTALL_ATTEMPTS = 200;
  let attempts = 0;

  function clean(value = "") {
    return String(value || "").trim();
  }

  function normalize(value = "") {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function validMacro(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1000) return null;
    return Math.round(number * 10) / 10;
  }

  function validCalories(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 10 || number > 5000) return null;
    return Math.round(number);
  }

  function titleCase(value = "") {
    return clean(value)
      .split(/\s+/)
      .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "")
      .join(" ");
  }

  function extractCurrentFood(text = "") {
    const source = clean(text);
    const match = source.match(/\b(?:i\s+(?:just\s+)?(?:ate|had)|(?:i've|i’ve)\s+had)\s+(.{2,220})/i);
    if (!match) return null;

    let food = clean(match[1]);

    // Stop at the logging/question portion of the same turn.
    food = food
      .replace(/[.!?]\s*(?:can|could|would|will)\s+you\b[\s\S]*$/i, "")
      .replace(/\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:log|add|save|track)\b[\s\S]*$/i, "")
      .replace(/\b(?:please\s+)?(?:log|add|save|track)\s+(?:that|it|this|the\s+meal)\b[\s\S]*$/i, "")
      .replace(/\b(?:how many|how much)\s+(?:calories|protein|carbs?|carbohydrates?|fat)\b[\s\S]*$/i, "")
      .replace(/\b(?:this|today)\s+(?:morning|afternoon|evening|night)\b/gi, "")
      .replace(/\b(?:for|at)\s+(?:breakfast|lunch|dinner|snack)\b/gi, "")
      .replace(/\b(?:this morning|this afternoon|this evening|tonight|today|earlier)\b/gi, "")
      .replace(/^[\s]*(?:a|an|the)\s+/i, "")
      .replace(/[,.!?;:]+$/g, "")
      .trim();

    if (!food || food.length < 2 || food.length > 140) return null;
    return titleCase(food);
  }

  function foodTokens(value = "") {
    const ignored = new Set([
      "a", "an", "the", "and", "with", "of", "for", "meal", "food",
      "breakfast", "lunch", "dinner", "snack", "estimated", "estimate"
    ]);

    return normalize(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !ignored.has(token));
  }

  function estimateText(estimate = {}) {
    const pieces = [
      estimate?.description,
      estimate?.name,
      estimate?.food,
      ...(Array.isArray(estimate?.foods)
        ? estimate.foods.flatMap((item) => [item?.name, item?.food, item?.description])
        : [])
    ];
    return normalize(pieces.filter(Boolean).join(" "));
  }

  function estimateMatchesFood(estimate, foodName) {
    if (!estimate || !foodName) return false;

    const targetTokens = foodTokens(foodName);
    const haystack = estimateText(estimate);
    if (!targetTokens.length || !haystack) return false;

    const matches = targetTokens.filter((token) => haystack.includes(token));

    // One distinctive token is enough for a one-token food. For multi-token
    // foods require at least half the meaningful words so chicken burrito
    // cannot match pepperoni pizza.
    const required = targetTokens.length === 1
      ? 1
      : Math.max(2, Math.ceil(targetTokens.length / 2));

    return matches.length >= required;
  }

  function currentTurnEstimate(summary = {}, currentFood = null) {
    const candidates = [
      summary.mealEstimate,
      summary.foodAnalysis,
      summary.nutritionEstimate,
      summary.calorieEstimate
    ].filter(Boolean);

    if (!currentFood) return candidates[0] || null;
    return candidates.find((candidate) => estimateMatchesFood(candidate, currentFood)) || null;
  }

  function priorEstimate(summary = {}) {
    return (
      summary.lastMealEstimate ||
      summary.appContext?.lastMealEstimate ||
      summary.appContext?.mealEstimate ||
      summary.threadState?.lastMealEstimate ||
      null
    );
  }

  function resolveMacros(estimate = {}) {
    return {
      protein_g: validMacro(
        estimate?.protein_g ?? estimate?.protein ?? estimate?.totalProtein ?? estimate?.totalProtein_g
      ),
      carbs_g: validMacro(
        estimate?.carbs_g ?? estimate?.carbs ?? estimate?.carbohydrates ?? estimate?.totalCarbs ?? estimate?.totalCarbs_g
      ),
      fat_g: validMacro(
        estimate?.fat_g ?? estimate?.fat ?? estimate?.totalFat ?? estimate?.totalFat_g
      )
    };
  }

  function resolveCalories(estimate = {}) {
    return validCalories(
      estimate?.totalCalories ?? estimate?.calories ?? estimate?.total_calories ?? estimate?.kcal
    );
  }

  function resolveEstimateName(estimate = {}) {
    const name = clean(estimate?.description || estimate?.name || estimate?.food || "");
    return name ? titleCase(name) : null;
  }

  function inferCategory(text = "") {
    const normalizedText = normalize(text);
    if (/\b(breakfast|morning)\b/.test(normalizedText)) return "Breakfast";
    if (/\b(lunch|afternoon)\b/.test(normalizedText)) return "Lunch";
    if (/\b(dinner|evening|tonight|night)\b/.test(normalizedText)) return "Dinner";
    if (/\bsnack\b/.test(normalizedText)) return "Snack";
    return "Meal";
  }

  function isBareReference(text = "") {
    const normalizedText = normalize(text);
    return (
      /\b(log|add|save|track)\b/.test(normalizedText) &&
      /\b(that|it|this|the meal)\b/.test(normalizedText) &&
      !extractCurrentFood(text)
    );
  }

  function buildMealAction({ name, calories, macros, category }) {
    if (!name || !calories) return null;

    // Never manufacture 0g macros simply because the structured estimate is
    // missing. If a fresh estimate is incomplete, do not offer a misleading
    // confirmation; Ari can answer/re-estimate instead.
    if (
      macros.protein_g === null ||
      macros.carbs_g === null ||
      macros.fat_g === null
    ) {
      return null;
    }

    return {
      action_type: "log_meal",
      requiresApproval: true,
      payload: {
        name,
        calories,
        category: category || "Meal",
        serving_size: "Estimated by Ari before logging",
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g
      },
      confirmation_text:
        `Log ${name} — about ${calories.toLocaleString()} kcal · ` +
        `${macros.protein_g}g protein · ${macros.carbs_g}g carbs · ${macros.fat_g}g fat?`
    };
  }

  function install() {
    const planner = window.Ari?.rebirthActionPlanner;

    if (!planner || typeof planner.detectMealLog !== "function") {
      attempts += 1;
      if (attempts < MAX_INSTALL_ATTEMPTS) {
        setTimeout(install, 50);
      } else {
        console.warn("ARI MEAL CONTEXT GUARD: planner not found");
      }
      return;
    }

    if (planner.__mealContextGuardVersion === VERSION) return;

    const originalDetectMealLog = planner.detectMealLog.bind(planner);

    planner.detectMealLog = function guardedDetectMealLog(text = "", summary = {}) {
      if (!this.userWantsMealLog(text)) return null;

      const currentFood = extractCurrentFood(text);

      if (currentFood) {
        const estimate = currentTurnEstimate(summary, currentFood);

        // Critical stale-context rule: when the current message names food,
        // NEVER fall back to lastMealEstimate/history from another turn.
        if (!estimate) {
          console.warn("ARI MEAL CONTEXT GUARD: rejected stale or mismatched meal estimate", {
            currentFood
          });
          return null;
        }

        const calories = resolveCalories(estimate);
        const macros = resolveMacros(estimate);

        return buildMealAction({
          name: currentFood,
          calories,
          macros,
          category: inferCategory(text)
        });
      }

      // Prior meal context is permitted only for a true pronoun-only follow-up
      // such as "log that" where no new food was named in the current message.
      if (isBareReference(text)) {
        const estimate = currentTurnEstimate(summary) || priorEstimate(summary);
        if (!estimate) return null;

        return buildMealAction({
          name: resolveEstimateName(estimate),
          calories: resolveCalories(estimate),
          macros: resolveMacros(estimate),
          category: inferCategory(text)
        });
      }

      // Other explicit direct forms retain the existing planner behavior.
      return originalDetectMealLog(text, summary);
    };

    planner.__mealContextGuardVersion = VERSION;
    planner.__mealContextGuardSource = SOURCE;

    window.AriMealContextGuard = {
      version: VERSION,
      source: SOURCE,
      extractCurrentFood,
      estimateMatchesFood
    };

    console.log("ARI MEAL CONTEXT GUARD LOADED:", VERSION);
  }

  install();
})();
