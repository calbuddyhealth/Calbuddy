// ARI vNext — trusted meal nutrition enrichment through ARI's server food search.
// The primary model identifies what the user ate. This layer prefers known
// catalog nutrition when the match is strong, preserves nutrition values the
// user explicitly supplied, and otherwise leaves estimation to the model.

import { searchAriFoodCatalog } from "../../ari-food-search.js";
import { searchCanonicalAriFoodRegistry } from "./canonical-food-registry.js";

export const FOOD_RESOLUTION_VERSION = "1.3.0";

export async function resolveMealNutritionFromFoodSearch({
  arguments: args = {},
  message = "",
  searchFn = null,
  canonicalSearchFn = searchCanonicalAriFoodRegistry,
  catalogSearchFn = searchAriFoodCatalog,
  allowExternal = true,
  canonicalOnly = false
} = {}) {
  const input = args && typeof args === "object" && !Array.isArray(args) ? { ...args } : {};
  const query = clean(input?.name, 220);
  if (!query) return unresolved("meal_name_missing");

  const providers = searchFn
    ? [{ source: "injected_food_search", search: searchFn, enabled: true }]
    : [
        { source: "ari_canonical_food_registry", search: canonicalSearchFn, enabled: true },
        ...(!canonicalOnly
          ? [{ source: "ari_food_search", search: catalogSearchFn, enabled: foodSearchConfigured() }]
          : [])
      ];

  let candidateCount = 0;
  let lastReason = "no_strong_food_match";

  for (const provider of providers) {
    if (!provider.enabled || typeof provider.search !== "function") continue;

    let result;
    try {
      result = await provider.search(query, {
        limit: 6,
        localCount: 0,
        allowExternal
      });
    } catch (error) {
      lastReason = error?.name === "AbortError"
        ? "food_search_timeout"
        : "food_search_failed";
      continue;
    }

    const candidates = Array.isArray(result?.results) ? result.results : [];
    candidateCount += candidates.length;
    const match = chooseStrongMatch(query, candidates);
    if (!match) {
      lastReason = "no_strong_food_match";
      continue;
    }

    const calculated = calculateCandidateNutrition(match.food, input);
    if (!calculated) {
      lastReason = "matched_food_serving_unresolved";
      continue;
    }

    return buildResolvedMeal({
      input,
      message,
      match,
      calculated,
      source: provider.source
    });
  }

  return {
    ...unresolved(lastReason),
    candidateCount
  };
}

function buildResolvedMeal({
  input = {},
  message = "",
  match,
  calculated,
  source = "ari_food_search"
} = {}) {
  const explicit = explicitNutritionFields(message);
  const next = { ...input };
  const appliedFields = [];

  for (const [field, value] of Object.entries({
    calories: calculated.calories,
    proteinG: calculated.proteinG,
    carbsG: calculated.carbsG,
    fatG: calculated.fatG
  })) {
    if (explicit.has(field)) continue;
    next[field] = value;
    appliedFields.push(field);
  }

  const provider = clean(
    match.food?.metadata?.sourceProvider ||
    match.food?.source ||
    (source === "ari_canonical_food_registry"
      ? "ARI Canonical Food Registry"
      : "ARI Food Search"),
    160
  );
  const provenance = source === "ari_canonical_food_registry"
    ? `Nutrition resolved from ARI's canonical food registry using ${provider} reference data.`
    : match.food?.verified === true
      ? `Verified nutrition resolved from ${provider}.`
      : `Nutrition matched through ARI Food Search from ${provider}; values may require normal serving-label tolerance.`;
  next.notes = appendNote(next.notes, provenance);

  return {
    resolved: true,
    reason: "strong_food_match",
    arguments: next,
    appliedFields,
    preservedExplicitFields: [...explicit],
    match: publicMatch(match.food, match),
    servingResolution: calculated.servingResolution,
    source,
    version: FOOD_RESOLUTION_VERSION
  };
}

