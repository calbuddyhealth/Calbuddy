// ARI vNext — server-side access to the same canonical food registry/search
// used by the Nutrition UI. Modules are loaded lazily once per server isolate.

export const CANONICAL_FOOD_REGISTRY_VERSION = "1.1.0";

let initializationPromise = null;

const DATA_MODULE_LOADERS = Object.freeze([
  () => import("../../../ari/nutrition/data/beverages/AriFoodBeverages.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodBeverageCore.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodSodaBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodEnergyDrinkBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodSportsDrinkBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodJuiceBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodCoffeeTeaBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodWaterBrands.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodBeverageBrands2.js"),
  () => import("../../../ari/nutrition/data/beverages/AriFoodBeverageBrands3.js"),

  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch1.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch2.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch3.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch4.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch5.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch6.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch7.js"),
  () => import("../../../ari/nutrition/data/branded/AriFoodTopBrandsBatch8.js"),

  () => import("../../../ari/nutrition/data/condiments/AriFoodCondiments.js"),
  () => import("../../../ari/nutrition/data/condiments/AriFoodCondimentsCore.js"),
  () => import("../../../ari/nutrition/data/condiments/AriFoodCondimentBrands.js"),

  () => import("../../../ari/nutrition/data/dairy/AriFoodDairy.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodDairyCore.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodMilkBrands.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodYogurtBrands.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodCheeseBrands.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodDairyBrands2.js"),
  () => import("../../../ari/nutrition/data/dairy/AriFoodDairyBrands3.js"),

  () => import("../../../ari/nutrition/data/fats/AriFoodFats.js"),
  () => import("../../../ari/nutrition/data/fats/AriFoodFatsCore.js"),
  () => import("../../../ari/nutrition/data/fats/AriFoodFatBrands.js"),

  () => import("../../../ari/nutrition/data/fruit/AriFoodFruit.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodCommonFruit.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodBerries.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodCitrus.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodTropicalFruit.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodStoneFruit.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodMelons.js"),
  () => import("../../../ari/nutrition/data/fruit/AriFoodDriedFruit.js"),

  () => import("../../../ari/nutrition/data/grains/AriFoodGrains.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodRice.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodPasta.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodBread.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodOats.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodOtherGrains.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodCerealBrands.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodCerealBrands2.js"),
  () => import("../../../ari/nutrition/data/grains/AriFoodOatBrands.js"),

  () => import("../../../ari/nutrition/data/prepared-meals/AriFoodPreparedMealsCore.js"),
  () => import("../../../ari/nutrition/data/prepared-meals/AriFoodEverydayBreakfastSides.js"),
  () => import("../../../ari/nutrition/data/prepared-meals/AriFoodEverydaySoupsMeals2.js"),

  () => import("../../../ari/nutrition/data/nuts/AriFoodNuts.js"),
  () => import("../../../ari/nutrition/data/nuts/AriFoodNutsCore.js"),
  () => import("../../../ari/nutrition/data/nuts/AriFoodNutBrands.js"),

  () => import("../../../ari/nutrition/data/oils/AriFoodOils.js"),
  () => import("../../../ari/nutrition/data/oils/AriFoodOilsCore.js"),
  () => import("../../../ari/nutrition/data/oils/AriFoodOilBrands.js"),

  () => import("../../../ari/nutrition/data/proteins/AriFoodProteins.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodPoultry.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodBeef.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodPork.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodSeafood.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodEggs.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodLamb.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodGameMeats.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodPlantProteins.js"),
  () => import("../../../ari/nutrition/data/proteins/AriFoodDeliMeatsCore.js"),

  () => import("../../../ari/nutrition/data/seasonings/AriFoodSeasonings.js"),
  () => import("../../../ari/nutrition/data/seasonings/AriFoodSeasoningsCore.js"),
  () => import("../../../ari/nutrition/data/seasonings/AriFoodSeasoningBrands.js"),

  () => import("../../../ari/nutrition/data/snacks/AriFoodSnacks.js"),
  () => import("../../../ari/nutrition/data/snacks/AriFoodSnacksCore.js"),
  () => import("../../../ari/nutrition/data/snacks/AriFoodSnackBrands.js"),

  () => import("../../../ari/nutrition/data/spirits/AriFoodSpirits.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodSpiritsCore.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodBeerBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodWineBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodLiquorBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodHardSeltzerBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodCannedCocktailBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodMaltBeverageBrands.js"),
  () => import("../../../ari/nutrition/data/spirits/AriFoodCocktailBrands.js"),

  () => import("../../../ari/nutrition/data/syrups/AriFoodSyrups.js"),
  () => import("../../../ari/nutrition/data/syrups/AriFoodSyrupsCore.js"),
  () => import("../../../ari/nutrition/data/syrups/AriFoodSyrupBrands.js"),

  () => import("../../../ari/nutrition/data/vegetables/AriFoodVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodLeafyVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodCruciferousVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodRootVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodStarchyVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodOtherVegetables.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodPeppers.js"),
  () => import("../../../ari/nutrition/data/vegetables/AriFoodDriedChiles.js")
]);

