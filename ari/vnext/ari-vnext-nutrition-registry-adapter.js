// Permanent Nutrition registry adapter.
// Reuses the mature resolver, but persistence belongs to NutritionService.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_nutrition_registry_adapter";
  let servicePromise = null;
  let installed = false;

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/nutrition/nutrition-service.js?v=1.0.0")
        .then((module) => module.default || module.NutritionService);
    }
    return servicePromise;
  }

  async function prepare(pending = {}) {
    const resolver = window.AriVNextNutritionResolutionAdapter;
    if (!resolver?.resolveMeal) {
      return { success: false, code: "nutrition_resolver_unavailable", message: "Ari Nutrition's resolver is unavailable." };
    }
    return await resolver.resolveMeal(pending);
  }

  async function createPending(pending = {}) {
    const prepared = await prepare(pending);
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that meal safely." };
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

    const service = await loadService();
    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null,
      vnext_source: SOURCE
    };
    const result = await service.logResolvedMeal(action);
    if (!result?.success) return result;
    return {
      success: true,
      result,
      meal: result.meal || result.result || null,
      action,
      ...(result.reply ? { reply: result.reply } : {})
    };
  }

  function install() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;
    if (!window.AriVNextNutritionResolutionAdapter?.resolveMeal) return false;

    registry.registerOperation("log_meal", {
      source: SOURCE,
      priority: 21000,
      match(input = {}) {
        const pending = input?.vnextPendingAction || input || {};
        return Array.isArray(pending?.arguments?.items);
      },
      prepare,
      createPending,
      executeConfirmed
    });

    installed = true;
    window.AriVNextNutritionRegistryAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      prepare,
      createPending,
      executeConfirmed
    });
    return true;
  }

  if (!install()) {
    window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
    window.addEventListener("ari:vnextNutritionResolutionReady", install, { once: true });
  }
})();
