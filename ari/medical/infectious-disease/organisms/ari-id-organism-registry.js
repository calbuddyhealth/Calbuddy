// ari/medical/infectious-disease/organisms/ari-id-organism-registry.js
// Purpose: Register all infectious disease organism modules into Ari Medical knowledge.
// V1.0.0 — Infectious Disease Organism Registry Loader / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};

window.Ari.medical.infectiousDisease.organismRegistry = {
  version: "1.0.0",

  register() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.register) {
      console.warn("ARI ID ORGANISM REGISTRY: knowledge registry not loaded.");
      return null;
    }

    return registry.register({
      id: "infectious_disease_organisms",
      version: this.version,
      domain: "infectious_disease",
      category: "organism",
      source: "ari-id-organism-registry",
      updated: "2026-07",
      advisoryOnly: true,
      entries: this.entries()
    });
  },

  entries() {
    return [
      ...this.from("bacterialOrganisms"),
      ...this.from("viralOrganisms"),
      ...this.from("fungalOrganisms"),
      ...this.from("parasiticOrganisms")
    ];
  },

  from(key = "") {
    const module = window.Ari.medical.infectiousDisease.organisms?.[key];

    if (!module?.entries) return [];

    try {
      return module.entries();
    } catch (error) {
      console.warn(`ARI ID ORGANISM REGISTRY: failed loading ${key}`, error);
      return [];
    }
  },

  status() {
    const modules = [
      "bacterialOrganisms",
      "viralOrganisms",
      "fungalOrganisms",
      "parasiticOrganisms"
    ];

    return {
      organismRegistryRan: true,
      organismRegistryVersion: this.version,
      modules: modules.map(key => ({
        key,
        loaded: Boolean(window.Ari.medical.infectiousDisease.organisms?.[key])
      })),
      totalEntries: this.entries().length,
      advisoryOnly: true
    };
  }
};

window.Ari.medical.infectiousDisease.organismRegistry.register();

window.AriIDOrganismRegistry =
  window.Ari.medical.infectiousDisease.organismRegistry;

console.log(
  "ARI ID ORGANISM REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.organismRegistry.version
);