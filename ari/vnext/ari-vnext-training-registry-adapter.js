// Permanent Training registry adapter.
// Keeps existing validation/mapping temporarily, but execution goes directly to TrainingService.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_training_registry_adapter";
  let servicePromise = null;
  let installed = false;

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/training/training-service.js?v=1.0.0")
        .then((module) => module.default || module.TrainingService);
    }
    return servicePromise;
  }

  async function prepare(pending = {}) {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return { success: false, code: "training_validator_unavailable", message: "Training validation is unavailable." };
    if (pending?.name === "plan_workout") return await adapter.mapWorkoutPlanValidated(pending, pending?.arguments || {});
    if (pending?.name === "edit_workout" || pending?.name === "edit_referenced_workout") {
      return await adapter.mapWorkoutEditValidated(pending, pending?.arguments || {});
    }
    return { success: false, code: "training_operation_unsupported", message: "That Training operation is not supported." };
  }

  async function createPending(pending = {}) {
    const prepared = await prepare(pending);
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that Training change safely." };
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
    const result = pending?.name === "plan_workout"
      ? await service.createValidatedWorkout(prepared.action)
      : await service.applyValidatedWorkoutEdit(prepared.action);

    if (!result?.success) return result;

    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null,
      vnext_source: SOURCE
    };

    window.dispatchEvent?.(new CustomEvent("ari:workoutPlanUpdated", {
      detail: {
        scheduledDate: result.scheduled_date || prepared.action?.payload?.scheduled_date || null,
        mode: pending?.name === "plan_workout" ? "create" : "edit",
        operation: result.operation || prepared.action?.payload?.vnext_prepared_edit?.operation || null,
        source: SOURCE,
        version: VERSION,
        vnextActionId: pending.id || null,
        confirmationTurnId: clean(input?.currentTurnId, 200) || null
      }
    }));

    return {
      success: true,
      result,
      action,
      ...(result.reply ? { reply: result.reply } : {})
    };
  }

  function register() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;

    for (const name of ["plan_workout", "edit_workout"]) {
      registry.registerOperation(name, {
        source: SOURCE,
        priority: 13000,
        prepare,
        createPending,
        executeConfirmed
      });
    }

    installed = true;
    return true;
  }

  window.AriVNextTrainingRegistryAdapter = Object.freeze({
    version: VERSION,
    source: SOURCE,
    ready: true,
    prepare,
    createPending,
    executeConfirmed
  });

  if (!register()) {
    window.addEventListener("ari:vnextOperationRegistryReady", register, { once: true });
  }
})();
