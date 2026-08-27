// ARI vNext — trusted structured-reference capabilities.
//
// Purpose:
// - Turn current Meal Plan and ARI Circle objects into bounded conversational
//   pointers without creating a second database.
// - Re-read canonical Meal Plan state at confirmation/execution time.
// - Keep current-turn authorization separate from reference resolution.
// - Use the existing user-scoped Meal Plan sync RPCs and atomic
//   ari_consume_nutrition_plan transaction for writes.
// - Hydrate Circle Action Network only for a reference follow-up whose recent
//   conversation already establishes Circle context.

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_structured_reference_capabilities";
  const BRIDGE_FLAG = "__ariStructuredReferenceContextV1";
  const ADAPTER_FLAG = "__ariStructuredReferenceActionsV1";
  const PLAN_MUTATION_PREFIX = "ari_vnext_plan_mutation_v1:";
  const MAX_STRUCTURED_REFERENCES = 16;
  const CIRCLE_CACHE_MS = 15 * 1000;
  const PLAN_ACTIONS = new Set([
    "log_referenced_planned_meal",
    "log_referenced_plan_components",
    "discard_referenced_meal_plan",
    "replace_referenced_meal_plan"
  ]);

  let circleCache = null;
  let circleCacheAt = 0;
  let circleCacheToken = null;

  function clean(value = "", max = 1000) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    return Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
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

  function planReferenceId(plan = {}) {
    const id = clean(plan?.id ?? plan?.cloud_id ?? plan?.cloudId, 180);
    return id ? `ref_ctx_meal_plan_${hashText(id)}` : "";
  }

  function componentReferenceId(plan = {}, item = {}, index = 0) {
    const planId = clean(plan?.id ?? plan?.cloud_id ?? plan?.cloudId, 180);
    if (!planId) return "";
    const componentIdentity = clean(item?.id, 160) || clean(item?.name, 180) || `component-${index}`;
    return `ref_ctx_meal_component_${hashText(`${planId}|${index}|${componentIdentity}`)}`;
  }

  function circleReferenceId(type = "", id = "") {
    const kind = clean(type, 40).toLowerCase();
    const canonicalId = clean(id, 180);
    return kind && canonicalId ? `ref_ctx_circle_${kind}_${hashText(`${kind}|${canonicalId}`)}` : "";
  }

  function normalizeSlot(value = "") {
    const text = clean(value, 40).toLowerCase();
    if (text === "breakfast") return "breakfast";
    if (text === "lunch") return "lunch";
    if (text === "dinner") return "dinner";
    if (text === "snack") return "snack";
    return "";
  }

  function slotLabel(value = "") {
    const slot = normalizeSlot(value);
    return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
  }

  function normalizeItems(plan = {}) {
    const source = array(plan?.items);
    if (source.length) {
      return source
        .slice(0, 16)
        .map((item, index) => {
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
        })
        .filter(Boolean);
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

  function referenceLike(message = "") {
    const text = clean(message, 600);
    if (!text || text.length > 260) return false;
    return /\b(?:it|its|them|they|that|this|those|these|the\s+(?:first|second|third)\s+(?:one|item|meal|option|meetup|mission|crew)|(?:first|second|third)\s+(?:one|item|meal|option|meetup|mission|crew)|the other one|same one|previous one|last one)\b/i.test(text);
  }

  function recentSemantic(message = "", history = []) {
    const recent = array(history).slice(-8).map((item) => clean(item?.content, 500)).join("\n");
    return `${recent}\n${clean(message, 800)}`;
  }

  function recentEstablishesCircle(message = "", history = []) {
    if (!referenceLike(message)) return false;
    const recent = array(history).slice(-8).map((item) => clean(item?.content, 500)).join("\n");
    return /\b(?:ari\s+circle|circle|meet[ -]?ups?|missions?|crews?|join request|waitlist|host|opportunit(?:y|ies)|activity partner|workout partner)\b/i.test(recent);
  }

  function preferredDomain(message = "", history = []) {
    const semantic = recentSemantic(message, history);
    if (/\b(?:meal plan|planned meal|breakfast|lunch|dinner|snack|food|calorie|nutrition|protein|carbs?|fat)\b/i.test(semantic)) return "nutrition";
    if (/\b(?:ari\s+circle|circle|meet[ -]?ups?|missions?|crews?|join request|waitlist|host|opportunit(?:y|ies))\b/i.test(semantic)) return "social";
    return "general";
  }

  function structuredPlanReferences(context = {}) {
    const active = array(context?.nutrition?.mealPlan?.active);
    const references = [];

    active.slice(0, 6).forEach((plan, planIndex) => {
      const referenceId = planReferenceId(plan);
      const id = clean(plan?.id, 180);
      if (!referenceId || !id) return;
      const slot = normalizeSlot(plan?.meal_slot ?? plan?.mealSlot);
      const name = clean(plan?.name, 180) || `${slotLabel(slot)} plan`;
      const items = normalizeItems(plan);

      references.push({
        referenceId,
        actionName: "current_meal_plan",
        domain: "nutrition",
        entityType: "meal_plan_item",
        label: `${slotLabel(slot)} · ${name}`,
        state: "persisted",
        canonical: {
          id,
          planId: id,
          planDate: clean(plan?.plan_date, 40),
          mealSlot: slot
        },
        details: {
          ordinal: planIndex + 1,
          collection: "today_meal_plan",
          name,
          calories: Math.max(0, Math.round(finite(plan?.calories) ?? 0)),
          proteinG: round1(plan?.protein_g),
          carbsG: round1(plan?.carbs_g),
          fatG: round1(plan?.fat_g),
          componentCount: items.length
        },
        verification: {
          verifiedByTrustedContext: true,
          currentContextRead: true
        },
        updatedAt: new Date().toISOString()
      });

      if (items.length <= 1 && items[0]?.id === "whole-meal") return;
      items.slice(0, 10).forEach((item, itemIndex) => {
        const componentRef = componentReferenceId(plan, item, itemIndex);
        if (!componentRef) return;
        references.push({
          referenceId: componentRef,
          actionName: "current_meal_plan_component",
          domain: "nutrition",
          entityType: "meal_plan_component",
          label: `${slotLabel(slot)} item ${itemIndex + 1} · ${item.name}`,
          state: "persisted",
          canonical: {
            id: componentRef,
            planId: id,
            componentIndex: itemIndex,
            componentId: clean(item?.id, 160) || null
          },
          details: {
            ordinal: itemIndex + 1,
            collection: `meal_plan_components:${referenceId}`,
            planReferenceId: referenceId,
            name: item.name,
            amount: item.amount,
            calories: item.calories,
            proteinG: item.protein_g,
            carbsG: item.carbs_g,
            fatG: item.fat_g
          },
          verification: {
            verifiedByTrustedContext: true,
            currentContextRead: true
          },
          updatedAt: new Date().toISOString()
        });
      });
    });

    return references;
  }

  function structuredCircleReferences(context = {}) {
    const network = object(context?.social?.actionNetwork);
    if (network?.available !== true) return [];

    const references = [];
    const seen = new Set();
    const best = array(network?.bestMatches);
    const opportunitySource = best.length ? best : array(network?.opportunities);

    opportunitySource.slice(0, 8).forEach((item, index) => {
      const type = clean(item?.type, 40).toLowerCase();
      const id = clean(item?.id, 180);
      if (!id || !["meetup", "mission"].includes(type)) return;
      const key = `${type}:${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const referenceId = circleReferenceId(type, id);
      references.push({
        referenceId,
        actionName: `current_circle_${type}`,
        domain: "social",
        entityType: type,
        label: clean(item?.title, 180) || `${type} ${index + 1}`,
        state: "persisted",
        canonical: {
          id,
          ...(type === "meetup" ? { meetupId: id } : { missionId: id })
        },
        details: {
          ordinal: index + 1,
          collection: best.length ? "circle_best_matches" : "circle_opportunities",
          title: clean(item?.title, 180),
          activity: clean(item?.activity, 100),
          area: clean(item?.area, 140),
          startsAt: clean(item?.startsAt, 80),
          viewerState: clean(item?.viewerState, 40),
          spotsRemaining: finite(item?.spotsRemaining)
        },
        verification: {
          verifiedByTrustedContext: true,
          currentContextRead: true
        },
        updatedAt: new Date().toISOString()
      });
    });

    array(network?.schedule).slice(0, 6).forEach((item) => {
      const type = clean(item?.type, 40).toLowerCase();
      const id = clean(item?.id, 180);
      const key = `${type}:${id}`;
      if (!id || !["meetup", "mission"].includes(type) || seen.has(key)) return;
      seen.add(key);
      references.push({
        referenceId: circleReferenceId(type, id),
        actionName: `current_circle_${type}`,
        domain: "social",
        entityType: type,
        label: clean(item?.title, 180) || type,
        state: "persisted",
        canonical: {
          id,
          ...(type === "meetup" ? { meetupId: id } : { missionId: id })
        },
        details: {
          collection: "circle_schedule",
          title: clean(item?.title, 180),
          activity: clean(item?.activity, 100),
          startsAt: clean(item?.startsAt, 80),
          viewerState: clean(item?.viewerState, 40)
        },
        verification: { verifiedByTrustedContext: true, currentContextRead: true },
        updatedAt: new Date().toISOString()
      });
    });

    array(network?.crews).slice(0, 6).forEach((crew, index) => {
      const crewId = clean(crew?.crewId, 180);
      if (!crewId) return;
      references.push({
        referenceId: circleReferenceId("crew", crewId),
        actionName: "current_circle_crew",
        domain: "social",
        entityType: "crew",
        label: clean(crew?.name, 120) || `Crew ${index + 1}`,
        state: "persisted",
        canonical: { id: crewId, crewId },
        details: {
          ordinal: index + 1,
          collection: "circle_crews",
          name: clean(crew?.name, 120),
          status: clean(crew?.status, 40),
          viewerRole: clean(crew?.viewerRole, 40),
          viewerStatus: clean(crew?.viewerStatus, 40)
        },
        verification: { verifiedByTrustedContext: true, currentContextRead: true },
        updatedAt: new Date().toISOString()
      });
    });

    array(network?.crewCandidates).slice(0, 4).forEach((candidate, index) => {
      const candidateKey = clean(candidate?.candidateKey, 80);
      if (!candidateKey) return;
      references.push({
        referenceId: circleReferenceId("crew_candidate", candidateKey),
        actionName: "current_circle_crew_candidate",
        domain: "social",
        entityType: "crew_candidate",
        label: `${clean(candidate?.topActivity, 100) || "Repeated activity"} group`,
        state: "persisted",
        canonical: { id: candidateKey, candidateKey },
        details: {
          ordinal: index + 1,
          collection: "circle_crew_candidates",
          completedTogether: finite(candidate?.completedTogether),
          memberCount: finite(candidate?.memberCount),
          topActivity: clean(candidate?.topActivity, 100)
        },
        verification: { verifiedByTrustedContext: true, currentContextRead: true },
        updatedAt: new Date().toISOString()
      });
    });

    return references;
  }

  function identityKey(reference = {}) {
    const canonical = object(reference?.canonical);
    const domain = clean(reference?.domain, 40);
    const entityType = clean(reference?.entityType, 60);
    const id = clean(canonical?.id ?? canonical?.planId ?? canonical?.crewId ?? canonical?.candidateKey, 180);
    if (id) return `${domain}:${entityType}:${id}`;
    return clean(reference?.referenceId, 180);
  }

  function mergeReferences(existing = [], structured = [], domain = "general") {
    const planRefs = structured.filter((item) => item?.domain === "nutrition");
    const circleRefs = structured.filter((item) => item?.domain === "social");
    const sessionRefs = array(existing);
    const ordered = domain === "nutrition"
      ? [...planRefs, ...sessionRefs, ...circleRefs]
      : domain === "social"
        ? [...circleRefs, ...sessionRefs, ...planRefs]
        : [...sessionRefs, ...planRefs, ...circleRefs];

    const seenReferences = new Set();
    const seenIdentity = new Set();
    const output = [];
    for (const reference of ordered) {
      const referenceId = clean(reference?.referenceId, 180);
      if (!referenceId || seenReferences.has(referenceId)) continue;
      const identity = identityKey(reference);
      if (identity && seenIdentity.has(identity)) continue;
      seenReferences.add(referenceId);
      if (identity) seenIdentity.add(identity);
      output.push(reference);
      if (output.length >= MAX_STRUCTURED_REFERENCES) break;
    }
    return output;
  }

  async function hydrateCircleForReference(message = "", options = {}) {
    if (!recentEstablishesCircle(message, options?.history)) return options;
    const current = options?.userContext?.social?.actionNetwork;
    if (current?.available === true) return options;

    const bridge = window.AriVNextBridge;
    const session = await bridge?.getSession?.();
    const token = clean(session?.access_token, 7000);
    if (!token) return options;

    let network = null;
    if (circleCache && circleCacheToken === token && Date.now() - circleCacheAt < CIRCLE_CACHE_MS) {
      network = circleCache;
    } else {
      try {
        const response = await fetch("/api/ari-vnext-circle-context", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: "{}",
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.available === true) {
          network = data;
          circleCache = data;
          circleCacheAt = Date.now();
          circleCacheToken = token;
        }
      } catch (error) {
        console.warn("[Ari vNext] Reference Circle context hydration skipped:", error?.message || error);
      }
    }

    if (!network?.available) return options;
    const userContext = object(options?.userContext);
    const social = object(userContext?.social);
    return {
      ...options,
      userContext: {
        ...userContext,
        social: { ...social, actionNetwork: network }
      }
    };
  }

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge) return false;
    if (bridge[BRIDGE_FLAG]) return true;
    if (typeof bridge.buildContext !== "function" || typeof bridge.ask !== "function") return false;

    const originalBuildContext = bridge.buildContext.bind(bridge);
    const originalAsk = bridge.ask.bind(bridge);

    bridge.buildContext = async function structuredReferenceBuildContext(options = {}) {
      const context = await originalBuildContext(options);
      const structured = [
        ...structuredPlanReferences(context),
        ...structuredCircleReferences(context)
      ];
      if (!structured.length) return context;

      const previousState = object(context?.referenceState);
      const references = mergeReferences(
        previousState?.references,
        structured,
        preferredDomain(options?.message, options?.history)
      );

      return {
        ...context,
        referenceState: {
          ...previousState,
          version: previousState?.version || "structured-context-v1",
          source: "session_and_current_trusted_context",
          structuredContextVersion: VERSION,
          references
        }
      };
    };

    bridge.ask = async function structuredReferenceAwareAsk(message, options = {}) {
      const nextOptions = await hydrateCircleForReference(message, options);
      return await originalAsk(message, nextOptions);
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    return true;
  }

  async function activePlans() {
    const sync = window.AriNutritionPlanSync;
    if (!sync || typeof sync.loadToday !== "function") {
      throw new Error("Today’s trusted Meal Plan service is not ready yet.");
    }
    const plans = await sync.loadToday();
    return array(plans).filter((plan) => clean(plan?.status || "planned", 40).toLowerCase() === "planned");
  }

  async function resolvePlanReference(referenceId = "") {
    const requested = clean(referenceId, 180);
    if (!requested) return null;
    const plans = await activePlans();

    if (requested.startsWith("ref_ctx_meal_plan_")) {
      return plans.find((plan) => planReferenceId(plan) === requested) || null;
    }

    if (/^ref_action_[a-z0-9]+$/i.test(requested)) {
      const snapshot = window.AriVNextReferenceState?.snapshot?.();
      const pointer = array(snapshot?.references).find((reference) => reference?.referenceId === requested);
      const canonicalId = clean(pointer?.canonical?.id ?? pointer?.canonical?.planId, 180);
      if (!canonicalId || clean(pointer?.entityType, 60) !== "meal_plan_item") return null;
      return plans.find((plan) => clean(plan?.id, 180) === canonicalId) || null;
    }

    return null;
  }

  async function resolveComponentReferences(referenceIds = []) {
    const requested = Array.from(new Set(array(referenceIds).map((value) => clean(value, 180)).filter(Boolean)));
    if (!requested.length) return null;
    const plans = await activePlans();
    let resolvedPlan = null;
    const indexes = [];
    const items = [];

    for (const referenceId of requested) {
      if (!referenceId.startsWith("ref_ctx_meal_component_")) return null;
      let match = null;
      for (const plan of plans) {
        const components = normalizeItems(plan);
        for (let index = 0; index < components.length; index += 1) {
          if (componentReferenceId(plan, components[index], index) === referenceId) {
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
    if (!replacement) return { valid: false, message: "The replacement meal details are incomplete." };
    try {
      const context = await window.CalBuddy?.getUserContext?.();
      const dailyGoal = finite(context?.dailyGoal);
      const consumed = Math.max(0, finite(context?.caloriesConsumed) ?? 0);
      const planned = Math.max(0, finite(context?.plannedCalories) ?? 0);
      if (dailyGoal === null || dailyGoal <= 0) return { valid: true };
      const allowance = Math.max(0, dailyGoal - consumed);
      const nextPlanned = Math.max(0, planned - Math.max(0, finite(plan?.calories) ?? 0) + replacement.calories);
      const tolerance = Math.max(100, Math.round(allowance * 0.1));
      if (nextPlanned > allowance + tolerance) {
        return {
          valid: false,
          message: "That replacement would put today’s active Meal Plan above the saved calories remaining, so Ari will not replace it as-is."
        };
      }
    } catch {
      // Failure to read budget context must not invent a budget. Canonical plan
      // identity and nutrition ranges are still revalidated before the write.
    }
    return { valid: true };
  }

  function makeUuid() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch {}
    const bytes = new Uint8Array(16);
    try {
      globalThis.crypto?.getRandomValues?.(bytes);
    } catch {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function mutationIdFor(pending = {}) {
    const pendingId = clean(pending?.id, 180);
    const key = `${PLAN_MUTATION_PREFIX}${pendingId || hashText(JSON.stringify(pending || {}))}`;
    try {
      const existing = clean(sessionStorage.getItem(key), 80);
      if (/^[0-9a-f-]{36}$/i.test(existing)) return existing;
      const next = makeUuid();
      sessionStorage.setItem(key, next);
      return next;
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
    const consumedNames = consumedItems.map((item) => clean(item?.name, 180)).filter(Boolean);
    const consumed = {
      name: consumedNames.length <= 3 ? consumedNames.join(" + ") : `${clean(plan?.name, 180) || slotLabel(plan?.meal_slot)} · selected items`,
      calories: Math.max(1, Math.round(consumedTotals.calories)),
      category: slotLabel(plan?.meal_slot),
      protein_g: round1(consumedTotals.protein_g),
      carbs_g: round1(consumedTotals.carbs_g),
      fat_g: round1(consumedTotals.fat_g),
      serving_size: "Selected from today’s Meal Plan"
    };

    if (!remainingItems.length) return { consumed, remaining: null, selectedNames: consumedNames };
    const remainingTotals = sumItems(remainingItems);
    const remainingNames = remainingItems.map((item) => clean(item?.name, 180)).filter(Boolean);
    const remaining = {
      name: remainingNames.length <= 3 ? remainingNames.join(" + ") : `${slotLabel(plan?.meal_slot)} remaining items`,
      calories: Math.round(remainingTotals.calories),
      protein_g: round1(remainingTotals.protein_g),
      carbs_g: round1(remainingTotals.carbs_g),
      fat_g: round1(remainingTotals.fat_g),
      serving_size: "Remaining planned items",
      items: remainingItems
    };
    return { consumed, remaining, selectedNames: consumedNames };
  }

  async function refreshNutritionState(action, detail = {}) {
    try { await window.AriNutritionPage?.refresh?.(); } catch {}
    try { await window.CalBuddy?.getConsumedCalories?.(); } catch {}
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: { action, source: SOURCE, version: VERSION, ...detail }
    }));
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: { action, source: SOURCE, version: VERSION, ...detail }
    }));
  }

  function commitConsumedMealReference(pending, plan, consumed, data = {}) {
    const state = window.AriVNextReferenceState;
    if (!state?.rememberPending || !state?.commit || !data?.mealId || !data?.mutationId) return;
    const synthetic = {
      id: `plan_consumed_${clean(pending?.id, 120) || hashText(data.mutationId)}`,
      name: "log_meal",
      sourceTurnId: clean(pending?.sourceTurnId, 180) || clean(pending?.id, 180) || "plan-consume",
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
    try {
      state.rememberPending(synthetic);
      state.commit({
        pendingAction: synthetic,
        execution: {
          success: true,
          result: {
            meal: {
              id: data.mealId,
              name: consumed.name,
              calories: consumed.calories,
              category: consumed.category,
              serving_size: consumed.serving_size,
              protein_g: consumed.protein_g,
              carbs_g: consumed.carbs_g,
              fat_g: consumed.fat_g,
              nutrition_date: clean(plan?.plan_date, 40)
            },
            mutationId: data.mutationId,
            nutritionDate: clean(plan?.plan_date, 40)
          }
        }
      });
    } catch (error) {
      console.warn("[Ari vNext] Consumed Meal Plan reference binding skipped:", error?.message || error);
    }
  }

  async function executePlanConsumption(pending, plan, selectedIndexes = null) {
    const client = window.calbuddySupabase;
    if (!client?.rpc || !plan?.id) {
      return { success: false, code: "meal_plan_transaction_unavailable", message: "The trusted Meal Plan transaction service is not ready yet." };
    }
    const built = consumedFromPlan(plan, selectedIndexes);
    if (!built?.consumed) return { success: false, code: "meal_plan_component_reference_stale", message: "Those planned items changed before confirmation. Ask Ari to show the current Meal Plan again." };

    const mutationId = mutationIdFor(pending);
    const { data, error } = await client.rpc("ari_consume_nutrition_plan", {
      p_plan_id: plan.id,
      p_mutation_id: mutationId,
      p_consumed: built.consumed,
      p_remaining: built.remaining
    });
    if (error) return { success: false, code: "meal_plan_transaction_failed", message: error.message || "That planned meal could not be logged. Nothing was changed." };

    await refreshNutritionState(built.remaining ? "referenced_plan_partially_eaten" : "referenced_plan_eaten", {
      planId: clean(plan.id, 180),
      mutationId: clean(data?.mutationId || mutationId, 80)
    });
    commitConsumedMealReference(pending, plan, built.consumed, data || {});

    return {
      success: true,
      result: {
        ...(data || {}),
        meal: {
          id: data?.mealId || null,
          ...built.consumed,
          nutrition_date: clean(plan?.plan_date, 40)
        },
        mutationId: data?.mutationId || mutationId,
        nutritionDate: clean(plan?.plan_date, 40)
      },
      reply: built.remaining
        ? `${built.selectedNames.join(", ")} logged. The remaining planned items are still in today’s Meal Plan.`
        : `${built.consumed.name} is logged as eaten.`
    };
  }

  async function executeDiscard(pending) {
    const plan = await resolvePlanReference(pending?.arguments?.referenceId);
    if (!plan) return { success: false, code: "meal_plan_reference_stale", message: "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again." };
    const sync = window.AriNutritionPlanSync;
    const updatedAt = new Date().toISOString();
    await sync.pushRecords([{ ...plan, cloud_id: plan.id, status: "skipped", updated_at: updatedAt }]);
    const current = await sync.loadToday();
    if (array(current).some((item) => clean(item?.id, 180) === clean(plan?.id, 180))) {
      return { success: false, code: "meal_plan_discard_not_verified", message: "That planned meal did not leave the active Meal Plan, so Ari did not report it as discarded." };
    }
    await refreshNutritionState("referenced_plan_discarded", { planId: clean(plan.id, 180) });
    return { success: true, result: { planId: plan.id, status: "skipped" }, reply: `${plan.name || slotLabel(plan.meal_slot)} removed from today’s Meal Plan.` };
  }

  async function executeReplace(pending) {
    const plan = await resolvePlanReference(pending?.arguments?.referenceId);
    if (!plan) return { success: false, code: "meal_plan_reference_stale", message: "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again." };
    const replacement = replacementFromArgs(pending?.arguments);
    if (!replacement) return { success: false, code: "meal_plan_replacement_invalid", message: "The replacement meal details are incomplete or outside supported nutrition ranges." };
    const budget = await validateReplacementBudget(plan, replacement);
    if (!budget.valid) return { success: false, code: "meal_plan_replacement_budget_invalid", message: budget.message };

    const sync = window.AriNutritionPlanSync;
    const record = {
      ...plan,
      ...replacement,
      cloud_id: plan.id,
      meal_slot: normalizeSlot(plan?.meal_slot),
      plan_date: clean(plan?.plan_date, 40),
      status: "planned",
      items: [{
        id: "whole-meal",
        name: replacement.name,
        amount: replacement.serving_size,
        calories: replacement.calories,
        protein_g: replacement.protein_g,
        carbs_g: replacement.carbs_g,
        fat_g: replacement.fat_g
      }],
      updated_at: new Date().toISOString()
    };
    await sync.pushRecords([record]);
    const current = await sync.loadToday();
    const verified = array(current).find((item) => clean(item?.id, 180) === clean(plan?.id, 180));
    if (!verified || clean(verified?.name, 180) !== replacement.name || Math.round(finite(verified?.calories) ?? 0) !== replacement.calories) {
      return { success: false, code: "meal_plan_replacement_not_verified", message: "The replacement could not be verified against the current Meal Plan, so Ari will not claim it changed." };
    }
    await refreshNutritionState("referenced_plan_replaced", { planId: clean(plan.id, 180) });
    return { success: true, result: { planItemId: plan.id, plan: verified }, reply: `${slotLabel(plan.meal_slot)} is now ${replacement.name} — about ${replacement.calories} kcal.` };
  }

  async function mapPlanAction(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = object(pending?.arguments);

    if (name === "log_referenced_plan_components") {
      const resolved = await resolveComponentReferences(args?.referenceIds);
      if (!resolved?.plan || !resolved.items.length) {
        return { success: false, code: "meal_plan_component_reference_stale", message: "Those planned items are no longer current. Ask Ari to show today’s Meal Plan again." };
      }
      const names = resolved.items.map((item) => item.name).join(", ");
      return createLegacyPending(pending, `Log ${names} from today’s ${slotLabel(resolved.plan.meal_slot).toLowerCase()} as eaten?`);
    }

    const plan = await resolvePlanReference(args?.referenceId);
    if (!plan) return { success: false, code: "meal_plan_reference_stale", message: "That planned meal is no longer active. Ask Ari to show today’s Meal Plan again." };

    if (name === "log_referenced_planned_meal") {
      return createLegacyPending(pending, `Log ${plan.name || slotLabel(plan.meal_slot)} — about ${Math.round(finite(plan.calories) ?? 0)} kcal — as eaten?`);
    }
    if (name === "discard_referenced_meal_plan") {
      return createLegacyPending(pending, `Remove ${plan.name || slotLabel(plan.meal_slot)} from today’s ${slotLabel(plan.meal_slot).toLowerCase()} Meal Plan?`);
    }
    if (name === "replace_referenced_meal_plan") {
      const replacement = replacementFromArgs(args);
      if (!replacement) return { success: false, code: "meal_plan_replacement_invalid", message: "The replacement meal details are incomplete." };
      const budget = await validateReplacementBudget(plan, replacement);
      if (!budget.valid) return { success: false, code: "meal_plan_replacement_budget_invalid", message: budget.message };
      return createLegacyPending(pending, `Replace ${plan.name || slotLabel(plan.meal_slot)} with ${replacement.name} — about ${replacement.calories} kcal — in today’s ${slotLabel(plan.meal_slot).toLowerCase()} Meal Plan?`);
    }

    return { success: false, code: "unsupported_meal_plan_reference_action", message: "That Meal Plan reference action is not supported." };
  }

  async function createLegacyPending(pending, confirmationText) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that Meal Plan change safely." };
    }
    const action = await window.CalBuddy.createPendingAction({
      action_type: clean(pending?.name, 120),
      payload: {
        reference_id: clean(pending?.arguments?.referenceId, 180) || null,
        reference_ids: array(pending?.arguments?.referenceIds).map((value) => clean(value, 180)).filter(Boolean),
        source: SOURCE,
        vnext_action_id: clean(pending?.id, 180),
        vnext_source_turn_id: clean(pending?.sourceTurnId, 180)
      },
      confirmation_text: confirmationText
    });
    return { success: true, action, resolution: { referenceBound: true, trustedRereadRequired: true } };
  }

  async function executePlanAction(pending = {}) {
    const name = clean(pending?.name, 120);
    if (name === "log_referenced_planned_meal") {
      const plan = await resolvePlanReference(pending?.arguments?.referenceId);
      if (!plan) return { success: false, code: "meal_plan_reference_stale", message: "That planned meal changed before confirmation. Ask Ari to show today’s Meal Plan again." };
      return await executePlanConsumption(pending, plan, null);
    }
    if (name === "log_referenced_plan_components") {
      const resolved = await resolveComponentReferences(pending?.arguments?.referenceIds);
      if (!resolved?.plan) return { success: false, code: "meal_plan_component_reference_stale", message: "Those planned items changed before confirmation. Ask Ari to show today’s Meal Plan again." };
      return await executePlanConsumption(pending, resolved.plan, resolved.indexes);
    }
    if (name === "discard_referenced_meal_plan") return await executeDiscard(pending);
    if (name === "replace_referenced_meal_plan") return await executeReplace(pending);
    return { success: false, code: "unsupported_meal_plan_reference_action", message: "That Meal Plan reference action is not supported." };
  }

  function patchAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter[ADAPTER_FLAG]) return true;
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") return false;

    const originalCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const originalExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function structuredReferenceCreate(pendingAction = {}) {
      const name = clean(pendingAction?.name, 120);
      if (PLAN_ACTIONS.has(name)) return await mapPlanAction(pendingAction);
      return await originalCreate(pendingAction);
    };

    adapter.executeConfirmed = async function structuredReferenceExecute(options = {}) {
      const pending = options?.vnextPendingAction || null;
      const name = clean(pending?.name, 120);
      if (PLAN_ACTIONS.has(name)) return await executePlanAction(pending);
      return await originalExecute(options);
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
    const adapterReady = patchAdapter();
    if (!bridgeReady || !adapterReady) return false;

    window.AriVNextStructuredReferenceCapabilities = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      planReferenceId,
      componentReferenceId,
      circleReferenceId
    });
    window.dispatchEvent(new CustomEvent("ari:vnextStructuredReferenceReady", {
      detail: { version: VERSION, source: SOURCE }
    }));
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
