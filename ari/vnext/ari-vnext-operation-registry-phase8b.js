// ARI vNext — Phase 8B trusted operation-registry migration.
//
// Moves mature domain operations onto the canonical registry without changing
// the authorization boundary. Current-turn intent + confirmation still grant
// permission; references only identify targets. Canonical services re-read the
// underlying app state before writes, and unresolved/stale targets fail closed.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_operation_registry_phase8b";
  const INSTALL_FLAG = "__ariOperationRegistryPhase8B";
  const BRIDGE_CLEAR_FLAG = "__ariRegistryFailurePreserveV1";
  const PLAN_MUTATION_PREFIX = "ari_vnext_plan_mutation_v2:";
  const PLAN_ACTIONS = [
    "log_referenced_planned_meal",
    "log_referenced_plan_components",
    "discard_referenced_meal_plan",
    "replace_referenced_meal_plan"
  ];
  const CIRCLE_OPERATIONS = [
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
  ];
  const CIRCLE_ACTION_TYPES = [
    "circle_create_meetup",
    "circle_join_meetup",
    "circle_leave_meetup",
    "circle_cancel_meetup",
    "circle_create_mission",
    "circle_join_mission",
    "circle_submit_mission_progress",
    "circle_create_crew",
    "circle_accept_crew_invite",
    "circle_decline_crew_invite",
    "circle_leave_crew",
    "circle_archive_crew"
  ];
  const LIVE_REFERENCE_ACTIONS = new Set([
    "update_nutrition_meal",
    "undo_nutrition_mutation",
    "update_weight_log",
    "delete_weight_log",
    "update_activity_log",
    "delete_activity_log",
    "edit_referenced_workout",
    "delete_workout"
  ]);

  let activityServicePromise = null;
  let protectedPendingId = null;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    return Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function normalizeSlot(value = "") {
    const slot = clean(value, 40).toLowerCase();
    return ["breakfast", "lunch", "dinner", "snack"].includes(slot) ? slot : "";
  }

  function slotLabel(value = "") {
    const slot = normalizeSlot(value);
    return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  function isUuid(value = "") {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 160));
  }

  function hashText(value = "") {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function makeUuid() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch {}
    const bytes = new Uint8Array(16);
    try { globalThis.crypto?.getRandomValues?.(bytes); } catch {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  async function storePending(pending = {}, action = {}, resolution = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare that change safely.");
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

  function referenceSnapshot() {
    return array(window.AriVNextReferenceState?.snapshot?.()?.references);
  }

  function persistedReference(referenceId = "") {
    const id = clean(referenceId, 180);
    return referenceSnapshot().find((reference) => clean(reference?.referenceId, 180) === id) || null;
  }

  function verifiedPersisted(reference = {}, domain = "", entityType = "") {
    return clean(reference?.state, 40) === "persisted" &&
      (!domain || clean(reference?.domain, 40) === domain) &&
      (!entityType || clean(reference?.entityType, 60) === entityType) &&
      reference?.verification?.verifiedByTrustedExecutor === true;
  }

  function liveTarget(pending = {}) {
    const name = clean(pending?.name, 120);
    if (!LIVE_REFERENCE_ACTIONS.has(name)) return null;
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    const reference = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    if (!reference) return null;
    const verification = object(reference?.verification);
    if (
      verification.verifiedByTrustedContext !== true ||
      verification.currentContextRead !== true ||
      verification.rehydratedFromAuthoritativeState !== true ||
      verification.staleCheckRequiredBeforeWrite !== true
    ) return null;

    if (name === "update_nutrition_meal" && clean(reference?.domain, 40) === "nutrition" && clean(reference?.entityType, 60) === "meal" && clean(reference?.canonical?.id, 180)) return reference;
    if (name === "undo_nutrition_mutation" && clean(reference?.domain, 40) === "nutrition" && clean(reference?.entityType, 60) === "meal" && isUuid(reference?.canonical?.mutationId)) return reference;
    if (["update_weight_log", "delete_weight_log"].includes(name) && clean(reference?.domain, 40) === "goals" && clean(reference?.entityType, 60) === "weight_log" && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    if (["update_activity_log", "delete_activity_log"].includes(name) && clean(reference?.domain, 40) === "training" && clean(reference?.entityType, 60) === "activity_log" && clean(reference?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    if (["edit_referenced_workout", "delete_workout"].includes(name) && clean(reference?.domain, 40) === "training" && clean(reference?.entityType, 60) === "workout" && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.date, 40))) return reference;
    return null;
  }

  function summarizeChanges(changes = []) {
    return array(changes).slice(0, 4).map((change) => {
      const field = clean(change?.field, 80).replaceAll("_", " ");
      const value = Number.isFinite(Number(change?.numberValue)) ? Number(change.numberValue) : clean(change?.textValue, 100);
      return field && value !== "" ? `${field} to ${value}` : field;
    }).filter(Boolean).join(", ");
  }

  async function createLivePending(pending = {}, target = {}) {
    const name = clean(pending?.name, 120);
    const label = clean(target?.label, 160) || "that item";
    const args = object(pending?.arguments);

    if (name === "update_nutrition_meal") {
      const changes = array(args?.changes).slice(0, 8);
      if (!changes.length) return failure("nutrition_reference_changes_required", "Tell Ari what should change about that meal.");
      return await storePending(pending, {
        action_type: name,
        payload: { meal_id: target.canonical.id, reference_id: target.referenceId, changes },
        confirmation_text: `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "undo_nutrition_mutation") {
      return await storePending(pending, {
        action_type: name,
        payload: { mutation_id: target.canonical.mutationId, reference_id: target.referenceId },
        confirmation_text: `Undo ${label}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "update_weight_log") {
      const value = finite(args?.value);
      const unit = clean(args?.unit, 12).toLowerCase() || "lb";
      if (value === null) return failure("weight_reference_value_required", "Tell Ari the corrected weight.");
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit },
        confirmation_text: `Change ${label} to ${value} ${unit}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "delete_weight_log") {
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (["update_activity_log", "delete_activity_log"].includes(name)) {
      const deleting = name === "delete_activity_log";
      const changes = deleting ? [] : array(args?.changes).slice(0, 8);
      if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
      return await storePending(pending, {
        action_type: name,
        payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
        confirmation_text: deleting ? `Delete ${label}?` : `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "edit_referenced_workout") {
      const prepared = await prepareReferencedWorkoutEdit(pending, target);
      if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
      return await storePending(pending, {
        ...prepared.action,
        action_type: name,
        payload: { ...prepared.action.payload, reference_id: target.referenceId }
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context", prepared: prepared.resolution || null });
    }

    if (name === "delete_workout") {
      return await storePending(pending, {
        action_type: name,
        payload: { scheduled_date: target.canonical.date, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    return failure("reference_action_not_supported", "That reference action is not supported.");
  }

  function referencedWorkoutEdit(pending = {}, target = {}) {
    const args = object(pending?.arguments);
    return {
      ...pending,
      id: `${clean(pending?.id, 180)}_phase8b`,
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

  async function prepareReferencedWorkoutEdit(pending, target) {
    return await window.AriVNextActionAdapter?.prepareCalBuddyAction?.(referencedWorkoutEdit(pending, target));
  }

  function executionEnvelope(pending, target, currentTurnId, result, operation, reply = "") {
    return {
      success: true,
      result,
      ...(reply ? { reply } : {}),
      action: {
        action_type: clean(pending?.name, 120),
        payload: { reference_id: target.referenceId },
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
        vnext_source: SOURCE
      },
      authoritativeReference: {
        referenceId: target.referenceId,
        entityType: target.entityType,
        operation,
        staleCheckedByTrustedExecutor: true,
        target
      }
    };
  }

  async function executeLive(input = {}) {
    const pending = pendingFrom(input);
    const target = liveTarget(pending);
    if (!target) return failure("rehydrated_reference_missing", "That current app item could not be resolved safely.");
    const name = clean(pending?.name, 120);
    const args = object(pending?.arguments);
    const currentTurnId = input?.currentTurnId || null;

    if (name === "update_nutrition_meal") {
      const result = await window.AriVNextNutritionReferenceAdapter?.updateReferencedMeal?.({ mealId: target.canonical.id, changes: array(args?.changes).slice(0, 8) });
      if (!result?.success) return result || failure("nutrition_reference_update_failed", "That meal could not be updated.");
      return executionEnvelope(pending, target, currentTurnId, result, "meal_update", `${result?.meal?.name || target.label || "Meal"} updated.`);
    }

    if (name === "undo_nutrition_mutation") {
      if (typeof window.CalBuddy?.undoNutritionMutation !== "function") return failure("nutrition_undo_unavailable", "The Nutrition undo service is not ready right now.");
      const result = await window.CalBuddy.undoNutritionMutation(target.canonical.mutationId);
      return executionEnvelope(pending, target, currentTurnId, result, "meal_undo", clean(result?.reply, 1000) || "Nutrition change undone.");
    }

    if (["update_weight_log", "delete_weight_log"].includes(name)) {
      const deleting = name === "delete_weight_log";
      const adapter = window.AriVNextWeightAdapter;
      const result = deleting
        ? await adapter?.deleteReferencedWeight?.({ logDate: target.canonical.logDate })
        : await adapter?.updateReferencedWeight?.({ logDate: target.canonical.logDate, value: args?.value, unit: args?.unit });
      if (!result?.success) return result || failure("weight_reference_write_failed", "That weigh-in could not be changed.");
      return executionEnvelope(pending, target, currentTurnId, result, deleting ? "weight_delete" : "weight_update", deleting ? "Weigh-in deleted." : "Weigh-in updated.");
    }

    if (["update_activity_log", "delete_activity_log"].includes(name)) {
      const deleting = name === "delete_activity_log";
      const adapter = window.AriVNextActivityAdapter;
      const result = deleting
        ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
        : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(args?.changes).slice(0, 8) });
      if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
      return executionEnvelope(pending, target, currentTurnId, result, deleting ? "activity_delete" : "activity_update", deleting ? "Activity deleted." : "Activity updated.");
    }

    if (name === "edit_referenced_workout") {
      const synthetic = referencedWorkoutEdit(pending, target);
      const prepared = await window.AriVNextActionAdapter?.prepareCalBuddyAction?.(synthetic);
      if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
      const result = await window.AriVNextActionAdapter?.executeValidatedWorkoutEdit?.({ action: prepared.action, pending: synthetic, currentTurnId });
      if (!result?.success) return result || failure("workout_reference_update_failed", "That workout could not be updated.");
      return executionEnvelope(pending, target, currentTurnId, result, "workout_edit", clean(result?.reply, 1000) || clean(result?.result?.reply, 1000) || "Workout updated.");
    }

    if (name === "delete_workout") {
      const adapter = window.AriVNextActionAdapter;
      let controller;
      try { controller = await adapter?.getWorkoutController?.(); } catch (error) {
        return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
      }
      const date = clean(target?.canonical?.date, 40);
      const current = controller?.getDate?.(date);
      if (!current || current?.type !== "workout" || !array(current?.exercises).length) return failure("workout_reference_not_found", "That planned workout is no longer available.");
      if (current?.completed === true || current?.progress?.completed === true) return failure("workout_reference_completed", "A completed workout cannot be deleted through Ari.");
      if (typeof controller?.clearDate !== "function" || controller.clearDate(date) === false) return failure("workout_delete_failed", "Training could not delete that workout safely.");
      const saved = await controller.save?.({ remote: true });
      if (saved === false) return failure("workout_delete_remote_failed", "The workout changed locally but ARI XP could not confirm the remote save.");
      window.dispatchEvent(new CustomEvent("ari:trainingWorkoutUpdated", { detail: { scheduledDate: date, mode: "delete", source: SOURCE } }));
      return executionEnvelope(pending, target, currentTurnId, { deleted: true, scheduled_date: date, reply: "That planned workout was deleted." }, "workout_delete", "That planned workout was deleted.");
    }

    return failure("reference_action_not_supported", "That reference action is not supported.");
  }

  function persistedUndoTarget(pending = {}) {
    const target = persistedReference(pending?.arguments?.referenceId);
    return verifiedPersisted(target, "nutrition", "meal") && isUuid(target?.canonical?.mutationId) ? target : null;
  }

  function persistedActivityTarget(pending = {}) {
    const target = persistedReference(pending?.arguments?.referenceId);
    return verifiedPersisted(target, "training", "activity_log") && clean(target?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40)) ? target : null;
  }

  async function createPersistedReferencePending(pending = {}) {
    const name = clean(pending?.name, 120);
    if (name === "undo_nutrition_mutation") {
      const target = persistedUndoTarget(pending);
      if (!target) return failure("reference_undo_target_unavailable", "That meal is no longer available as a verified recent journaled entry.");
      return await storePending(pending, {
        action_type: name,
        payload: { mutation_id: target.canonical.mutationId, reference_id: target.referenceId },
        confirmation_text: `Undo ${clean(target.label, 160) || "that meal"}?`
      }, { referenceId: target.referenceId, journaled: true });
    }

    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const deleting = name === "delete_activity_log";
    const changes = deleting ? [] : array(pending?.arguments?.changes).slice(0, 8);
    if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    return await storePending(pending, {
      action_type: name,
      payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
      confirmation_text: deleting ? `Delete ${clean(target.label, 160) || "that activity"}?` : `Update ${clean(target.label, 160) || "that activity"}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
    }, { referenceId: target.referenceId, operation: deleting ? "delete" : "update" });
  }

  async function executePersistedReference(input = {}) {
    const pending = pendingFrom(input);
    const name = clean(pending?.name, 120);
    if (name === "undo_nutrition_mutation") {
      const target = persistedUndoTarget(pending);
      if (!target) return failure("reference_undo_target_unavailable", "That meal is no longer available as a verified recent journaled entry.");
      if (typeof window.CalBuddy?.undoNutritionMutation !== "function") return failure("nutrition_undo_unavailable", "The Nutrition undo service is not ready right now.");
      try {
        const result = await window.CalBuddy.undoNutritionMutation(target.canonical.mutationId);
        const execution = {
          success: true,
          result,
          reply: clean(result?.reply, 1000) || "Nutrition change undone.",
          referenceUndo: { referenceId: target.referenceId, mutationId: target.canonical.mutationId, target }
        };
        const lifecycle = window.AriVNextReferenceState?.commit?.({ pendingAction: pending, execution });
        return { ...execution, referenceLifecycle: lifecycle || null };
      } catch (error) {
        return failure("nutrition_undo_failed", error?.message || "That nutrition change could not be undone. Nothing else was changed.");
      }
    }

    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const deleting = name === "delete_activity_log";
    const adapter = window.AriVNextActivityAdapter;
    const result = deleting
      ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
      : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(pending?.arguments?.changes).slice(0, 8) });
    if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
    const execution = {
      success: true,
      result,
      reply: deleting ? "Activity deleted." : "Activity updated.",
      referenceActivity: { referenceId: target.referenceId, activityId: target.canonical.id, operation: deleting ? "delete" : "update", target }
    };
    const lifecycle = window.AriVNextReferenceState?.commit?.({ pendingAction: pending, execution });
    return { ...execution, referenceLifecycle: lifecycle || null };
  }

  function normalizeItems(plan = {}) {
    const source = array(plan?.items);
    if (source.length) {
      return source.slice(0, 16).map((item, index) => {
        const name = clean(item?.name, 180);
        if (!name) return null;
        return {
          id: clean(item?.id, 160) || `component-${index}`,
          name,
          amount: clean(item?.amount ?? item?.serving_size, 180),
          calories: Math.max(0, Math.round(finite(item?.calories) ?? 0)),
          protein_g: round1(item?.protein_g ?? item?.proteinG ?? item?.protein),
          carbs_g: round1(item?.carbs_g ?? item?.carbsG ?? item?.carbs ?? item?.carbohydrates),
          fat_g: round1(item?.fat_g ?? item?.fatG ?? item?.fat)
        };
      }).filter(Boolean);
    }
    return [{
      id: "whole-meal",
      name: clean(plan?.name, 180) || "Meal",
      amount: clean(plan?.serving_size, 180) || "Planned serving",
      calories: Math.max(0, Math.round(finite(plan?.calories) ?? 0)),
      protein_g: round1(plan?.protein_g),
      carbs_g: round1(plan?.carbs_g),
      fat_g: round1(plan?.fat_g)
    }];
  }

  function sumItems(items = []) {
    return array(items).reduce((totals, item) => {
      totals.calories += Math.max(0, finite(item?.calories) ?? 0);
      totals.protein_g += Math.max(0, finite(item?.protein_g) ?? 0);
      totals.carbs_g += Math.max(0, finite(item?.carbs_g) ?? 0);
      totals.fat_g += Math.max(0, finite(item?.fat_g) ?? 0);
      return totals;
    }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }

  function planReferenceId(plan = {}) {
    return window.AriVNextStructuredReferenceCapabilities?.planReferenceId?.(plan) || "";
  }

  function componentReferenceId(plan = {}, item = {}, index = 0) {
    return window.AriVNextStructuredReferenceCapabilities?.componentReferenceId?.(plan, item, index) || "";
  }

  async function activePlans() {
    const sync = window.AriNutritionPlanSync;
    if (!sync?.loadToday || !sync?.pushRecords) return [];
    try {
      const rows = await sync.loadToday();
      return array(rows).filter((row) => clean(row?.status || "planned", 40) === "planned");
    } catch {
      return [];
    }
  }

  async function resolvePlanReference(referenceId = "") {
    const requested = clean(referenceId, 180);
    if (!requested) return null;
    const plans = await activePlans();
    for (const plan of plans) {
      if (planReferenceId(plan) === requested) return plan;
    }
    if (/^ref_action_[a-z0-9]+$/i.test(requested)) {
      const pointer = persistedReference(requested);
      const canonicalId = clean(pointer?.canonical?.id ?? pointer?.canonical?.planId, 180);
      if (canonicalId && clean(pointer?.entityType, 60) === "meal_plan_item") {
        return plans.find((plan) => clean(plan?.id, 180) === canonicalId) || null;
      }
    }
    return null;
  }

  async function resolveComponents(referenceIds = []) {
    const ids = Array.from(new Set(array(referenceIds).map((value) => clean(value, 180)).filter(Boolean)));
    if (!ids.length) return null;
    const plans = await activePlans();
    let resolvedPlan = null;
    const indexes = [];
    const items = [];
    for (const id of ids) {
      let match = null;
      for (const plan of plans) {
        const components = normalizeItems(plan);
        for (let index = 0; index < components.length; index += 1) {
          if (componentReferenceId(plan, components[index], index) === id) {
            match = { plan, index, item: components[index] };
            break;
          }
        }
        if (match) break;
      }
      if (!match) return null;
      if (resolvedPlan && clean(resolvedPlan?.id, 180) !== clean(match.plan?.id, 180)) return null;
      resolvedPlan = match.plan;
      indexes.push(match.index);
      items.push(match.item);
    }
    return { plan: resolvedPlan, indexes: [...new Set(indexes)].sort((a, b) => a - b), items };
  }

  function replacementFromArgs(args = {}) {
    const name = clean(args?.name, 180);
    const calories = finite(args?.calories);
    const protein = finite(args?.proteinG);
    const carbs = finite(args?.carbsG);
    const fat = finite(args?.fatG);
    if (!name || calories === null || calories <= 0 || calories > 5000) return null;
    if ([protein, carbs, fat].some((value) => value === null || value < 0 || value > 2000)) return null;
    return {
      name,
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat),
      serving_size: clean(args?.servingSize, 220) || "Planned by Ari",
      notes: clean(args?.notes, 500)
    };
  }

  async function validateReplacementBudget(plan, replacement) {
    try {
      const context = await window.CalBuddy?.getUserContext?.();
      const dailyGoal = finite(context?.dailyGoal);
      if (dailyGoal === null || dailyGoal <= 0) return { valid: true };
      const consumed = Math.max(0, finite(context?.caloriesConsumed) ?? 0);
      const planned = Math.max(0, finite(context?.plannedCalories) ?? 0);
      const allowance = Math.max(0, dailyGoal - consumed);
      const nextPlanned = Math.max(0, planned - Math.max(0, finite(plan?.calories) ?? 0) + replacement.calories);
      const tolerance = Math.max(100, Math.round(allowance * 0.1));
      if (nextPlanned > allowance + tolerance) return { valid: false, message: "That replacement would put today’s active Meal Plan above the saved calories remaining, so Ari will not replace it as-is." };
    } catch {}
    return { valid: true };
  }

  async function createPlanReferencePending(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = object(pending?.arguments);
    if (name === "log_referenced_plan_components") {
      const resolved = await resolveComponents(args?.referenceIds);
      if (!resolved?.plan || !resolved.items.length) return failure("meal_plan_component_reference_stale", "Those planned items are no longer current. Ask Ari to show today’s Meal Plan again.");
      return await storePending(pending, {
        action_type: name,
        payload: { reference_ids: array(args?.referenceIds).map((id) => clean(id, 180)).filter(Boolean), source: SOURCE },
        confirmation_text: `Log ${resolved.items.map((item) => item.name).join(", ")} from today’s ${slotLabel(resolved.plan.meal_slot).toLowerCase()} as eaten?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }

    const plan = await resolvePlanReference(args?.referenceId);
    if (!plan) return failure("meal_plan_reference_stale", "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again.");
    if (name === "log_referenced_planned_meal") {
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Log ${plan.name || slotLabel(plan.meal_slot)} — about ${Math.round(finite(plan.calories) ?? 0)} kcal — as eaten?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }
    if (name === "discard_referenced_meal_plan") {
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Remove ${plan.name || slotLabel(plan.meal_slot)} from today’s ${slotLabel(plan.meal_slot).toLowerCase()} Meal Plan?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }
    if (name === "replace_referenced_meal_plan") {
      const replacement = replacementFromArgs(args);
      if (!replacement) return failure("meal_plan_replacement_invalid", "The replacement meal details are incomplete.");
      const budget = await validateReplacementBudget(plan, replacement);
      if (!budget.valid) return failure("meal_plan_replacement_budget_invalid", budget.message);
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Replace ${plan.name || slotLabel(plan.meal_slot)} with ${replacement.name} — about ${replacement.calories} kcal — in today’s ${slotLabel(plan.meal_slot).toLowerCase()} Meal Plan?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }
    return failure("unsupported_meal_plan_reference_action", "That Meal Plan reference action is not supported.");
  }

  function mutationIdFor(pending = {}) {
    const key = `${PLAN_MUTATION_PREFIX}${clean(pending?.id, 180) || hashText(JSON.stringify(pending || {}))}`;
    try {
      const current = clean(sessionStorage.getItem(key), 80);
      if (isUuid(current)) return current;
      const id = makeUuid();
      sessionStorage.setItem(key, id);
      return id;
    } catch {
      return makeUuid();
    }
  }

  function consumedFromPlan(plan = {}, selectedIndexes = null) {
    const components = normalizeItems(plan);
    if (!Array.isArray(selectedIndexes)) {
      return {
        consumed: {
          name: clean(plan?.name, 180) || "Meal",
          calories: Math.max(1, Math.round(finite(plan?.calories) ?? 0)),
          category: slotLabel(plan?.meal_slot),
          protein_g: round1(plan?.protein_g),
          carbs_g: round1(plan?.carbs_g),
          fat_g: round1(plan?.fat_g),
          serving_size: clean(plan?.serving_size, 220) || "From today’s Meal Plan"
        },
        remaining: null,
        selectedNames: [clean(plan?.name, 180) || "Meal"]
      };
    }
    const selected = new Set(selectedIndexes.filter((index) => Number.isInteger(index) && components[index]));
    const consumedItems = components.filter((_, index) => selected.has(index));
    const remainingItems = components.filter((_, index) => !selected.has(index));
    if (!consumedItems.length) return null;
    const consumedTotals = sumItems(consumedItems);
    const selectedNames = consumedItems.map((item) => item.name);
    const consumed = {
      name: selectedNames.length <= 3 ? selectedNames.join(" + ") : `${clean(plan?.name, 180) || slotLabel(plan?.meal_slot)} · selected items`,
      calories: Math.max(1, Math.round(consumedTotals.calories)),
      category: slotLabel(plan?.meal_slot),
      protein_g: round1(consumedTotals.protein_g),
      carbs_g: round1(consumedTotals.carbs_g),
      fat_g: round1(consumedTotals.fat_g),
      serving_size: "Selected from today’s Meal Plan"
    };
    if (!remainingItems.length) return { consumed, remaining: null, selectedNames };
    const remainingTotals = sumItems(remainingItems);
    return {
      consumed,
      selectedNames,
      remaining: {
        name: remainingItems.map((item) => item.name).slice(0, 3).join(" + ") || `${slotLabel(plan?.meal_slot)} remaining items`,
        calories: Math.round(remainingTotals.calories),
        protein_g: round1(remainingTotals.protein_g),
        carbs_g: round1(remainingTotals.carbs_g),
        fat_g: round1(remainingTotals.fat_g),
        serving_size: "Remaining planned items",
        items: remainingItems
      }
    };
  }

  async function refreshNutrition(action, detail = {}) {
    try { await window.AriNutritionPage?.refresh?.(); } catch {}
    try { await window.CalBuddy?.getConsumedCalories?.(); } catch {}
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action, source: SOURCE, version: VERSION, ...detail } }));
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", { detail: { action, source: SOURCE, version: VERSION, ...detail } }));
  }

  function bindConsumedReference(pending, plan, consumed, data = {}) {
    const state = window.AriVNextReferenceState;
    if (!state?.rememberPending || !state?.commit || !data?.mealId || !data?.mutationId) return;
    const synthetic = {
      id: `plan_consumed_${clean(pending?.id, 120) || hashText(data.mutationId)}`,
      name: "log_meal",
      sourceTurnId: clean(pending?.sourceTurnId, 180) || "plan-consume",
      sourceMessage: clean(pending?.sourceMessage, 600),
      arguments: {
        name: consumed.name,
        calories: consumed.calories,
        mealCategory: consumed.category,
        servingSize: consumed.serving_size,
        proteinG: consumed.protein_g,
        carbsG: consumed.carbs_g,
        fatG: consumed.fat_g,
        quantity: 1
      }
    };
    state.rememberPending({ pendingAction: synthetic });
    state.commit({ pendingAction: synthetic, execution: { success: true, result: { meal: { id: data.mealId, ...consumed, nutrition_date: clean(plan?.plan_date, 40) }, mutationId: data.mutationId, nutritionDate: clean(plan?.plan_date, 40) } } });
  }

  async function executePlanConsumption(pending, plan, indexes = null) {
    const client = window.calbuddySupabase;
    if (!client?.rpc || !plan?.id) return failure("meal_plan_transaction_unavailable", "The trusted Meal Plan transaction service is not ready yet.");
    const built = consumedFromPlan(plan, indexes);
    if (!built?.consumed) return failure("meal_plan_component_reference_stale", "Those planned items changed before confirmation. Ask Ari to show the current Meal Plan again.");
    const mutationId = mutationIdFor(pending);
    const { data, error } = await client.rpc("ari_consume_nutrition_plan", {
      p_plan_id: plan.id,
      p_mutation_id: mutationId,
      p_consumed: built.consumed,
      p_remaining: built.remaining
    });
    if (error) return failure("meal_plan_transaction_failed", error.message || "That planned meal could not be logged. Nothing was changed.");
    await refreshNutrition(built.remaining ? "referenced_plan_partially_eaten" : "referenced_plan_eaten", { planId: clean(plan.id, 180), mutationId: clean(data?.mutationId || mutationId, 80) });
    bindConsumedReference(pending, plan, built.consumed, data || {});
    return {
      success: true,
      result: { ...(data || {}), meal: { id: data?.mealId || null, ...built.consumed, nutrition_date: clean(plan?.plan_date, 40) }, mutationId: data?.mutationId || mutationId, nutritionDate: clean(plan?.plan_date, 40) },
      reply: built.remaining ? `${built.selectedNames.join(", ")} logged. The remaining planned items are still in today’s Meal Plan.` : `${built.consumed.name} is logged as eaten.`
    };
  }

  async function executePlanReference(input = {}) {
    const pending = pendingFrom(input);
    const name = clean(pending?.name, 120);
    if (name === "log_referenced_planned_meal") {
      const plan = await resolvePlanReference(pending?.arguments?.referenceId);
      if (!plan) return failure("meal_plan_reference_stale", "That planned meal changed before confirmation. Ask Ari to show today’s Meal Plan again.");
      return await executePlanConsumption(pending, plan, null);
    }
    if (name === "log_referenced_plan_components") {
      const resolved = await resolveComponents(pending?.arguments?.referenceIds);
      if (!resolved?.plan) return failure("meal_plan_component_reference_stale", "Those planned items changed before confirmation. Ask Ari to show today’s Meal Plan again.");
      return await executePlanConsumption(pending, resolved.plan, resolved.indexes);
    }
    if (name === "discard_referenced_meal_plan") {
      const plan = await resolvePlanReference(pending?.arguments?.referenceId);
      if (!plan) return failure("meal_plan_reference_stale", "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again.");
      const sync = window.AriNutritionPlanSync;
      await sync.pushRecords([{ ...plan, cloud_id: plan.id, status: "skipped", updated_at: new Date().toISOString() }]);
      const current = await sync.loadToday();
      if (array(current).some((item) => clean(item?.id, 180) === clean(plan?.id, 180) && clean(item?.status || "planned", 40) === "planned")) return failure("meal_plan_discard_not_verified", "That planned meal did not leave the active Meal Plan, so Ari did not report it as discarded.");
      await refreshNutrition("referenced_plan_discarded", { planId: clean(plan.id, 180) });
      return { success: true, result: { planId: plan.id, status: "skipped" }, reply: `${plan.name || slotLabel(plan.meal_slot)} removed from today’s Meal Plan.` };
    }
    if (name === "replace_referenced_meal_plan") {
      const plan = await resolvePlanReference(pending?.arguments?.referenceId);
      if (!plan) return failure("meal_plan_reference_stale", "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again.");
      const replacement = replacementFromArgs(pending?.arguments);
      if (!replacement) return failure("meal_plan_replacement_invalid", "The replacement meal details are incomplete or outside supported nutrition ranges.");
      const budget = await validateReplacementBudget(plan, replacement);
      if (!budget.valid) return failure("meal_plan_replacement_budget_invalid", budget.message);
      const sync = window.AriNutritionPlanSync;
      const record = {
        ...plan,
        ...replacement,
        cloud_id: plan.id,
        meal_slot: normalizeSlot(plan?.meal_slot),
        plan_date: clean(plan?.plan_date, 40),
        status: "planned",
        items: [{ id: "whole-meal", name: replacement.name, amount: replacement.serving_size, calories: replacement.calories, protein_g: replacement.protein_g, carbs_g: replacement.carbs_g, fat_g: replacement.fat_g }],
        updated_at: new Date().toISOString()
      };
      await sync.pushRecords([record]);
      const current = await sync.loadToday();
      const verified = array(current).find((item) => clean(item?.id, 180) === clean(plan?.id, 180));
      if (!verified || clean(verified?.name, 180) !== replacement.name || Math.round(finite(verified?.calories) ?? 0) !== replacement.calories) return failure("meal_plan_replacement_not_verified", "The replacement could not be verified against the current Meal Plan, so Ari will not claim it changed.");
      await refreshNutrition("referenced_plan_replaced", { planId: clean(plan.id, 180) });
      return { success: true, result: { planItemId: plan.id, plan: verified }, reply: `${slotLabel(plan.meal_slot)} is now ${replacement.name} — about ${replacement.calories} kcal.` };
    }
    return failure("unsupported_meal_plan_reference_action", "That Meal Plan reference action is not supported.");
  }

  function normalizeMealComponent(item = {}, index = 0) {
    const name = clean(item?.name, 180);
    const calories = finite(item?.calories);
    const protein = finite(item?.proteinG ?? item?.protein_g);
    const carbs = finite(item?.carbsG ?? item?.carbs_g);
    const fat = finite(item?.fatG ?? item?.fat_g);
    if (!name || [calories, protein, carbs, fat].some((value) => value === null || value < 0)) return null;
    return { id: clean(item?.id, 160) || `component-${index}`, name, amount: clean(item?.amount || item?.servingSize || item?.serving_size, 180), calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat) };
  }

  function normalizePlannedMeal(meal = {}, index = 0) {
    const mealSlot = normalizeSlot(meal?.mealSlot ?? meal?.meal_slot);
    const name = clean(meal?.name, 180);
    const calories = finite(meal?.calories);
    const protein = finite(meal?.proteinG ?? meal?.protein_g);
    const carbs = finite(meal?.carbsG ?? meal?.carbs_g);
    const fat = finite(meal?.fatG ?? meal?.fat_g);
    if (!mealSlot || !name || [calories, protein, carbs, fat].some((value) => value === null || value < 0) || calories <= 0 || calories > 5000) return null;
    let items = array(meal?.items).map(normalizeMealComponent).filter(Boolean);
    if (!items.length) items = [{ id: `whole-meal-${index}`, name, amount: clean(meal?.servingSize ?? meal?.serving_size, 180) || "1 planned serving", calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat) }];
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return { plan_date: date, meal_slot: mealSlot, name, calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat), serving_size: clean(meal?.servingSize ?? meal?.serving_size, 180) || "Planned by Ari", items, notes: clean(meal?.notes, 500) };
  }

  async function prepareTodayPlan(pending = {}) {
    const args = object(pending?.arguments);
    const meals = array(args?.meals).slice(0, 4).map(normalizePlannedMeal).filter(Boolean);
    if (!meals.length) return failure("meal_plan_required", "Ari did not produce a complete meal for today’s Meal Plan.");
    const slots = meals.map((meal) => meal.meal_slot);
    if (new Set(slots).size !== slots.length) return failure("meal_plan_duplicate_slots", "Ari proposed more than one meal for the same Meal Plan slot.");
    const context = typeof window.CalBuddy?.getUserContext === "function" ? await window.CalBuddy.getUserContext() : {};
    const budgetBasis = clean(args?.budgetBasis, 40).toLowerCase() || "general";
    const targetCalories = finite(args?.targetCalories);
    if (budgetBasis === "daily_goal" && finite(context?.dailyGoal) === null) return failure("daily_calorie_goal_required", "Your Daily Calorie Goal is not set, so Ari will not invent a calorie budget. Set the goal first or give Ari an explicit calorie target.");
    if (budgetBasis === "explicit_user_target" && (targetCalories === null || targetCalories <= 0)) return failure("explicit_meal_plan_target_required", "The requested Meal Plan calorie target is missing.");
    const activeSlots = new Set(array(context?.plannedMeals).map((item) => normalizeSlot(item?.meal_slot ?? item?.mealSlot)).filter(Boolean));
    const collision = meals.find((meal) => activeSlots.has(meal.meal_slot));
    if (collision) return failure("meal_plan_slot_already_active", `Today’s ${slotLabel(collision.meal_slot).toLowerCase()} already has an active Meal Plan. Discard it before replacing it.`);
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const remaining = finite(context?.caloriesRemainingAfterPlan);
    if (budgetBasis === "daily_goal" && remaining !== null && totalCalories > remaining + Math.max(100, Math.round(remaining * 0.10))) return failure("meal_plan_exceeds_remaining_budget", "That plan is above the calories remaining in today’s saved budget, so Ari will not save it as-is.", { proposedCalories: totalCalories, remainingCalories: remaining });
    return {
      success: true,
      action: {
        action_type: "plan_meal",
        payload: { meals, plan_date: meals[0].plan_date, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
        confirmation_text: meals.length === 1 ? `Add ${meals[0].name} — about ${meals[0].calories} kcal — to today’s ${slotLabel(meals[0].meal_slot).toLowerCase()} Meal Plan?` : `Add this ${Math.round(totalCalories).toLocaleString()} kcal plan to today’s Meal Plan?`
      },
      resolution: { todayOnly: true, budgetBasis, targetCalories: targetCalories === null ? null : Math.round(targetCalories), totalCalories: Math.round(totalCalories), mealSlots: slots }
    };
  }

  async function prepareLogPlannedMeal(pending = {}) {
    const mealSlot = normalizeSlot(pending?.arguments?.mealSlot ?? pending?.arguments?.meal_slot);
    if (!mealSlot) return failure("planned_meal_slot_required", "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan.");
    return {
      success: true,
      action: {
        action_type: "log_planned_meal",
        payload: { meal_slot: mealSlot, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
        confirmation_text: `Log today’s planned ${slotLabel(mealSlot).toLowerCase()} as eaten?`
      },
      resolution: { todayOnly: true, mealSlot }
    };
  }

  async function activityService() {
    if (!activityServicePromise) {
      activityServicePromise = import("../../js/training/activity-log-service.js?v=1.1.0")
        .then((module) => module.default || module.ActivityLogService);
    }
    return await activityServicePromise;
  }

  function installFailurePreservation(registry) {
    const bridge = window.AriVNextBridge;
    if (!bridge?.getPendingAction || !bridge?.setPendingAction || !bridge?.clearPendingAction) return false;
    if (!bridge[BRIDGE_CLEAR_FLAG]) {
      const originalClear = bridge.clearPendingAction.bind(bridge);
      bridge.clearPendingAction = function registryAwarePendingClear() {
        const current = bridge.getPendingAction?.() || null;
        if (protectedPendingId && clean(current?.id, 220) === protectedPendingId) {
          protectedPendingId = null;
          return false;
        }
        return originalClear();
      };
      Object.defineProperty(bridge, BRIDGE_CLEAR_FLAG, { configurable: false, enumerable: false, value: VERSION });
    }

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== false) return execution;
      const pending = pendingFrom(input);
      if (!pending?.id) return execution;
      bridge.setPendingAction(pending);
      protectedPendingId = clean(pending.id, 220);
      const protectedId = protectedPendingId;
      window.setTimeout(() => {
        if (protectedPendingId === protectedId) protectedPendingId = null;
      }, 0);
      return execution;
    }, { source: `${SOURCE}:failure-preservation`, priority: 10000 });
    return true;
  }

  function registerCircle(registry) {
    const circle = window.AriVNextCircleActionAdapter;
    if (!circle?.ready || typeof circle.prepare !== "function" || typeof circle.execute !== "function") return false;
    for (const name of CIRCLE_OPERATIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:circle`,
        priority: 2000,
        async prepare(pending = {}) {
          return await circle.prepare(pending, object(pending?.arguments));
        }
      });
    }
    for (const type of CIRCLE_ACTION_TYPES) {
      registry.registerApplicationExecutor(type, {
        source: `${SOURCE}:circle`,
        priority: 2000,
        async execute(action = {}) {
          return await circle.execute(action);
        }
      });
    }
    return true;
  }

  function registerManualActivityExecutor(registry) {
    registry.registerApplicationExecutor("log_activity", {
      source: `${SOURCE}:activity`,
      priority: 1500,
      async execute(action = {}) {
        const service = await activityService();
        const result = await service.logActivity(action?.payload || {}, { source: clean(action?.payload?.source || "ari_vnext", 80) });
        if (!result?.success) return failure(result?.code || "activity_log_failed", result?.message || "Activity could not be saved.");
        return result;
      }
    });
  }

  function registerReferenceOperations(registry) {
    for (const name of LIVE_REFERENCE_ACTIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:authoritative-reference`,
        priority: 4000,
        match(input = {}) { return Boolean(liveTarget(pendingFrom(input))); },
        async createPending(pending = {}) { return await createLivePending(pending, liveTarget(pending)); },
        async executeConfirmed(input = {}) { return await executeLive(input); }
      });
    }

    for (const name of ["undo_nutrition_mutation", "update_activity_log", "delete_activity_log"]) {
      registry.registerOperation(name, {
        source: `${SOURCE}:persisted-reference`,
        priority: 3000,
        match(input = {}) {
          const pending = pendingFrom(input);
          return name === "undo_nutrition_mutation" ? Boolean(persistedUndoTarget(pending)) : Boolean(persistedActivityTarget(pending));
        },
        async createPending(pending = {}) { return await createPersistedReferencePending(pending); },
        async executeConfirmed(input = {}) { return await executePersistedReference(input); }
      });
    }
  }

  function registerMealPlan(registry) {
    registry.registerOperation("plan_meal", { source: `${SOURCE}:meal-plan`, priority: 2200, async prepare(pending = {}) { return await prepareTodayPlan(pending); } });
    registry.registerOperation("log_planned_meal", { source: `${SOURCE}:meal-plan`, priority: 2200, async prepare(pending = {}) { return await prepareLogPlannedMeal(pending); } });
    for (const name of PLAN_ACTIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:meal-plan-reference`,
        priority: 3500,
        async createPending(pending = {}) { return await createPlanReferencePending(pending); },
        async executeConfirmed(input = {}) { return await executePlanReference(input); }
      });
    }
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!window.AriVNextStructuredReferenceCapabilities?.ready || !window.AriVNextAuthoritativeReferenceRehydration?.ready) return false;
    if (!window.AriVNextActivityAdapter || !window.AriVNextNutritionReferenceAdapter?.ready || !window.AriVNextWeightAdapter?.ready) return false;
    if (!window.AriVNextCircleActionAdapter?.ready) return false;

    installFailurePreservation(registry);
    registerCircle(registry);
    registerManualActivityExecutor(registry);
    registerReferenceOperations(registry);
    registerMealPlan(registry);

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    const migratedOperations = Array.from(new Set([
      ...CIRCLE_OPERATIONS,
      ...LIVE_REFERENCE_ACTIONS,
      "plan_meal",
      "log_planned_meal",
      ...PLAN_ACTIONS,
      "log_activity"
    ])).sort();

    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      migratedOperations,
      migratedApplicationActions: [...CIRCLE_ACTION_TYPES, "log_activity"].sort()
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8BReady", {
      detail: { version: VERSION, migratedOperations }
    }));
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[Ari Phase 8B] install retry:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();