export function chooseStrongMatch(query, candidates = []) {
  const normalizedQuery = normalize(query);
  const queryTokens = meaningfulTokens(normalizedQuery);
  if (!normalizedQuery || !queryTokens.length) return null;

  let best = null;

  for (const food of candidates) {
    if (!food || typeof food !== "object") continue;
    const name = normalize(food?.name);
    const display = normalize(food?.displayName);
    const brand = normalize(food?.brand);
    const aliases = Array.isArray(food?.aliases) ? food.aliases.map(normalize).filter(Boolean) : [];
    const haystack = normalize([display, name, brand, ...aliases].filter(Boolean).join(" "));
    if (!haystack) continue;

    const matched = queryTokens.filter((token) =>
      meaningfulTokens(haystack).some((candidate) => tokenEquivalent(token, candidate))
    ).length;
    const coverage = matched / queryTokens.length;
    const exactIdentity =
      normalizedQuery === display ||
      normalizedQuery === name ||
      aliases.includes(normalizedQuery);

    const confidence = finite(food?.metadata?.confidence, 0.5);
    const searchScore = finite(food?.metadata?.searchScore, 0);
    const verified = food?.verified === true;
    const singleTokenStrong =
      queryTokens.length === 1 &&
      coverage === 1 &&
      (confidence >= 0.65 || verified);

    const accepted =
      exactIdentity ||
      singleTokenStrong ||
      (coverage >= 0.8 && matched >= 2 && (confidence >= 0.55 || verified || searchScore >= 500));

    if (!accepted) continue;

    const rank =
      (exactIdentity ? 10000 : 0) +
      coverage * 1000 +
      confidence * 100 +
      (verified ? 100 : 0) +
      Math.min(1000, Math.max(0, searchScore));

    if (!best || rank > best.rank) {
      best = {
        food,
        rank,
        coverage: round(coverage, 3),
        confidence: round(confidence, 3),
        exactIdentity,
        matchedTokens: matched,
        queryTokenCount: queryTokens.length
      };
    }
  }

  return best;
}

export function calculateCandidateNutrition(food = {}, args = {}) {
  const nutrition = food?.nutrition && typeof food.nutrition === "object" ? food.nutrition : {};
  if (!completeMacros(nutrition)) return null;

  const quantity = positive(args?.quantity) || 1;
  const unit = normalizeUnit(args?.unit);
  const basisGrams = positive(food?.nutritionBasis?.grams);
  const basisMilliliters = positive(food?.nutritionBasis?.milliliters);

  const requestedGrams = toGrams(quantity, unit);
  if (requestedGrams && basisGrams) {
    return scaledNutrition(
      nutrition,
      requestedGrams / basisGrams,
      `weight:${round(requestedGrams, 2)}g`
    );
  }

  const requestedMilliliters = toMilliliters(quantity, unit);
  if (requestedMilliliters && basisMilliliters) {
    return scaledNutrition(
      nutrition,
      requestedMilliliters / basisMilliliters,
      `volume:${round(requestedMilliliters, 2)}ml`
    );
  }

  const serving = findBestServing(food, args);
  if (serving) {
    const servingGrams = positive(serving?.grams);
    if (servingGrams && basisGrams) {
      return scaledNutrition(
        nutrition,
        (servingGrams * quantity) / basisGrams,
        `registry_serving:${clean(serving?.label || serving?.unit, 120)}`
      );
    }

    const servingMilliliters = positive(serving?.milliliters);
    if (servingMilliliters && basisMilliliters) {
      return scaledNutrition(
        nutrition,
        (servingMilliliters * quantity) / basisMilliliters,
        `registry_serving:${clean(serving?.label || serving?.unit, 120)}`
      );
    }

    const basisType = normalize(food?.nutritionBasis?.type);
    const basisUnit = normalizeUnit(food?.nutritionBasis?.unit);
    const servingUnit = normalizeUnit(serving?.unit);
    const basisAmount = positive(food?.nutritionBasis?.amount) || 1;
    const servingAmount = positive(serving?.amount) || 1;
    if (
      basisType === "unit" &&
      basisUnit &&
      servingUnit &&
      unitsEquivalent(basisUnit, servingUnit)
    ) {
      return scaledNutrition(
        nutrition,
        (servingAmount * quantity) / basisAmount,
        `registry_unit:${servingUnit}`
      );
    }
  }

  const label = food?.metadata?.labelNutrition;
  const labelServingGrams = positive(label?.servingGrams);
  const hasLabelServing = Array.isArray(food?.servings) &&
    food.servings.some((item) => item?.id === "label-serving" && positive(item?.grams));

  if (completeMacros(label) && (labelServingGrams || hasLabelServing)) {
    return scaledNutrition(
      {
        calories: label.calories,
        protein: label.protein,
        carbs: label.carbs,
        fat: label.fat
      },
      quantity,
      "label_serving"
    );
  }

  const basisType = normalize(food?.nutritionBasis?.type);
  if (basisType === "unit" && completeMacros(nutrition)) {
    return scaledNutrition(nutrition, quantity, "unit_basis");
  }

  return null;
}

