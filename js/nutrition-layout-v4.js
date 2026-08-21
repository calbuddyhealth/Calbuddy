// ARI XP — Nutrition layout v4.6.0
// Presentation controller + iPhone momentum safeguards + consolidated today-only Meal Plan loader.
(() => {
  "use strict";

  function installNutritionCoreInitBoundary() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || typeof CalBuddy.init !== "function") return;
    if (CalBuddy.init.__ariNutritionOwnedInit === true) return;

    // calbuddy-core.js owns generic multi-surface dashboard hydration. Nutrition
    // already owns its own Today + Recent startup reads, so running the generic
    // dashboard refresh here creates a second canonical Today ledger query and
    // blocks first interaction behind redundant Supabase work.
    const nutritionInit = async function nutritionOwnedCoreInit() {
      CalBuddy.getPendingAction?.();
      CalBuddy.setAriMood?.("idle");
      console.log(
        "CalBuddy core loaded.",
        CalBuddy.version,
        "Nutrition owns initial ledger hydration."
      );
    };

    nutritionInit.__ariNutritionOwnedInit = true;
    CalBuddy.init = nutritionInit;
  }

  function updateTodayMealLabel() {
    const label = document.getElementById("todayMealCountLabel");
    const list = document.getElementById("todayMealList");
    if (!label || !list) return;

    const count = list.querySelectorAll(".nutrition-meal-card").length;
    label.textContent = count === 1 ? "Meals today · 1" : `Meals today · ${count}`;
  }

  function installNutritionLoadCoordinator() {
    if (window.__ariNutritionLoadCoordinatorV1) return;

    const originalToday = window.loadTodayMeals;
    const originalRecent = window.loadRecentMeals;
    if (typeof originalToday !== "function" || typeof originalRecent !== "function") return;

    let todayCycle = null;
    let recentCycle = null;
    let clearTimer = null;

    const startRecent = () => {
      if (!recentCycle) {
        recentCycle = Promise.resolve().then(() => originalRecent());
      }
      return recentCycle;
    };

    window.loadTodayMeals = function coordinatedTodayMealsLoad() {
      if (todayCycle) return todayCycle;

      window.clearTimeout(clearTimer);
      const recent = startRecent();
      const today = Promise.resolve().then(() => originalToday());

      todayCycle = Promise.allSettled([today, recent])
        .then((results) => {
          const todayResult = results[0];
          if (todayResult?.status === "rejected") throw todayResult.reason;
          return todayResult?.value;
        })
        .finally(() => {
          // Keep the already-completed Recent promise through the next microtask.
          // nutrition.js currently calls `await loadTodayMeals(); await loadRecentMeals();`;
          // this prevents that second statement from issuing a duplicate query.
          clearTimer = window.setTimeout(() => {
            todayCycle = null;
            recentCycle = null;
          }, 0);
        });

      return todayCycle;
    };

    window.loadRecentMeals = function coordinatedRecentMealsLoad() {
      return startRecent();
    };

    window.__ariNutritionLoadCoordinatorV1 = Object.freeze({
      version: "1.0.0",
      getStatus: () => ({
        todayInFlight: Boolean(todayCycle),
        recentInFlight: Boolean(recentCycle)
      })
    });
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
    script.src = "js/nutrition-meal-plan-today.js?v=2.1.0";
    script.async = false;
    document.head.appendChild(script);
  }

  function boot() {
    installNutritionCoreInitBoundary();
    installNutritionLoadCoordinator();
    installMomentumGuards();
    loadMealPlanner();

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
    // Both boundaries must install immediately. calbuddy-core.js and
    // nutrition.js registered DOM-ready handlers before this file, and those
    // handlers resolve their globals at event time.
    installNutritionCoreInitBoundary();
    installNutritionLoadCoordinator();
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
