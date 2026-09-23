// =====================================================
// ARI XP
// File: js/nutrition-meal-plan-today.js
// Version: 3.0.0
// Purpose:
//   Compatibility tombstone for the removed Meal Plan UI.
//   Old cached Nutrition layouts may still request this path.
//   Never create plan UI or plan mutations; remove any stale injected surface.
// =====================================================

(() => {
  "use strict";

  const VERSION = "3.0.0";

  function removeLegacyMealPlanSurface() {
    document.getElementById("nutritionTodayModeTabs")?.remove();
    document.getElementById("nutritionTodayMealPlan")?.remove();
    document.getElementById("ariNutritionTodayMealPlanCss")?.remove();
    document.getElementById("ariNutritionTodayIntegratedStyle")?.remove();

    const section = document.getElementById("manualEntrySection");
    section?.classList.remove("is-today-plan-mode");

    const header = section?.querySelector(":scope > .ari-manual-header");
    const form = section?.querySelector(":scope > .ari-form");
    if (header) header.hidden = false;
    if (form) form.hidden = false;

    document.querySelectorAll(".nutrition-recent-plan-actions").forEach((node) => node.remove());
  }

  window.AriNutritionMealPlanner = Object.freeze({
    version: VERSION,
    removed: true,
    setMode() {
      removeLegacyMealPlanSurface();
    },
    async refresh() {
      removeLegacyMealPlanSurface();
      return [];
    },
    getState() {
      return Object.freeze({ mode: "log", plans: [], favorites: [], removed: true });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeLegacyMealPlanSurface, { once: true });
  } else {
    removeLegacyMealPlanSurface();
  }
})();