export async function ensureCanonicalFoodRegistry() {
  if (registryReady()) return diagnostics();

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await import("../../../ari/nutrition/AriFoodRegistry.js");

      const failures = [];
      for (let index = 0; index < DATA_MODULE_LOADERS.length; index += 1) {
        try {
          await DATA_MODULE_LOADERS[index]();
        } catch (error) {
          failures.push({
            index,
            message: String(error?.message || "module_load_failed").slice(0, 240)
          });
        }
      }

      await import("../../../ari/nutrition/AriFoodSearch.js");

      const result = diagnostics();
      if (!result.ready || result.foodCount < 1) {
        const error = new Error("Canonical ARI food registry did not initialize.");
        error.code = "ARI_CANONICAL_FOOD_REGISTRY_UNAVAILABLE";
        throw error;
      }

      return { ...result, moduleFailures: failures };
    })();

    initializationPromise.catch(() => {
      initializationPromise = null;
    });
  }

  return initializationPromise;
}

export async function searchCanonicalAriFoodRegistry(query, options = {}) {
  const state = await ensureCanonicalFoodRegistry();
  const search = globalThis.AriFoodSearch;
  if (!search || typeof search.search !== "function") {
    return {
      success: false,
      query: String(query || "").trim(),
      results: [],
      source: "ari_canonical_food_registry",
      registry: state
    };
  }

  const limit = clampInteger(options?.limit, 1, 12, 8);
  const cleanedQuery = String(query || "").trim();
  const registry = globalThis.AriFoodRegistry;

  const exact = [
    ...(typeof registry?.getByName === "function" ? registry.getByName(cleanedQuery) : []),
    ...(typeof registry?.getByAlias === "function" ? registry.getByAlias(cleanedQuery) : [])
  ];

  const fuzzy = search.search(cleanedQuery, {
    limit,
    includeSearchMeta: true,
    typoTolerance: true
  });

  const merged = [];
  const seen = new Set();
  for (const food of [...exact, ...(Array.isArray(fuzzy) ? fuzzy : [])]) {
    const id = String(food?.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(food);
    if (merged.length >= limit) break;
  }

  return {
    success: true,
    query: cleanedQuery,
    results: merged.map(toResolverFood),
    source: "ari_canonical_food_registry",
    registry: state
  };
}

function toResolverFood(food = {}) {
  const sourceProvider =
    food?.metadata?.sourceProvenance?.provider ||
    food?.metadata?.nutritionReference ||
    food?.source ||
    "ARI Canonical Food Registry";
  return {
    ...food,
    metadata: {
      ...(food?.metadata && typeof food.metadata === "object" ? food.metadata : {}),
      confidence: confidenceNumber(food),
      searchScore: Number(food?.search?.score || food?.score || 0),
      sourceType: "ari_canonical_registry",
      sourceProvider,
      canonicalRegistry: true
    }
  };
}

function confidenceNumber(food = {}) {
  const raw = food?.metadata?.confidence;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return Math.min(1, Math.max(0, numeric));
  const label = String(raw || "").toLowerCase();
  if (label === "high") return 0.95;
  if (label === "medium") return 0.75;
  if (label === "low") return 0.55;
  if (food?.verified === true) return 0.9;
  return 0.65;
}

function registryReady() {
  return Boolean(
    globalThis.AriFoodRegistry &&
    typeof globalThis.AriFoodRegistry.count === "function" &&
    globalThis.AriFoodRegistry.count() > 0 &&
    globalThis.AriFoodSearch &&
    typeof globalThis.AriFoodSearch.search === "function"
  );
}

function diagnostics() {
  return {
    ready: registryReady(),
    foodCount:
      typeof globalThis.AriFoodRegistry?.count === "function"
        ? Number(globalThis.AriFoodRegistry.count() || 0)
        : 0,
    registryVersion: globalThis.AriFoodRegistry?.VERSION || null,
    searchVersion: globalThis.AriFoodSearch?.VERSION || null,
    loaderVersion: CANONICAL_FOOD_REGISTRY_VERSION
  };
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}
