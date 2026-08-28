// ARI vNext — Phase 9C compound-action confirmation/execution boundary.
//
// The server prepares one turn-bound `compound_action_batch` only after every
// sub-action passed its existing tool validator and independent reference gate.
// This browser capability adds one confirmation surface and delegates confirmed
// sub-actions back through the canonical Phase 8C operation registry.
//
// Before the first write, every reference-bound sub-action is rehydrated from
// current canonical app context. If any referenced object vanished or changed
// identity, the entire batch is rejected before mutation. A trusted lifecycle
// ref_action pointer may hand off to a fresh stable ref_live pointer only when
// both resolve to the same unique canonical identity. No second database,
// model call, or parallel executor is introduced here.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_phase9c_compound_actions";
  const INSTALL_FLAG = "__ariOperationRegistryPhase9C";
  const OPERATION = "compound_action_batch";
  const MAX_ACTIONS = 4;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const api = {
    version: VERSION,
    source: SOURCE,
    ready: false
  };
  window.AriVNextPhase9CCompoundActions = api;

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function normalizeActions(pending = {}) {
    const actions = array(pending?.arguments?.actions).slice(0, MAX_ACTIONS).map((raw, index) => ({
      index,
      name: clean(raw?.name, 120),
      toolName: clean(raw?.toolName, 160),
      arguments: object(raw?.arguments),
      clause: clean(raw?.clause, 700)
    }));
    if (actions.length < 2 || actions.length > MAX_ACTIONS) return [];
    if (actions.some((action) => !action.name || action.name === OPERATION || !action.clause)) return [];
    return actions;
  }

  function summaryLabel(name = "") {
    const labels = {
      log_meal: "log meal",
      log_planned_meal: "log planned meal",
      log_activity: "log activity",
      log_weight: "log weight",
      update_nutrition_meal: "edit meal",
      undo_nutrition_mutation: "undo meal",
      log_referenced_planned_meal: "log planned meal",
      log_referenced_plan_components: "log planned items",
      discard_referenced_meal_plan: "remove planned meal",
      replace_referenced_meal_plan: "replace planned meal",
      update_activity_log: "edit activity",
      delete_activity_log: "delete activity",
      update_weight_log: "correct weight",
      delete_weight_log: "delete weight",
      edit_referenced_workout: "edit workout",
      delete_workout: "delete workout"
    };
    return labels[name] || clean(name, 80).replaceAll("_", " ");
  }

  function confirmationText(actions = []) {
    const labels = actions.map((action) => summaryLabel(action.name));
    return `Apply these ${actions.length} changes together — ${labels.join(", ")}?`;
  }

  async function createStoredPending(pending = {}) {
    const actions = normalizeActions(pending);
    if (!actions.length) return failure("compound_batch_invalid", "Those requested changes could not be grouped safely.");
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare those changes safely.");
    }

    const stored = await window.CalBuddy.createPendingAction({
      action_type: OPERATION,
      payload: {
        count: actions.length,
        operations: actions.map((action) => action.name)
      },
      confirmation_text: confirmationText(actions)
    });
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return {
      success: true,
      action: wrapped,
      resolution: {
        compound: true,
        actionCount: actions.length,
        independentlyValidated: true,
        canonicalPreflightRequired: true
      }
    };
  }

  async function currentContextForClause(clause = "") {
    const bridge = window.AriVNextBridge;
    if (typeof bridge?.buildContext !== "function") return null;
    let userContext = {};
    try {
      if (typeof window.CalBuddy?.getUserContext === "function") {
        userContext = (await window.CalBuddy.getUserContext()) || {};
      }
    } catch {
      userContext = {};
    }
    try {
      return await bridge.buildContext({
        userContext,
        message: clause,
        history: [],
        page: window.location?.pathname || "compound_confirmation"
      });
    } catch {
      return null;
    }
  }

  function authoritativeReference(reference = null) {
    if (!reference || clean(reference?.state, 40) !== "persisted") return false;
    const verification = object(reference?.verification);
    return verification?.verifiedByTrustedExecutor === true ||
      (verification?.verifiedByTrustedContext === true && verification?.currentContextRead === true);
  }

  function canonicalIdentity(reference = null) {
    if (!reference || typeof reference !== "object") return "";
    const canonical = object(reference?.canonical);
    const domain = clean(reference?.domain, 40).toLowerCase();
    const entityType = clean(reference?.entityType, 60).toLowerCase();
    const identity = clean(
      canonical?.id ??
      canonical?.mealId ??
      canonical?.activityId ??
      canonical?.logDate ??
      canonical?.date ??
      canonical?.planId ??
      canonical?.crewId ??
      canonical?.meetupId ??
      canonical?.missionId ??
      canonical?.candidateKey,
      220
    );
    return domain && entityType && identity ? `${domain}|${entityType}|${identity}` : "";
  }

  function lifecycleReference(referenceId = "") {
    const requested = clean(referenceId, 180);
    if (!requested) return null;
    try {
      const direct = window.AriVNextReferenceState?.resolveReference?.(requested);
      if (direct) return direct;
    } catch {}
    try {
      return array(window.AriVNextReferenceState?.snapshot?.()?.references)
        .find((reference) => clean(reference?.referenceId, 180) === requested) || null;
    } catch {
      return null;
    }
  }

  function freshReferenceMatches(referenceId = "", references = []) {
    const requested = clean(referenceId, 180);
    const current = array(references).filter((reference) =>
      clean(reference?.referenceId, 180) === requested && authoritativeReference(reference)
    );
    if (current.length) return current;

    // After refresh/relaunch a trusted executor pointer can be replaced by a
    // stable rehydrated pointer. The old opaque reference is accepted only as a
    // lookup key; current canonical context must still contain exactly one item
    // with the same domain/entity/identity before execution may proceed.
    const lifecycle = lifecycleReference(requested);
    const verification = object(lifecycle?.verification);
    if (!lifecycle || clean(lifecycle?.state, 40) !== "persisted" || verification?.verifiedByTrustedExecutor !== true) return [];
    const identity = canonicalIdentity(lifecycle);
    if (!identity) return [];
    return array(references).filter((reference) =>
      authoritativeReference(reference) && canonicalIdentity(reference) === identity
    );
  }

  function requestedReferenceIds(action = {}) {
    const args = object(action?.arguments);
    const ids = [];
    const one = clean(args?.referenceId, 180);
    if (one) ids.push(one);
    for (const value of array(args?.referenceIds)) {
      const id = clean(value, 180);
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }

  async function preflightAction(action = {}) {
    const referenceIds = requestedReferenceIds(action);
    if (!referenceIds.length) return { success: true, references: [] };

    const context = await currentContextForClause(action.clause);
    const references = array(context?.referenceState?.references);
    if (!context) {
      return failure("compound_context_preflight_unavailable", "Ari could not re-read the current app state before applying those changes.");
    }

    const resolved = [];
    for (const referenceId of referenceIds) {
      const matches = freshReferenceMatches(referenceId, references);
      if (matches.length !== 1) {
        return failure(
          matches.length > 1 ? "compound_reference_ambiguous" : "compound_reference_stale",
          matches.length > 1
            ? "One requested target is no longer unambiguous. Nothing was changed."
            : "One requested item is no longer available in the current app state. Nothing was changed.",
          { referenceId }
        );
      }
      resolved.push({ requestedReferenceId: referenceId, currentReferenceId: clean(matches[0]?.referenceId, 180) });
    }
    return { success: true, references: resolved };
  }

  async function preflightBatch(actions = []) {
    const registryNames = new Set(array(window.AriVNextOperationRegistry?.snapshot?.()?.operationNames));
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      if (!registryNames.has(action.name)) {
        return failure("compound_operation_unregistered", "One requested change is not available in Ari's trusted operation registry.", { failedIndex: index, operation: action.name });
      }
      const checked = await preflightAction(action);
      if (!checked?.success) return { ...checked, failedIndex: index, operation: action.name };
    }
    return { success: true };
  }

  function subPending(batch = {}, action = {}, index = 0) {
    return {
      id: `${clean(batch?.id, 180)}:sub:${index + 1}`,
      sourceTurnId: clean(batch?.sourceTurnId, 200),
      name: action.name,
      arguments: action.arguments,
      confirmationRequired: true,
      createdAt: batch?.createdAt || new Date().toISOString(),
      expiresAt: batch?.expiresAt || null,
      phase9cBatchId: clean(batch?.id, 180),
      phase9cSubactionIndex: index
    };
  }

  function clearOuterPending(batch = {}) {
    const id = clean(batch?.id, 220);
    if (!id) return;
    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === id) window.AriVNextBridge?.clearPendingAction?.();
    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === id) window.CalBuddy?.clearPendingAction?.();
  }

  async function executeBatch(input = {}) {
    const batch = input?.vnextPendingAction || null;
    const actions = normalizeActions(batch);
    if (!batch?.id || !batch?.sourceTurnId || !actions.length) {
      return failure("compound_batch_invalid", "Those requested changes are no longer a valid confirmed batch.");
    }
    if (batch?.expiresAt && Date.parse(batch.expiresAt) <= Date.now()) {
      return failure("vnext_action_expired", "That group of changes expired. Ask Ari to prepare it again.");
    }

    const preflight = await preflightBatch(actions);
    if (!preflight?.success) return preflight;

    const adapter = window.AriVNextActionAdapter;
    if (typeof adapter?.executeConfirmed !== "function") {
      return failure("compound_executor_unavailable", "Ari's trusted action executor is unavailable.");
    }

    const results = [];
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      const execution = await adapter.executeConfirmed({
        vnextPendingAction: subPending(batch, action, index),
        currentTurnId: input?.currentTurnId || null
      });
      results.push({
        index,
        operation: action.name,
        success: execution?.success === true,
        code: clean(execution?.code, 120) || null,
        reply: clean(execution?.reply || execution?.result?.reply, 500) || null
      });

      if (execution?.success !== true) {
        const completedCount = results.filter((item) => item.success).length;
        if (completedCount > 0) {
          // Never leave a partially completed batch retryable: re-confirming it
          // could duplicate earlier successful sub-actions.
          clearOuterPending(batch);
        }
        return failure(
          completedCount > 0 ? "compound_partial_execution" : (clean(execution?.code, 120) || "compound_subaction_failed"),
          completedCount > 0
            ? `${completedCount} of ${actions.length} changes completed before a later change failed. The batch was closed so completed changes cannot be repeated accidentally.`
            : (execution?.message || "None of the grouped changes were completed."),
          {
            failedIndex: index,
            completedCount,
            totalCount: actions.length,
            retryable: completedCount === 0,
            results
          }
        );
      }
    }

    return {
      success: true,
      result: {
        reply: `${actions.length} requested changes completed.`,
        compound: true,
        completedCount: actions.length,
        results
      },
      reply: `${actions.length} requested changes completed.`,
      compound: true,
      completedCount: actions.length,
      results
    };
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (registry?.ready !== true || typeof registry?.registerOperation !== "function") return false;
    if (registry[INSTALL_FLAG]) {
      api.ready = true;
      return true;
    }

    registry.registerOperation(OPERATION, {
      source: SOURCE,
      priority: 2000,
      async createPending(pending = {}) {
        return await createStoredPending(pending);
      },
      async executeConfirmed(input = {}) {
        return await executeBatch(input);
      }
    });

    try {
      Object.defineProperty(registry, INSTALL_FLAG, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: VERSION
      });
    } catch {}

    api.ready = true;
    try {
      window.dispatchEvent(new CustomEvent("ari:vnextPhase9CCompoundActionsReady", {
        detail: { version: VERSION, source: SOURCE }
      }));
    } catch {}
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();
