// Permanent Nutrition registry adapter.
// Reuses mature resolution/reference identity, while persistence belongs to NutritionService.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_nutrition_registry_adapter";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let servicePromise = null;
  let installed = false;

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/nutrition/nutrition-service.js?v=1.2.0")
        .then((module) => module.default || module.NutritionService);
    }
    return servicePromise;
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  async function storePending(pending = {}, action = {}, resolution = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that Nutrition change safely." };
    }
    const stored = await window.CalBuddy.createPendingAction(action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution };
  }

  function resolveUndoTarget(pending = {}) {
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    if (!referenceId) return null;

    const live = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    if (
      live &&
      clean(live?.domain, 40) === "nutrition" &&
      clean(live?.entityType, 60) === "meal" &&
      UUID_RE.test(clean(live?.canonical?.mutationId, 160)) &&
      live?.verification?.verifiedByTrustedContext === true &&
      live?.verification?.currentContextRead === true &&
      live?.verification?.rehydratedFromAuthoritativeState === true
    ) return live;

    const references = array(window.AriVNextReferenceState?.snapshot?.()?.references);
    const persisted = references.find((reference) => clean(reference?.referenceId, 180) === referenceId) || null;
    if (
      persisted &&
      clean(persisted?.state, 40) === "persisted" &&
      clean(persisted?.domain, 40) === "nutrition" &&
      clean(persisted?.entityType, 60) === "meal" &&
      persisted?.verification?.verifiedByTrustedExecutor === true &&
      UUID_RE.test(clean(persisted?.canonical?.mutationId, 160))
    ) return persisted;

    return null;
  }

  async function prepareMeal(pending = {}) {
    const resolver = window.AriVNextNutritionResolutionAdapter;
    if (!resolver?.resolveMeal) {
      return { success: false, code: "nutrition_resolver_unavailable", message: "Ari Nutrition's resolver is unavailable." };
    }
    return await resolver.resolveMeal(pending);
  }

  async function createMealPending(pending = {}) {
    const prepared = await prepareMeal(pending);
    if (!prepared?.success || !prepared?.action) return prepared;
    return await storePending(pending, prepared.action, prepared.resolution || null);
  }

  async function executeMeal(input = {}) {
    const pending = pendingFrom(input);
    const prepared = await prepareMeal(pending);
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

  async function createUndoPending(pending = {}) {
    const target = resolveUndoTarget(pending);
    if (!target) {
      return { success: false, code: "reference_undo_target_unavailable", message: "That meal is no longer available as a verified recent Nutrition change." };
    }
    const label = clean(target?.label, 160) || "that Nutrition change";
    return await storePending(pending, {
      action_type: "undo_nutrition_mutation",
      payload: {
        mutation_id: target.canonical.mutationId,
        reference_id: target.referenceId
      },
      confirmation_text: `Undo ${label}?`
    }, { referenceId: target.referenceId, authority: "verified_reference" });
  }

  async function executeUndo(input = {}) {
    const pending = pendingFrom(input);
    const target = resolveUndoTarget(pending);
    if (!target) {
      return { success: false, code: "reference_undo_target_unavailable", message: "That meal is no longer available as a verified recent Nutrition change." };
    }

    const service = await loadService();
    const result = await service.undoMutation(target.canonical.mutationId);
    if (!result?.success) return result;

    return {
      success: true,
      result,
      reply: result.reply || "Nutrition change undone.",
      action: {
        action_type: "undo_nutrition_mutation",
        payload: { reference_id: target.referenceId },
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null,
        vnext_source: SOURCE
      },
      authoritativeReference: {
        referenceId: target.referenceId,
        entityType: target.entityType,
        operation: "meal_undo",
        staleCheckedByTrustedExecutor: true,
        target
      }
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
        const pending = pendingFrom(input);
        return Array.isArray(pending?.arguments?.items);
      },
      prepare: prepareMeal,
      createPending: createMealPending,
      executeConfirmed: executeMeal
    });

    registry.registerOperation("undo_nutrition_mutation", {
      source: `${SOURCE}:undo`,
      priority: 21000,
      match(input = {}) {
        return Boolean(resolveUndoTarget(pendingFrom(input)));
      },
      createPending: createUndoPending,
      executeConfirmed: executeUndo
    });

    installed = true;
    window.AriVNextNutritionRegistryAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      prepareMeal,
      createMealPending,
      executeMeal,
      createUndoPending,
      executeUndo
    });
    return true;
  }

  if (!install()) {
    window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
    window.addEventListener("ari:vnextNutritionResolutionReady", install, { once: true });
  }
})();
