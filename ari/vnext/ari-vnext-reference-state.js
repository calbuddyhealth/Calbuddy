// ARI vNext — bounded browser-side reference lifecycle state.
//
// This is a pointer layer, not another application database. It remembers a
// small set of recent Ari action targets so later turns can resolve words such
// as "that" or "it" to the canonical object that the trusted app executor
// actually created or changed. Reference-bound Nutrition Undo and Training
// activity edits/deletes resolve only through verified persisted pointers.

(() => {
  "use strict";

  const VERSION = "1.2.0";
  const STORAGE_PREFIX = "ari_vnext_reference_state_v1";
  const MAX_REFERENCES = 8;
  const MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const ADAPTER_FLAG = "__ariReferenceLifecycleV1";
  const BRIDGE_FLAG = "__ariReferenceContextV1";
  const CANCEL_FLAG = "__ariReferenceCancelV1";
  const REFERENCE_UNDO_ACTION = "undo_nutrition_mutation";
  const REFERENCE_ACTIVITY_UPDATE_ACTION = "update_activity_log";
  const REFERENCE_ACTIVITY_DELETE_ACTION = "delete_activity_log";
  const REFERENCE_ACTIONS = new Set([
    REFERENCE_UNDO_ACTION,
    REFERENCE_ACTIVITY_UPDATE_ACTION,
    REFERENCE_ACTIVITY_DELETE_ACTION
  ]);

  function clean(value = "", max = 180) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function isUuid(value = "") {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 160));
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

  function currentConversationId(explicit = null) {
    return clean(explicit || window.CalBuddy?.getConversationId?.() || "default", 200) || "default";
  }

  function storageKey(conversationId = null) {
    return `${STORAGE_PREFIX}:${hash(currentConversationId(conversationId))}`;
  }

  function compactObject(value, maxKeys = 10) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    for (const [key, raw] of Object.entries(value).slice(0, maxKeys)) {
      if (raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
      else if (typeof raw === "boolean") output[key] = raw;
      else if (typeof raw === "string") output[key] = clean(raw, 220);
    }
    return output;
  }

  function compactReference(reference = {}) {
    return {
      referenceId: clean(reference.referenceId, 160),
      actionName: clean(reference.actionName, 120),
      domain: clean(reference.domain, 40) || "general",
      entityType: clean(reference.entityType, 60) || "app_object",
      label: clean(reference.label, 220) || "Recent Ari action",
      state: clean(reference.state, 40) || "discussed",
      sourceTurnId: clean(reference.sourceTurnId, 200) || null,
      vnextActionId: clean(reference.vnextActionId, 200) || null,
      canonical: compactObject(reference.canonical, 12),
      details: compactObject(reference.details, 12),
      verification: compactObject(reference.verification, 8),
      updatedAt: clean(reference.updatedAt, 80) || new Date().toISOString(),
      expiresAt: clean(reference.expiresAt, 80) || null
    };
  }

  function prune(references = []) {
    const now = Date.now();
    return references
      .filter((reference) => {
        if (!reference || typeof reference !== "object") return false;
        if (["cancelled", "failed", "expired", "deleted"].includes(clean(reference.state, 40))) return false;
        const updatedAt = Date.parse(clean(reference.updatedAt, 80));
        return !Number.isFinite(updatedAt) || now - updatedAt <= MAX_AGE_MS;
      })
      .sort((left, right) => Date.parse(right?.updatedAt || 0) - Date.parse(left?.updatedAt || 0))
      .slice(0, MAX_REFERENCES)
      .map(compactReference);
  }

  function read(conversationId = null) {
    try {
      const raw = sessionStorage.getItem(storageKey(conversationId));
      if (!raw) return { version: VERSION, references: [] };
      const parsed = JSON.parse(raw);
      return {
        version: VERSION,
        references: prune(Array.isArray(parsed?.references) ? parsed.references : [])
      };
    } catch {
      return { version: VERSION, references: [] };
    }
  }

  function write(state = {}, conversationId = null) {
    const next = {
      version: VERSION,
      references: prune(Array.isArray(state?.references) ? state.references : [])
    };
    try {
      sessionStorage.setItem(storageKey(conversationId), JSON.stringify(next));
    } catch {
      // Storage restrictions should never block Ari or trusted app writes.
    }
    return next;
  }

  function domainForAction(name = "") {
    const action = clean(name, 120).toLowerCase();
    if (/meal|nutrition|food/.test(action)) return "nutrition";
    if (/workout|training|activity|exercise/.test(action)) return "training";
    if (/weight|goal|profile/.test(action)) return "goals";
    if (/meetup|mission|crew|circle|quest|friend|challenge|event/.test(action)) return "social";
    if (/experiment/.test(action)) return "training";
    return "general";
  }

  function entityTypeForAction(name = "") {
    const action = clean(name, 120).toLowerCase();
    if (action === "log_meal") return "meal";
    if (/meal_plan|planned_meal|plan_meal/.test(action)) return "meal_plan_item";
    if (action === "log_activity") return "activity_log";
    if (action === "log_weight") return "weight_log";
    if (action === "update_goal") return "goal";
    if (/workout/.test(action)) return "workout";
    if (/meetup/.test(action)) return "meetup";
    if (/mission|quest/.test(action)) return "mission";
    if (/crew/.test(action)) return "crew";
    if (/experiment/.test(action)) return "experiment";
    return "app_object";
  }

  function detailsForAction(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    const allowed = [
      "calories", "proteinG", "carbsG", "fatG", "quantity", "unit", "servingSize", "mealCategory",
      "dateText", "activityName", "durationMinutes", "sets", "repsPerSet", "caloriesBurned", "intensity",
      "averageHeartRate", "notes", "goalType", "value", "focus", "operation", "exercise",
      "replacementExercise", "slot", "mealSlot", "title"
    ];
    const details = {};
    for (const key of allowed) {
      const value = args[key];
      if (value === null || value === undefined || value === "") continue;
      if (typeof value === "number" && Number.isFinite(value)) details[key] = value;
      else if (typeof value === "string") details[key] = clean(value, key === "notes" ? 220 : 180);
    }
    return details;
  }

  function labelForAction(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    if (name === "log_meal") return clean(args.name, 220) || "Meal";
    if (name === "log_activity") return clean(args.activityName, 220) || "Activity";
    if (name === "log_weight") return `${clean(args.value, 40)} ${clean(args.unit, 20) || "lb"}`.trim();
    if (name === "update_goal") return `${clean(args.goalType, 80) || "goal"}${args.value !== null && args.value !== undefined ? ` ${clean(args.value, 60)}` : ""}`.trim();
    if (/workout/.test(name)) return clean(args.title || args.focus, 220) || `${clean(args.dateText, 80) || "Planned"} workout`;
    if (/meal_plan|planned_meal|plan_meal/.test(name)) return clean(args.title || args.name || args.mealSlot || args.slot, 220) || "Meal Plan item";
    return clean(args.title || args.name || args.label, 220) || name.replaceAll("_", " ") || "Recent Ari action";
  }

  function makeReferenceId(pending = {}) {
    const actionId = clean(pending?.id, 200);
    return actionId ? `ref_action_${hash(actionId)}` : `ref_action_${Date.now().toString(36)}`;
  }

  function isReferenceAction(pending = {}) {
    return REFERENCE_ACTIONS.has(clean(pending?.name, 120));
  }

  function isReferenceUndoAction(pending = {}) {
    return clean(pending?.name, 120) === REFERENCE_UNDO_ACTION;
  }

  function isReferenceActivityAction(pending = {}) {
    const name = clean(pending?.name, 120);
    return name === REFERENCE_ACTIVITY_UPDATE_ACTION || name === REFERENCE_ACTIVITY_DELETE_ACTION;
  }

  function pendingReference(pending = {}) {
    return compactReference({
      referenceId: makeReferenceId(pending),
      actionName: clean(pending?.name, 120),
      domain: domainForAction(pending?.name),
      entityType: entityTypeForAction(pending?.name),
      label: labelForAction(pending),
      state: "pending_confirmation",
      sourceTurnId: clean(pending?.sourceTurnId, 200) || null,
      vnextActionId: clean(pending?.id, 200) || null,
      canonical: {},
      details: detailsForAction(pending),
      verification: { verifiedByTrustedExecutor: false },
      updatedAt: new Date().toISOString(),
      expiresAt: clean(pending?.expiresAt, 80) || null
    });
  }

  function findValue(root, keys = [], depth = 0) {
    if (!root || typeof root !== "object" || depth > 3) return null;
    for (const key of keys) {
      const value = root[key];
      if (value !== null && value !== undefined && value !== "") return value;
    }
    for (const value of Object.values(root)) {
      if (!value || typeof value !== "object") continue;
      const found = findValue(value, keys, depth + 1);
      if (found !== null && found !== undefined && found !== "") return found;
    }
    return null;
  }

  function canonicalForExecution(pending = {}, execution = {}) {
    const action = clean(pending?.name, 120);
    const result = execution?.result && typeof execution.result === "object" ? execution.result : {};
    const canonical = {};

    if (action === "log_meal") {
      canonical.id = clean(findValue(result, ["id", "meal_id"]), 160) || undefined;
      canonical.mutationId = clean(findValue(result, ["ari_mutation_id", "mutationId"]), 160) || undefined;
      canonical.nutritionDate = clean(findValue(result, ["nutrition_date", "nutritionDate"]), 40) || undefined;
    } else if (action === "log_activity") {
      canonical.id = clean(findValue(result, ["id", "activity_id", "activityId"]), 160) || undefined;
      canonical.logDate = clean(findValue(result, ["log_date", "logDate"]), 40) || undefined;
    } else if (action === "log_weight") {
      canonical.logDate = clean(findValue(result, ["log_date", "logDate"]), 40) || clean(pending?.arguments?.dateText, 40) || undefined;
    } else if (action === "update_goal") {
      canonical.goalType = clean(pending?.arguments?.goalType, 80) || undefined;
    } else if (/workout/.test(action)) {
      canonical.id = clean(findValue(result, ["workoutId", "workout_id"]), 160) || undefined;
      canonical.date = clean(findValue(result, ["scheduled_date", "scheduledDate", "date"]), 40) || clean(pending?.arguments?.dateText, 40) || undefined;
    } else {
      canonical.id = clean(findValue(result, ["meetupId", "missionId", "crewId", "planItemId", "experimentId", "id"]), 160) || undefined;
      canonical.date = clean(findValue(result, ["scheduled_date", "log_date", "nutrition_date", "date"]), 40) || undefined;
    }

    return compactObject(canonical, 8);
  }

  function upsert(reference, conversationId = null) {
    const state = read(conversationId);
    const references = state.references.filter((item) => item.referenceId !== reference.referenceId);
    references.unshift(reference);
    return write({ references }, conversationId).references[0] || reference;
  }

  function rememberPending({ pendingAction, conversationId = null } = {}) {
    if (!pendingAction?.id || !pendingAction?.name || isReferenceAction(pendingAction)) return null;
    return upsert(pendingReference(pendingAction), conversationId);
  }

  function resolveReference(referenceId = "", conversationId = null) {
    const id = clean(referenceId, 160);
    if (!id) return null;
    return read(conversationId).references.find((reference) => reference.referenceId === id) || null;
  }

  function resolveUndoTarget(pendingAction = {}, conversationId = null) {
    if (!isReferenceUndoAction(pendingAction)) return null;
    const target = resolveReference(pendingAction?.arguments?.referenceId, conversationId);
    if (!target) return null;
    if (clean(target.state, 40) !== "persisted") return null;
    if (clean(target.domain, 40) !== "nutrition") return null;
    if (clean(target.entityType, 60) !== "meal") return null;
    if (target?.verification?.verifiedByTrustedExecutor !== true) return null;
    if (!isUuid(target?.canonical?.mutationId)) return null;
    return target;
  }

  function resolveActivityTarget(pendingAction = {}, conversationId = null) {
    if (!isReferenceActivityAction(pendingAction)) return null;
    const target = resolveReference(pendingAction?.arguments?.referenceId, conversationId);
    if (!target) return null;
    if (clean(target.state, 40) !== "persisted") return null;
    if (clean(target.domain, 40) !== "training") return null;
    if (clean(target.entityType, 60) !== "activity_log") return null;
    if (target?.verification?.verifiedByTrustedExecutor !== true) return null;
    if (!clean(target?.canonical?.id, 160)) return null;
    if (!clean(target?.canonical?.logDate, 40)) return null;
    return target;
  }

  function removeReference(referenceId = "", conversationId = null) {
    const id = clean(referenceId, 160);
    if (!id) return false;
    const state = read(conversationId);
    write({ references: state.references.filter((reference) => reference.referenceId !== id) }, conversationId);
    return true;
  }

  function tombstone(target = {}, verification = {}, conversationId = null) {
    if (!target?.referenceId) return null;
    removeReference(target.referenceId, conversationId);
    return compactReference({
      ...target,
      state: "deleted",
      verification: {
        ...target.verification,
        verifiedByTrustedExecutor: true,
        executorSuccess: true,
        ...verification
      },
      updatedAt: new Date().toISOString(),
      expiresAt: null
    });
  }

  function commitUndo({ pendingAction, execution, conversationId = null } = {}) {
    if (execution?.success === false) return null;
    const target = resolveUndoTarget(pendingAction, conversationId) || execution?.referenceUndo?.target || null;
    if (!target?.referenceId) return null;

    const executedMutationId = clean(execution?.referenceUndo?.mutationId, 160);
    if (executedMutationId && executedMutationId !== clean(target?.canonical?.mutationId, 160)) return null;

    return tombstone(target, { undoVerified: true }, conversationId);
  }

  function detailsFromActivity(activity = {}, previous = {}) {
    return compactObject({
      ...previous,
      activityName: clean(activity?.activity_name, 180) || previous?.activityName,
      durationMinutes: activity?.duration_minutes ?? previous?.durationMinutes,
      sets: activity?.sets ?? previous?.sets,
      repsPerSet: activity?.reps_per_set ?? previous?.repsPerSet,
      caloriesBurned: activity?.calories_burned ?? previous?.caloriesBurned,
      intensity: clean(activity?.intensity, 40) || previous?.intensity,
      averageHeartRate: activity?.average_heart_rate ?? previous?.averageHeartRate,
      dateText: clean(activity?.log_date, 40) || previous?.dateText,
      notes: clean(activity?.notes, 220) || undefined
    }, 12);
  }

  function commitActivityMutation({ pendingAction, execution, conversationId = null } = {}) {
    if (execution?.success === false) return null;
    const target = resolveActivityTarget(pendingAction, conversationId) || execution?.referenceActivity?.target || null;
    if (!target?.referenceId) return null;

    const executedActivityId = clean(execution?.referenceActivity?.activityId, 160);
    if (executedActivityId && executedActivityId !== clean(target?.canonical?.id, 160)) return null;

    if (clean(pendingAction?.name, 120) === REFERENCE_ACTIVITY_DELETE_ACTION) {
      return tombstone(target, { deleteVerified: true }, conversationId);
    }

    const activity = execution?.result?.activity && typeof execution.result.activity === "object"
      ? execution.result.activity
      : {};
    const canonicalId = clean(activity?.id, 160) || clean(target?.canonical?.id, 160);
    const logDate = clean(activity?.log_date, 40) || clean(target?.canonical?.logDate, 40);
    if (!canonicalId || !logDate) return null;

    return upsert(compactReference({
      ...target,
      actionName: "log_activity",
      label: clean(activity?.activity_name, 220) || target.label,
      state: "persisted",
      canonical: {
        ...target.canonical,
        id: canonicalId,
        logDate
      },
      details: detailsFromActivity(activity, target.details),
      verification: {
        ...target.verification,
        verifiedByTrustedExecutor: true,
        executorSuccess: true,
        updateVerified: true
      },
      updatedAt: new Date().toISOString(),
      expiresAt: null
    }), conversationId);
  }

  function commit({ pendingAction, execution, conversationId = null } = {}) {
    if (!pendingAction?.id || execution?.success === false) return null;
    if (isReferenceUndoAction(pendingAction)) {
      return commitUndo({ pendingAction, execution, conversationId });
    }
    if (isReferenceActivityAction(pendingAction)) {
      return commitActivityMutation({ pendingAction, execution, conversationId });
    }

    const state = read(conversationId);
    const referenceId = makeReferenceId(pendingAction);
    const existing = state.references.find((item) => item.referenceId === referenceId) || pendingReference(pendingAction);
    const reference = compactReference({
      ...existing,
      state: "persisted",
      canonical: canonicalForExecution(pendingAction, execution),
      details: { ...existing.details, ...detailsForAction(pendingAction) },
      verification: {
        verifiedByTrustedExecutor: true,
        executorSuccess: true
      },
      updatedAt: new Date().toISOString(),
      expiresAt: null
    });
    return upsert(reference, conversationId);
  }

  function removeAction(pendingAction = {}, conversationId = null) {
    const referenceId = makeReferenceId(pendingAction);
    const state = read(conversationId);
    return write({ references: state.references.filter((item) => item.referenceId !== referenceId) }, conversationId);
  }

  function cancel({ pendingAction, conversationId = null } = {}) {
    if (!pendingAction?.id) return false;
    removeAction(pendingAction, conversationId);
    return true;
  }

  function fail({ pendingAction, conversationId = null } = {}) {
    if (!pendingAction?.id) return false;
    removeAction(pendingAction, conversationId);
    return true;
  }

  function snapshot({ conversationId = null } = {}) {
    const state = read(conversationId);
    if (!state.references.length) return null;
    return {
      version: VERSION,
      references: state.references.map(compactReference)
    };
  }

  function clear({ conversationId = null } = {}) {
    try {
      sessionStorage.removeItem(storageKey(conversationId));
    } catch {}
    return true;
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
      vnext_source: "ari_vnext_reference_state"
    };

    window.CalBuddy.setPendingAction?.(wrapped);
    return {
      success: true,
      action: wrapped,
      resolution
    };
  }

  async function createReferenceUndoPendingAction(pendingAction = {}) {
    const target = resolveUndoTarget(pendingAction);
    if (!target) {
      return failure(
        "reference_undo_target_unavailable",
        "That meal is no longer available as a verified recent journaled entry."
      );
    }

    return await storeLegacyPendingAction(pendingAction, {
      action_type: REFERENCE_UNDO_ACTION,
      payload: {
        mutation_id: target.canonical.mutationId,
        reference_id: target.referenceId
      },
      confirmation_text: `Undo ${clean(target.label, 160) || "that meal"}?`
    }, {
      referenceId: target.referenceId,
      entityType: target.entityType,
      label: target.label,
      journaled: true
    });
  }

  function describeActivityChanges(changes = []) {
    const parts = [];
    for (const change of (Array.isArray(changes) ? changes : []).slice(0, 4)) {
      const field = clean(change?.field, 80);
      const value = Number.isFinite(Number(change?.numberValue))
        ? Number(change.numberValue)
        : clean(change?.textValue, 100);
      if (field === "duration_minutes") parts.push(`duration to ${value} min`);
      else if (field === "calories_burned") parts.push(`calories to ${value} kcal`);
      else if (field === "average_heart_rate") parts.push(`average heart rate to ${value} bpm`);
      else if (field === "sets") parts.push(`sets to ${value}`);
      else if (field === "reps_per_set") parts.push(`reps per set to ${value}`);
      else if (field === "activity_name") parts.push(`name to ${value}`);
      else if (field === "intensity") parts.push(`intensity to ${String(value).replaceAll("_", " ")}`);
      else if (field === "log_date") parts.push(`date to ${value}`);
      else if (field === "notes") parts.push("notes");
    }
    return parts.join(", ");
  }

  async function createReferenceActivityPendingAction(pendingAction = {}) {
    const target = resolveActivityTarget(pendingAction);
    if (!target) {
      return failure(
        "activity_reference_target_unavailable",
        "That activity is no longer available as a verified recent Training entry."
      );
    }

    const name = clean(pendingAction?.name, 120);
    const deleting = name === REFERENCE_ACTIVITY_DELETE_ACTION;
    const changes = Array.isArray(pendingAction?.arguments?.changes)
      ? pendingAction.arguments.changes.slice(0, 8)
      : [];
    if (!deleting && !changes.length) {
      return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    }

    const summary = describeActivityChanges(changes);
    return await storeLegacyPendingAction(pendingAction, {
      action_type: name,
      payload: {
        activity_id: target.canonical.id,
        reference_id: target.referenceId,
        changes
      },
      confirmation_text: deleting
        ? `Delete ${clean(target.label, 160) || "that activity"}?`
        : `Update ${clean(target.label, 160) || "that activity"}${summary ? ` — ${summary}` : ""}?`
    }, {
      referenceId: target.referenceId,
      entityType: target.entityType,
      label: target.label,
      operation: deleting ? "delete" : "update"
    });
  }

  async function executeReferenceUndo({ pendingAction, currentTurnId = null } = {}) {
    if (!pendingAction?.id || !pendingAction?.sourceTurnId) {
      return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
    }
    if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) {
      return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
    }

    const target = resolveUndoTarget(pendingAction);
    if (!target) {
      return failure(
        "reference_undo_target_unavailable",
        "That meal is no longer available as a verified recent journaled entry."
      );
    }
    if (typeof window.CalBuddy?.undoNutritionMutation !== "function") {
      return failure("nutrition_undo_unavailable", "The Nutrition undo service is not ready right now.");
    }

    const mutationId = clean(target.canonical.mutationId, 160);
    try {
      const result = await window.CalBuddy.undoNutritionMutation(mutationId);
      window.CalBuddy.cancelPendingAction?.();
      return {
        success: true,
        result,
        action: {
          action_type: REFERENCE_UNDO_ACTION,
          payload: {
            mutation_id: mutationId,
            reference_id: target.referenceId
          },
          vnext_action_id: pendingAction.id,
          vnext_source_turn_id: pendingAction.sourceTurnId,
          vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
          vnext_source: "ari_vnext_reference_state"
        },
        referenceUndo: {
          referenceId: target.referenceId,
          mutationId,
          target
        }
      };
    } catch (error) {
      return failure(
        "nutrition_undo_failed",
        error?.message || "That nutrition change could not be undone. Nothing else was changed."
      );
    }
  }

  async function executeReferenceActivityMutation({ pendingAction, currentTurnId = null } = {}) {
    if (!pendingAction?.id || !pendingAction?.sourceTurnId) {
      return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
    }
    if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) {
      return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
    }

    const target = resolveActivityTarget(pendingAction);
    if (!target) {
      return failure(
        "activity_reference_target_unavailable",
        "That activity is no longer available as a verified recent Training entry."
      );
    }

    const adapter = window.AriVNextActivityAdapter;
    const deleting = clean(pendingAction?.name, 120) === REFERENCE_ACTIVITY_DELETE_ACTION;
    const executor = deleting ? adapter?.deleteReferencedActivity : adapter?.updateReferencedActivity;
    if (typeof executor !== "function") {
      return failure("activity_reference_executor_unavailable", "The Training activity service is not ready right now.");
    }

    const activityId = clean(target.canonical.id, 160);
    const logDate = clean(target.canonical.logDate, 40);
    const changes = Array.isArray(pendingAction?.arguments?.changes)
      ? pendingAction.arguments.changes.slice(0, 8)
      : [];

    try {
      const result = await executor({ activityId, logDate, changes });
      if (!result?.success) {
        return failure(
          result?.code || (deleting ? "activity_reference_delete_failed" : "activity_reference_update_failed"),
          result?.message || (deleting ? "That activity could not be deleted." : "That activity could not be updated.")
        );
      }

      window.CalBuddy.cancelPendingAction?.();
      return {
        success: true,
        result,
        action: {
          action_type: deleting ? REFERENCE_ACTIVITY_DELETE_ACTION : REFERENCE_ACTIVITY_UPDATE_ACTION,
          payload: {
            activity_id: activityId,
            reference_id: target.referenceId,
            changes: deleting ? [] : changes
          },
          vnext_action_id: pendingAction.id,
          vnext_source_turn_id: pendingAction.sourceTurnId,
          vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
          vnext_source: "ari_vnext_reference_state"
        },
        referenceActivity: {
          referenceId: target.referenceId,
          activityId,
          operation: deleting ? "delete" : "update",
          target
        }
      };
    } catch (error) {
      return failure(
        deleting ? "activity_reference_delete_failed" : "activity_reference_update_failed",
        error?.message || (deleting
          ? "That activity could not be deleted. Nothing else was changed."
          : "That activity could not be updated. Nothing else was changed.")
      );
    }
  }

  function patchActionAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || adapter[ADAPTER_FLAG]) return Boolean(adapter?.[ADAPTER_FLAG]);
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") return false;

    const originalCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const originalExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function referenceAwareCreate(pendingAction = {}) {
      let result;
      if (isReferenceUndoAction(pendingAction)) {
        result = await createReferenceUndoPendingAction(pendingAction);
      } else if (isReferenceActivityAction(pendingAction)) {
        result = await createReferenceActivityPendingAction(pendingAction);
      } else {
        result = await originalCreate(pendingAction);
      }
      if (result?.success && result?.action) {
        rememberPending({ pendingAction });
      }
      return result;
    };

    adapter.executeConfirmed = async function referenceAwareExecute(input = {}) {
      const pendingAction = input?.vnextPendingAction || null;
      try {
        let execution;
        if (isReferenceUndoAction(pendingAction)) {
          execution = await executeReferenceUndo({ pendingAction, currentTurnId: input?.currentTurnId || null });
        } else if (isReferenceActivityAction(pendingAction)) {
          execution = await executeReferenceActivityMutation({ pendingAction, currentTurnId: input?.currentTurnId || null });
        } else {
          execution = await originalExecute(input);
        }
        if (execution?.success) {
          const reference = commit({ pendingAction, execution });
          return { ...execution, referenceLifecycle: reference };
        }
        fail({ pendingAction });
        return execution;
      } catch (error) {
        fail({ pendingAction });
        throw error;
      }
    };

    Object.defineProperty(adapter, ADAPTER_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });
    return true;
  }

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge || bridge[BRIDGE_FLAG]) return Boolean(bridge?.[BRIDGE_FLAG]);
    if (typeof bridge.ask !== "function" || typeof bridge.buildContext !== "function") return false;

    const originalAsk = bridge.ask.bind(bridge);
    const originalBuildContext = bridge.buildContext.bind(bridge);

    bridge.buildContext = async function referenceAwareContext(options = {}) {
      const context = await originalBuildContext(options);
      const referenceState = snapshot({ conversationId: options?.conversationId || null });
      if (!referenceState) return context;
      return { ...context, referenceState };
    };

    bridge.ask = async function referenceAwareAsk(message, options = {}) {
      const pendingBefore = bridge.getPendingAction?.() || null;
      const result = await originalAsk(message, options);
      if (result?.action?.type === "cancel_pending_action") {
        cancel({ pendingAction: result?.pendingAction || pendingBefore });
      }
      return result;
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });
    return true;
  }

  function patchCancelBoundary() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || CalBuddy[CANCEL_FLAG]) return Boolean(CalBuddy?.[CANCEL_FLAG]);
    if (typeof CalBuddy.cancelPendingAction !== "function") return false;

    const originalCancel = CalBuddy.cancelPendingAction.bind(CalBuddy);
    CalBuddy.cancelPendingAction = function referenceAwareCancel(...args) {
      const pending = window.AriVNextBridge?.getPendingAction?.() || null;
      const result = originalCancel(...args);
      cancel({ pendingAction: pending });
      return result;
    };

    Object.defineProperty(CalBuddy, CANCEL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });
    return true;
  }

  function install() {
    const adapterReady = patchActionAdapter();
    const bridgeReady = patchBridge();
    const cancelReady = patchCancelBoundary();
    return adapterReady && bridgeReady && cancelReady;
  }

  window.AriVNextReferenceState = Object.freeze({
    version: VERSION,
    source: "ari-vnext-reference-state",
    ready: true,
    rememberPending,
    commit,
    cancel,
    fail,
    snapshot,
    clear
  });

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 40);
  }

  window.dispatchEvent(new CustomEvent("ari:vnextReferenceStateReady", {
    detail: { version: VERSION }
  }));
})();