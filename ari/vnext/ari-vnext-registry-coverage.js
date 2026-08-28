// ARI vNext — permanent model-mutation registry coverage contract.
// Observes registration only. It has no preparation, pending, execution, persistence, or model authority.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_registry_coverage";
  const MODEL_MUTATION_OPERATIONS = Object.freeze([
    "log_meal",
    "log_activity",
    "log_weight",
    "update_goal",
    "plan_meal",
    "log_planned_meal",
    "plan_workout",
    "edit_workout",
    "update_nutrition_meal",
    "undo_nutrition_mutation",
    "update_weight_log",
    "delete_weight_log",
    "update_activity_log",
    "delete_activity_log",
    "edit_referenced_workout",
    "delete_workout",
    "log_referenced_planned_meal",
    "log_referenced_plan_components",
    "discard_referenced_meal_plan",
    "replace_referenced_meal_plan",
    "create_circle_meetup",
    "join_circle_meetup",
    "leave_circle_meetup",
    "cancel_circle_meetup",
    "create_circle_mission",
    "join_circle_mission",
    "submit_circle_mission_progress",
    "create_circle_crew",
    "accept_circle_crew_invite",
    "decline_circle_crew_invite",
    "leave_circle_crew",
    "archive_circle_crew"
  ]);

  function inspect() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.snapshot !== "function") return null;
    const snapshot = registry.snapshot();
    const registered = new Set(Array.isArray(snapshot?.operationNames) ? snapshot.operationNames : []);
    const missingOperations = MODEL_MUTATION_OPERATIONS.filter((name) => !registered.has(name));
    return { snapshot, missingOperations };
  }

  function install() {
    if (window.AriVNextRegistryCoverage?.ready === true) return true;
    const result = inspect();
    if (!result || result.missingOperations.length) return false;
    window.AriVNextRegistryCoverage = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      fallbackPolicy: "no_model_visible_mutation_requires_captured_fallback",
      modelMutationOperations: [...MODEL_MUTATION_OPERATIONS].sort(),
      operationCount: MODEL_MUTATION_OPERATIONS.length
    });
    window.dispatchEvent(new CustomEvent("ari:vnextRegistryCoverageReady", {
      detail: { version: VERSION, operationCount: MODEL_MUTATION_OPERATIONS.length }
    }));
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();
