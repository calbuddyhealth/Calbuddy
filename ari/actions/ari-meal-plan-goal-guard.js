// =====================================================
// ARI XP
// File: ari/actions/ari-meal-plan-goal-guard.js
// Version: 1.0.0
// Purpose:
//   Prevent today-only Meal Plan generation from inventing a fallback calorie
//   budget when the user has not configured a Daily Calorie Goal.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const INSTALL_FLAG = "__ariMealPlanGoalGuardV1";
  const DAILY_GOAL_KEY = "calbuddyDailyCalorieGoal";

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function isMealPlanDecision(decision = {}) {
    return clean(decision.domain) === "nutrition" &&
      clean(decision.target) === "meal_plan" &&
      clean(decision.action) === "plan_meal" &&
      decision.needs_clarification !== true;
  }

  function hasExplicitCalorieTarget(decision = {}) {
    return number(decision?.entities?.calorie_target) > 0;
  }

  function dailyCalorieGoal() {
    return Math.max(0, number(localStorage.getItem(DAILY_GOAL_KEY)));
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (CalBuddy[INSTALL_FLAG]) return true;

    // Install only after the canonical Meal Plan action has wrapped the
    // internal Ask Ari boundary, so this guard can sit immediately in front
    // of that service without replacing it.
    if (!CalBuddy.__ariMealPlanActionV2 || typeof CalBuddy._askAriInternal !== "function") return false;

    const previousInternal = CalBuddy._askAriInternal.bind(CalBuddy);

    CalBuddy._askAriInternal = async function ariMealPlanGoalGuard(args = {}) {
      const decision = args.intentDecision || null;

      if (
        isMealPlanDecision(decision) &&
        !hasExplicitCalorieTarget(decision) &&
        dailyCalorieGoal() <= 0
      ) {
        return {
          reply: "I can build today’s plan from your remaining calories, but I need your Daily Calorie Goal first. Set it in Goals, then ask me again and I’ll use what you have left today.",
          pendingAction: null,
          intentDecision: decision,
          emotion: "coach",
          source: "ari_meal_plan_goal_guard"
        };
      }

      return await previousInternal(args);
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.info(`[ARI Meal Plan Goal Guard] Ready. Version ${VERSION}.`);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
