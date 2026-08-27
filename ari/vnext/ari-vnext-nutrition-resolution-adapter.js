// ARI vNext — trusted Nutrition Resolution Adapter.
// Version 1.1.0
//
// The language model identifies foods and user-supplied portions. This adapter
// decides nutrition truth using existing ARI XP food infrastructure:
// personal mapping -> verified/canonical ARI food -> validated cloud candidate
// -> bounded AI estimate as a last resort. The model never writes the ledger.
//
// Important invariants:
// - Final calories/macros always carry a serving basis.
// - Raw/cooked WEIGHT ambiguity is never silently guessed for state-sensitive
//   generic foods.
// - Retried confirmations reuse the same mutation UUID, so a lost RPC response
//   cannot create a duplicate meal.
// - The app's canonical Nutrition window supplies nutrition_date; server UTC is
//   never allowed to redefine the user's Nutrition day.
// - Alcohol energy is included in integrity checks.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_nutrition_resolution_adapter";
  const INSTALL_FLAG = "__ariNutritionResolutionV1";
  const EXECUTOR_FLAG = "__ariResolvedNutritionExecutorV1";
  const FOOD_LOADER_URL = "js/nutrition-food-loader.js?v=1.0.1";
  const MAX_ITEMS = 16;
  const MIN_IDENTITY_CONFIDENCE = 0.82;
  const MIN_NUTRITION_CONFIDENCE = 0.72;
  const MIN_ESTIMATE_CONFIDENCE = 0.45;
  const RESOLUTION_CACHE_MS = 10 * 60 * 1000;
  const MUTATION_PREFIX = "ari_resolved_nutrition_mutation_v1";
  const cache = new Map();

  const WEIGHT_UNITS = new Set([
    "g", "gram", "grams", "kg", "kilogram", "kilograms",
    "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds"
  ]);

  // These generic food families commonly change calorie density materially when
  // water is gained/lost in cooking. Exact branded/package records are exempt.
  const COOK_STATE_SENSITIVE = /\b(chicken|turkey|beef|steak|pork|ham|lamb|veal|duck|fish|salmon|tuna|tilapia|cod|shrimp|prawn|rice|pasta|noodle|oat|oatmeal|quinoa|couscous|barley|farro|lentil|bean)\b/i;

  function clean(value = "", max = 240) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function normalize(value = "") {
    return clean(value, 500)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function number(value, fallback = null) {
    if (value === null || value === undefined || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function round(value, decimals = 1) {
    const parsed = number(value, 0);
    const factor = 10 ** decimals;
    return Math.round((parsed + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min, max, fallback = min) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function makeMutationId() {
    if (typeof window.crypto?.randomUUID === "function") return window.crypto.randomUUID();
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
    return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  }

  function hash(value = "") {
    const source = String(value || "resolved-nutrition");
    let result = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      result ^= source.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function mutationStorageKey(action = {}) {
    const identity = clean(action?.vnext_action_id || action?.vnext_source_turn_id || "", 220);
    return `${MUTATION_PREFIX}:${hash(identity || "fallback")}`;
  }

  function mutationIdForAction(action = {}) {
    const key = mutationStorageKey(action);
    try {
      const existing = sessionStorage.getItem(key);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing || "")) {
        return { id: existing, key };
      }
      const id = makeMutationId();
      sessionStorage.setItem(key, id);
      return { id, key };
    } catch {
      return { id: makeMutationId(), key: null };
    }
  }

  function clearMutationStorage(key) {
    if (!key) return;
    try { sessionStorage.removeItem(key); } catch {}
  }

  function localDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const safe = Number.isFinite(date.getTime()) ? date : new Date();
    const year = safe.getFullYear();
    const month = String(safe.getMonth() + 1).padStart(2, "0");
    const day = String(safe.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function resolveNutritionDate() {
    if (typeof window.CalBuddy?.getNutritionWindow === "function") {
      try {
        const date = clean((await window.CalBuddy.getNutritionWindow())?.nutritionDate, 20);
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      } catch {}
    }
    return localDate();
  }

  function loadScript(src) {
    const base = String(src).split("?")[0];
    const existing = [...document.scripts].find((script) => String(script.getAttribute("src") || "").split("?")[0].endsWith(base));
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Could not load ${base}.`));
      document.head.appendChild(script);
    });
  }

  async function ensureFoodSystem() {
    if (window.AriFoodRegistry && window.AriFoodSearch && window.AriFoodCalculator) return true;
    if (!window.AriNutritionFoodLoader?.start) await loadScript(FOOD_LOADER_URL);
    const ready = await window.AriNutritionFoodLoader?.start?.();
    if (ready !== true || !window.AriFoodRegistry || !window.AriFoodSearch || !window.AriFoodCalculator) {
      throw new Error("ARI Nutrition's canonical food resolver is unavailable.");
    }
    return true;
  }

  async function currentSession() {
    try {
      if (typeof window.CalBuddy?.getCurrentSession === "function") {
        const session = await window.CalBuddy.getCurrentSession();
        if (session) return session;
      }
    } catch {}
    try {
      const client = window.calbuddySupabase;
      if (!client?.auth?.getSession) return null;
      const { data } = await client.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  }

  async function personalMappings(items = []) {
    const client = window.calbuddySupabase;
    if (!client?.from) return new Map();
    const phrases = Array.from(new Set(items
      .map((item) => normalize(item?.userPhrase || item?.foodText))
      .filter(Boolean)))
      .slice(0, MAX_ITEMS);
    if (!phrases.length) return new Map();

    try {
      const { data, error } = await client
        .from("ari_user_food_mappings")
        .select("normalized_phrase,canonical_food_id,food_display_name,quantity,unit,measurement_state,confidence,observation_count,last_confirmed_at")
        .in("normalized_phrase", phrases)
        .order("confidence", { ascending: false });
      if (error || !Array.isArray(data)) return new Map();
      const output = new Map();
      for (const row of data) {
        const key = normalize(row?.normalized_phrase);
        if (key && !output.has(key)) output.set(key, row);
      }
      return output;
    } catch {
      return new Map();
    }
  }

  function searchOptions(item = {}, strict = true) {
    const options = { limit: 8, includeSearchMeta: true };
    const state = normalize(item.state);
    const preparation = normalize(item.preparation);
    const brand = clean(item.brand, 160);
    if (strict && brand) options.brand = brand;
    if (strict && ["raw", "cooked", "ready to drink", "ready-to-drink"].includes(state)) options.state = state;
    if (strict && preparation && !["unknown", "prepared", "cooked", "packaged"].includes(preparation)) options.preparation = preparation;
    return options;
  }

  function buildQuery(item = {}) {
    const parts = [item.brand, item.foodText];
    const prep = normalize(item.preparation);
    const state = normalize(item.state);
    if (prep && !normalize(item.foodText).includes(prep) && !["unknown", "packaged"].includes(prep)) parts.push(prep);
    if (state === "raw" && !normalize(item.foodText).includes("raw")) parts.push("raw");
    return parts.map((value) => clean(value, 180)).filter(Boolean).join(" ").slice(0, 320);
  }

  function searchLocal(item = {}) {
    const search = window.AriFoodSearch;
    if (!search?.search) return [];
    const query = buildQuery(item) || clean(item.foodText, 220);
    let results = search.search(query, searchOptions(item, true));
    if (!Array.isArray(results) || !results.length) results = search.search(query, searchOptions(item, false));
    if ((!results || !results.length) && query !== clean(item.foodText, 220)) {
      results = search.search(clean(item.foodText, 220), searchOptions(item, false));
    }
    return Array.isArray(results) ? results : [];
  }

  function sourceProfile(food = {}) {
    const metadata = object(food.metadata);
    const source = normalize(food.source);
    const sourceType = normalize(metadata.sourceType || metadata.source_type || food.sourceType || food.source_type);
    const confidence = number(metadata.confidence, number(food.confidence, null));
    const verified = food.verified === true || metadata.labelVerified === true || metadata.verified === true;
    const canonical = source.startsWith("arifood") || normalize(metadata.referenceStatus) === "curated generic average";

    if (verified) return { type: "verified_product", confidence: 0.99, verified: true };
    if (canonical) return { type: "ari_canonical", confidence: 0.93, verified: false };
    if (sourceType.includes("manufacturer")) return { type: "manufacturer_candidate", confidence: clamp(confidence, 0, 1, 0.88), verified: false };
    if (sourceType.includes("usda") || source.includes("usda")) return { type: "external_reference", confidence: clamp(confidence, 0, 1, 0.82), verified: false };
    if (sourceType.includes("open food facts") || sourceType.includes("open_food_facts") || source.includes("open food facts")) {
      return { type: "external_candidate", confidence: clamp(confidence, 0, 1, 0.62), verified: false };
    }
    return { type: "external_candidate", confidence: clamp(confidence, 0, 1, 0.68), verified: false };
  }

  function identityConfidence(food = {}, item = {}) {
    const searchScore = number(food?.search?.score, number(food?.score, 0));
    let score = searchScore >= 900 ? 0.99 : searchScore >= 700 ? 0.95 : searchScore >= 500 ? 0.89 : searchScore >= 300 ? 0.82 : 0.72;
    const requestedBrand = normalize(item.brand);
    const candidateBrand = normalize(food.brand);
    if (requestedBrand) {
      if (!candidateBrand || (!candidateBrand.includes(requestedBrand) && !requestedBrand.includes(candidateBrand))) return 0;
      score = Math.max(score, 0.94);
    }

    const requestedState = normalize(item.state);
    const candidateState = normalize(food.state);
    if (requestedState === "raw" && candidateState && candidateState !== "raw") return 0;
    if (requestedState === "cooked" && candidateState === "raw") return 0;

    const requestedPrep = normalize(item.preparation);
    const candidatePrep = normalize(food.preparation);
    if (requestedPrep && candidatePrep && !["unknown", "prepared", "cooked", "packaged"].includes(requestedPrep)) {
      if (candidatePrep === requestedPrep) score = Math.max(score, 0.95);
      else if (!candidatePrep.includes(requestedPrep) && !requestedPrep.includes(candidatePrep)) score -= 0.18;
    }
    return clamp(score, 0, 1, 0);
  }

  function pickCandidate(results = [], item = {}, mapping = null) {
    const registry = window.AriFoodRegistry;
    if (mapping?.canonical_food_id && registry?.getById) {
      const mapped = registry.getById(mapping.canonical_food_id);
      if (mapped) {
        return {
          food: mapped,
          identityConfidence: clamp(mapping.confidence, 0, 1, 0.95),
          nutritionConfidence: Math.max(0.9, sourceProfile(mapped).confidence),
          sourceType: "personal_mapping",
          mapping
        };
      }
    }

    let best = null;
    for (const food of results) {
      const identity = identityConfidence(food, item);
      const profile = sourceProfile(food);
      if (identity < MIN_IDENTITY_CONFIDENCE || profile.confidence < MIN_NUTRITION_CONFIDENCE) continue;
      const combined = identity * 0.58 + profile.confidence * 0.42;
      if (!best || combined > best.combined) {
        best = { food, identityConfidence: identity, nutritionConfidence: profile.confidence, sourceType: profile.type, combined };
      }
    }
    return best;
  }

  async function cloudEnrich(item = {}, localCount = 0) {
    const session = await currentSession();
    const token = clean(session?.access_token, 5000);
    const registry = window.AriFoodRegistry;
    if (!token || !registry?.register) return [];
    const query = buildQuery(item) || clean(item.foodText, 220);
    if (query.length < 2) return [];

    try {
      const response = await fetch("/api/ari-food-search", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, limit: 8, localCount })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true || !Array.isArray(data?.results)) return [];
      for (const food of data.results) {
        try { registry.register(food, { source: "AriNutritionResolverCloud", replace: true }); } catch {}
      }
      return data.results;
    } catch {
      return [];
    }
  }

  function normalizedUnit(unit = "") {
    const value = normalize(unit);
    const aliases = {
      gram: "g", grams: "g", kilogram: "kg", kilograms: "kg",
      ounce: "oz", ounces: "oz", lbs: "lb", pound: "lb", pounds: "lb"
    };
    return aliases[value] || value;
  }

  function isWeightPortion(item = {}, mapping = null) {
    const unit = normalizedUnit(item.unit || mapping?.unit || "");
    return WEIGHT_UNITS.has(unit);
  }

  function effectiveMeasurementState(item = {}, mapping = null) {
    const explicit = normalize(item.measurementState).replaceAll(" ", "_");
    if (["raw", "cooked", "not_applicable"].includes(explicit)) return explicit;
    const learned = normalize(mapping?.measurement_state).replaceAll(" ", "_");
    if (["raw", "cooked", "not_applicable"].includes(learned)) return learned;
    return "unknown";
  }

  function requiresMeasurementClarification(item = {}, candidate = {}) {
    if (!isWeightPortion(item, candidate.mapping)) return false;
    if (effectiveMeasurementState(item, candidate.mapping) !== "unknown") return false;
    const profile = sourceProfile(candidate.food || {});
    if (profile.verified === true || profile.type === "manufacturer_candidate") return false;
    const text = `${item.foodText || ""} ${candidate.food?.name || ""} ${candidate.food?.displayName || ""} ${candidate.food?.category || ""}`;
    return COOK_STATE_SENSITIVE.test(text);
  }

  function genericDefaultUnit(unit = "") {
    return ["", "serving", "item", "piece", "bottle", "can", "beer", "drink", "meal", "portion"].includes(normalize(unit));
  }

  function calculateCandidate(candidate = {}, item = {}) {
    const food = candidate.food;
    const calculator = window.AriFoodCalculator;
    if (!food?.id || !calculator) return null;
    if (requiresMeasurementClarification(item, candidate)) {
      return { clarificationRequired: true, reason: "raw_cooked_weight_ambiguous" };
    }

    let quantity = number(item.quantity, null);
    let unit = clean(item.unit, 80).toLowerCase();
    const mapping = candidate.mapping || null;
    if (quantity === null && mapping) quantity = number(mapping.quantity, null);
    if (!unit && mapping) unit = clean(mapping.unit, 80).toLowerCase();

    let calculation = null;
    if (quantity !== null && unit && !genericDefaultUnit(unit)) calculation = calculator.calculate(food.id, quantity, unit);
    if ((!calculation || calculation.ok !== true) && quantity !== null && unit && genericDefaultUnit(unit)) {
      calculation = calculator.calculateDefaultServing(food.id, quantity);
    }
    if ((!calculation || calculation.ok !== true) && quantity === null) {
      quantity = 1;
      calculation = calculator.calculateDefaultServing(food.id, 1);
    }
    if (!calculation || calculation.ok !== true) return null;

    const multiplier = number(calculation?.resolved?.multiplier, 1);
    const alcoholG = round(number(food?.nutrition?.alcohol, 0) * multiplier, 2);
    const portionConfidence = item.quantity !== null && clean(item.unit) ? 0.98 : mapping ? 0.95 : 0.82;
    const measurementState = effectiveMeasurementState(item, mapping);

    const component = {
      user_phrase: clean(item.userPhrase || item.foodText, 260),
      normalized_phrase: normalize(item.userPhrase || item.foodText),
      name: clean(food.displayName || food.name || item.foodText, 220),
      food_id: clean(food.id, 220),
      quantity: number(item.quantity, quantity),
      unit: clean(item.unit || calculation?.requested?.unit || calculation?.resolved?.serving?.unit || "serving", 80),
      serving_label: clean(calculation?.resolved?.serving?.label || item.servingHint || calculation?.display?.serving, 220),
      grams: number(calculation?.resolved?.grams, null),
      milliliters: number(calculation?.resolved?.milliliters, null),
      calories: round(calculation?.nutrition?.calories, 1),
      protein_g: round(calculation?.nutrition?.protein, 1),
      carbs_g: round(calculation?.nutrition?.carbs, 1),
      fat_g: round(calculation?.nutrition?.fat, 1),
      alcohol_g: alcoholG,
      source_type: candidate.sourceType,
      source_id: clean(food?.metadata?.sourceId || food?.sourceId || food.id, 220),
      source_label: clean(food.source || candidate.sourceType, 220),
      nutrition_basis: object(calculation?.basis?.nutritionBasis),
      identity_confidence: round(candidate.identityConfidence, 3),
      nutrition_confidence: round(candidate.nutritionConfidence, 3),
      portion_confidence: round(portionConfidence, 3),
      estimated: false,
      estimate_low: null,
      estimate_high: null,
      metadata: {
        state: clean(food.state || item.state, 80),
        preparation: clean(food.preparation || item.preparation, 100),
        measurementState,
        brand: clean(food.brand || item.brand, 160),
        resolvedBy: clean(calculation?.resolved?.resolvedBy, 100),
        searchScore: number(food?.search?.score, null)
      }
    };

    return integrityCheck(component, food) ? component : null;
  }

  function integrityCheck(component = {}, food = null) {
    const calories = number(component.calories, null);
    if (calories === null || calories < 0 || calories > 10000) return false;
    const protein = Math.max(0, number(component.protein_g, 0));
    const carbs = Math.max(0, number(component.carbs_g, 0));
    const fat = Math.max(0, number(component.fat_g, 0));
    const alcohol = Math.max(0, number(component.alcohol_g, 0));
    const macroEnergy = protein * 4 + carbs * 4 + fat * 9 + alcohol * 7;
    const sourceType = normalize(component.source_type);
    const unverifiedExternal = sourceType.includes("external candidate");

    if (calories === 0) {
      const text = normalize(`${component.name} ${food?.category || ""} ${food?.tags?.join?.(" ") || ""}`);
      if (!/water|diet|zero sugar|zero calorie|unsweetened tea|black coffee/.test(text)) return false;
    }

    if (unverifiedExternal && calories > 0 && macroEnergy > 0) {
      const discrepancy = Math.abs(calories - macroEnergy);
      if (discrepancy > Math.max(120, calories * 0.5)) return false;
    }

    if (number(component.grams, null) !== null && component.grams > 0 && calories / component.grams > 10.5) return false;
    if (number(component.milliliters, null) !== null && component.milliliters > 0 && calories / component.milliliters > 5) return false;
    return true;
  }

  function estimateComponent(item = {}) {
    const mid = number(item.fallbackCaloriesMid, null);
    const confidence = clamp(item.fallbackConfidence, 0, 1, 0);
    if (mid === null || mid <= 0 || mid > 10000 || confidence < MIN_ESTIMATE_CONFIDENCE) return null;
    const low = number(item.fallbackCaloriesLow, mid);
    const high = number(item.fallbackCaloriesHigh, mid);
    if (low < 0 || high < mid || low > mid) return null;

    return {
      user_phrase: clean(item.userPhrase || item.foodText, 260),
      normalized_phrase: normalize(item.userPhrase || item.foodText),
      name: clean(item.foodText || item.userPhrase, 220) || "Estimated food",
      food_id: null,
      quantity: number(item.quantity, 1),
      unit: clean(item.unit || "serving", 80),
      serving_label: clean(item.servingHint || `${number(item.quantity, 1)} ${item.unit || "serving"}`, 220),
      grams: null,
      milliliters: null,
      calories: round(mid, 1),
      protein_g: round(number(item.fallbackProteinG, 0), 1),
      carbs_g: round(number(item.fallbackCarbsG, 0), 1),
      fat_g: round(number(item.fallbackFatG, 0), 1),
      alcohol_g: round(number(item.fallbackAlcoholG, 0), 1),
      source_type: "ai_estimate",
      source_id: null,
      source_label: "Ari bounded estimate fallback",
      nutrition_basis: { type: "requested_portion_estimate", quantity: number(item.quantity, 1), unit: clean(item.unit || "serving", 80) },
      identity_confidence: round(Math.min(0.85, confidence + 0.1), 3),
      nutrition_confidence: round(confidence, 3),
      portion_confidence: round(item.quantity !== null && clean(item.unit) ? Math.min(0.85, confidence + 0.12) : confidence, 3),
      estimated: true,
      estimate_low: round(low, 1),
      estimate_high: round(high, 1),
      metadata: {
        state: clean(item.state, 80),
        preparation: clean(item.preparation, 100),
        measurementState: effectiveMeasurementState(item),
        brand: clean(item.brand, 160),
        fallbackReason: clean(item.fallbackReason, 500)
      }
    };
  }

  async function resolveOne(item = {}, mappings = new Map()) {
    const phraseKey = normalize(item.userPhrase || item.foodText);
    const mapping = mappings.get(phraseKey) || null;
    let results = searchLocal(item);
    let candidate = pickCandidate(results, item, mapping);

    if (!candidate) {
      await cloudEnrich(item, results.length);
      results = searchLocal(item);
      candidate = pickCandidate(results, item, mapping);
    }

    if (candidate) {
      const resolved = calculateCandidate(candidate, item);
      if (resolved?.clarificationRequired) return resolved;
      if (resolved) return resolved;
    }
    return estimateComponent(item);
  }

  function aggregate(args = {}, components = []) {
    const totals = components.reduce((sum, item) => {
      sum.calories += number(item.calories, 0);
      sum.protein += number(item.protein_g, 0);
      sum.carbs += number(item.carbs_g, 0);
      sum.fat += number(item.fat_g, 0);
      sum.alcohol += number(item.alcohol_g, 0);
      return sum;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, alcohol: 0 });

    const estimatedCount = components.filter((item) => item.estimated === true).length;
    const minimumConfidence = components.reduce((value, item) => Math.min(value, number(item.nutrition_confidence, 0)), 1);
    const mealName = clean(args.name, 220) || components.map((item) => item.name).join(" + ").slice(0, 220) || "Ari meal";
    const serving = components.map((item) => `${item.quantity ?? 1} ${item.unit || "serving"} ${item.name}`).join(" + ").slice(0, 500);

    return {
      meal: {
        name: mealName,
        calories: Math.round(totals.calories),
        category: clean(args.mealCategory, 80) || "Meal",
        protein_g: round(totals.protein, 1),
        carbs_g: round(totals.carbs, 1),
        fat_g: round(totals.fat, 1),
        serving_size: serving || "Resolved by Ari Nutrition",
        multiplier: 1,
        is_favorite: false
      },
      resolution: {
        version: VERSION,
        method: estimatedCount === 0 ? "evidence_resolved" : estimatedCount === components.length ? "ai_estimate" : "hybrid_resolved",
        estimated: estimatedCount > 0,
        estimated_count: estimatedCount,
        component_count: components.length,
        minimum_nutrition_confidence: round(minimumConfidence, 3),
        alcohol_g: round(totals.alcohol, 1),
        notes: clean(args.notes, 1200),
        resolved_at: new Date().toISOString()
      }
    };
  }

  async function resolveMeal(pending = {}) {
    const key = clean(pending.id, 200);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.savedAt < RESOLUTION_CACHE_MS) return cached.value;

    await ensureFoodSystem();
    const args = object(pending.arguments);
    const items = Array.isArray(args.items) ? args.items.slice(0, MAX_ITEMS) : [];
    if (!items.length) return { success: false, code: "meal_items_required", message: "Ari needs at least one food item to resolve this meal." };

    const mappings = await personalMappings(items);
    const components = [];
    for (const item of items) {
      const resolved = await resolveOne(object(item), mappings);
      if (resolved?.clarificationRequired) {
        return {
          success: false,
          code: resolved.reason || "nutrition_clarification_required",
          message: `Was ${clean(item?.quantity, 40)} ${clean(item?.unit, 30)} of ${clean(item?.foodText, 120) || "that food"} weighed before or after cooking?`
        };
      }
      if (!resolved) {
        return {
          success: false,
          code: "nutrition_clarification_required",
          message: `I couldn't resolve ${clean(item?.userPhrase || item?.foodText, 160) || "one item"} accurately enough to log it. Give me the portion or product detail that matters most.`
        };
      }
      components.push(resolved);
    }

    const summary = aggregate(args, components);
    if (!Number.isFinite(summary.meal.calories) || summary.meal.calories <= 0 || summary.meal.calories > 10000) {
      return { success: false, code: "resolved_meal_calories_invalid", message: "The resolved meal total did not pass Ari's nutrition integrity check." };
    }

    const estimatedSuffix = summary.resolution.estimated_count
      ? `; ${summary.resolution.estimated_count} item${summary.resolution.estimated_count === 1 ? "" : "s"} estimated`
      : "";
    const value = {
      success: true,
      action: {
        action_type: "log_meal",
        payload: {
          ...summary.meal,
          vnext_resolved_nutrition: true,
          ari_components: components,
          ari_resolution: summary.resolution
        },
        confirmation_text: `Log ${summary.meal.name} (${summary.meal.calories} kcal${estimatedSuffix})?`
      },
      resolution: { ...summary.resolution, components }
    };
    if (key) cache.set(key, { savedAt: Date.now(), value });
    return value;
  }

  async function executeResolvedAction(action = {}) {
    const payload = object(action.payload);
    const client = window.calbuddySupabase;
    const session = await currentSession();
    if (!session?.user?.id || !client?.rpc) {
      return { success: false, code: "resolved_nutrition_session_required", error: "A signed-in ARI XP session is required to save resolved nutrition." };
    }

    const mutation = mutationIdForAction(action);
    const nutritionDate = await resolveNutritionDate();
    const meal = {
      name: clean(payload.name, 220),
      calories: Math.round(number(payload.calories, 0)),
      category: clean(payload.category, 80) || "Meal",
      nutrition_date: nutritionDate,
      protein_g: Math.max(0, number(payload.protein_g, 0)),
      carbs_g: Math.max(0, number(payload.carbs_g, 0)),
      fat_g: Math.max(0, number(payload.fat_g, 0)),
      serving_size: clean(payload.serving_size, 500) || "Resolved by Ari Nutrition",
      multiplier: 1,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    window.CalBuddy?.setAriMood?.("logging");
    const { data, error } = await client.rpc("ari_log_resolved_nutrition_meal", {
      p_mutation_id: mutation.id,
      p_meal: meal,
      p_components: Array.isArray(payload.ari_components) ? payload.ari_components : [],
      p_resolution: object(payload.ari_resolution)
    });

    if (error) {
      // Keep the action-scoped mutation UUID for retry. If the server committed
      // before the response was lost, its journal will return idempotently.
      window.CalBuddy?.setAriMood?.("concerned");
      return { success: false, code: "resolved_nutrition_write_failed", error: error.message || "The resolved meal could not be saved. Nothing was changed." };
    }

    clearMutationStorage(mutation.key);
    const saved = data?.meal && typeof data.meal === "object"
      ? { ...data.meal, source: "supabase" }
      : { ...meal, id: data?.mealId || null, source: "supabase" };
    saved.ari_mutation_id = mutation.id;
    saved.ari_today_calories = number(data?.todayCalories, null);
    saved.ari_undo_available = data?.undoAvailable === true;
    saved.ari_resolution = data?.resolution || payload.ari_resolution || null;

    try {
      if (Number.isFinite(Number(data?.todayCalories))) {
        localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
        localStorage.setItem("calbuddyCaloriesConsumedDate", String(data?.nutritionDate || nutritionDate));
      }
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", {
        detail: {
          action: "log_meal",
          mutationId: mutation.id,
          meal: saved,
          todayCalories: data?.todayCalories ?? null,
          undoAvailable: data?.undoAvailable === true,
          resolution: data?.resolution || payload.ari_resolution || null,
          source: SOURCE,
          version: VERSION
        }
      }));
      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
        detail: { action: "log", meal: saved, mutationId: mutation.id }
      }));
    } catch {}

    window.CalBuddy?.setAriMood?.("success");
    const reply = `${saved.name || "Meal"} logged${Number.isFinite(Number(data?.todayCalories)) ? ` · ${Math.round(Number(data.todayCalories)).toLocaleString()} kcal today` : ""}.`;
    return {
      success: true,
      result: saved,
      meal: saved,
      mutationId: mutation.id,
      todayCalories: data?.todayCalories ?? null,
      undoAvailable: data?.undoAvailable === true,
      resolution: data?.resolution || payload.ari_resolution || null,
      reply
    };
  }

  function installExecutor() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || typeof CalBuddy.executeAction !== "function") return false;
    if (CalBuddy[EXECUTOR_FLAG]) return true;
    const originalExecute = CalBuddy.executeAction.bind(CalBuddy);
    CalBuddy.executeAction = async function resolutionAwareExecutor(action = {}) {
      if (action?.action_type === "log_meal" && action?.payload?.vnext_resolved_nutrition === true) {
        return await executeResolvedAction(action);
      }
      return await originalExecute(action);
    };
    Object.defineProperty(CalBuddy, EXECUTOR_FLAG, { configurable: false, enumerable: false, value: VERSION });
    return true;
  }

  function installAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || typeof adapter.prepareCalBuddyAction !== "function") return false;
    if (adapter[INSTALL_FLAG]) return true;
    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);
    adapter.prepareCalBuddyAction = async function nutritionResolutionPrepare(pending = {}) {
      const args = object(pending?.arguments);
      if (clean(pending?.name, 120) === "log_meal" && Array.isArray(args.items)) {
        return await resolveMeal(pending);
      }
      return await originalPrepare(pending);
    };
    Object.defineProperty(adapter, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    return true;
  }

  function install() {
    if (!installAdapter() || !installExecutor()) return false;
    window.AriVNextNutritionResolutionAdapter = Object.freeze({
      version: VERSION,
      ready: true,
      source: SOURCE,
      resolveMeal,
      integrityCheck,
      requiresMeasurementClarification
    });
    window.dispatchEvent(new CustomEvent("ari:vnextNutritionResolutionReady", { detail: { version: VERSION } }));
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
      console.warn("[Ari Nutrition Resolution] install retry:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();