function findBestServing(food = {}, args = {}) {
  const servings = Array.isArray(food?.servings) ? food.servings : [];
  if (!servings.length) return null;

  const requestedUnit = normalizeUnit(args?.unit);
  const servingText = normalize(args?.servingSize);
  let best = null;

  for (const serving of servings) {
    const unit = normalizeUnit(serving?.unit);
    const label = normalize(serving?.label);
    let score = serving?.isDefault === true ? 20 : 0;

    if (requestedUnit && unit && unitsEquivalent(requestedUnit, unit)) score += 120;
    if (requestedUnit && label && textContainsEquivalentToken(label, requestedUnit)) score += 70;
    if (servingText && label) {
      const requestedTokens = meaningfulTokens(servingText);
      const labelTokens = meaningfulTokens(label);
      const matches = requestedTokens.filter((token) =>
        labelTokens.some((candidate) => tokenEquivalent(token, candidate))
      ).length;
      if (requestedTokens.length && matches === requestedTokens.length) score += 100;
      else if (matches > 0) score += Math.round((matches / requestedTokens.length) * 50);
    }

    if (!best || score > best.score) best = { serving, score };
  }

  if (best?.score > 20) return best.serving;
  return servings.find((serving) => serving?.isDefault === true) || null;
}

function textContainsEquivalentToken(text, requestedUnit) {
  const requestedTokens = meaningfulTokens(requestedUnit);
  const textTokens = meaningfulTokens(text);
  return requestedTokens.some((token) =>
    textTokens.some((candidate) => tokenEquivalent(token, candidate))
  );
}

function unitsEquivalent(left, right) {
  const a = normalizeUnit(left);
  const b = normalizeUnit(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const aTokens = meaningfulTokens(a);
  const bTokens = meaningfulTokens(b);
  return aTokens.some((token) => bTokens.some((candidate) => tokenEquivalent(token, candidate)));
}

export function explicitNutritionFields(message = "") {
  const text = String(message || "").toLowerCase();
  const fields = new Set();

  if (/\b\d+(?:\.\d+)?\s*(?:kcal|calories?|cals?)\b/i.test(text)) fields.add("calories");
  if (
    /\b\d+(?:\.\d+)?\s*g(?:rams?)?\s*(?:of\s*)?protein\b/i.test(text) ||
    /\bprotein\s*(?:is|:|=)?\s*\d+(?:\.\d+)?\s*g\b/i.test(text)
  ) fields.add("proteinG");
  if (
    /\b\d+(?:\.\d+)?\s*g(?:rams?)?\s*(?:of\s*)?(?:carbs?|carbohydrates?)\b/i.test(text) ||
    /\b(?:carbs?|carbohydrates?)\s*(?:is|:|=)?\s*\d+(?:\.\d+)?\s*g\b/i.test(text)
  ) fields.add("carbsG");
  if (
    /\b\d+(?:\.\d+)?\s*g(?:rams?)?\s*(?:of\s*)?fat\b/i.test(text) ||
    /\bfat\s*(?:is|:|=)?\s*\d+(?:\.\d+)?\s*g\b/i.test(text)
  ) fields.add("fatG");

  return fields;
}

function foodSearchConfigured() {
  const url = clean(process.env.SUPABASE_URL, 1200);
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    8000
  );
  return Boolean(url && key);
}

