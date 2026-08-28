// =====================================================
// ARI XP
// File: ari/actions/ari-meal-plan-goal-guard.js
// Version: 2.0.0-compat
// Purpose:
//   Compatibility shim only. Meal Plan product policy is owned server-side by
//   api/_lib/ari-vnext/nutrition-plan-policy.js. This file intentionally does
//   not wrap CalBuddy._askAriInternal and has no mutation or product-veto authority.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "2.0.0-compat";
  const INSTALL_FLAG = "__ariMealPlanGoalGuardV1";

  if (!window.CalBuddy[INSTALL_FLAG]) {
    Object.defineProperty(window.CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });
  }

  console.info(`[ARI Meal Plan Goal Guard] Compatibility shim only. Version ${VERSION}.`);
})();
