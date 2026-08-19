/* ARI Nutrition label-scan consent lazy loader v1.0.0 */
(() => {
  "use strict";

  let loading = null;

  function loadConsentModule() {
    if (window.AriAIConsent) return Promise.resolve(window.AriAIConsent);
    if (loading) return loading;

    loading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-ari-nutrition-consent="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.AriAIConsent || null), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "js/ai-processing-consent.js?v=1.1.0";
      script.dataset.ariNutritionConsent = "1";
      script.onload = () => resolve(window.AriAIConsent || null);
      script.onerror = () => reject(new Error("AI consent module could not load."));
      document.head.appendChild(script);
    });

    return loading;
  }

  document.addEventListener("click", async (event) => {
    const button = event.target?.closest?.("#nutritionLabelScanBtn");
    if (!button || window.AriAIConsent) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    button.disabled = true;
    try {
      const consent = await loadConsentModule();
      consent?.show?.();
    } catch (error) {
      console.error("[ARI Nutrition Consent]", error);
      window.alert("ARI could not open AI processing permission. Try again.");
    } finally {
      button.disabled = false;
    }
  }, true);
})();