function publicMatch(food = {}, match = {}) {
  return {
    id: clean(food?.id, 300) || null,
    name: clean(food?.displayName || food?.name, 260) || null,
    brand: clean(food?.brand, 120) || null,
    verified: food?.verified === true,
    confidence: round(finite(food?.metadata?.confidence, 0.5), 3),
    searchScore: round(finite(food?.metadata?.searchScore, 0), 2),
    coverage: round(finite(match?.coverage, 0), 3),
    exactIdentity: match?.exactIdentity === true,
    sourceType: clean(food?.metadata?.sourceType, 80) || null,
    sourceProvider: clean(food?.metadata?.sourceProvider, 160) || null
  };
}

function scaledNutrition(nutrition = {}, multiplier = 1, servingResolution = "") {
  const values = {
    calories: Number(nutrition?.calories),
    proteinG: Number(nutrition?.protein),
    carbsG: Number(nutrition?.carbs),
    fatG: Number(nutrition?.fat)
  };
  if (!Object.values(values).every((value) => Number.isFinite(value) && value >= 0)) return null;

  return {
    calories: Math.round(values.calories * multiplier),
    proteinG: round(values.proteinG * multiplier, 1),
    carbsG: round(values.carbsG * multiplier, 1),
    fatG: round(values.fatG * multiplier, 1),
    servingResolution
  };
}

function completeMacros(value = {}) {
  return ["calories", "protein", "carbs", "fat"].every((key) => {
    const number = Number(value?.[key]);
    return Number.isFinite(number) && number >= 0;
  });
}

function meaningfulTokens(value = "") {
  const stop = new Set(["a", "an", "the", "of", "and", "with", "one", "1", "my"]);
  return normalize(value)
    .split(" ")
    .filter((token) => token && !stop.has(token));
}

function tokenEquivalent(left, right) {
  if (left === right) return true;
  if (left.length >= 4 && right.length >= 4) {
    if (left.startsWith(right) || right.startsWith(left)) return true;
    const singularLeft = left.endsWith("s") ? left.slice(0, -1) : left;
    const singularRight = right.endsWith("s") ? right.slice(0, -1) : right;
    return singularLeft === singularRight;
  }
  return false;
}

function toGrams(amount, unit) {
  if (!amount || !unit) return null;
  if (["g", "gram", "grams"].includes(unit)) return amount;
  if (["kg", "kilogram", "kilograms"].includes(unit)) return amount * 1000;
  if (["oz", "ounce", "ounces"].includes(unit)) return amount * 28.349523125;
  if (["lb", "lbs", "pound", "pounds"].includes(unit)) return amount * 453.59237;
  return null;
}

function toMilliliters(amount, unit) {
  if (!amount || !unit) return null;
  if (["ml", "milliliter", "milliliters", "millilitre", "millilitres"].includes(unit)) return amount;
  if (["l", "liter", "liters", "litre", "litres"].includes(unit)) return amount * 1000;
  if (["tsp", "teaspoon", "teaspoons"].includes(unit)) return amount * 4.92892159375;
  if (["tbsp", "tablespoon", "tablespoons"].includes(unit)) return amount * 14.78676478125;
  if (["fl oz", "fluid ounce", "fluid ounces"].includes(unit)) return amount * 29.5735295625;
  if (["cup", "cups"].includes(unit)) return amount * 236.5882365;
  return null;
}

function normalizeUnit(value) {
  return normalize(value).replace(/\s+/g, " ");
}

function appendNote(existing, addition) {
  const left = clean(existing, 900);
  const right = clean(addition, 900);
  if (!left) return right;
  if (!right || left.includes(right)) return left;
  return `${left} ${right}`.slice(0, 1200);
}

function unresolved(reason) {
  return {
    resolved: false,
    reason,
    arguments: null,
    appliedFields: [],
    preservedExplicitFields: [],
    match: null,
    source: "ari_food_search",
    version: FOOD_RESOLUTION_VERSION
  };
}

function normalize(value) {
  return clean(value, 1600)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, decimals = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** decimals;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}
