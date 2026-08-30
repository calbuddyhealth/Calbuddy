// ARI vNext — canonical trusted operation registry.
//
// First permanent cutover: log_meal. Other operations continue through the
// existing trusted adapter until they are migrated and proven independently.
// This prevents another all-at-once adapter deletion while giving Nutrition one
// authoritative preparation/execution path.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_operation_registry";
  const INSTALL_FLAG = "__ariOperationRegistryV1";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 240) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    const parsed = finite(value);
    return parsed === null ? null : Math.round(parsed * 10) / 10;
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function isResolvedMeal(args = {}) {
    const calories = finite(args?.calories);
    const protein = finite(args?.proteinG);
    const carbs = finite(args?.carbsG);
    const fat = finite(args?.fatG);

    return Boolean(
      clean(args?.name, 180) &&
      calories !== null && calories > 0 && calories <= 10000 &&
      protein !== null && protein >= 0 && protein <= 1000 &&
      carbs !== null && carbs >= 0 && carbs <= 1500 &&
      fat !== null && fat >= 0 && fat <= 1000
    );
  }

  function servingLabel(args = {}) {
    const explicit = clean(args?.servingSize, 160);
    if (explicit) return explicit;
    const quantity = finite(args?.quantity);
    const unit = clean(args?.unit, 80);
    if (quantity !== null && quantity > 0 && unit) return `${quantity} ${unit}`;
    return "1 serving";
  }

  function prepareLogMeal(pending = {}) {
    if (!pending?.id || !pending?.sourceTurnId) {
      return failure("invalid_pending_action", "The meal action is missing its turn-bound identity.");
    }

    const args = pending?.arguments && typeof pending.arguments === "object" && !Array.isArray(pending.arguments)
      ? pending.arguments
      : {};

    if (!isResolvedMeal(args)) {
      return failure(
        "meal_nutrition_required",
        "Nutrition must be resolved before the meal can be saved."
      );
    }

    const calories = Math.round(finite(args.calories));
    const name = clean(args.name, 180);

    return {
      success: true,
      action: {
        action_type: "log_meal",
        payload: {
          name,
          calories,
          category: clean(args.mealCategory, 80) || "Meal",
          protein_g: round1(args.proteinG),
          carbs_g: round1(args.carbsG),
          fat_g: round1(args.fatG),
          serving_size: servingLabel(args),
          multiplier: 1,
          notes: clean(args.notes, 500)
        },
        confirmation_text: `Log ${clean(name, 120)} (${calories} kcal)?`
      },
      resolution: {
        operation: "log_meal",
        resolvedNutrition: true,
        source: SOURCE
      }
    };
  }

  async function createLogMealPending(pending = {}) {
    const prepared = prepareLogMeal(pending);
    if (!prepared.success) return prepared;

    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "CalBuddy pending action service is unavailable.");
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
    return { success: true, action: wrapped, resolution: prepared.resolution };
  }

  function clearMatchingPendingCopies(pending = {}) {
    const pendingId = clean(pending?.id, 220);
    if (!pendingId) return false;

    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === pendingId) {
      window.AriVNextBridge?.clearPendingAction?.();
    }

    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === pendingId) {
      window.CalBuddy?.clearPendingAction?.();
    }
    return true;
  }

  function reconcileOrphanedLegacyPending() {
    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    const linkedId = clean(legacyPending?.vnext_action_id, 220);
    if (!linkedId) return false;

    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === linkedId) return false;

    window.CalBuddy?.clearPendingAction?.();
    return true;
  }

  async function executeLogMeal(input = {}) {
    const pending = input?.vnextPendingAction || null;
    if (!pending?.id || !pending?.sourceTurnId) {
      return failure("missing_vnext_pending_action", "There is no turn-bound meal action to execute.");
    }

    if (pending?.expiresAt && Date.parse(pending.expiresAt) < Date.now()) {
      return failure("vnext_action_expired", "That pending meal expired. Ask Ari to prepare it again.");
    }

    const prepared = prepareLogMeal(pending);
    if (!prepared.success) return prepared;

    if (typeof window.CalBuddy?.executeAction !== "function") {
      return failure("action_executor_unavailable", "CalBuddy action executor is unavailable.");
    }

    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(input?.currentTurnId, 220) || null,
      vnext_source: SOURCE
    };

    const result = await window.CalBuddy.executeAction(action);
    const success = result?.success !== false;
    const execution = { success, result, action };

    if (success) clearMatchingPendingCopies(pending);
    return execution;
  }

  function install() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter[INSTALL_FLAG]) return true;
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") {
      return false;
    }

    const fallbackCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const fallbackExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function registryCreatePending(pending = {}) {
      if (clean(pending?.name, 120) === "log_meal") return await createLogMealPending(pending);
      return await fallbackCreate(pending);
    };

    adapter.executeConfirmed = async function registryExecuteConfirmed(input = {}) {
      const pending = input?.vnextPendingAction || null;
      if (clean(pending?.name, 120) === "log_meal") return await executeLogMeal(input);
      return await fallbackExecute(input);
    };

    Object.defineProperty(adapter, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    reconcileOrphanedLegacyPending();
    return true;
  }

  const registry = {
    version: VERSION,
    source: SOURCE,
    ready: false,
    hasOperation(name = "") {
      return clean(name, 120) === "log_meal";
    },
    prepare(pending = {}) {
      if (clean(pending?.name, 120) !== "log_meal") {
        return failure("operation_handler_unavailable", "That operation has not been migrated to the registry yet.");
      }
      return prepareLogMeal(pending);
    },
    createPending: createLogMealPending,
    executeConfirmed: executeLogMeal,
    clearMatchingPendingCopies,
    reconcileOrphanedLegacyPending,
    snapshot() {
      return { version: VERSION, operations: ["log_meal"], source: SOURCE };
    }
  };

  window.AriVNextOperationRegistry = registry;

  if (install()) {
    registry.ready = true;
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", {
      detail: registry.snapshot()
    }));
  } else {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install()) {
        window.clearInterval(timer);
        registry.ready = true;
        window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", {
          detail: registry.snapshot()
        }));
      } else if (attempts >= 200) {
        window.clearInterval(timer);
        console.error("[Ari Operation Registry] trusted action adapter did not initialize.");
      }
    }, 25);
  }
})();
