// ARI vNext — trusted meal nutrition enrichment through ARI's server food search.
// The primary model identifies what the user ate. This layer prefers known
// catalog nutrition when the match is strong, preserves nutrition values the
// user explicitly supplied, and otherwise leaves estimation to the model.

import { searchAriFoodCatalog } from "../../ari-food-search.js";

export const FOOD_RESOLUTION_VERSION = "1.0.0";

export async function resolveMealNutritionFromFoodSearch({
  arguments: args = {},
  message = "",
  searchFn = searchAriFoodCatalog,
  allowExternal = true
} = {}) {
  const input = args && typeof args === "object" && !Array.isArray(args) ? { ...args } : {};
  const query = clean(input?.name, 220);
  if (!query) return unresolved("meal_name_missing");

  // In production vNext shares the same server-backed food search credentials
  // as /api/ari-food-search. If that server search is unavailable, do not block
  // meal logging; the model's estimate/repair path remains the fallback.
  if (searchFn === searchAriFoodCatalog && !foodSearchConfigured()) {
    return unresolved("food_search_unconfigured");
  }

  let result;
  try {
    result = await searchFn(query, { limit: 6, localCount: 0, allowExternal });
  } catch (error) {
    return unresolved(error?.name === "AbortError" ? "food_search_timeout" : "food_search_failed");
  }

  const candidates = Array.isArray(result?.results) ? result.results : [];
  const match = chooseStrongMatch(query, candidates);
  if (!match) {
    return {
      ...unresolved("no_strong_food_match"),
      candidateCount: candidates.length,
      externalSource: result?.externalSource || null
    };
  }

  const calculated = calculateCandidateNutrition(match.food, input);
  if (!calculated) {
    return {
      ...unresolved("matched_food_serving_unresolved"),
      candidateCount: candidates.length,
      match: publicMatch(match.food, match)
    };
  }

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
    "ARI Food Search",
    160
  );
  const provenance = match.food?.verified === true
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
    source: "ari_food_search",
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
      (display.length >= 5 && (display.includes(normalizedQuery) || normalizedQuery.includes(display))) ||
      (name.length >= 5 && (name.includes(normalizedQuery) || normalizedQuery.includes(name)));

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
  const basisGrams =
    positive(food?.nutritionBasis?.grams) ||
    positive(food?.nutritionBasis?.amount);

  const requestedGrams = toGrams(quantity, unit);
  if (requestedGrams && basisGrams) {
    return scaledNutrition(
      nutrition,
      requestedGrams / basisGrams,
      `weight:${round(requestedGrams, 2)}g`
    );
  }

  const label = food?.metadata?.labelNutrition;
  const labelServingGrams = positive(label?.servingGrams);
  const hasLabelServing = Array.isArray(food?.servings) &&
    food.servings.some((serving) => serving?.id === "label-serving" && positive(serving?.grams));

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

  // If the database's declared nutrition basis itself is a single serving,
  // permit one serving/item even when a gram conversion is unavailable.
  const basisType = normalize(food?.nutritionBasis?.type);
  if (basisType === "serving" && completeMacros(nutrition)) {
    return scaledNutrition(nutrition, quantity, "serving_basis");
  }

  return null;
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
