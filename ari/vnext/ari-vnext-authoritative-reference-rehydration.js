// ARI vNext — authoritative reference rehydration.
//
// Rebuilds conversational pointers from canonical app context on every Ari turn
// so references survive page reloads, WebView recreation, Safari eviction, and
// other sessionStorage loss without creating a second database. The current
// user message remains the only source of mutation authorization. Rehydrated
// pointers identify targets only; trusted domain adapters re-read the canonical
// object again before every write.

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_authoritative_reference_rehydration";
  const BRIDGE_FLAG = "__ariAuthoritativeReferenceRehydrationV1";
  const ADAPTER_FLAG = "__ariAuthoritativeReferenceActionsV1";
  const MAX_CONTEXT_REFERENCES = 16;

  const LIVE_ACTIONS = new Set([
    "update_nutrition_meal",
    "undo_nutrition_mutation",
    "update_weight_log",
    "delete_weight_log",
    "update_activity_log",
    "delete_activity_log",
    "edit_referenced_workout",
    "delete_workout"
  ]);

  let currentReferences = new Map();

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

  function stableReferenceId(domain = "general", entityType = "app_object", identity = "") {
    const d = clean(domain, 40).toLowerCase() || "general";
    const type = clean(entityType, 60).toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "app_object";
    const id = clean(identity, 240);
    return id ? `ref_live_${type}_${hashText(`${d}|${type}|${id}`)}` : "";
  }

  function compactObject(value = {}, maxKeys = 12) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    for (const [key, raw] of Object.entries(value).slice(0, maxKeys)) {
      if (raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "boolean") output[key] = raw;
      else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
      else if (typeof raw === "string") output[key] = clean(raw, 220);
    }
    return output;
  }

  function trustedLiveReference({ referenceId, actionName, domain, entityType, label, canonical, details }) {
    return {
      referenceId,
      actionName,
      domain,
      entityType,
      label: clean(label, 220) || "Current app item",
      state: "persisted",
      canonical: compactObject(canonical, 12),
      details: compactObject(details, 14),
      verification: {
        verifiedByTrustedContext: true,
        currentContextRead: true,
        rehydratedFromAuthoritativeState: true,
        staleCheckRequiredBeforeWrite: true
      },
      updatedAt: new Date().toISOString()
    };
  }

  function canonicalIdentity(reference = {}) {
    const canonical = object(reference?.canonical);
    const domain = clean(reference?.domain, 40);
    const entityType = clean(reference?.entityType, 60);
    const id = clean(
      canonical?.id ?? canonical?.mealId ?? canonical?.activityId ?? canonical?.logDate ?? canonical?.date ?? canonical?.planId ?? canonical?.crewId,
      200
    );
    return id ? `${domain}:${entityType}:${id}` : clean(reference?.referenceId, 180);
  }

  function addReference(output, seen, reference) {
    const referenceId = clean(reference?.referenceId, 180);
    if (!referenceId || seen.has(referenceId)) return;
    seen.add(referenceId);
    output.push(reference);
  }

  function mealReferences(context = {}) {
    const output = [];
    const seenIds = new Set();
    const sources = [
      { rows: array(context?.mealsToday), collection: "meals_today" },
      { rows: array(context?.recentMeals), collection: "recent_meals" }
    ];

    for (const source of sources) {
      source.rows.slice(0, 12).forEach((meal, index) => {
        const id = clean(meal?.id ?? meal?.meal_id ?? meal?.mealId, 180);
        if (!id || seenIds.has(id)) return;
        seenIds.add(id);
        const mutationCandidate = clean(meal?.ari_mutation_id ?? meal?.mutation_id ?? meal?.mutationId, 180);
        const nutritionDate = clean(meal?.nutrition_date ?? meal?.nutritionDate ?? meal?.date, 40);
        const name = clean(meal?.name ?? meal?.meal_name ?? meal?.title, 180) || "Meal";
        const referenceId = stableReferenceId("nutrition", "meal", id);
        if (!referenceId) return;

        output.push(trustedLiveReference({
          referenceId,
          actionName: "current_nutrition_meal",
          domain: "nutrition",
          entityType: "meal",
          label: name,
          canonical: {
            id,
            mealId: id,
            ...(isUuid(mutationCandidate) ? { mutationId: mutationCandidate } : {}),
            ...(nutritionDate ? { nutritionDate } : {})
          },
          details: {
            ordinal: index + 1,
            collection: source.collection,
            name,
            calories: finite(meal?.calories),
            proteinG: finite(meal?.protein_g ?? meal?.proteinG),
            carbsG: finite(meal?.carbs_g ?? meal?.carbsG),
            fatG: finite(meal?.fat_g ?? meal?.fatG),
            servingSize: clean(meal?.serving_size ?? meal?.servingSize, 180),
            mealCategory: clean(meal?.category ?? meal?.mealCategory, 100),
            nutritionDate,
            createdAt: clean(meal?.created_at ?? meal?.createdAt, 80)
          }
        }));
      });
    }
    return output;
  }

  function weightReferences(context = {}) {
    return array(context?.recentWeights).slice(0, 12).map((row, index) => {
      const logDate = clean(row?.log_date ?? row?.logDate ?? row?.date, 40);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) return null;
      const id = clean(row?.id, 180);
      const value = finite(row?.weight ?? row?.value ?? row?.weight_lb ?? row?.weightLb);
      const unit = clean(row?.unit ?? row?.weight_unit ?? "lb", 12).toLowerCase() || "lb";
      const referenceId = stableReferenceId("goals", "weight_log", id || logDate);
      return trustedLiveReference({
        referenceId,
        actionName: "current_weight_log",
        domain: "goals",
        entityType: "weight_log",
        label: value === null ? `Weigh-in · ${logDate}` : `${value} ${unit} · ${logDate}`,
        canonical: { ...(id ? { id } : {}), logDate },
        details: {
          ordinal: index + 1,
          collection: "recent_weights",
          value,
          unit,
          logDate
        }
      });
    }).filter(Boolean);
  }

  function workoutReferences(context = {}) {
    const output = [];
    const seenDates = new Set();
    const candidates = [];
    if (object(context?.trainingToday)?.type === "workout") {
      candidates.push({ row: context.trainingToday, collection: "training_today" });
    }
    for (const row of array(context?.recentTraining).slice(0, 16)) {
      if (clean(row?.type, 40).toLowerCase() === "workout") candidates.push({ row, collection: "recent_workouts" });
    }

    candidates.forEach(({ row, collection }, index) => {
      const date = clean(row?.date ?? row?.scheduled_date ?? row?.scheduledDate, 40);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || seenDates.has(date)) return;
      seenDates.add(date);
      const id = clean(row?.id ?? row?.workout_id ?? row?.workoutId ?? row?.sessionId, 180);
      const title = clean(row?.title ?? row?.focusLabel ?? row?.focus ?? row?.goal, 180) || "Workout";
      const referenceId = stableReferenceId("training", "workout", id || date);
      output.push(trustedLiveReference({
        referenceId,
        actionName: "current_training_workout",
        domain: "training",
        entityType: "workout",
        label: `${title} · ${date}`,
        canonical: { ...(id ? { id } : {}), date },
        details: {
          ordinal: index + 1,
          collection,
          title,
          date,
          completed: row?.completed === true,
          exerciseCount: array(row?.exercises).length,
          durationMinutes: finite(row?.durationMinutes ?? row?.estimatedDurationMinutes)
        }
      }));
    });
    return output;
  }

  function activityReferences(context = {}) {
    const training = object(context?.training);
    const rows = [
      ...array(training?.activityLogs),
      ...array(training?.activity_logs),
      ...array(training?.recentActivities),
      ...array(training?.manualActivities),
      ...array(context?.recentActivities)
    ];
    const output = [];
    const seen = new Set();

    rows.slice(0, 20).forEach((row, index) => {
      const id = clean(row?.id ?? row?.activity_id ?? row?.activityId, 180);
      const logDate = clean(row?.log_date ?? row?.logDate ?? row?.date, 40);
      if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(logDate) || seen.has(id)) return;
      seen.add(id);
      const name = clean(row?.activity_name ?? row?.activityName ?? row?.name, 180) || "Activity";
      const referenceId = stableReferenceId("training", "activity_log", id);
      output.push(trustedLiveReference({
        referenceId,
        actionName: "current_activity_log",
        domain: "training",
        entityType: "activity_log",
        label: `${name} · ${logDate}`,
        canonical: { id, activityId: id, logDate },
        details: {
          ordinal: index + 1,
          collection: "recent_activity_logs",
          activityName: name,
          logDate,
          durationMinutes: finite(row?.duration_minutes ?? row?.durationMinutes),
          caloriesBurned: finite(row?.calories_burned ?? row?.caloriesBurned),
          averageHeartRate: finite(row?.average_heart_rate ?? row?.averageHeartRate),
          intensity: clean(row?.intensity, 40)
        }
      }));
    });
    return output;
  }

  function liveReferences(context = {}) {
    return [
      ...mealReferences(context),
      ...weightReferences(context),
      ...workoutReferences(context),
      ...activityReferences(context)
    ];
  }

  function referenceFollowUp(message = "") {
    const text = clean(message, 500);
    return Boolean(text) && /\b(?:it|its|them|they|that|this|those|these|one|ones|first|second|third|other|same|previous|last)\b/i.test(text);
  }

  function preferredDomain(message = "", history = []) {
    const recent = referenceFollowUp(message)
      ? array(history).slice(-8).map((item) => clean(item?.content, 500)).join("\n")
      : "";
    const semantic = `${recent}\n${clean(message, 1000)}`;
    if (/\b(?:meal|food|eat|ate|calorie|nutrition|protein|carbs?|fat|breakfast|lunch|dinner|snack)\b/i.test(semantic)) return "nutrition";
    if (/\b(?:workout|training|exercise|activity|gym|sets?|reps?|run|cardio)\b/i.test(semantic)) return "training";
    if (/\b(?:weight|weigh|goal|target|cut|bulk|maintain)\b/i.test(semantic)) return "goals";
    if (/\b(?:circle|meetup|mission|crew|join|host|event)\b/i.test(semantic)) return "social";
    return "general";
  }

  function mergeReferenceState(context = {}, live = [], options = {}) {
    const previous = object(context?.referenceState);
    const existing = array(previous?.references);
    const domain = preferredDomain(options?.message, options?.history);
    const executorRefs = existing.filter((reference) => reference?.verification?.verifiedByTrustedExecutor === true);
    const existingDomain = existing.filter((reference) => reference?.domain === domain && !executorRefs.includes(reference));
    const liveDomain = live.filter((reference) => reference?.domain === domain);
    const otherExisting = existing.filter((reference) => !executorRefs.includes(reference) && !existingDomain.includes(reference));
    const otherLive = live.filter((reference) => reference?.domain !== domain);
    const ordered = domain === "general"
      ? [...executorRefs, ...existing.filter((reference) => !executorRefs.includes(reference)), ...live]
      : [...executorRefs, ...liveDomain, ...existingDomain, ...otherExisting, ...otherLive];

    const output = [];
    const seenRefs = new Set();
    const seenIdentity = new Set();
    for (const reference of ordered) {
      const referenceId = clean(reference?.referenceId, 180);
      if (!referenceId || seenRefs.has(referenceId)) continue;
      const identity = canonicalIdentity(reference);
      if (identity && seenIdentity.has(identity)) continue;
      seenRefs.add(referenceId);
      if (identity) seenIdentity.add(identity);
      output.push(reference);
      if (output.length >= MAX_CONTEXT_REFERENCES) break;
    }

    return {
      ...previous,
      version: previous?.version || "authoritative-rehydration-v1",
      source: "session_current_context_and_authoritative_rehydration",
      authoritativeRehydrationVersion: VERSION,
      references: output
    };
  }

  function refreshCurrentMap(context = {}, live = []) {
    const next = new Map();
    for (const reference of [...array(context?.referenceState?.references), ...live]) {
      const referenceId = clean(reference?.referenceId, 180);
      const verification = object(reference?.verification);
      if (!referenceId) continue;
      if (verification?.verifiedByTrustedContext !== true || verification?.currentContextRead !== true) continue;
      next.set(referenceId, reference);
    }
    currentReferences = next;
  }

  function resolveReference(referenceId = "") {
    return currentReferences.get(clean(referenceId, 180)) || null;
  }

  function isTrustedLiveReference(reference = {}, { domain = "", entityType = "" } = {}) {
    if (!reference || clean(reference?.state, 40) !== "persisted") return false;
    if (domain && clean(reference?.domain, 40) !== domain) return false;
    if (entityType && clean(reference?.entityType, 60) !== entityType) return false;
    const verification = object(reference?.verification);
    return verification?.verifiedByTrustedContext === true &&
      verification?.currentContextRead === true &&
      verification?.rehydratedFromAuthoritativeState === true &&
      verification?.staleCheckRequiredBeforeWrite === true;
  }

  function liveTarget(pending = {}) {
    const action = clean(pending?.name, 120);
    if (!LIVE_ACTIONS.has(action)) return null;
    const target = resolveReference(pending?.arguments?.referenceId);
    if (!target) return null;

    if (action === "update_nutrition_meal" && isTrustedLiveReference(target, { domain: "nutrition", entityType: "meal" }) && clean(target?.canonical?.id, 180)) return target;
    if (action === "undo_nutrition_mutation" && isTrustedLiveReference(target, { domain: "nutrition", entityType: "meal" }) && isUuid(target?.canonical?.mutationId)) return target;
    if (["update_weight_log", "delete_weight_log"].includes(action) && isTrustedLiveReference(target, { domain: "goals", entityType: "weight_log" }) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40))) return target;
    if (["update_activity_log", "delete_activity_log"].includes(action) && isTrustedLiveReference(target, { domain: "training", entityType: "activity_log" }) && clean(target?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40))) return target;
    if (["edit_referenced_workout", "delete_workout"].includes(action) && isTrustedLiveReference(target, { domain: "training", entityType: "workout" }) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.date, 40))) return target;
    return null;
  }

  function failure(code, message) {
    return { success: false, code, message };
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

  function summarizeChanges(changes = []) {
    return array(changes).slice(0, 4).map((change) => {
      const field = clean(change?.field, 80).replaceAll("_", " ");
      const value = Number.isFinite(Number(change?.numberValue)) ? Number(change.numberValue) : clean(change?.textValue, 100);
      return field && value !== "" ? `${field} to ${value}` : field;
    }).filter(Boolean).join(", ");
  }

  async function createLivePendingAction(pending = {}, target = {}) {
    const action = clean(pending?.name, 120);
    const label = clean(target?.label, 160) || "that item";

    if (action === "update_nutrition_meal") {
      const changes = array(pending?.arguments?.changes).slice(0, 8);
      if (!changes.length) return failure("nutrition_reference_changes_required", "Tell Ari what should change about that meal.");
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { meal_id: target.canonical.id, reference_id: target.referenceId, changes },
        confirmation_text: `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
      }, { referenceId: target.referenceId, entityType: "meal", authority: "rehydrated_current_context" });
    }

    if (action === "undo_nutrition_mutation") {
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { mutation_id: target.canonical.mutationId, reference_id: target.referenceId },
        confirmation_text: `Undo ${label}?`
      }, { referenceId: target.referenceId, entityType: "meal", authority: "rehydrated_current_context" });
    }

    if (action === "update_weight_log") {
      const value = finite(pending?.arguments?.value);
      const unit = clean(pending?.arguments?.unit, 12).toLowerCase() || "lb";
      if (value === null) return failure("weight_reference_value_required", "Tell Ari the corrected weight.");
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit },
        confirmation_text: `Change ${label} to ${value} ${unit}?`
      }, { referenceId: target.referenceId, entityType: "weight_log", authority: "rehydrated_current_context" });
    }

    if (action === "delete_weight_log") {
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, entityType: "weight_log", authority: "rehydrated_current_context" });
    }

    if (["update_activity_log", "delete_activity_log"].includes(action)) {
      const deleting = action === "delete_activity_log";
      const changes = deleting ? [] : array(pending?.arguments?.changes).slice(0, 8);
      if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
        confirmation_text: deleting ? `Delete ${label}?` : `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
      }, { referenceId: target.referenceId, entityType: "activity_log", authority: "rehydrated_current_context" });
    }

    if (action === "edit_referenced_workout") {
      const synthetic = referencedWorkoutEdit(pending, target);
      const prepared = await window.AriVNextActionAdapter?.prepareCalBuddyAction?.(synthetic);
      if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
      return await storeLegacyPendingAction(pending, {
        ...prepared.action,
        action_type: action,
        payload: { ...prepared.action.payload, reference_id: target.referenceId }
      }, { referenceId: target.referenceId, entityType: "workout", authority: "rehydrated_current_context" });
    }

    if (action === "delete_workout") {
      return await storeLegacyPendingAction(pending, {
        action_type: action,
        payload: { scheduled_date: target.canonical.date, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, entityType: "workout", authority: "rehydrated_current_context" });
    }

    return failure("reference_action_not_supported", "That reference action is not supported.");
  }

  function referencedWorkoutEdit(pending = {}, target = {}) {
    const args = object(pending?.arguments);
    return {
      ...pending,
      id: `${clean(pending?.id, 180)}_rehydrated`,
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

  async function executeLiveMutation({ pendingAction, target, currentTurnId = null } = {}) {
    if (!pendingAction?.id || !target) return failure("rehydrated_reference_missing", "That current app item could not be resolved safely.");
    if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) {
      return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
    }

    const action = clean(pendingAction?.name, 120);
    try {
      if (action === "update_nutrition_meal") {
        const executor = window.AriVNextNutritionReferenceAdapter?.updateReferencedMeal;
        if (typeof executor !== "function") return failure("nutrition_reference_executor_unavailable", "The trusted Nutrition edit service is not ready right now.");
        const result = await executor({ mealId: target.canonical.id, changes: array(pendingAction?.arguments?.changes).slice(0, 8) });
        if (!result?.success) return result;
        return successExecution(pendingAction, target, currentTurnId, result, "meal_update");
      }

      if (action === "undo_nutrition_mutation") {
        if (typeof window.CalBuddy?.undoNutritionMutation !== "function") return failure("nutrition_undo_unavailable", "The Nutrition undo service is not ready right now.");
        const result = await window.CalBuddy.undoNutritionMutation(target.canonical.mutationId);
        return successExecution(pendingAction, target, currentTurnId, result, "meal_undo");
      }

      if (["update_weight_log", "delete_weight_log"].includes(action)) {
        const deleting = action === "delete_weight_log";
        const adapter = window.AriVNextWeightAdapter;
        const executor = deleting ? adapter?.deleteReferencedWeight : adapter?.updateReferencedWeight;
        if (typeof executor !== "function") return failure("weight_reference_executor_unavailable", "The trusted weight service is not ready right now.");
        const result = await executor(deleting
          ? { logDate: target.canonical.logDate }
          : { logDate: target.canonical.logDate, value: pendingAction?.arguments?.value, unit: pendingAction?.arguments?.unit });
        if (!result?.success) return result;
        return successExecution(pendingAction, target, currentTurnId, result, deleting ? "weight_delete" : "weight_update");
      }

      if (["update_activity_log", "delete_activity_log"].includes(action)) {
        const deleting = action === "delete_activity_log";
        const adapter = window.AriVNextActivityAdapter;
        const executor = deleting ? adapter?.deleteReferencedActivity : adapter?.updateReferencedActivity;
        if (typeof executor !== "function") return failure("activity_reference_executor_unavailable", "The trusted Training activity service is not ready right now.");
        const result = await executor({
          activityId: target.canonical.id,
          logDate: target.canonical.logDate,
          changes: deleting ? [] : array(pendingAction?.arguments?.changes).slice(0, 8)
        });
        if (!result?.success) return result;
        return successExecution(pendingAction, target, currentTurnId, result, deleting ? "activity_delete" : "activity_update");
      }

      if (action === "edit_referenced_workout") {
        const adapter = window.AriVNextActionAdapter;
        const synthetic = referencedWorkoutEdit(pendingAction, target);
        const prepared = await adapter?.prepareCalBuddyAction?.(synthetic);
        if (!prepared?.success || !prepared?.action) return prepared || failure("workout_reference_prepare_failed", "That workout edit could not be prepared safely.");
        const result = await adapter?.executeValidatedWorkoutEdit?.({ action: prepared.action, pending: synthetic, currentTurnId });
        if (!result?.success) return result || failure("workout_reference_update_failed", "That workout could not be updated.");
        return successExecution(pendingAction, target, currentTurnId, result, "workout_edit");
      }

      if (action === "delete_workout") {
        const adapter = window.AriVNextActionAdapter;
        const controller = await adapter?.getWorkoutController?.();
        const date = clean(target?.canonical?.date, 40);
        const current = controller?.getDate?.(date);
        if (!current || current?.type !== "workout" || !array(current?.exercises).length) {
          return failure("workout_reference_not_found", "That planned workout is no longer available.");
        }
        if (current?.completed === true || current?.progress?.completed === true) {
          return failure("workout_reference_completed", "A completed workout cannot be deleted through Ari.");
        }
        if (typeof controller?.clearDate !== "function") return failure("workout_delete_unavailable", "Training cannot safely clear that workout right now.");
        if (controller.clearDate(date) === false) return failure("workout_delete_failed", "Training could not delete that workout safely.");
        const remoteSaved = await controller.save?.({ remote: true });
        if (remoteSaved === false) return failure("workout_delete_remote_failed", "The workout changed locally but ARI XP could not confirm the remote save.");
        window.dispatchEvent(new CustomEvent("ari:trainingWorkoutUpdated", { detail: { scheduledDate: date, mode: "delete", source: SOURCE } }));
        return successExecution(pendingAction, target, currentTurnId, { deleted: true, scheduled_date: date, reply: "That planned workout was deleted." }, "workout_delete");
      }
    } catch (error) {
      return failure("rehydrated_reference_execution_failed", error?.message || "That current app item changed before Ari could complete the action. Nothing else was changed.");
    }

    return failure("reference_action_not_supported", "That reference action is not supported.");
  }

  function successExecution(pendingAction, target, currentTurnId, result, operation) {
    window.CalBuddy.cancelPendingAction?.();
    return {
      success: true,
      result,
      action: {
        action_type: clean(pendingAction?.name, 120),
        payload: { reference_id: target.referenceId },
        vnext_action_id: pendingAction.id,
        vnext_source_turn_id: pendingAction.sourceTurnId,
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

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge) return false;
    if (bridge[BRIDGE_FLAG]) return true;
    if (typeof bridge.buildContext !== "function") return false;

    const originalBuildContext = bridge.buildContext.bind(bridge);
    bridge.buildContext = async function authoritativeReferenceBuildContext(options = {}) {
      const context = await originalBuildContext(options);
      const live = liveReferences(context);
      refreshCurrentMap(context, live);
      if (!live.length) return context;
      return {
        ...context,
        referenceState: mergeReferenceState(context, live, options)
      };
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    return true;
  }

  function patchActionAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter[ADAPTER_FLAG]) return true;
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") return false;

    const originalCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const originalExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function authoritativeReferenceCreate(pendingAction = {}) {
      const target = liveTarget(pendingAction);
      if (!target) return await originalCreate(pendingAction);
      return await createLivePendingAction(pendingAction, target);
    };

    adapter.executeConfirmed = async function authoritativeReferenceExecute(input = {}) {
      const pendingAction = input?.vnextPendingAction || null;
      const target = liveTarget(pendingAction);
      if (!target) return await originalExecute(input);
      return await executeLiveMutation({
        pendingAction,
        target,
        currentTurnId: input?.currentTurnId || null
      });
    };

    Object.defineProperty(adapter, ADAPTER_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    return true;
  }

  function install() {
    const bridgeReady = patchBridge();
    const adapterReady = patchActionAdapter();
    return bridgeReady && adapterReady;
  }

  window.AriVNextAuthoritativeReferenceRehydration = Object.freeze({
    version: VERSION,
    source: SOURCE,
    ready: true,
    resolveReference,
    snapshot() {
      return Array.from(currentReferences.values()).map((reference) => ({ ...reference }));
    }
  });

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 40);
  }

  window.dispatchEvent(new CustomEvent("ari:vnextAuthoritativeReferenceRehydrationReady", {
    detail: { version: VERSION }
  }));
})();