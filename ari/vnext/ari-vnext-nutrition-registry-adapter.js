// Permanent Nutrition registry adapter.
// Reuses mature resolution/reference identity, while persistence belongs to Nutrition services.

(() => {
  "use strict";

  const VERSION = "1.2.0";
  const SOURCE = "ari_vnext_nutrition_registry_adapter";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const PLAN_OPERATIONS = [
    "log_referenced_planned_meal",
    "log_referenced_plan_components",
    "discard_referenced_meal_plan",
    "replace_referenced_meal_plan"
  ];
  let servicePromise = null;
  let planServicePromise = null;
  let installed = false;

  function clean(value = "", max = 200) {
    return String(value ?? "").trim().slice(0, max);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeSlot(value = "") {
    const slot = clean(value, 40).toLowerCase();
    return ["breakfast", "lunch", "dinner", "snack"].includes(slot) ? slot : "";
  }

  function slotLabel(value = "") {
    const slot = normalizeSlot(value);
    return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/nutrition/nutrition-service.js?v=1.2.0")
        .then((module) => module.default || module.NutritionService);
    }
    return servicePromise;
  }

  function loadPlanService() {
    if (!planServicePromise) {
      planServicePromise = import("../../js/nutrition/nutrition-plan-service.js?v=1.0.0")
        .then((module) => module.default || module.NutritionPlanService);
    }
    return planServicePromise;
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

  function references() {
    return array(window.AriVNextReferenceState?.snapshot?.()?.references);
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

    const persisted = references().find((reference) => clean(reference?.referenceId, 180) === referenceId) || null;
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
      payload: { mutation_id: target.canonical.mutationId, reference_id: target.referenceId },
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
      const pointer = references().find((reference) => clean(reference?.referenceId, 180) === requested) || null;
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
    const planService = await loadPlanService();
    let resolvedPlan = null;
    const indexes = [];
    const items = [];
    for (const id of ids) {
      let match = null;
      for (const plan of plans) {
        const components = planService.normalizeItems(plan);
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

  async function resolvePlanOperation(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = pending?.arguments || {};
    if (name === "log_referenced_plan_components") {
      const resolved = await resolveComponents(args?.referenceIds);
      return resolved?.plan ? { ...resolved, type: "components" } : null;
    }
    const plan = await resolvePlanReference(args?.referenceId);
    return plan ? { plan, type: "plan" } : null;
  }

  async function createPlanPending(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = pending?.arguments || {};
    const resolved = await resolvePlanOperation(pending);
    if (!resolved?.plan) {
      const code = name === "log_referenced_plan_components" ? "meal_plan_component_reference_stale" : "meal_plan_reference_stale";
      return { success: false, code, message: "That Meal Plan reference is no longer current. Ask Ari to show today’s Meal Plan again." };
    }

    if (name === "log_referenced_plan_components") {
      return await storePending(pending, {
        action_type: name,
        payload: { reference_ids: array(args?.referenceIds).map((id) => clean(id, 180)).filter(Boolean), source: SOURCE },
        confirmation_text: `Log ${resolved.items.map((item) => item.name).join(", ")} from today’s ${slotLabel(resolved.plan.meal_slot).toLowerCase()} as eaten?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }

    if (name === "log_referenced_planned_meal") {
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Log ${resolved.plan.name || slotLabel(resolved.plan.meal_slot)} — about ${Math.round(Number(resolved.plan.calories) || 0)} kcal — as eaten?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }

    if (name === "discard_referenced_meal_plan") {
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Remove ${resolved.plan.name || slotLabel(resolved.plan.meal_slot)} from today’s ${slotLabel(resolved.plan.meal_slot).toLowerCase()} Meal Plan?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }

    if (name === "replace_referenced_meal_plan") {
      const planService = await loadPlanService();
      const replacement = planService.replacementFromArgs(args);
      if (!replacement) return { success: false, code: "meal_plan_replacement_invalid", message: "The replacement meal details are incomplete." };
      const budget = await planService.validateReplacementBudget(resolved.plan, replacement);
      if (!budget.valid) return { success: false, code: "meal_plan_replacement_budget_invalid", message: budget.message };
      return await storePending(pending, {
        action_type: name,
        payload: { reference_id: clean(args?.referenceId, 180), source: SOURCE },
        confirmation_text: `Replace ${resolved.plan.name || slotLabel(resolved.plan.meal_slot)} with ${replacement.name} — about ${replacement.calories} kcal — in today’s ${slotLabel(resolved.plan.meal_slot).toLowerCase()} Meal Plan?`
      }, { referenceBound: true, trustedRereadRequired: true });
    }

    return { success: false, code: "unsupported_meal_plan_reference_action", message: "That Meal Plan reference action is not supported." };
  }

  async function executePlan(input = {}) {
    const pending = pendingFrom(input);
    const name = clean(pending?.name, 120);
    const resolved = await resolvePlanOperation(pending);
    if (!resolved?.plan) {
      const code = name === "log_referenced_plan_components" ? "meal_plan_component_reference_stale" : "meal_plan_reference_stale";
      return { success: false, code, message: "That Meal Plan changed before execution. Ask Ari to show today’s Meal Plan again." };
    }
    const planService = await loadPlanService();
    if (name === "log_referenced_planned_meal") {
      return await planService.consumePlan({ action: pending, plan: resolved.plan, selectedIndexes: null });
    }
    if (name === "log_referenced_plan_components") {
      return await planService.consumePlan({ action: pending, plan: resolved.plan, selectedIndexes: resolved.indexes });
    }
    if (name === "discard_referenced_meal_plan") {
      return await planService.discardPlan(resolved.plan);
    }
    if (name === "replace_referenced_meal_plan") {
      return await planService.replacePlan({ plan: resolved.plan, replacement: pending?.arguments || {} });
    }
    return { success: false, code: "unsupported_meal_plan_reference_action", message: "That Meal Plan reference action is not supported." };
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

    for (const operation of PLAN_OPERATIONS) {
      registry.registerOperation(operation, {
        source: `${SOURCE}:meal-plan`,
        priority: 22000,
        match(input = {}) {
          return clean(pendingFrom(input)?.name, 120) === operation;
        },
        createPending: createPlanPending,
        executeConfirmed: executePlan
      });
    }

    installed = true;
    window.AriVNextNutritionRegistryAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      prepareMeal,
      createMealPending,
      executeMeal,
      createUndoPending,
      executeUndo,
      resolvePlanReference,
      resolveComponents,
      createPlanPending,
      executePlan
    });
    return true;
  }

  if (!install()) {
    window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
    window.addEventListener("ari:vnextNutritionResolutionReady", install, { once: true });
  }
})();
