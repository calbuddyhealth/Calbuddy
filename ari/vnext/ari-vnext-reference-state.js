// ARI vNext — bounded browser-side reference lifecycle state.
//
// This is a pointer layer, not another application database. It remembers a
// small set of recent Ari action targets so later turns can resolve words such
// as "that" or "it" to the canonical object that the trusted app executor
// actually created or changed.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STORAGE_PREFIX = "ari_vnext_reference_state_v1";
  const MAX_REFERENCES = 8;
  const MAX_AGE_MS = 6 * 60 * 60 * 1000;

  function clean(value = "", max = 180) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
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

  function read(conversationId = null) {
    try {
      const raw = sessionStorage.getItem(storageKey(conversationId));
      if (!raw) return { version: VERSION, references: [] };
      const parsed = JSON.parse(raw);
      const references = Array.isArray(parsed?.references) ? parsed.references : [];
      return { version: VERSION, references: prune(references) };
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

  function prune(references = []) {
    const now = Date.now();
    return references
      .filter((reference) => {
        if (!reference || typeof reference !== "object") return false;
        if (["cancelled", "failed", "expired"].includes(clean(reference.state, 40))) return false;
        const updatedAt = Date.parse(clean(reference.updatedAt, 80));
        return !Number.isFinite(updatedAt) || now - updatedAt <= MAX_AGE_MS;
      })
      .sort((left, right) => Date.parse(right?.updatedAt || 0) - Date.parse(left?.updatedAt || 0))
      .slice(0, MAX_REFERENCES)
      .map(compactReference);
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
    if (/meal_plan|planned_meal/.test(action)) return "meal_plan_item";
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
      "dateText", "activityName", "durationMinutes", "goalType", "value", "focus", "operation", "exercise",
      "replacementExercise", "slot", "mealSlot", "title"
    ];
    const details = {};
    for (const key of allowed) {
      const value = args[key];
      if (value === null || value === undefined || value === "") continue;
      if (typeof value === "number" && Number.isFinite(value)) details[key] = value;
      else if (typeof value === "string") details[key] = clean(value, 180);
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
    if (/meal_plan|planned_meal/.test(name)) return clean(args.title || args.name || args.mealSlot || args.slot, 220) || "Meal Plan item";
    return clean(args.title || args.name || args.label, 220) || name.replaceAll("_", " ") || "Recent Ari action";
  }

  function makeReferenceId(pending = {}) {
    const actionId = clean(pending?.id, 200);
    return actionId ? `ref_action_${hash(actionId)}` : `ref_action_${Date.now().toString(36)}`;
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
    if (!pendingAction?.id || !pendingAction?.name) return null;
    return upsert(pendingReference(pendingAction), conversationId);
  }

  function commit({ pendingAction, execution, conversationId = null } = {}) {
    if (!pendingAction?.id || execution?.success === false) return null;
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

  window.AriVNextReferenceState = Object.freeze({
    version: VERSION,
    source: "ari-vnext-reference-state",
    rememberPending,
    commit,
    cancel,
    fail,
    snapshot,
    clear
  });

  window.dispatchEvent(new CustomEvent("ari:vnextReferenceStateReady", {
    detail: { version: VERSION }
  }));
})();
