// Permanent Training registry adapter.
// Keeps existing validation/mapping temporarily, while execution belongs to TrainingService.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_training_registry_adapter";
  let servicePromise = null;
  let installed = false;

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/training/training-service.js?v=1.1.0")
        .then((module) => module.default || module.TrainingService);
    }
    return servicePromise;
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  function resolveWorkoutTarget(pending = {}) {
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    if (!referenceId) return null;
    const target = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    const verification = object(target?.verification);
    if (
      clean(target?.domain, 40) !== "training" ||
      clean(target?.entityType, 60) !== "workout" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.date, 40)) ||
      verification.verifiedByTrustedContext !== true ||
      verification.currentContextRead !== true ||
      verification.rehydratedFromAuthoritativeState !== true ||
      verification.staleCheckRequiredBeforeWrite !== true
    ) return null;
    return target;
  }

  function referencedEditPending(pending = {}, target = {}) {
    const args = object(pending?.arguments);
    return {
      ...pending,
      name: "edit_workout",
      arguments: {
        dateText: clean(target?.canonical?.date, 40),
        operation: clean(args?.operation, 40),
        exercise: clean(args?.exercise, 180),
        replacementExercise: clean(args?.replacementExercise, 180),
        sets: args?.sets ?? null,
        reps: args?.reps ?? null,
        restSeconds: args?.restSeconds ?? null,
        position: args?.position ?? null,
        durationMinutes: args?.durationMinutes ?? null,
        title: clean(args?.title, 160),
        instruction: clean(args?.instruction, 500)
      }
    };
  }

  async function prepare(pending = {}) {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return { success: false, code: "training_validator_unavailable", message: "Training validation is unavailable." };
    if (pending?.name === "plan_workout") return await adapter.mapWorkoutPlanValidated(pending, pending?.arguments || {});
    if (pending?.name === "edit_workout") return await adapter.mapWorkoutEditValidated(pending, pending?.arguments || {});
    if (pending?.name === "edit_referenced_workout") {
      const target = resolveWorkoutTarget(pending);
      if (!target) return { success: false, code: "rehydrated_reference_missing", message: "That current workout could not be resolved safely." };
      return await adapter.mapWorkoutEditValidated(referencedEditPending(pending, target), referencedEditPending(pending, target).arguments);
    }
    if (pending?.name === "delete_workout") {
      const target = resolveWorkoutTarget(pending);
      if (!target) return { success: false, code: "rehydrated_reference_missing", message: "That current workout could not be resolved safely." };
      return {
        success: true,
        action: {
          action_type: "delete_workout",
          payload: { scheduled_date: target.canonical.date, reference_id: target.referenceId },
          confirmation_text: `Delete ${clean(target?.label, 160) || "that workout"}?`
        },
        resolution: { referenceId: target.referenceId, authority: "rehydrated_current_context" }
      };
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
    const pending = pendingFrom(input);
    const prepared = await prepare(pending);
    if (!prepared?.success || !prepared?.action) return prepared;

    const service = await loadService();
    let result;
    if (pending?.name === "plan_workout") result = await service.createValidatedWorkout(prepared.action);
    else if (pending?.name === "delete_workout") result = await service.deleteWorkout({ scheduledDate: prepared.action?.payload?.scheduled_date });
    else result = await service.applyValidatedWorkoutEdit(prepared.action);
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
        mode: pending?.name === "plan_workout" ? "create" : pending?.name === "delete_workout" ? "delete" : "edit",
        operation: result.operation || prepared.action?.payload?.vnext_prepared_edit?.operation || null,
        source: SOURCE,
        version: VERSION,
        vnextActionId: pending.id || null,
        confirmationTurnId: clean(input?.currentTurnId, 200) || null
      }
    }));

    const target = ["edit_referenced_workout", "delete_workout"].includes(pending?.name) ? resolveWorkoutTarget(pending) : null;
    return {
      success: true,
      result,
      action,
      ...(result.reply ? { reply: result.reply } : {}),
      ...(target ? {
        authoritativeReference: {
          referenceId: target.referenceId,
          entityType: target.entityType,
          operation: pending?.name === "delete_workout" ? "workout_delete" : "workout_edit",
          staleCheckedByTrustedExecutor: true,
          target
        }
      } : {})
    };
  }

  function register() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;

    for (const name of ["plan_workout", "edit_workout", "edit_referenced_workout", "delete_workout"]) {
      registry.registerOperation(name, {
        source: SOURCE,
        priority: 13000,
        match(input = {}) {
          if (!["edit_referenced_workout", "delete_workout"].includes(name)) return true;
          return Boolean(resolveWorkoutTarget(pendingFrom(input)));
        },
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
    executeConfirmed,
    resolveWorkoutTarget
  });

  if (!register()) {
    window.addEventListener("ari:vnextOperationRegistryReady", register, { once: true });
  }

  import("./ari-vnext-nutrition-registry-adapter.js?v=1.0.0").catch((error) => {
    console.warn("[Ari vNext] Nutrition registry adapter failed to load:", error?.message || error);
  });
})();
