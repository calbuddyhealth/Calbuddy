// Permanent registry ownership for plan_meal and log_planned_meal.
(() => {
  "use strict";

  const SOURCE = "ari_vnext_nutrition_plan_command_registry";
  let servicePromise = null;
  let installed = false;

  function service() {
    if (!servicePromise) {
      servicePromise = import("../../js/nutrition/nutrition-plan-command-service.js?v=1.0.0")
        .then((module) => module.default || module.NutritionPlanCommandService);
    }
    return servicePromise;
  }

  async function prepare(pending = {}) {
    const svc = await service();
    if (pending?.name === "plan_meal") return await svc.preparePlan(pending);
    if (pending?.name === "log_planned_meal") return svc.preparePlannedMealLog(pending);
    return { success: false, code: "meal_plan_command_unsupported", message: "That Meal Plan command is not supported." };
  }

  async function createPending(pending = {}) {
    const prepared = await prepare(pending);
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that Meal Plan change safely." };
    }
    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution: prepared.resolution || null };
  }

  async function executeConfirmed(input = {}) {
    const pending = input?.vnextPendingAction || input || {};
    const prepared = await prepare(pending);
    if (!prepared?.success || !prepared?.action) return prepared;
    const svc = await service();
    const result = pending?.name === "plan_meal"
      ? await svc.savePlan(prepared.action)
      : await svc.logPlannedMeal(prepared.action);
    if (!result?.success) return result;
    return {
      success: true,
      result,
      reply: result.reply,
      action: {
        ...prepared.action,
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: input?.currentTurnId || null,
        vnext_source: SOURCE
      }
    };
  }

  function register() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;
    for (const name of ["plan_meal", "log_planned_meal"]) {
      registry.registerOperation(name, {
        source: SOURCE,
        priority: 23000,
        match(input = {}) { return (input?.vnextPendingAction || input || {})?.name === name; },
        prepare,
        createPending,
        executeConfirmed
      });
    }
    installed = true;
    window.AriVNextNutritionPlanCommandRegistry = Object.freeze({ ready: true, source: SOURCE, prepare, createPending, executeConfirmed });
    return true;
  }

  if (!register()) window.addEventListener("ari:vnextOperationRegistryReady", register, { once: true });

  import("./ari-vnext-nutrition-registry-adapter.js?v=1.2.0").catch((error) => {
    console.warn("[Ari vNext] Nutrition registry adapter failed to load:", error?.message || error);
  });
})();
