// ARI vNext — explicit permanent domain bootstrap.
// Loads mutation domains from one place instead of chaining imports between adapters.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_domain_bootstrap";
  const DOMAIN_MODULES = Object.freeze([
    "./ari-vnext-weight-goals-service-adapter.js?v=1.1.0",
    "./ari-vnext-training-registry-adapter.js?v=2.0.0",
    "./ari-vnext-nutrition-registry-adapter.js?v=1.2.0"
  ]);

  window.Ari = window.Ari || {};

  const api = {
    version: VERSION,
    source: SOURCE,
    ready: false,
    modules: DOMAIN_MODULES.map((value) => value.split("?")[0])
  };
  window.AriVNextDomainBootstrap = api;

  function domainsReady() {
    return Boolean(
      window.AriVNextWeightGoalsServiceAdapter?.ready === true &&
      window.AriVNextTrainingRegistryAdapter?.ready === true &&
      window.AriVNextNutritionRegistryAdapter?.ready === true
    );
  }

  async function install() {
    await Promise.all(DOMAIN_MODULES.map((src) => import(src)));
    const started = Date.now();
    while (!domainsReady()) {
      if (Date.now() - started > 5000) throw new Error("Ari permanent domain adapters did not initialize completely.");
      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }
    api.ready = true;
    window.dispatchEvent(new CustomEvent("ari:vnextDomainBootstrapReady", {
      detail: { version: VERSION, source: SOURCE, modules: api.modules }
    }));
    return true;
  }

  install().catch((error) => {
    console.error("[Ari vNext] Domain bootstrap failed:", error?.message || error);
  });
})();
