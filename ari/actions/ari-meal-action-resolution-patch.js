// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-meal-action-resolution-patch.js
// Version: 1.0.0-experimental
// Purpose: make log_meal actions nutrition-complete before confirmation.
// =====================================================
(() => {
  "use strict";

  const runtime = window.AriAppControlRuntime || window.Ari?.appControlRuntime;
  if (!runtime) {
    console.error("ARI MEAL ACTION RESOLUTION PATCH: app control runtime unavailable");
    return;
  }

  const originalPrepareAction = typeof runtime.prepareAction === "function"
    ? runtime.prepareAction.bind(runtime)
    : null;

  runtime.prepareAction = async function prepareAction(action = {}, summary = {}) {
    let prepared = originalPrepareAction
      ? await originalPrepareAction(action, summary)
      : { ...action, payload: { ...(action.payload || {}) } };

    const operation = this.normalizeOperation?.(
      prepared.operation || prepared.action_type || prepared.type
    );

    if (operation !== "log_meal") return prepared;

    const resolver = window.AriMealResolutionRuntime || window.Ari?.mealResolutionRuntime;
    if (!resolver || typeof resolver.resolveMeal !== "function") {
      throw new Error("ari_meal_resolution_runtime_unavailable");
    }

    const payload = await resolver.resolveMeal(prepared.payload || {});
    const calories = Number(payload.calories || 0);
    if (!Number.isFinite(calories) || calories <= 0) {
      throw new Error("meal_calories_unresolved");
    }

    const matchNote = payload.nutritionResolution?.allDatabaseMatched === true
      ? "from the ARI Nutrition database"
      : "using the ARI Nutrition database with an estimate where needed";

    prepared = {
      ...prepared,
      operation: "log_meal",
      action_type: "log_meal",
      payload,
      confirmation_text:
        prepared.confirmation_text ||
        `I estimate that meal at about ${Math.round(calories).toLocaleString()} calories ${matchNote}. Log it?`,
      confirmationText:
        prepared.confirmationText ||
        `I estimate that meal at about ${Math.round(calories).toLocaleString()} calories ${matchNote}. Log it?`,
      nutritionResolved: true,
      nutritionResolution: payload.nutritionResolution || null
    };

    return prepared;
  };

  runtime.mealActionResolutionPatchVersion = "1.0.0-experimental";
})();