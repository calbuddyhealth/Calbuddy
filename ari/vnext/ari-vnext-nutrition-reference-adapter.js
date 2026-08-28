// ARI vNext — reference-bound Nutrition meal edits.
// Reference identity stays here; canonical persistence lives in NutritionService.

(() => {
  "use strict";

  const VERSION = "2.0.0";
  const SOURCE = "ari_vnext_nutrition_reference_adapter";
  let servicePromise = null;

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/nutrition/nutrition-service.js?v=1.1.0")
        .then((module) => module.default || module.NutritionService);
    }
    return servicePromise;
  }

  async function updateReferencedMeal({ mealId = "", changes = [] } = {}) {
    const service = await loadService();
    return await service.updateMeal({ mealId, changes });
  }

  window.AriVNextNutritionReferenceAdapter = Object.freeze({
    version: VERSION,
    source: SOURCE,
    ready: true,
    updateReferencedMeal
  });

  window.dispatchEvent(new CustomEvent("ari:vnextNutritionReferenceReady", {
    detail: { version: VERSION }
  }));
})();
