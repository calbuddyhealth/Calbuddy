// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-meal-action.js
// Version: 1.0.0
// Purpose:
//   SINGLE originator for Ari-created meal-log mutations.
//   Uses only the current user turn + the structured mealEstimate returned
//   for that same turn. No conversation-history or last-meal fallback.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const INSTALL_FLAG = "__ariMealActionV1";
  const SOURCE = "ari_meal_action_v1_current_turn";

  const clean = (value = "") => String(value ?? "").trim();

  function isMealLogRequest(message = "") {
    const text = clean(message).toLowerCase();
    if (!text) return false;

    const writeIntent = /\b(log|track|save|record|add)\b/.test(text);
    const eatingContext = /\b(i ate|i had|i drank|i just ate|i just had|i just drank|breakfast|lunch|dinner|snack|meal|food)\b/.test(text);
    const nonMealTarget = /\b(workout|training|exercise|sets?|reps?|weight|blood pressure|heart rate|steps?|sleep|medication|dose|symptom|mood|journal|note|github|code|account|login)\b/.test(text);

    return writeIntent && eatingContext && !nonMealTarget;
  }

  function normalizeMealTitle(estimate = {}, message = "") {
    const foods = Array.isArray(estimate.foods)
      ? estimate.foods.map(item => clean(item?.name)).filter(Boolean)
      : [];

    let title = clean(estimate.description);

    if (!title && foods.length) {
      title = foods.slice(0, 4).join(" + ");
    }

    if (!title) {
      title = clean(message);
    }

    title = title
      .replace(/^\s*(?:i\s+(?:had|ate|drank|just\s+had|just\s+ate|just\s+drank))\s+/i, "")
      .replace(/\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:log|track|save|record|add)\b.*$/i, "")
      .replace(/\bplease\s+(?:log|track|save|record|add)\b.*$/i, "")
      .replace(/\b(?:log|track|save|record|add)\s+(?:that|this|it)(?:\s+meal)?\b.*$/i, "")
      .replace(/[.?!,:;\-\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!title && foods.length) title = foods.slice(0, 4).join(" + ");
    if (!title) title = "Meal";

    if (title.length > 72 && foods.length) {
      title = foods.slice(0, 4).join(" + ");
    }

    if (title.length > 72) {
      title = `${title.slice(0, 69).trim()}...`;
    }

    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  function normalizeEstimate(raw = {}, message = "") {
    const calories = Number(raw.totalCalories ?? raw.calories ?? 0);
    const protein = Number(raw.protein_g);
    const carbs = Number(raw.carbs_g);
    const fat = Number(raw.fat_g);

    if (!Number.isFinite(calories) || calories <= 0) return null;
    if (![protein, carbs, fat].every(Number.isFinite)) return null;

    return {
      name: normalizeMealTitle(raw, message),
      calories: Math.round(calories),
      protein_g: Math.max(0, Math.round(protein * 10) / 10),
      carbs_g: Math.max(0, Math.round(carbs * 10) / 10),
      fat_g: Math.max(0, Math.round(fat * 10) / 10),
      category: "Meal",
      serving_size: "Estimated by Ari before logging",
      estimate_confidence: clean(raw.confidence) || "medium",
      source: SOURCE
    };
  }

  function clearOldMealPendingAction(CalBuddy) {
    try {
      const pending = CalBuddy.getPendingAction?.();
      if (pending?.action_type === "log_meal") {
        CalBuddy.cancelPendingAction?.();
      }
    } catch {
      // Best-effort stale-state cleanup only.
    }
  }

  async function createPendingMeal(CalBuddy, estimate) {
    const action = {
      action_type: "log_meal",
      source: SOURCE,
      payload: estimate,
      confirmation_text:
        `Log ${estimate.name} — about ${estimate.calories.toLocaleString()} kcal · ` +
        `${estimate.protein_g}g protein · ${estimate.carbs_g}g carbs · ${estimate.fat_g}g fat?`
    };

    const pending = await CalBuddy.createPendingAction(action);
    CalBuddy.setAriMood?.("coach");
    return pending;
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.createPendingAction) return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const originalInternal = CalBuddy._askAriInternal.bind(CalBuddy);

    CalBuddy._askAriInternal = async function ariMealActionRouter(args = {}) {
      const message = clean(args.message);

      if (!isMealLogRequest(message)) {
        return await originalInternal(args);
      }

      // New meal request starts a new write transaction. Previous pending meal
      // attempts are never reused or treated as evidence for this turn.
      clearOldMealPendingAction(CalBuddy);

      const result = await originalInternal(args);
      if (result?.blocked) return result;

      const structured =
        result?.mealEstimate ||
        result?.nutritionEstimate ||
        result?.response?.mealEstimate ||
        result?.response?.nutritionEstimate ||
        null;

      const estimate = normalizeEstimate(structured || {}, message);

      if (!estimate) {
        return {
          ...result,
          pendingAction: null,
          reply:
            clean(result?.reply) ||
            "I can estimate and log that meal, but I need a clearer serving or food description first.",
          source: "ari-meal-action-estimate-incomplete"
        };
      }

      const pending = await createPendingMeal(CalBuddy, estimate);

      return {
        ...result,
        mealEstimate: structured,
        pendingAction: pending,
        source: SOURCE
      };
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI MEAL ACTION INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const tryInstall = () => {
    attempts += 1;
    if (install()) return;
    if (attempts < 120) window.setTimeout(tryInstall, 50);
  };

  tryInstall();
})();
