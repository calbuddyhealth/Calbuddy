// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-antiviral-registry.js
// Purpose: Register all antiviral sub-registries into Ari Medical knowledge.
// V1.0.0 — Antiviral Registry Loader / Modular Antiviral Architecture

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antiviralRegistry = {
  version: "1.0.0",

  register() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.register) {
      console.warn("ARI ANTIVIRAL REGISTRY: knowledge registry not loaded.");
      return null;
    }

    const entries = this.entries();

    return registry.register({
      id: "antiviral_medications",
      version: this.version,
      domain: "pharmacology",
      category: "medication_class",
      source: "ari-antiviral-registry",
      updated: "2026-07",
      advisoryOnly: true,
      entries
    });
  },

  entries() {
    return [
      ...this.from("herpesAntivirals"),
      ...this.from("influenzaAntivirals"),
      ...this.from("covidAntivirals"),
      ...this.from("hivAntiretrovirals"),
      ...this.from("hepatitisBAntivirals"),
      ...this.from("hepatitisCAntivirals"),
      ...this.from("rsvAntivirals")
    ];
  },

  from(key = "") {
    const module =
      window.Ari.medical.registries.infectiousDisease.antivirals?.[key];

    if (!module?.entries) return [];

    try {
      return module.entries();
    } catch (error) {
      console.warn(`ARI ANTIVIRAL REGISTRY: failed loading ${key}`, error);
      return [];
    }
  },

  status() {
    const modules = [
      "herpesAntivirals",
      "influenzaAntivirals",
      "covidAntivirals",
      "hivAntiretrovirals",
      "hepatitisBAntivirals",
      "hepatitisCAntivirals",
      "rsvAntivirals"
    ];

    return {
      antiviralRegistryRan: true,
      antiviralRegistryVersion: this.version,
      modules: modules.map(key => ({
        key,
        loaded: Boolean(
          window.Ari.medical.registries.infectiousDisease.antivirals?.[key]
        )
      })),
      totalEntries: this.entries().length,
      advisoryOnly: true
    };
  }
};

window.Ari.medical.registries.infectiousDisease.antiviralRegistry.register();

window.AriAntiviralRegistry =
  window.Ari.medical.registries.infectiousDisease.antiviralRegistry;

console.log(
  "ARI ANTIVIRAL REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antiviralRegistry.version
);