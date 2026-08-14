// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-meal-context-guard.js
// Version: 1.1.0
// Purpose:
//   Make meal WRITE actions strictly current-turn only.
//   Conversation history may inform Ari's dialogue, but it may never supply
//   the food, calories, or macros used by a new log_meal action.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari/actions/ari-meal-context-guard";

  window.Ari = window.Ari || {};

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
      .map((word) => word
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : "")
      .join(" ");
  }

  function stripMealCommandTail(value = "") {
    return clean(value)
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
  }

  function extractCurrentFood(text = "") {
    const source = clean(text);

    const eatingMatch = source.match(
      /\b(?:i\s+(?:just\s+)?(?:ate|had)|(?:i've|i’ve)\s+had)\s+(.{2,240})/i
    );

    if (eatingMatch) {
      const food = stripMealCommandTail(eatingMatch[1]);
      if (food && food.length >= 2 && food.length <= 160) {
        return titleCase(food);
      }
    }

    // Support direct same-turn commands such as "log a chicken burrito" while
    // explicitly rejecting pronouns like "log that" / "save it".
    const directMatch = source.match(
      /\b(?:log|add|save|track)\s+(?:my\s+)?(?:a\s+|an\s+|the\s+)?(.{2,180})/i
    );

    if (directMatch) {
      const raw = stripMealCommandTail(directMatch[1])
        .replace(/\b(?:for\s+)?\d{2,5}\s*(?:calories|calorie|kcal|cals)\b[\s\S]*$/i, "")
        .trim();

      if (!/^(?:that|it|this|meal|the meal)$/i.test(raw)) {
        if (raw && raw.length >= 2 && raw.length <= 160) {
          return titleCase(raw);
        }
      }
    }

    return null;
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
        ? estimate.foods.flatMap((item) => [
            item?.name,
            item?.food,
            item?.description
          ])
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
    const required = targetTokens.length === 1
      ? 1
      : Math.max(2, Math.ceil(targetTokens.length / 2));

    return matches.length >= required;
  }

  function getCurrentTurnEstimate(summary = {}, currentFood = null) {
    // IMPORTANT: no lastMealEstimate, appContext meal estimate, thread state,
    // or history is legal here. These four fields must originate this turn.
    const candidates = [
      summary.mealEstimate,
      summary.foodAnalysis,
      summary.nutritionEstimate,
      summary.calorieEstimate
    ].filter(Boolean);

    if (!currentFood) return null;

    return candidates.find((candidate) =>
      estimateMatchesFood(candidate, currentFood)
    ) || null;
  }

  function resolveMacros(estimate = {}) {
    return {
      protein_g: validMacro(
        estimate?.protein_g ??
        estimate?.protein ??
        estimate?.totalProtein ??
        estimate?.totalProtein_g
      ),
      carbs_g: validMacro(
        estimate?.carbs_g ??
        estimate?.carbs ??
        estimate?.carbohydrates ??
        estimate?.totalCarbs ??
        estimate?.totalCarbs_g
      ),
      fat_g: validMacro(
        estimate?.fat_g ??
        estimate?.fat ??
        estimate?.totalFat ??
        estimate?.totalFat_g
      )
    };
  }

  function resolveCalories(estimate = {}) {
    return validCalories(
      estimate?.totalCalories ??
      estimate?.calories ??
      estimate?.total_calories ??
      estimate?.kcal
    );
  }

  function inferCategory(text = "") {
    const normalizedText = normalize(text);
    if (/\b(breakfast|morning)\b/.test(normalizedText)) return "Breakfast";
    if (/\b(lunch|afternoon)\b/.test(normalizedText)) return "Lunch";
    if (/\b(dinner|evening|tonight|night)\b/.test(normalizedText)) return "Dinner";
    if (/\bsnack\b/.test(normalizedText)) return "Snack";
    return "Meal";
  }

  function buildMealAction({ name, calories, macros, category }) {
    if (!name || !calories) return null;

    // Never manufacture zeros for missing nutrition data. Zero is accepted
    // only when the current-turn estimate explicitly returned numeric zero.
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
        fat_g: macros.fat_g,
        ari_context_policy: "current_turn_only"
      },
      confirmation_text:
        `Log ${name} — about ${calories.toLocaleString()} kcal · ` +
        `${macros.protein_g}g protein · ${macros.carbs_g}g carbs · ` +
        `${macros.fat_g}g fat?`
    };
  }

  function clearOldPendingMealAction() {
    const pending = window.CalBuddy?.getPendingAction?.();
    const type = pending?.action_type || pending?.type || pending?.actionType;

    if (type !== "log_meal") return;

    try {
      window.CalBuddy?.cancelPendingAction?.();
    } catch (error) {
      console.warn("ARI MEAL CONTEXT GUARD: failed to clear old meal action", error);
    }

    try {
      window.hidePendingAction?.();
    } catch (_) {}
  }

  function patchPlanner(planner) {
    if (!planner || typeof planner.detectMealLog !== "function") return planner;
    if (planner.__mealContextGuardVersion === VERSION) return planner;

    planner.detectMealLog = function currentTurnOnlyMealLog(text = "", summary = {}) {
      if (!this.userWantsMealLog(text)) return null;

      const currentFood = extractCurrentFood(text);

      // No food in this user turn = no meal write. "Log that" by itself is
      // intentionally conversational/clarification territory now.
      if (!currentFood) {
        console.info(
          "ARI MEAL CONTEXT GUARD: blocked cross-turn meal reference"
        );
        return null;
      }

      const estimate = getCurrentTurnEstimate(summary, currentFood);

      if (!estimate) {
        console.warn(
          "ARI MEAL CONTEXT GUARD: blocked missing/mismatched current-turn estimate",
          { currentFood }
        );
        return null;
      }

      return buildMealAction({
        name: currentFood,
        calories: resolveCalories(estimate),
        macros: resolveMacros(estimate),
        category: inferCategory(text)
      });
    };

    planner.__mealContextGuardVersion = VERSION;
    planner.__mealContextGuardSource = SOURCE;

    return planner;
  }

  // The App Bridge loads the planner lazily. Intercept assignment so this
  // guard cannot miss installation simply because the user waited >10 sec
  // before sending the first message.
  function installPlannerAssignmentHook() {
    const ari = window.Ari;
    const existing = ari.rebirthActionPlanner;

    if (existing) {
      patchPlanner(existing);
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(
      ari,
      "rebirthActionPlanner"
    );

    if (descriptor && descriptor.configurable === false) return;

    let plannerValue = existing;

    Object.defineProperty(ari, "rebirthActionPlanner", {
      configurable: true,
      enumerable: true,
      get() {
        return plannerValue;
      },
      set(value) {
        plannerValue = patchPlanner(value);
      }
    });
  }

  function installAskBoundaryGuard() {
    const calBuddy = window.CalBuddy;
    if (!calBuddy || typeof calBuddy.askAri !== "function") return;
    if (calBuddy.askAri.__currentTurnMealGuardVersion === VERSION) return;

    const originalAskAri = calBuddy.askAri.bind(calBuddy);

    const guardedAskAri = async function guardedAskAri(options = {}) {
      const message = clean(
        typeof options === "string" ? options : options?.message
      );

      // Starting a new meal attempt invalidates any old pending meal write.
      // It does not clear workout/weight/profile actions.
      if (extractCurrentFood(message) || /\b(log|add|save|track)\b/i.test(message)) {
        clearOldPendingMealAction();
      }

      return originalAskAri(options);
    };

    guardedAskAri.__currentTurnMealGuardVersion = VERSION;
    calBuddy.askAri = guardedAskAri;
  }

  installPlannerAssignmentHook();
  installAskBoundaryGuard();

  window.AriMealContextGuard = {
    version: VERSION,
    source: SOURCE,
    policy: "current_turn_only",
    extractCurrentFood,
    estimateMatchesFood,
    clearOldPendingMealAction
  };

  console.log("ARI MEAL CONTEXT GUARD LOADED:", VERSION);
})();
