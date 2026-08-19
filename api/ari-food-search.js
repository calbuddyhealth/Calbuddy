// =====================================================
// ARI EXPERIENCE
// File: api/ari-food-search.js
// Version: 1.1.0
// Purpose:
//   Authenticated hybrid grocery-food search + exact UPC lookup.
//
// Text search order:
//   1. ARI server-backed food_database cache
//   2. USDA FoodData Central Branded Foods when configured
//   3. Open Food Facts full-text fallback
//
// Barcode order:
//   1. Exact UPC in ARI food_database
//   2. Exact Open Food Facts barcode lookup
//   3. USDA exact GTIN/UPC fallback when configured
//
// Barcode lookups preserve label-serving nutrition separately from
// normalized per-100g nutrition so the UI can match the package label.
// =====================================================

const AUTH_TIMEOUT_MS = positiveInteger(process.env.ARI_AUTH_TIMEOUT_MS, 3500);
const CATALOG_TIMEOUT_MS = positiveInteger(process.env.ARI_FOOD_DB_TIMEOUT_MS, 2200);
const EXTERNAL_TIMEOUT_MS = positiveInteger(process.env.ARI_FOOD_EXTERNAL_TIMEOUT_MS, 3200);
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;

const PRIVATE_LABEL_BRANDS = [
  "kroger", "ralphs", "food 4 less", "food4less", "simple truth",
  "private selection", "great value", "signature select", "good & gather",
  "market pantry", "365 by whole foods market", "365 everyday value",
  "kirkland", "member's mark", "members mark"
];

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_food_search_api" });
  }

  const startedAt = Date.now();

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_food_search_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const body = resolveBody(req);
    const mode = cleanText(body.mode, 40).toLowerCase() === "barcode" ? "barcode" : "search";

    if (mode === "barcode") {
      const barcode = normalizeBarcode(body.barcode || body.query);
      if (!barcode) {
        return res.status(400).json({
          success: false,
          error: "A valid UPC/EAN barcode is required.",
          code: "INVALID_BARCODE",
          source: "ari_food_search_api",
          timing: { totalMs: Date.now() - startedAt }
        });
      }

      const result = await lookupBarcode(barcode);
      return res.status(200).json({
        success: true,
        mode: "barcode",
        barcode,
        match: result.food ? toClientFood(result.food) : null,
        lookupStatus: result.status,
        confidence: result.confidence,
        fallbackEligible: result.status !== "matched",
        fallbackReason: result.fallbackReason,
        externalSource: result.externalSource,
        source: "ari_food_search_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const query = cleanText(body.query, 160);
    const limit = clampInteger(body.limit, 1, MAX_LIMIT, DEFAULT_LIMIT);
    const localCount = clampInteger(body.localCount, 0, 100, 0);

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        results: [],
        source: "ari_food_search_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const databaseResults = await searchCatalog(query, limit);
    let externalResults = [];
    let externalSource = null;
    const enoughCombinedResults = databaseResults.length + localCount >= Math.min(6, limit);
    const externalEligible = query.includes(" ") || query.length >= 6;

    if (!enoughCombinedResults && externalEligible) {
      const usdaKey = cleanText(process.env.USDA_FDC_API_KEY, 500);
      if (usdaKey) {
        externalResults = await searchUsdaBranded(query, Math.max(limit, 10), usdaKey);
        externalSource = externalResults.length ? "usda" : null;
      }
      if (!externalResults.length) {
        externalResults = await searchOpenFoodFacts(query, Math.max(limit, 12));
        externalSource = externalResults.length ? "open_food_facts" : externalSource;
      }
    }

    const merged = mergeAndRank(query, databaseResults, externalResults, limit);

    // Existing typed-search behavior keeps a provenance-tagged external cache.
    // Exact barcode scans are intentionally not written here; user label evidence
    // is stored separately in nutrition_label_evidence.
    if (externalResults.length) {
      cacheExternalResults(externalResults.slice(0, 10)).catch((error) => {
        console.warn("[ARI Food Search Cache Warning]", error?.message || error);
      });
    }

    return res.status(200).json({
      success: true,
      results: merged.map(toClientFood),
      catalogHits: databaseResults.length,
      externalSource,
      source: "ari_food_search_api",
      timing: { totalMs: Date.now() - startedAt }
    });
  } catch (error) {
    console.error("[ARI Food Search Error]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Food search failed.",
      source: "ari_food_search_api",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

async function lookupBarcode(barcode) {
  const catalog = await searchCatalogBarcode(barcode);
  if (catalog) return evaluateBarcodeFood(catalog, "ari_catalog");

  const openFoodFacts = await lookupOpenFoodFactsBarcode(barcode);
  if (openFoodFacts) return evaluateBarcodeFood(openFoodFacts, "open_food_facts");

  const usdaKey = cleanText(process.env.USDA_FDC_API_KEY, 500);
  if (usdaKey) {
    const usda = await lookupUsdaBarcode(barcode, usdaKey);
    if (usda) return evaluateBarcodeFood(usda, "usda");
  }

  return {
    food: null,
    status: "not_found",
    confidence: 0,
    fallbackReason: "barcode_not_found",
    externalSource: null
  };
}

function evaluateBarcodeFood(food, externalSource) {
  const label = food?.labelNutrition || makeLabelNutrition(food);
  const hasIdentity = Boolean(food?.name && (food?.brand || food?.displayName));
  const hasServing = Boolean(label?.servingLabel || positiveNumber(label?.servingGrams));
  const hasCalories = Number.isFinite(Number(label?.calories)) && Number(label.calories) >= 0;
  const macroCount = [label?.protein, label?.carbs, label?.fat]
    .filter((value) => Number.isFinite(Number(value)) && Number(value) >= 0).length;

  let confidence = clampNumber(food?.confidence, 0, 1, 0.5);
  if (hasIdentity) confidence += 0.08;
  if (hasServing) confidence += 0.08;
  if (hasCalories) confidence += 0.08;
  if (macroCount === 3) confidence += 0.06;
  confidence = clampNumber(confidence, 0, 0.99, 0.5);

  const complete = hasIdentity && hasServing && hasCalories && macroCount === 3;
  const matched = complete && confidence >= 0.72;

  return {
    food: { ...food, labelNutrition: label },
    status: matched ? "matched" : "needs_verification",
    confidence,
    fallbackReason: matched ? null : "barcode_incomplete",
    externalSource
  };
}

async function searchCatalogBarcode(barcode) {
  const config = getSupabaseServerConfig();
  if (!config?.serviceRoleKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  const select = [
    "canonical_key", "name", "display_name", "brand", "category", "subcategory",
    "aliases", "tags", "upcs", "serving_size", "serving_grams", "calories",
    "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
    "nutrition_basis_grams", "source", "source_type", "source_id", "source_url",
    "verified", "confidence", "popularity"
  ].join(",");

  try {
    const url = `${config.url}/rest/v1/food_database?select=${encodeURIComponent(select)}&upcs=cs.${encodeURIComponent(`{${barcode}}`)}&active=eq.true&limit=1`;
    const response = await fetch(url, {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) && rows[0] ? normalizeCatalogRow(rows[0]) : null;
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Barcode Catalog Warning]", error?.message || error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupOpenFoodFactsBarcode(barcode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  const fields = [
    "code", "product_name", "brands", "serving_size", "serving_quantity",
    "product_quantity", "nutriments", "categories_tags"
  ].join(",");

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ARIExperience/1.1 (https://www.arixp.com)"
        },
        signal: controller.signal
      }
    );
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    if (Number(data?.status) !== 1 || !data?.product) return null;
    const food = normalizeOpenFoodFactsFood({ ...data.product, code: data.product.code || barcode });
    return food?.name ? food : null;
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Barcode OFF Warning]", error?.message || error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupUsdaBarcode(barcode, apiKey) {
  const foods = await searchUsdaBranded(barcode, 20, apiKey, false);
  const normalizedTarget = normalizeBarcode(barcode);
  return foods.find((food) => (food.upcs || []).some((upc) => normalizeBarcode(upc) === normalizedTarget)) || null;
}

async function searchCatalog(query, limit) {
  const config = getSupabaseServerConfig();
  if (!config?.serviceRoleKey) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/search_ari_food_database`, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({ search_query: query, result_limit: limit })
    });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeCatalogRow).filter(Boolean) : [];
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Food Search Catalog Error]", error?.message || error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function searchUsdaBranded(query, limit, apiKey, excludePrivateLabels = true) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          dataType: ["Branded"],
          pageSize: Math.min(25, Math.max(10, limit)),
          pageNumber: 1
        })
      }
    );
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const foods = (Array.isArray(data?.foods) ? data.foods : [])
      .map(normalizeUsdaFood)
      .filter(isUsableExternalFood);
    return excludePrivateLabels ? foods.filter((food) => !isPrivateLabel(food.brand)) : foods;
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Food Search USDA Warning]", error?.message || error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function searchOpenFoodFacts(query, limit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(Math.min(25, Math.max(12, limit))),
    fields: ["code", "product_name", "brands", "serving_size", "serving_quantity", "nutriments", "categories_tags"].join(",")
  });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": "ARIExperience/1.1 (https://www.arixp.com)" },
      signal: controller.signal
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    return (Array.isArray(data?.products) ? data.products : [])
      .map(normalizeOpenFoodFactsFood)
      .filter(isUsableExternalFood)
      .filter((food) => !isPrivateLabel(food.brand));
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Food Search OFF Warning]", error?.message || error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCatalogRow(row) {
  if (!row || typeof row !== "object") return null;
  const brand = cleanText(row.brand, 120);
  const name = cleanText(row.name, 220);
  if (!name) return null;
  const food = {
    canonicalKey: cleanText(row.canonical_key, 260) || makeCanonicalKey(brand, name),
    name,
    displayName: cleanText(row.display_name, 260) || joinName(brand, name),
    brand,
    category: cleanText(row.category, 80) || "branded-food",
    subcategory: cleanText(row.subcategory, 80),
    aliases: stringArray(row.aliases, 20, 120),
    tags: stringArray(row.tags, 20, 80),
    upcs: stringArray(row.upcs, 12, 40),
    servingSize: cleanText(row.serving_size, 120),
    servingGrams: positiveNumber(row.serving_grams),
    calories: nonNegativeNumber(row.calories),
    protein: nonNegativeNumber(row.protein_g),
    carbs: nonNegativeNumber(row.carbs_g),
    fat: nonNegativeNumber(row.fat_g),
    fiber: nonNegativeNumber(row.fiber_g),
    sugar: nonNegativeNumber(row.sugar_g),
    sodiumMg: nonNegativeNumber(row.sodium_mg),
    basisGrams: positiveNumber(row.nutrition_basis_grams) || 100,
    source: cleanText(row.source, 120) || "ARI Food Database",
    sourceType: cleanText(row.source_type, 80) || "ari_catalog",
    sourceId: cleanText(row.source_id, 160),
    sourceUrl: cleanText(row.source_url, 1000),
    verified: row.verified === true,
    confidence: clampNumber(row.confidence, 0, 1, 0.5),
    popularity: clampNumber(row.popularity, 0, 100, 0),
    score: Number(row.score) || 0,
    cached: true
  };
  food.labelNutrition = makeLabelNutrition(food);
  return food;
}

function normalizeUsdaFood(food) {
  if (!food || typeof food !== "object") return null;
  const brand = cleanText(food.brandName || food.brandOwner, 120);
  const name = cleanText(food.description, 220);
  const servingGrams = servingToGrams(food.servingSize, food.servingSizeUnit);
  const normalized = {
    canonicalKey: makeCanonicalKey(brand, name),
    name,
    displayName: joinName(brand, name),
    brand,
    category: cleanText(food.brandedFoodCategory, 80) || "branded-food",
    subcategory: "",
    aliases: [],
    tags: ["branded", "packaged", "grocery"],
    upcs: cleanText(food.gtinUpc, 40) ? [cleanText(food.gtinUpc, 40)] : [],
    servingSize: cleanText(food.householdServingFullText, 120) || formatServing(food.servingSize, food.servingSizeUnit),
    servingGrams,
    calories: readUsdaNutrient(food, ["1008"], ["energy"], "kcal"),
    protein: readUsdaNutrient(food, ["1003"], ["protein"]),
    carbs: readUsdaNutrient(food, ["1005"], ["carbohydrate"]),
    fat: readUsdaNutrient(food, ["1004"], ["total lipid", "total fat"]),
    fiber: readUsdaNutrient(food, ["1079"], ["fiber"]),
    sugar: readUsdaNutrient(food, ["2000"], ["sugars", "sugar"]),
    sodiumMg: readUsdaNutrient(food, ["1093"], ["sodium"]),
    basisGrams: 100,
    source: "USDA FoodData Central",
    sourceType: "usda_branded",
    sourceId: cleanText(food.fdcId, 80),
    sourceUrl: food.fdcId ? `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients` : "",
    verified: false,
    confidence: 0.88,
    popularity: 55,
    score: 0,
    cached: false,
    sourcePayload: { fdcId: food.fdcId || null, dataType: food.dataType || null, gtinUpc: food.gtinUpc || null }
  };
  normalized.labelNutrition = makeLabelNutrition(normalized);
  return normalized;
}

function normalizeOpenFoodFactsFood(product) {
  if (!product || typeof product !== "object") return null;
  const n = product.nutriments || {};
  const brand = cleanText(String(product.brands || "").split(",")[0], 120);
  const name = cleanText(product.product_name, 220);
  const servingGrams = positiveNumber(product.serving_quantity) || gramsFromServingText(product.serving_size);

  const calories100 = firstNullableNumber(
    n["energy-kcal_100g"],
    Number.isFinite(Number(n.energy_100g)) ? Number(n.energy_100g) / 4.184 : null
  );
  const protein100 = firstNullableNumber(n.proteins_100g);
  const carbs100 = firstNullableNumber(n.carbohydrates_100g);
  const fat100 = firstNullableNumber(n.fat_100g);
  const fiber100 = firstNullableNumber(n.fiber_100g);
  const sugar100 = firstNullableNumber(n.sugars_100g);
  const sodium100mg = Number.isFinite(Number(n.sodium_100g)) ? Math.max(0, Number(n.sodium_100g) * 1000) : null;

  const normalized = {
    canonicalKey: makeCanonicalKey(brand, name),
    name,
    displayName: joinName(brand, name),
    brand,
    category: Array.isArray(product.categories_tags) ? cleanText(product.categories_tags[0], 80).replace(/^en:/, "") || "branded-food" : "branded-food",
    subcategory: "",
    aliases: [],
    tags: ["branded", "packaged", "grocery"],
    upcs: cleanText(product.code, 40) ? [cleanText(product.code, 40)] : [],
    servingSize: cleanText(product.serving_size, 120),
    servingGrams,
    calories: nonNegativeNumber(calories100),
    protein: nonNegativeNumber(protein100),
    carbs: nonNegativeNumber(carbs100),
    fat: nonNegativeNumber(fat100),
    fiber: nonNegativeNumber(fiber100),
    sugar: nonNegativeNumber(sugar100),
    sodiumMg: nonNegativeNumber(sodium100mg),
    basisGrams: 100,
    source: "Open Food Facts",
    sourceType: "open_food_facts",
    sourceId: cleanText(product.code, 80),
    sourceUrl: product.code ? `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code)}` : "",
    verified: false,
    confidence: 0.62,
    popularity: 35,
    score: 0,
    cached: false,
    sourcePayload: { code: product.code || null }
  };

  const scale = servingGrams ? servingGrams / 100 : null;
  normalized.labelNutrition = {
    servingLabel: normalized.servingSize || (servingGrams ? `${round(servingGrams, 1)} g` : "1 serving"),
    servingGrams,
    calories: firstNullableNumber(n["energy-kcal_serving"], scale !== null && calories100 !== null ? calories100 * scale : null),
    protein: firstNullableNumber(n.proteins_serving, scale !== null && protein100 !== null ? protein100 * scale : null),
    carbs: firstNullableNumber(n.carbohydrates_serving, scale !== null && carbs100 !== null ? carbs100 * scale : null),
    fat: firstNullableNumber(n.fat_serving, scale !== null && fat100 !== null ? fat100 * scale : null),
    fiber: firstNullableNumber(n.fiber_serving, scale !== null && fiber100 !== null ? fiber100 * scale : null),
    sugar: firstNullableNumber(n.sugars_serving, scale !== null && sugar100 !== null ? sugar100 * scale : null),
    sodiumMg: firstNullableNumber(
      Number.isFinite(Number(n.sodium_serving)) ? Number(n.sodium_serving) * 1000 : null,
      scale !== null && sodium100mg !== null ? sodium100mg * scale : null
    )
  };

  return normalized;
}

function makeLabelNutrition(food) {
  const servingGrams = positiveNumber(food?.servingGrams);
  const basisGrams = positiveNumber(food?.basisGrams) || 100;
  const scale = servingGrams ? servingGrams / basisGrams : 1;
  return {
    servingLabel: cleanText(food?.servingSize, 120) || (servingGrams ? `${round(servingGrams, 1)} g` : "1 serving"),
    servingGrams,
    calories: Number.isFinite(Number(food?.calories)) ? Number(food.calories) * scale : null,
    protein: Number.isFinite(Number(food?.protein)) ? Number(food.protein) * scale : null,
    carbs: Number.isFinite(Number(food?.carbs)) ? Number(food.carbs) * scale : null,
    fat: Number.isFinite(Number(food?.fat)) ? Number(food.fat) * scale : null,
    fiber: Number.isFinite(Number(food?.fiber)) ? Number(food.fiber) * scale : null,
    sugar: Number.isFinite(Number(food?.sugar)) ? Number(food.sugar) * scale : null,
    sodiumMg: Number.isFinite(Number(food?.sodiumMg)) ? Number(food.sodiumMg) * scale : null
  };
}

function isUsableExternalFood(food) {
  return Boolean(food && food.name && food.brand && Number.isFinite(food.calories) && Number.isFinite(food.protein) && Number.isFinite(food.carbs) && Number.isFinite(food.fat));
}

function mergeAndRank(query, databaseResults, externalResults, limit) {
  const map = new Map();
  for (const food of [...databaseResults, ...externalResults]) {
    if (!food?.canonicalKey) continue;
    const score = Number(food.score) || scoreFood(food, query);
    const existing = map.get(food.canonicalKey);
    if (!existing || score > existing.score) map.set(food.canonicalKey, { ...food, score });
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, limit);
}

function scoreFood(food, query) {
  const needle = normalizeText(query);
  const display = normalizeText(food.displayName || food.name);
  const name = normalizeText(food.name);
  const brand = normalizeText(food.brand);
  const haystack = normalizeText([food.brand, food.name, ...(food.aliases || []), ...(food.tags || [])].join(" "));
  if (!needle) return 0;
  let score = 0;
  if (display === needle) score += 1000;
  else if (name === needle) score += 960;
  else if (brand === needle) score += 900;
  if (display.startsWith(needle)) score += 720;
  if (name.startsWith(needle)) score += 680;
  if (brand.startsWith(needle)) score += 620;
  if (haystack.includes(needle)) score += 420;
  const tokens = needle.split(" ").filter(Boolean);
  const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
  if (tokens.length && matchedTokens === tokens.length) score += 360;
  score += matchedTokens * 45;
  score += food.verified ? 70 : 0;
  score += clampNumber(food.confidence, 0, 1, 0.5) * 35;
  score += clampNumber(food.popularity, 0, 100, 0) / 4;
  return score;
}

function toClientFood(food) {
  const basisGrams = positiveNumber(food.basisGrams) || 100;
  const servings = [];
  if (positiveNumber(food.servingGrams)) {
    servings.push({
      id: "label-serving",
      label: food.servingSize || `${round(food.servingGrams, 1)} g`,
      amount: 1,
      unit: "serving",
      grams: food.servingGrams,
      isDefault: true
    });
  }
  servings.push({ id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: servings.length === 0 });

  return {
    id: `cloud-${food.canonicalKey}`,
    name: food.name,
    displayName: food.displayName || joinName(food.brand, food.name),
    brand: food.brand || null,
    category: food.category || "branded-food",
    state: "solid",
    preparation: "packaged-ready-to-eat",
    aliases: food.aliases || [],
    tags: Array.from(new Set([...(food.tags || []), "ari-cloud-catalog"])),
    popularity: Math.round(clampNumber(food.popularity, 0, 100, 0)),
    nutritionBasis: { type: "weight", amount: basisGrams, unit: "g", grams: basisGrams },
    nutrition: {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodiumMg: food.sodiumMg || 0
    },
    servings,
    source: "AriBrandCloud",
    verified: food.verified === true,
    metadata: {
      brandSpecific: true,
      packagedProduct: true,
      canonicalKey: food.canonicalKey,
      upcs: food.upcs || [],
      sourceType: food.sourceType || "ari_catalog",
      sourceProvider: food.source || "ARI Food Database",
      sourceId: food.sourceId || null,
      sourceUrl: food.sourceUrl || null,
      confidence: clampNumber(food.confidence, 0, 1, 0.5),
      cached: food.cached === true,
      labelNutrition: food.labelNutrition || makeLabelNutrition(food)
    }
  };
}

async function cacheExternalResults(foods) {
  const config = getSupabaseServerConfig();
  if (!config?.serviceRoleKey || !Array.isArray(foods) || !foods.length) return;
  const rows = foods
    .filter(isUsableExternalFood)
    .filter((food) => !isPrivateLabel(food.brand))
    .map((food) => ({
      canonical_key: food.canonicalKey,
      name: food.name,
      display_name: food.displayName,
      brand: food.brand || null,
      category: food.category || "branded-food",
      subcategory: food.subcategory || null,
      aliases: food.aliases || [],
      tags: food.tags || [],
      upcs: food.upcs || [],
      serving_size: food.servingSize || null,
      serving_grams: food.servingGrams || null,
      calories: food.calories,
      protein_g: food.protein,
      carbs_g: food.carbs,
      fat_g: food.fat,
      fiber_g: food.fiber || 0,
      sugar_g: food.sugar || 0,
      sodium_mg: food.sodiumMg || 0,
      nutrition_basis_grams: food.basisGrams || 100,
      source: food.source || "external",
      source_type: food.sourceType || "external",
      source_id: food.sourceId || null,
      source_url: food.sourceUrl || null,
      source_payload: food.sourcePayload || {},
      verified: food.verified === true,
      confidence: clampNumber(food.confidence, 0, 1, 0.5),
      popularity: Math.round(clampNumber(food.popularity, 0, 100, 0)),
      retailer_private_label: false,
      active: true,
      last_seen_at: new Date().toISOString()
    }));
  if (!rows.length) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/rest/v1/food_database?on_conflict=canonical_key`, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      signal: controller.signal,
      body: JSON.stringify(rows)
    });
    if (!response.ok) console.warn("[ARI Food Search Cache Write Warning]", response.status);
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI Food Search Cache Write Error]", error?.message || error);
  } finally {
    clearTimeout(timer);
  }
}

