// =====================================================
// ARI XP
// File: js/nutrition-validator.js
// Version: 1.0.0
// Purpose:
//   One shared nutrition-entry validator for UI trust checks and Ari context.
//   This file does not mutate data. It only returns deterministic findings.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";

  if (window.AriNutritionValidator?.version === VERSION) return;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const COMPLETE_MEAL_WORDS = /\b(burrito|bowl|burger|pizza|sandwich|wrap|plate|platter|combo|meal|entree|breakfast|lunch|dinner)\b/i;
  const SUBSTANTIAL_SERVING = /\b(large|full|whole|bowl|plate|platter|meal|serving)\b/i;

  function detect(entry = {}) {
    const findings = [];
    const name = clean(entry?.name).toLowerCase();
    const serving = clean(entry?.serving_size ?? entry?.servingSize).toLowerCase();
    const calories = number(entry?.calories, NaN);
    const protein = Math.max(0, number(entry?.protein_g ?? entry?.proteinG ?? entry?.protein, 0));
    const carbs = Math.max(0, number(
      entry?.carbs_g ??
      entry?.carbsG ??
      entry?.carbs ??
      entry?.carbohydrates_g ??
      entry?.carbohydrates,
      0
    ));
    const fat = Math.max(0, number(entry?.fat_g ?? entry?.fatG ?? entry?.fat, 0));

    if (!Number.isFinite(calories) || calories < 0) {
      findings.push("Calories are missing or invalid.");
      return findings;
    }

    if (
      calories > 0 &&
      calories < 100 &&
      (COMPLETE_MEAL_WORDS.test(name) || SUBSTANTIAL_SERVING.test(serving))
    ) {
      findings.push("The calorie total looks unusually low for the meal description or serving.");
    }

    if (calories > 5000) {
      findings.push("The calorie total is unusually high for one entry.");
    }

    const macroCalories = protein * 4 + carbs * 4 + fat * 9;
    if (macroCalories > 0) {
      const difference = Math.abs(macroCalories - calories);
      const tolerance = Math.max(120, calories * 0.4);
      if (difference > tolerance) {
        findings.push("Calories and macronutrients do not appear to describe the same portion.");
      }
    }

    return findings;
  }

  function isSuspicious(entry = {}) {
    return detect(entry).length > 0;
  }

  function summarize(entry = {}) {
    const findings = detect(entry);
    return {
      valid: findings.length === 0,
      warningCount: findings.length,
      findings
    };
  }

  window.AriNutritionValidator = Object.freeze({
    version: VERSION,
    detect,
    isSuspicious,
    summarize
  });
})();
