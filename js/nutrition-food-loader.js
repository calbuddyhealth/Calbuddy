/* =====================================================
   ARI Nutrition Food Loader
   Version: 1.0.2
   Keeps the local food database off Nutrition's critical
   rendering path while preserving the existing registry,
   search, hybrid search, and calculator architecture.

   V1.0.2:
   - Adds the curated prepared-meals core module.

   V1.0.1:
   - Never hydrates the full database automatically on page open.
   - Starts only when the user interacts with Food Name or code
     explicitly requests start().
   - Loads food modules in small ordered batches.
   - Yields back to the browser between batches so taps, scrolling,
     disclosure controls, barcode UI, and manual meal entry remain
     responsive on iPhone/WKWebView.
===================================================== */

(() => {
  "use strict";

  const VERSION = "1.0.2";
  const FOOD_BATCH_SIZE = 3;
  const REGISTRY_SCRIPT = "ari/nutrition/AriFoodRegistry.js?v=2.0.1";
  const ENGINE_SCRIPTS = Object.freeze([
    "ari/nutrition/AriFoodSearch.js?v=1.0.0",
    "ari/nutrition/AriHybridFoodSearch.js?v=1.0.1",
    "ari/nutrition/AriFoodCalculator.js?v=1.0.0"
  ]);

  const FOOD_DATA_SCRIPTS = Object.freeze([
    "ari/nutrition/data/beverages/AriFoodBeverages.js?v=1.0.0",
    "ari/nutrition/data/beverages/AriFoodBeverageCore.js",
    "ari/nutrition/data/beverages/AriFoodSodaBrands.js",
    "ari/nutrition/data/beverages/AriFoodEnergyDrinkBrands.js",
    "ari/nutrition/data/beverages/AriFoodSportsDrinkBrands.js",
    "ari/nutrition/data/beverages/AriFoodJuiceBrands.js",
    "ari/nutrition/data/beverages/AriFoodCoffeeTeaBrands.js",
    "ari/nutrition/data/beverages/AriFoodWaterBrands.js",
    "ari/nutrition/data/beverages/AriFoodBeverageBrands2.js",
    "ari/nutrition/data/beverages/AriFoodBeverageBrands3.js",

    "ari/nutrition/data/condiments/AriFoodCondiments.js?v=1.0.0",
    "ari/nutrition/data/condiments/AriFoodCondimentsCore.js",
    "ari/nutrition/data/condiments/AriFoodCondimentBrands.js",

    "ari/nutrition/data/dairy/AriFoodDairy.js?v=1.0.0",
    "ari/nutrition/data/dairy/AriFoodDairyCore.js",
    "ari/nutrition/data/dairy/AriFoodMilkBrands.js",
    "ari/nutrition/data/dairy/AriFoodYogurtBrands.js",
    "ari/nutrition/data/dairy/AriFoodCheeseBrands.js",
    "ari/nutrition/data/dairy/AriFoodDairyBrands2.js",
    "ari/nutrition/data/dairy/AriFoodDairyBrands3.js",

    "ari/nutrition/data/fats/AriFoodFats.js?v=1.0.0",
    "ari/nutrition/data/fats/AriFoodFatsCore.js",
    "ari/nutrition/data/fats/AriFoodFatBrands.js",

    "ari/nutrition/data/fruit/AriFoodFruit.js?v=1.0.0",
    "ari/nutrition/data/fruit/AriFoodCommonFruit.js",
    "ari/nutrition/data/fruit/AriFoodBerries.js",
    "ari/nutrition/data/fruit/AriFoodCitrus.js",
    "ari/nutrition/data/fruit/AriFoodTropicalFruit.js",
    "ari/nutrition/data/fruit/AriFoodStoneFruit.js",
    "ari/nutrition/data/fruit/AriFoodMelons.js",
    "ari/nutrition/data/fruit/AriFoodDriedFruit.js",

    "ari/nutrition/data/grains/AriFoodGrains.js?v=1.1.0",
    "ari/nutrition/data/grains/AriFoodRice.js",
    "ari/nutrition/data/grains/AriFoodPasta.js",
    "ari/nutrition/data/grains/AriFoodBread.js",
    "ari/nutrition/data/grains/AriFoodOats.js",
    "ari/nutrition/data/grains/AriFoodOtherGrains.js",
    "ari/nutrition/data/grains/AriFoodCerealBrands.js",
    "ari/nutrition/data/grains/AriFoodCerealBrands2.js",
    "ari/nutrition/data/grains/AriFoodOatBrands.js",

    "ari/nutrition/data/prepared-meals/AriFoodPreparedMealsCore.js?v=1.0.0",
    "ari/nutrition/data/prepared-meals/AriFoodEverydayBreakfastSides.js?v=1.0.0",

    "ari/nutrition/data/nuts/AriFoodNuts.js?v=1.0.0",
    "ari/nutrition/data/nuts/AriFoodNutsCore.js",
    "ari/nutrition/data/nuts/AriFoodNutBrands.js",

    "ari/nutrition/data/oils/AriFoodOils.js?v=1.0.0",
    "ari/nutrition/data/oils/AriFoodOilsCore.js",
    "ari/nutrition/data/oils/AriFoodOilBrands.js",

    "ari/nutrition/data/proteins/AriFoodProteins.js?v=1.0.0",
    "ari/nutrition/data/proteins/AriFoodPoultry.js",
    "ari/nutrition/data/proteins/AriFoodBeef.js",
    "ari/nutrition/data/proteins/AriFoodPork.js",
    "ari/nutrition/data/proteins/AriFoodSeafood.js",
    "ari/nutrition/data/proteins/AriFoodEggs.js",
    "ari/nutrition/data/proteins/AriFoodLamb.js",
    "ari/nutrition/data/proteins/AriFoodGameMeats.js",
    "ari/nutrition/data/proteins/AriFoodPlantProteins.js",

    "ari/nutrition/data/seasonings/AriFoodSeasonings.js?v=1.0.0",
    "ari/nutrition/data/seasonings/AriFoodSeasoningsCore.js",
    "ari/nutrition/data/seasonings/AriFoodSeasoningBrands.js",

    "ari/nutrition/data/snacks/AriFoodSnacks.js?v=1.0.0",
    "ari/nutrition/data/snacks/AriFoodSnacksCore.js",
    "ari/nutrition/data/snacks/AriFoodSnackBrands.js",

    "ari/nutrition/data/spirits/AriFoodSpirits.js?v=1.1.0",
    "ari/nutrition/data/spirits/AriFoodSpiritsCore.js",
    "ari/nutrition/data/spirits/AriFoodBeerBrands.js",
    "ari/nutrition/data/spirits/AriFoodWineBrands.js",
    "ari/nutrition/data/spirits/AriFoodLiquorBrands.js",
    "ari/nutrition/data/spirits/AriFoodHardSeltzerBrands.js",
    "ari/nutrition/data/spirits/AriFoodCannedCocktailBrands.js",
    "ari/nutrition/data/spirits/AriFoodMaltBeverageBrands.js",
    "ari/nutrition/data/spirits/AriFoodCocktailBrands.js",

    "ari/nutrition/data/syrups/AriFoodSyrups.js?v=1.0.0",
    "ari/nutrition/data/syrups/AriFoodSyrupsCore.js",
    "ari/nutrition/data/syrups/AriFoodSyrupBrands.js",

    "ari/nutrition/data/vegetables/AriFoodVegetables.js?v=1.1.0",
    "ari/nutrition/data/vegetables/AriFoodLeafyVegetables.js",
    "ari/nutrition/data/vegetables/AriFoodCruciferousVegetables.js",
    "ari/nutrition/data/vegetables/AriFoodRootVegetables.js",
    "ari/nutrition/data/vegetables/AriFoodStarchyVegetables.js",
    "ari/nutrition/data/vegetables/AriFoodOtherVegetables.js",
    "ari/nutrition/data/vegetables/AriFoodPeppers.js",
    "ari/nutrition/data/vegetables/AriFoodDriedChiles.js"
  ]);

  const state = {
    status: "idle",
    startedAt: 0,
    readyAt: 0,
    promise: null,
    error: null,
    loadedModules: 0
  };

  function setFoodStatus(text, stateName = "loading") {
    const container = document.getElementById("manualFoodSystemStatus");
    const label = document.getElementById("manualFoodSystemStatusText");
    if (label) label.textContent = String(text || "");
    if (container) container.dataset.state = stateName;
  }

  function existingScript(src) {
    const clean = String(src || "").split("?")[0];
    return Array.from(document.scripts).find((script) => {
      const value = script.getAttribute("src") || "";
      return value === src || value.split("?")[0] === clean;
    });
  }

  function loadScript(src, { ordered = true } = {}) {
    const existing = existingScript(src);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = !ordered;
      script.dataset.ariNutritionLazy = "true";
      script.addEventListener("load", () => resolve(script), { once: true });
      script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
      document.head.appendChild(script);
    });
  }

  function yieldToBrowser() {
    return new Promise((resolve) => {
      const finish = () => window.setTimeout(resolve, 0);
      if (document.visibilityState === "visible" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(finish);
        return;
      }
      window.setTimeout(resolve, 16);
    });
  }

  async function loadFoodDataInBatches() {
    for (let index = 0; index < FOOD_DATA_SCRIPTS.length; index += FOOD_BATCH_SIZE) {
      const batch = FOOD_DATA_SCRIPTS.slice(index, index + FOOD_BATCH_SIZE);
      await Promise.all(batch.map((src) => loadScript(src)));
      state.loadedModules += batch.length;
      setFoodStatus(
        `FOOD SEARCH LOADING ${Math.min(state.loadedModules, FOOD_DATA_SCRIPTS.length)}/${FOOD_DATA_SCRIPTS.length}`,
        "loading"
      );
      await yieldToBrowser();
    }
  }

  function announceReady() {
    try { window.initializeNutritionFoodSystem?.(); } catch (error) {
      console.warn("[ARI Nutrition Food Loader] food status refresh failed", error);
    }

    const nameInput = document.getElementById("mealName");
    if (nameInput?.value?.trim()) {
      try { window.scheduleManualFoodSearch?.(); } catch {}
    }

    try {
      window.dispatchEvent(new CustomEvent("ari:nutritionFoodReady", {
        detail: {
          version: VERSION,
          foodCount: window.AriFoodRegistry?.count?.() || 0,
          loadMs: Math.max(0, Math.round(state.readyAt - state.startedAt))
        }
      }));
    } catch {}
  }

  async function start() {
    if (state.status === "ready") return true;
    if (state.promise) return state.promise;

    state.status = "loading";
    state.startedAt = performance.now();
    state.error = null;
    state.loadedModules = 0;
    setFoodStatus("FOOD SEARCH LOADING", "loading");

    state.promise = (async () => {
      try {
        await loadScript(REGISTRY_SCRIPT);
        await yieldToBrowser();
        await loadFoodDataInBatches();

        for (const src of ENGINE_SCRIPTS) {
          await loadScript(src);
          await yieldToBrowser();
        }

        state.readyAt = performance.now();
        state.status = "ready";
        announceReady();
        return true;
      } catch (error) {
        state.status = "error";
        state.error = error;
        state.promise = null;
        console.error("[ARI Nutrition Food Loader]", error);
        setFoodStatus("MANUAL MODE", "offline");
        return false;
      }
    })();

    return state.promise;
  }

  function markIdle() {
    if (state.status !== "idle") return;
    setFoodStatus("TAP FOOD NAME TO SEARCH", "idle");
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.target?.closest?.("#mealFoodSearchShell")) start().catch(() => {});
  }, { capture: true, passive: true });

  document.addEventListener("focusin", (event) => {
    if (event.target?.id === "mealName") start().catch(() => {});
  }, { capture: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markIdle, { once: true });
  } else {
    markIdle();
  }

  window.AriNutritionFoodLoader = Object.freeze({
    version: VERSION,
    start,
    getStatus: () => ({
      status: state.status,
      error: state.error?.message || null,
      foodCount: window.AriFoodRegistry?.count?.() || 0,
      loadedModules: state.loadedModules,
      totalModules: FOOD_DATA_SCRIPTS.length
    })
  });
})();