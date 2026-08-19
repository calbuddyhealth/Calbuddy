// ARI XP — Nutrition layout v4.0.0
// Small presentation controller for the action-first Nutrition surface.
(() => {
  "use strict";

  function updateTodayMealLabel() {
    const label = document.getElementById("todayMealCountLabel");
    const list = document.getElementById("todayMealList");
    if (!label || !list) return;

    const count = list.querySelectorAll(".nutrition-meal-card").length;
    label.textContent = count === 1 ? "Meals today · 1" : `Meals today · ${count}`;
  }

  function boot() {
    const dashboard = document.getElementById("todayNutritionSection");
    if (dashboard && !dashboard.hasAttribute("open")) dashboard.open = true;

    const todayMeals = document.getElementById("todayMealsSection");
    if (todayMeals) todayMeals.open = false;

    updateTodayMealLabel();

    const list = document.getElementById("todayMealList");
    if (list && "MutationObserver" in window) {
      const observer = new MutationObserver(updateTodayMealLabel);
      observer.observe(list, { childList: true, subtree: false });
    }

    window.addEventListener("calbuddy:dashboardRefresh", updateTodayMealLabel);
    window.addEventListener("ari:activityChanged", updateTodayMealLabel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
