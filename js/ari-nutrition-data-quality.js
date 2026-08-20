// =====================================================
// ARI XP
// File: js/ari-nutrition-data-quality.js
// Version: 1.0.0
// Purpose:
//   Add compact data-quality/provenance evidence to the user context Ari sees.
//   Suspicious records remain user data; Ari is told to question them rather
//   than silently treating them as reliable facts.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const INSTALL_FLAG = "__ariNutritionDataQualityV1";
  const page = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  if (!["", "home.html", "nutrition.html"].includes(page)) return;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function detect(entry = {}) {
    const reasons = [];
    const name = clean(entry?.name).toLowerCase();
    const serving = clean(entry?.serving_size).toLowerCase();
    const calories = number(entry?.calories, NaN);
    const protein = Math.max(0, number(entry?.protein_g ?? entry?.proteinG ?? entry?.protein, 0));
    const carbs = Math.max(0, number(entry?.carbs_g ?? entry?.carbsG ?? entry?.carbs, 0));
    const fat = Math.max(0, number(entry?.fat_g ?? entry?.fatG ?? entry?.fat, 0));

    if (!Number.isFinite(calories) || calories < 0) {
      return ["Calories are missing or invalid."];
    }

    const completeMealWords = /\b(burrito|bowl|burger|pizza|sandwich|wrap|plate|platter|combo|meal|entree|breakfast|lunch|dinner)\b/i;
    const substantialServing = /\b(large|full|whole|bowl|plate|platter|meal|serving)\b/i;

    if (
      calories > 0 &&
      calories < 100 &&
      (completeMealWords.test(name) || substantialServing.test(serving))
    ) {
      reasons.push("Calories look unusually low for the description or serving.");
    }

    const macroCalories = protein * 4 + carbs * 4 + fat * 9;
    if (macroCalories > 0) {
      const difference = Math.abs(macroCalories - calories);
      const tolerance = Math.max(120, calories * 0.4);
      if (difference > tolerance) {
        reasons.push("Calories and macros may describe different portions.");
      }
    }

    return reasons;
  }

  function buildQuality(context = {}) {
    const meals = Array.isArray(context?.mealsToday) ? context.mealsToday : [];
    const warnings = meals
      .map((meal) => {
        const reasons = detect(meal);
        if (!reasons.length) return null;
        return {
          mealId: meal?.id || null,
          name: clean(meal?.name) || "Meal",
          calories: Number.isFinite(Number(meal?.calories)) ? Number(meal.calories) : null,
          servingSize: clean(meal?.serving_size) || null,
          reasons
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    return {
      version: VERSION,
      sourceOfTruth: "public.meals",
      nutritionDate: context?.nutritionDate || null,
      loggedMealCount: meals.length,
      loggedCalories: Number.isFinite(Number(context?.caloriesConsumed))
        ? Number(context.caloriesConsumed)
        : meals.reduce((sum, meal) => sum + Math.max(0, number(meal?.calories)), 0),
      warningCount: warnings.length,
      warnings,
      instruction:
        warnings.length
          ? "One or more logged nutrition records look suspicious. Treat those records as uncertain evidence, name the specific inconsistency when relevant, and ask for correction before building precise recommendations on top of them."
          : "No simple nutrition integrity warning was detected in today's logged meals."
    };
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || typeof CalBuddy.getUserContext !== "function") return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const original = CalBuddy.getUserContext.bind(CalBuddy);

    CalBuddy.getUserContext = async function ariNutritionQualityContext(...args) {
      const context = await original(...args);
      if (!context || typeof context !== "object") return context;

      const quality = buildQuality(context);
      context.nutrition = {
        ...(context.nutrition && typeof context.nutrition === "object" ? context.nutrition : {}),
        ledgerEvidence: {
          source: quality.sourceOfTruth,
          nutritionDate: quality.nutritionDate,
          loggedMealCount: quality.loggedMealCount,
          loggedCalories: quality.loggedCalories
        },
        dataQuality: quality
      };

      return context;
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    console.info(`[ARI Nutrition Data Quality] Ready. Version ${VERSION}.`);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
