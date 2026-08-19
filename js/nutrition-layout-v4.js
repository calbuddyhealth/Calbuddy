// ARI XP — Nutrition layout v4.4.0
// Presentation controller + iPhone momentum safeguards + today-only Meal Plan loader.
(() => {
  "use strict";

  function updateTodayMealLabel() {
    const label = document.getElementById("todayMealCountLabel");
    const list = document.getElementById("todayMealList");
    if (!label || !list) return;

    const count = list.querySelectorAll(".nutrition-meal-card").length;
    label.textContent = count === 1 ? "Meals today · 1" : `Meals today · ${count}`;
  }

  function installMomentumGuards() {
    if (window.__ariNutritionMomentumGuards) return;
    window.__ariNutritionMomentumGuards = true;

    /* nutrition.js scrolls each new Ari message into view with smooth behavior.
       Once Ask Ari is part of the document scroller, that can cancel an active
       iOS inertial flick. Suppress only that page-specific auto-scroll. */
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      try {
        if (this?.matches?.("#ariMessages .ari-message")) return;
      } catch {}
      return nativeScrollIntoView.apply(this, args);
    };

    /* nutrition.js also programmatically refocuses Ask Ari when a reply ends.
       On iPhone this can reposition the visual viewport and interrupt momentum.
       Direct user taps still focus the textarea normally. */
    const nativeTextareaFocus = HTMLTextAreaElement.prototype.focus;
    HTMLTextAreaElement.prototype.focus = function (...args) {
      if (this?.id === "ariInput") return;
      return nativeTextareaFocus.apply(this, args);
    };
  }

  function loadMealPlanner() {
    if (document.getElementById("ariNutritionMealPlannerScript")) return;

    const script = document.createElement("script");
    script.id = "ariNutritionMealPlannerScript";
    script.src = "js/nutrition-meal-plan-today.js?v=2.0.0";
    script.async = false;
    document.head.appendChild(script);
  }

  function loadMealPlanCompact() {
    if (document.getElementById("ariNutritionMealPlanCompactScript")) return;

    const script = document.createElement("script");
    script.id = "ariNutritionMealPlanCompactScript";
    script.src = "js/nutrition-meal-plan-compact.js?v=1.0.0";
    script.async = false;
    document.head.appendChild(script);
  }

  function boot() {
    installMomentumGuards();
    loadMealPlanner();
    loadMealPlanCompact();

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
    window.addEventListener("ari:nutritionMealPlanChanged", updateTodayMealLabel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
