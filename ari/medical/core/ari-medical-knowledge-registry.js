// ari/medical/core/ari-medical-knowledge-registry.js
// Purpose: Central registry for Ari Medical knowledge modules.
// V1.1.0 — Schema-Aware Medical Knowledge Registry / Legacy Compatible

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.knowledgeRegistry = {
  version: "1.1.0",

  modules: {},

  register(module = {}) {
    const id = String(module.id || "").trim();

    if (!id) return this.error("Knowledge module missing id.");

    const rawEntries = Array.isArray(module.entries) ? module.entries : [];
    const entries = rawEntries.map(entry =>
      this.normalizeEntry(entry, module)
    );

    this.modules[id] = {
      id,
      version: module.version || "1.0.0",
      domain: module.domain || "general",
      category: module.category || "uncategorized",
      source: module.source || id,
      updated: module.updated || null,
      advisoryOnly: module.advisoryOnly !== false,
      entries,
      aliases: module.aliases || {},
      metadata: module.metadata || {}
    };

    return { registered: true, id, count: entries.length };
  },

  normalizeEntry(entry = {}, module = {}) {
    const schema = window.Ari.medical.knowledgeSchema;

    const schemaEntry = entry?.schema?.name === "ari-medical-knowledge-schema"
      ? entry
      : module.category === "medication_class"
        ? schema?.normalizeLegacyMedication?.(entry) || entry
        : schema?.create?.(entry) || entry;

    return this.withLegacyFields(schemaEntry);
  },

  withLegacyFields(entry = {}) {
    return {
      ...entry,

      name: entry.name || entry.identity?.name || "",
      className: entry.className || entry.identity?.className || entry.identity?.name || "",
      aliases: entry.aliases || entry.identity?.aliases || [],
      systems: entry.systems || entry.identity?.systems || [],

      riskTags: entry.riskTags || entry.recognition?.riskTags || [],
      interactionRisks: entry.interactionRisks || entry.interactions?.riskTags || [],

      commonEffects: entry.commonEffects || entry.effects?.common || [],
      seriousEffects: entry.seriousEffects || entry.effects?.serious || [],
      withdrawalEffects: entry.withdrawalEffects || entry.effects?.withdrawal || [],
      overdoseEffects: entry.overdoseEffects || entry.effects?.overdose || [],
      toxicityEffects: entry.toxicityEffects || entry.effects?.toxicity || [],

      warningSigns: entry.warningSigns || entry.safety?.redFlags || [],
      contraindications: entry.contraindications || entry.safety?.contraindications || [],
      precautions: entry.precautions || entry.safety?.precautions || [],

      monitoring:
        entry.monitoring ||
        [
          ...(entry.monitoring?.symptoms || []),
          ...(entry.monitoring?.labs || []),
          ...(entry.monitoring?.vitals || [])
        ],

      pediatricCaution:
        entry.pediatricCaution ??
        entry.populations?.pediatrics?.caution ??
        false,

      pregnancyCaution:
        entry.pregnancyCaution ??
        entry.populations?.pregnancy?.caution ??
        false,

      schemaNormalized: true
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
        const score = this.scoreEntry(text, entry);

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

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
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

  scoreEntry(query = "", entry = {}) {
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
      ...(entry.riskTags || []),
      ...(entry.interactionRisks || []),
      ...(entry.systems || []),
      ...(entry.recognition?.symptomLinks || []),
      ...(entry.recognition?.patternLinks || []),
      ...(entry.education?.clinicianPrompt || [])
    ].filter(Boolean).map(value => String(value).toLowerCase());

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
      ...(entry.aliases || []),
      ...(entry.identity?.aliases || [])
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
    return { registered: false, error: message };
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