function readUsdaNutrient(food, nutrientNumbers = [], names = [], requiredUnit = "") {
  const list = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  for (const nutrient of list) {
    const number = cleanText(nutrient?.nutrientNumber || nutrient?.nutrientId, 40);
    const name = normalizeText(nutrient?.nutrientName || nutrient?.name);
    const unit = normalizeText(nutrient?.unitName || nutrient?.unit);
    const numberMatch = nutrientNumbers.some((candidate) => number === String(candidate));
    const nameMatch = names.some((candidate) => name.includes(normalizeText(candidate)));
    const unitMatch = !requiredUnit || unit === normalizeText(requiredUnit);
    if ((numberMatch || nameMatch) && unitMatch) return nonNegativeNumber(nutrient?.value ?? nutrient?.amount);
  }
  return 0;
}

function getSupabaseServerConfig() {
  const url = cleanText(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const serviceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  const publicKey = cleanText(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || serviceRoleKey, 5000);
  return url ? { url, serviceRoleKey, publicKey } : null;
}

async function authenticateRequest(req) {
  const authorization = cleanText(req?.headers?.authorization, 5000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = cleanText(match?.[1], 5000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };
  const config = getSupabaseServerConfig();
  if (!config?.url || !config?.publicKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.publicKey, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = cleanText(user?.id, 200);
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    return { authenticated: true, userId };
  } catch (error) {
    return { authenticated: false, status: 503, code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED", message: "ARI could not verify the signed-in session." };
  } finally {
    clearTimeout(timer);
  }
}

function isPrivateLabel(brand) {
  const normalized = normalizeText(brand);
  return PRIVATE_LABEL_BRANDS.some((blocked) => normalized.includes(normalizeText(blocked)));
}

function makeCanonicalKey(brand, name) {
  const normalized = normalizeText(`${brand || "brand"} ${name || "product"}`)
    .replace(/\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|lb|lbs|g|kg|ml|l|ct|count)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.replace(/\s+/g, "-").slice(0, 240) || `food-${Date.now()}`;
}

function joinName(brand, name) {
  const cleanBrand = cleanText(brand, 120);
  const cleanName = cleanText(name, 220);
  if (!cleanBrand) return cleanName;
  if (normalizeText(cleanName).startsWith(normalizeText(cleanBrand))) return cleanName;
  return `${cleanBrand} ${cleanName}`.trim();
}

function normalizeBarcode(value) {
  const digits = cleanText(value, 64).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits : "";
}

function servingToGrams(value, unit) {
  const amount = positiveNumber(value);
  if (!amount) return null;
  const normalizedUnit = normalizeText(unit);
  if (["g", "gram", "grams"].includes(normalizedUnit)) return amount;
  if (["oz", "ounce", "ounces"].includes(normalizedUnit)) return amount * 28.349523125;
  return null;
}

function gramsFromServingText(value) {
  const text = cleanText(value, 120);
  const match = /(?:\(|\b)(\d+(?:\.\d+)?)\s*g\b/i.exec(text);
  return match ? positiveNumber(match[1]) : null;
}

function formatServing(amount, unit) {
  const number = positiveNumber(amount);
  const cleanUnit = cleanText(unit, 20);
  return number && cleanUnit ? `${number} ${cleanUnit}` : "";
}

function firstNullableNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return null;
}

function stringArray(value, maxItems = 20, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function normalizeText(value) {
  return cleanText(value, 1000).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function round(value, decimals = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** decimals;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
