// ARI vNext — reference capability completion layer.
// Extends the universal pointer lifecycle without creating another database.
// Current-turn authorization is still decided server-side; this browser layer
// only resolves verified canonical targets and executes through trusted writers.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_reference_capability_extension";
  const STORAGE_PREFIX = "ari_vnext_reference_state_v1";
  const PATCH_FLAG = "__ariReferenceCapabilityExtensionV1";

  const UPDATE_MEAL = "update_nutrition_meal";
  const UPDATE_WEIGHT = "update_weight_log";
  const DELETE_WEIGHT = "delete_weight_log";
  const EDIT_WORKOUT = "edit_referenced_workout";
  const DELETE_WORKOUT = "delete_workout";
  const UNDO_NUTRITION = "undo_nutrition_mutation";
  const EXTENDED_ACTIONS = new Set([UPDATE_MEAL, UPDATE_WEIGHT, DELETE_WEIGHT, EDIT_WORKOUT, DELETE_WORKOUT]);

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function hash(value = "") {
    const source = String(value || "default");
    let result = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      result ^= source.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function conversationId(explicit = null) {
    return clean(explicit || window.CalBuddy?.getConversationId?.() || "default", 200) || "default";
  }

  function storageKey(explicit = null) {
    return `${STORAGE_PREFIX}:${hash(conversationId(explicit))}`;
  }

  function readState(explicit = null) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(storageKey(explicit)) || "{}");
      return {
        version: clean(parsed?.version, 40) || "1.2.0",
        references: Array.isArray(parsed?.references) ? parsed.references : []
      };
    } catch {
      return { version: "1.2.0", references: [] };
    }
  }

  function writeState(state = {}, explicit = null) {
    const next = {
      version: clean(state?.version, 40) || "1.2.0",
      references: Array.isArray(state?.references) ? state.references.slice(0, 8) : []
    };
    try {
      sessionStorage.setItem(storageKey(explicit), JSON.stringify(next));
    } catch {
      // Reference state is a resilience pointer layer only.
    }
    return next;
  }

  function getReference(referenceId = "", explicit = null) {
    const id = clean(referenceId, 160);
    if (!id) return null;
    return readState(explicit).references.find((reference) => clean(reference?.referenceId, 160) === id) || null;
  }

  function verified(reference = {}, { domain = "", entityType = "" } = {}) {
    if (!reference || clean(reference.state, 40) !== "persisted") return false;
    if (domain && clean(reference.domain, 40) !== domain) return false;
    if (entityType && clean(reference.entityType, 60) !== entityType) return false;
    return reference?.verification?.verifiedByTrustedExecutor === true;
  }

  function replaceReference(reference = {}, explicit = null) {
    if (!reference?.referenceId) return null;
    const state = readState(explicit);
    const references = state.references.filter((item) => clean(item?.referenceId, 160) !== clean(reference.referenceId, 160));
    references.unshift({ ...reference, updatedAt: new Date().toISOString(), expiresAt: null });
    writeState({ ...state, references }, explicit);
    return references[0];
  }

  function removeReference(referenceId = "", explicit = null) {
    const id = clean(referenceId, 160);
    if (!id) return false;
    const state = readState(explicit);
    writeState({ ...state, references: state.references.filter((item) => clean(item?.referenceId, 160) !== id) }, explicit);
    return true;
  }

  function resolveTarget(pendingAction = {}) {
    const name = clean(pendingAction?.name, 120);
    const reference = getReference(pendingAction?.arguments?.referenceId);
    if (!reference) return null;

    if (name === UPDATE_MEAL && verified(reference, { domain: "nutrition", entityType: "meal" }) && clean(reference?.canonical?.id, 160)) return reference;
    if ((name === UPDATE_WEIGHT || name === DELETE_WEIGHT) && verified(reference, { domain: "goals", entityType: "weight_log" }) && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    if ((name === EDIT_WORKOUT || name === DELETE_WORKOUT) && verified(reference, { domain: "training", entityType: "workout" }) && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.date, 40))) return reference;
    return null;
  }

  async function storeLegacyPendingAction(pendingAction = {}, action = {}, resolution = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "CalBuddy pending action service is unavailable.");
    }
    const stored = await window.CalBuddy.createPendingAction(action);
    const wrapped = {
      ...stored,
      vnext_action_id: pendingAction.id,
      vnext_source_turn_id: pendingAction.sourceTurnId,
      vnext_expires_at: pendingAction.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution };
  }

  function changeSummary(changes = [], type = "meal") {
    const labels = {
      calories: "calories",
      protein_g: "protein",
      carbs_g: "carbs",
      fat_g: "fat",
      serving_size: "serving",
      multiplier: "quantity",
      name: "name",
      category: "category"
    };
    return (Array.isArray(changes) ? changes : []).slice(0, 4).map((change) => {
      const field = clean(change?.field, 80);
      const value = Number.isFinite(Number(change?.numberValue)) ? Number(change.numberValue) : clean(change?.textValue, 100);
      return `${labels[field] || field} to ${value}`;
    }).filter(Boolean).join(", ") || `${type} details`;
  }

  async function createExtendedPendingAction(pendingAction = {}) {
    const target = resolveTarget(pendingAction);
    if (!target) return failure("reference_target_unavailable", "That item is no longer available as a verified recent app entry.");
    const name = clean(pendingAction?.name, 120);

    if (name === UPDATE_MEAL) {
      const changes = Array.isArray(pendingAction?.arguments?.changes) ? pendingAction.arguments.changes.slice(0, 8) : [];
      if (!changes.length) return failure("nutrition_reference_changes_required", "Tell Ari what should change about that meal.");
      return await storeLegacyPendingAction(pendingAction, {
        action_type: UPDATE_MEAL,
        payload: { meal_id: target.canonical.id, reference_id: target.referenceId, changes },
        confirmation_text: `Update ${clean(target.label, 160) || "that meal"} — ${changeSummary(changes)}?`
      }, { referenceId: target.referenceId, entityType: "meal", operation: "update" });
    }

    if (name === UPDATE_WEIGHT) {
      const value = Number(pendingAction?.arguments?.value);
      const unit = clean(pendingAction?.arguments?.unit, 12).toLowerCase() || "lb";
      return await storeLegacyPendingAction(pendingAction, {
        action_type: UPDATE_WEIGHT,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit },
        confirmation_text: `Change ${clean(target.label, 120) || "that weigh-in"} to ${value} ${unit}?`
      }, { referenceId: target.referenceId, entityType: "weight_log", operation: "update" });
    }

    if (name === DELETE_WEIGHT) {
      return await storeLegacyPendingAction(pendingAction, {
        action_type: DELETE_WEIGHT,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId },
        confirmation_text: `Delete ${clean(target.label, 120) || "that weigh-in"}?`
      }, { referenceId: target.referenceId, entityType: "weight_log", operation: "delete" });
    }

    if (name === EDIT_WORKOUT) {
      const synthetic = referencedWorkoutEdit(pendingAction, target);
      const prepared = await window.AriVNextActionAdapter?.prepareCalBuddyAction?.(synthetic);
      if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
      return await storeLegacyPendingAction(pendingAction, {
        ...prepared.action,
        action_type: EDIT_WORKOUT,
        payload: {
          ...prepared.action.payload,
          reference_id: target.referenceId
        }
      }, { referenceId: target.referenceId, entityType: "workout", operation: "edit", prepared: prepared.resolution || null });
    }

    if (name === DELETE_WORKOUT) {
      return await storeLegacyPendingAction(pendingAction, {
        action_type: DELETE_WORKOUT,
        payload: { scheduled_date: target.canonical.date, reference_id: target.referenceId },
        confirmation_text: `Delete ${clean(target.label, 160) || "that planned workout"}?`
      }, { referenceId: target.referenceId, entityType: "workout", operation: "delete" });
    }

    return failure("reference_action_not_supported", "That reference action is not supported.");
  }

  function referencedWorkoutEdit(pendingAction = {}, target = {}) {
    const args = pendingAction?.arguments && typeof pendingAction.arguments === "object" ? pendingAction.arguments : {};
    return {
      ...pendingAction,
      id: `${clean(pendingAction.id, 180)}_resolved`,
      name: "edit_workout",
      arguments: {
        dateText: clean(target?.canonical?.date, 40),
        operation: clean(args.operation, 40),
        exercise: clean(args.exercise, 180),
        replacementExercise: clean(args.replacementExercise, 180),
        sets: args.sets ?? null,
        reps: args.reps ?? null,
        restSeconds: args.restSeconds ?? null,
        position: args.position ?? null,
        durationMinutes: args.durationMinutes ?? null,
        title: clean(args.title, 160),
        instruction: clean(args.instruction, 500)
      }
    };
  }

  async function executeMealUpdate(pendingAction = {}, target = {}) {
    const executor = window.AriVNextNutritionReferenceAdapter?.updateReferencedMeal;
    if (typeof executor !== "function") return failure("nutrition_reference_executor_unavailable", "The trusted Nutrition edit service is not ready right now.");
    const result = await executor({ mealId: target.canonical.id, changes: pendingAction?.arguments?.changes || [] });
    if (!result?.success) return result;
    return { success: true, result, referenceTarget: target, referenceOperation: "meal_update" };
  }

  async function executeWeightMutation(pendingAction = {}, target = {}) {
    const name = clean(pendingAction?.name, 120);
    const adapter = window.AriVNextWeightAdapter;
    const deleting = name === DELETE_WEIGHT;
    const executor = deleting ? adapter?.deleteReferencedWeight : adapter?.updateReferencedWeight;
    if (typeof executor !== "function") return failure("weight_reference_executor_unavailable", "The trusted weight service is not ready right now.");
    const result = await executor(deleting
      ? { logDate: target.canonical.logDate }
      : { logDate: target.canonical.logDate, value: pendingAction?.arguments?.value, unit: pendingAction?.arguments?.unit });
    if (!result?.success) return result;
    return { success: true, result, referenceTarget: target, referenceOperation: deleting ? "weight_delete" : "weight_update" };
  }

  async function executeWorkoutMutation(pendingAction = {}, target = {}, currentTurnId = null) {
    const name = clean(pendingAction?.name, 120);
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return failure("workout_reference_executor_unavailable", "The trusted Training controller is not ready right now.");

    if (name === EDIT_WORKOUT) {
      const synthetic = referencedWorkoutEdit(pendingAction, target);
      const prepared = await adapter.prepareCalBuddyAction?.(synthetic);
      if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
      const result = await adapter.executeValidatedWorkoutEdit?.({ action: prepared.action, pending: synthetic, currentTurnId });
      if (!result?.success) return result;
      return { ...result, referenceTarget: target, referenceOperation: "workout_edit" };
    }

    let controller;
    try {
      controller = await adapter.getWorkoutController?.();
    } catch (error) {
      return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
    }
    const date = clean(target?.canonical?.date, 40);
    const current = controller?.getDate?.(date);
    if (!current || current?.type !== "workout" || !Array.isArray(current?.exercises) || !current.exercises.length) {
      return failure("workout_reference_not_found", "That planned workout is no longer available.");
    }
    if (current?.completed === true || current?.progress?.completed === true) {
      return failure("workout_reference_completed", "A completed workout cannot be deleted through Ari.");
    }
    if (typeof controller?.clearDate !== "function") return failure("workout_delete_unavailable", "Training cannot safely clear that workout right now.");
    const cleared = controller.clearDate(date);
    if (cleared === false) return failure("workout_delete_failed", "Training could not delete that workout safely.");
    const remoteSaved = await controller.save?.({ remote: true });
    if (remoteSaved === false) return failure("workout_delete_remote_failed", "The workout changed locally but ARI XP could not confirm the remote save.");
    window.dispatchEvent(new CustomEvent("ari:trainingWorkoutUpdated", { detail: { scheduledDate: date, mode: "delete", source: SOURCE } }));
    return {
      success: true,
      result: { deleted: true, scheduled_date: date, reply: "That planned workout was deleted." },
      referenceTarget: target,
      referenceOperation: "workout_delete"
    };
  }

  function mealDetails(meal = {}, previous = {}) {
    return {
      ...previous,
      calories: Number(meal?.calories ?? previous?.calories ?? 0),
      proteinG: Number(meal?.protein_g ?? previous?.proteinG ?? 0),
      carbsG: Number(meal?.carbs_g ?? previous?.carbsG ?? 0),
      fatG: Number(meal?.fat_g ?? previous?.fatG ?? 0),
      servingSize: clean(meal?.serving_size || previous?.servingSize, 180),
      mealCategory: clean(meal?.category || previous?.mealCategory, 100)
    };
  }

  function commitExtended(pendingAction = {}, execution = {}) {
    const target = execution?.referenceTarget || resolveTarget(pendingAction);
    if (!target?.referenceId || execution?.success === false) return null;
    const operation = clean(execution?.referenceOperation, 80);

    if (["weight_delete", "workout_delete"].includes(operation)) {
      removeReference(target.referenceId);
      return { ...target, state: "deleted", updatedAt: new Date().toISOString() };
    }

    if (operation === "meal_update") {
      const data = execution?.result || {};
      const meal = data?.meal && typeof data.meal === "object" ? data.meal : {};
      return replaceReference({
        ...target,
        actionName: "log_meal",
        label: clean(meal?.name, 220) || target.label,
        state: "persisted",
        canonical: {
          ...target.canonical,
          id: clean(meal?.id, 160) || clean(target?.canonical?.id, 160),
          mutationId: clean(data?.mutationId, 160) || clean(target?.canonical?.mutationId, 160),
          previousMutationId: clean(data?.previousMutationId, 160) || clean(target?.canonical?.mutationId, 160),
          nutritionDate: clean(meal?.nutrition_date, 40) || clean(data?.nutritionDate, 40) || clean(target?.canonical?.nutritionDate, 40)
        },
        details: mealDetails(meal, target.details),
        verification: { ...target.verification, verifiedByTrustedExecutor: true, executorSuccess: true, updateVerified: true }
      });
    }

    if (operation === "weight_update") {
      const row = execution?.result?.weight || {};
      const pounds = Number(row?.weight_lbs);
      return replaceReference({
        ...target,
        actionName: "log_weight",
        label: Number.isFinite(pounds) ? `${Math.round(pounds * 10) / 10} lb` : target.label,
        state: "persisted",
        canonical: { ...target.canonical, logDate: clean(row?.log_date, 40) || target.canonical.logDate },
        details: { ...target.details, value: Number.isFinite(pounds) ? pounds : target.details?.value, unit: "lb" },
        verification: { ...target.verification, verifiedByTrustedExecutor: true, executorSuccess: true, updateVerified: true }
      });
    }

    if (operation === "workout_edit") {
      const workout = execution?.result?.workout || {};
      return replaceReference({
        ...target,
        state: "persisted",
        label: clean(workout?.title, 220) || target.label,
        canonical: {
          ...target.canonical,
          id: clean(workout?.workoutId || workout?.workout_id, 160) || target.canonical.id,
          date: clean(execution?.result?.scheduled_date, 40) || target.canonical.date
        },
        details: {
          ...target.details,
          title: clean(workout?.title, 180) || target.details?.title,
          durationMinutes: Number(workout?.plannedDurationMinutes ?? workout?.durationMinutes ?? target.details?.durationMinutes)
        },
        verification: { ...target.verification, verifiedByTrustedExecutor: true, executorSuccess: true, updateVerified: true }
      });
    }

    return null;
  }

  function restoreReferenceAfterEditUndo(pendingAction = {}, execution = {}, priorTarget = null) {
    const data = execution?.result;
    if (clean(pendingAction?.name, 120) !== UNDO_NUTRITION || !priorTarget?.referenceId) return null;
    if (clean(data?.actionType, 80) !== "update_meal" || !data?.meal) return null;
    const meal = data.meal;
    const previousMutationId = clean(data?.previousMutationId, 160);
    return replaceReference({
      ...priorTarget,
      actionName: "log_meal",
      label: clean(meal?.name, 220) || priorTarget.label,
      state: "persisted",
      canonical: {
        ...priorTarget.canonical,
        id: clean(meal?.id, 160) || priorTarget.canonical.id,
        mutationId: previousMutationId || undefined,
        previousMutationId: undefined,
        nutritionDate: clean(meal?.nutrition_date, 40) || clean(data?.nutritionDate, 40) || priorTarget.canonical.nutritionDate
      },
      details: mealDetails(meal, priorTarget.details),
      verification: { ...priorTarget.verification, verifiedByTrustedExecutor: true, executorSuccess: true, undoVerified: true }
    });
  }

  function failure(code, message) {
    return { success: false, code, message };
  }

  function install() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || adapter[PATCH_FLAG]) return Boolean(adapter?.[PATCH_FLAG]);
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") return false;

    const originalCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const originalExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function capabilityAwareCreate(pendingAction = {}) {
      if (EXTENDED_ACTIONS.has(clean(pendingAction?.name, 120))) {
        return await createExtendedPendingAction(pendingAction);
      }
      return await originalCreate(pendingAction);
    };

    adapter.executeConfirmed = async function capabilityAwareExecute(input = {}) {
      const pendingAction = input?.vnextPendingAction || null;
      const name = clean(pendingAction?.name, 120);
      const priorUndoTarget = name === UNDO_NUTRITION ? getReference(pendingAction?.arguments?.referenceId) : null;

      if (!EXTENDED_ACTIONS.has(name)) {
        const execution = await originalExecute(input);
        if (execution?.success && name === UNDO_NUTRITION) {
          const restored = restoreReferenceAfterEditUndo(pendingAction, execution, priorUndoTarget);
          if (restored) return { ...execution, referenceLifecycle: restored };
        }
        return execution;
      }

      if (!pendingAction?.id || !pendingAction?.sourceTurnId) return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
      if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
      const target = resolveTarget(pendingAction);
      if (!target) return failure("reference_target_unavailable", "That item is no longer available as a verified recent app entry.");

      let execution;
      if (name === UPDATE_MEAL) execution = await executeMealUpdate(pendingAction, target);
      else if (name === UPDATE_WEIGHT || name === DELETE_WEIGHT) execution = await executeWeightMutation(pendingAction, target);
      else execution = await executeWorkoutMutation(pendingAction, target, input?.currentTurnId || null);

      if (!execution?.success) return execution;
      window.CalBuddy?.cancelPendingAction?.();
      const lifecycle = commitExtended(pendingAction, execution);
      return {
        ...execution,
        action: execution.action || {
          action_type: name,
          payload: { reference_id: target.referenceId },
          vnext_action_id: pendingAction.id,
          vnext_source_turn_id: pendingAction.sourceTurnId,
          vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null,
          vnext_source: SOURCE
        },
        referenceLifecycle: lifecycle
      };
    };

    Object.defineProperty(adapter, PATCH_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    window.AriVNextReferenceCapabilityExtension = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true
    });
    window.dispatchEvent(new CustomEvent("ari:vnextReferenceCapabilitiesReady", { detail: { version: VERSION } }));
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 40);
  }
})();
