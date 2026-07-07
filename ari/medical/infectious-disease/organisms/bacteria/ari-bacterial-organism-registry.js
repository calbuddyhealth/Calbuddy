// ari/medical/infectious-disease/organisms/bacteria/ari-bacterial-organism-registry.js
// Purpose: Register all bacterial organism sub-registries into Ari Medical knowledge.
// V1.0.0 — Bacterial Organism Registry Loader / Modular Bacteria Architecture

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.organisms =
  window.Ari.medical.infectiousDisease.organisms || {};
window.Ari.medical.infectiousDisease.organisms.bacteria =
  window.Ari.medical.infectiousDisease.organisms.bacteria || {};

window.Ari.medical.infectiousDisease.organisms.bacterialOrganisms = {
  version: "1.0.0",

  register() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.register) {
      console.warn("ARI BACTERIAL ORGANISM REGISTRY: knowledge registry not loaded.");
      return null;
    }

    return registry.register({
      id: "bacterial_organisms",
      version: this.version,
      domain: "infectious_disease",
      category: "organism",
      source: "ari-bacterial-organism-registry",
      updated: "2026-07",
      advisoryOnly: true,
      entries: this.entries()
    });
  },

  entries() {
    return [
      ...this.from("staphylococcusOrganisms"),
      ...this.from("streptococcusOrganisms"),
      ...this.from("enterococcusOrganisms"),
      ...this.from("enterobacteralesOrganisms"),
      ...this.from("pseudomonasOrganisms"),
      ...this.from("neisseriaHaemophilusOrganisms"),
      ...this.from("anaerobeOrganisms"),
      ...this.from("atypicalBacteriaOrganisms"),
      ...this.from("mycobacteriaOrganisms")
    ];
  },

  from(key = "") {
    const module =
      window.Ari.medical.infectiousDisease.organisms.bacteria?.[key];

    if (!module?.entries) return [];

    try {
      return module.entries();
    } catch (error) {
      console.warn(`ARI BACTERIAL ORGANISM REGISTRY: failed loading ${key}`, error);
      return [];
    }
  },

  status() {
    const modules = [
      "staphylococcusOrganisms",
      "streptococcusOrganisms",
      "enterococcusOrganisms",
      "enterobacteralesOrganisms",
      "pseudomonasOrganisms",
      "neisseriaHaemophilusOrganisms",
      "anaerobeOrganisms",
      "atypicalBacteriaOrganisms",
      "mycobacteriaOrganisms"
    ];

    return {
      bacterialOrganismRegistryRan: true,
      bacterialOrganismRegistryVersion: this.version,
      modules: modules.map(key => ({
        key,
        loaded: Boolean(
          window.Ari.medical.infectiousDisease.organisms.bacteria?.[key]
        )
      })),
      totalEntries: this.entries().length,
      advisoryOnly: true
    };
  }
};

window.Ari.medical.infectiousDisease.organisms.bacterialOrganisms.register();

window.AriBacterialOrganismRegistry =
  window.Ari.medical.infectiousDisease.organisms.bacterialOrganisms;

console.log(
  "ARI BACTERIAL ORGANISM REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.organisms.bacterialOrganisms.version
);