// =====================================================
// ARI REBIRTH
// File: ari/nutrition/ari-meal-resolution-runtime.js
// Version: 1.0.0-experimental
// Purpose: Resolve natural-language meal actions through ARI Nutrition data
// before CalBuddy.logMeal() is allowed to persist them.
// =====================================================
(() => {
  "use strict";
  window.Ari = window.Ari || {};

  const FOOD_SCRIPTS = [
    "ari/nutrition/AriFoodRegistry.js?v=2.0.1",
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
    "ari/nutrition/data/vegetables/AriFoodDriedChiles.js",
    "ari/nutrition/AriFoodSearch.js?v=1.0.0",
    "ari/nutrition/AriFoodCalculator.js?v=1.0.0"
  ];

  const Runtime = {
    version: "1.0.0-experimental",
    source: "ari-meal-resolution-runtime",
    _readyPromise: null,

    isPresent(src) {
      const target = String(src).split("?")[0].replace(/^\//, "");
      return Array.from(document.scripts || []).some(script => {
        const raw = script.getAttribute("src") || "";
        try { return new URL(raw, location.href).pathname.replace(/^\//, "") === target; }
        catch { return raw.split("?")[0].replace(/^\//, "") === target; }
      });
    },

    loadScript(src) {
      if (this.isPresent(src)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`nutrition_script_load_failed:${src}`));
        (document.head || document.documentElement).appendChild(script);
      });
    },

    async ensureReady() {
      if (window.AriFoodSearch?.search && window.AriFoodCalculator?.calculate) return true;
      if (!this._readyPromise) {
        this._readyPromise = (async () => {
          for (const src of FOOD_SCRIPTS) await this.loadScript(src);
          if (!window.AriFoodSearch?.search || !window.AriFoodCalculator?.calculate) {
            throw new Error("ari_nutrition_runtime_not_ready");
          }
          return true;
        })().catch(error => { this._readyPromise = null; throw error; });
      }
      return this._readyPromise;
    },

    cleanNumber(value) {
      const number = Number(value);
      return Number.isFinite(number) && number >= 0 ? number : 0;
    },

    normalizeItems(payload = {}) {
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length) return items;
      const name = payload.name || payload.description || payload.food || "";
      return name ? [{
        query: name,
        name,
        amount: payload.amount || payload.quantity || 1,
        unit: payload.unit || payload.serving_unit || "serving",
        estimatedGrams: payload.estimatedGrams || payload.estimated_grams || null,
        estimatedNutrition: payload.estimatedNutrition || null
      }] : [];
    },

    calculateCandidate(food, item) {
      const calculator = window.AriFoodCalculator;
      const grams = Number(item.estimatedGrams ?? item.estimated_grams);
      if (Number.isFinite(grams) && grams > 0) {
        const byGrams = calculator.calculate(food.id, grams, "g");
        if (byGrams?.ok) return byGrams;
      }
      const amount = Number(item.amount ?? item.quantity ?? 1);
      const unit = item.unit || item.servingUnit || item.serving_unit || "serving";
      const direct = calculator.calculate(food.id, Number.isFinite(amount) && amount > 0 ? amount : 1, unit);
      if (direct?.ok) return direct;
      return null;
    },

    resolveFallbackItem(item) {
      const estimate = item.estimatedNutrition || item.estimate || {};
      const calories = this.cleanNumber(estimate.calories ?? item.calories);
      if (!calories) return null;
      return {
        source: "openai-estimate-fallback",
        matched: false,
        name: item.name || item.query || "Food",
        displayName: item.name || item.query || "Food",
        requested: { amount: item.amount || item.quantity || 1, unit: item.unit || "serving" },
        nutrition: {
          calories,
          protein: this.cleanNumber(estimate.protein ?? estimate.protein_g ?? item.protein_g),
          carbs: this.cleanNumber(estimate.carbs ?? estimate.carbs_g ?? item.carbs_g),
          fat: this.cleanNumber(estimate.fat ?? estimate.fat_g ?? item.fat_g)
        }
      };
    },

    async resolveItem(item = {}) {
      const query = String(item.query || item.name || item.food || "").trim();
      if (!query) return null;
      const results = window.AriFoodSearch.search(query, { limit: 5, includeSearchMeta: true });
      for (const food of results) {
        const calculation = this.calculateCandidate(food, item);
        if (!calculation?.ok) continue;
        return {
          source: "ari-food-database",
          matched: true,
          foodId: food.id,
          name: food.name || query,
          displayName: food.displayName || food.name || query,
          requested: calculation.requested,
          resolved: calculation.resolved,
          nutrition: calculation.nutrition,
          search: food.search || null
        };
      }
      return this.resolveFallbackItem(item);
    },

    aggregate(items = []) {
      return items.reduce((total, item) => {
        const nutrition = item?.nutrition || {};
        total.calories += this.cleanNumber(nutrition.calories);
        total.protein += this.cleanNumber(nutrition.protein);
        total.carbs += this.cleanNumber(nutrition.carbs);
        total.fat += this.cleanNumber(nutrition.fat);
        return total;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },

    async resolveMeal(payload = {}) {
      await this.ensureReady();
      const requestedItems = this.normalizeItems(payload);
      if (!requestedItems.length) throw new Error("meal_items_missing");
      const resolvedItems = [];
      for (const item of requestedItems) {
        const resolved = await this.resolveItem(item);
        if (resolved) resolvedItems.push(resolved);
      }
      if (!resolvedItems.length) throw new Error("meal_nutrition_unresolved");
      const totals = this.aggregate(resolvedItems);
      if (!totals.calories) throw new Error("meal_calories_unresolved");
      const name = payload.name || resolvedItems.map(item => item.displayName).join(" + ");
      const serving = resolvedItems.map(item => {
        const amount = item.requested?.amount;
        const unit = item.requested?.unit;
        return `${amount || ""} ${unit || ""} ${item.displayName}`.replace(/\s+/g, " ").trim();
      }).join("; ");
      return {
        ...payload,
        name,
        calories: Math.round(totals.calories),
        protein_g: Math.round(totals.protein * 10) / 10,
        carbs_g: Math.round(totals.carbs * 10) / 10,
        fat_g: Math.round(totals.fat * 10) / 10,
        serving_size: serving || payload.serving_size || "Resolved by ARI Nutrition",
        nutritionResolution: {
          source: this.source,
          databasePreferred: true,
          itemCount: resolvedItems.length,
          allDatabaseMatched: resolvedItems.every(item => item.matched === true),
          items: resolvedItems,
          totals
        }
      };
    }
  };

  window.AriMealResolutionRuntime = Runtime;
  window.Ari.mealResolutionRuntime = Runtime;
})();