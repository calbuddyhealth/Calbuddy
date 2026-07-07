// ari/medical/core/ari-medical-knowledge-registry.js
// Purpose: Central registry for Ari Medical knowledge modules.
// V1.0.0 — Medical Knowledge Registry / Plug-in Architecture / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.knowledgeRegistry = {
  version: "1.0.0",

  modules: {},

  register(module = {}) {
    const id = String(module.id || "").trim();

    if (!id) {
      return this.error("Knowledge module missing id.");
    }

    this.modules[id] = {
      id,
      version: module.version || "1.0.0",
      domain: module.domain || "general",
      category: module.category || "uncategorized",
      source: module.source || id,
      updated: module.updated || null,
      advisoryOnly: module.advisoryOnly !== false,

      entries: Array.isArray(module.entries) ? module.entries : [],
      aliases: module.aliases || {},
      metadata: module.metadata || {}
    };

    return {
      registered: true,
      id,
      count: this.modules[id].entries.length
    };
  },

  getModule(id = "") {
    return this.modules[id] || null;
  },

  getAllModules() {
    return Object.values(this.modules);
  },

  search(query = "", options = {}) {
    const text = this.normalize(query);
    const domain = options.domain || null;
    const category = options.category || null;
    const limit = options.limit || 10;

    if (!text) return [];

    const results = [];

    this.getAllModules().forEach(module => {
      if (domain && module.domain !== domain) return;
      if (category && module.category !== category) return;

      module.entries.forEach(entry => {
        const score = this.scoreEntry(text, entry, module);

        if (score > 0) {
          results.push({
            moduleId: module.id,
            domain: module.domain,
            category: module.category,
            score,
            entry,
            source: module.source,
            advisoryOnly: true
          });
        }
      });
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  findByAlias(value = "", options = {}) {
    const text = this.normalize(value);
    if (!text) return [];

    const domain = options.domain || null;
    const results = [];

    this.getAllModules().forEach(module => {
      if (domain && module.domain !== domain) return;

      module.entries.forEach(entry => {
        const aliases = this.entryAliases(entry);

        if (aliases.some(alias => this.normalize(alias) === text)) {
          results.push({
            moduleId: module.id,
            domain: module.domain,
            category: module.category,
            score: 100,
            entry,
            source: module.source,
            matchType: "exact_alias",
            advisoryOnly: true
          });
        }
      });
    });

    return results;
  },

  findByDomain(domain = "", options = {}) {
    const category = options.category || null;

    return this.getAllModules()
      .filter(module => module.domain === domain)
      .filter(module => !category || module.category === category)
      .flatMap(module =>
        module.entries.map(entry => ({
          moduleId: module.id,
          domain: module.domain,
          category: module.category,
          entry,
          source: module.source,
          advisoryOnly: true
        }))
      );
  },

  scoreEntry(query = "", entry = {}, module = {}) {
    let score = 0;

    const fields = [
      entry.id,
      entry.name,
      entry.className,
      entry.label,
      entry.description,
      ...(entry.aliases || []),
      ...(entry.commonEffects || []),
      ...(entry.seriousEffects || []),
      ...(entry.warningSigns || []),
      ...(entry.relatedSymptoms || []),
      ...(entry.systems || []),
      ...(entry.tags || [])
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    fields.forEach(field => {
      if (field === query) score += 50;
      else if (field.includes(query)) score += 15;
      else if (query.includes(field) && field.length > 3) score += 10;
    });

    return score;
  },

  entryAliases(entry = {}) {
    return [
      entry.id,
      entry.name,
      entry.className,
      entry.label,
      ...(entry.aliases || [])
    ].filter(Boolean);
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  error(message = "") {
    return {
      registered: false,
      error: message
    };
  },

  status() {
    const modules = this.getAllModules();

    return {
      knowledgeRegistryRan: true,
      knowledgeRegistryVersion: this.version,
      moduleCount: modules.length,
      entryCount: modules.reduce((sum, module) => sum + module.entries.length, 0),
      modules: modules.map(module => ({
        id: module.id,
        domain: module.domain,
        category: module.category,
        entries: module.entries.length,
        version: module.version
      })),
      advisoryOnly: true
    };
  }
};

window.AriMedicalKnowledgeRegistry = window.Ari.medical.knowledgeRegistry;

console.log(
  "ARI MEDICAL KNOWLEDGE REGISTRY LOADED:",
  window.Ari.medical.knowledgeRegistry.version
);