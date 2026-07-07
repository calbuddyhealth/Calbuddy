// ari/medical/core/ari-medical-registry-validator.js
// Purpose: Validate Ari Medical registries against the UMKO standard.
// V2.1.0 — Universal Medical Registry Validator / Global QA

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.registryValidator = {
  version: "2.1.0",

  requiredFields: [
    "id",
    "umkoId",
"versionId",
"status",
    "className",
    "aliases",
    "systems",
    "specialty",

    "riskTags",
    "patternTags",
    "symptomLinks",
    "indications",
    "commonUseCases",

    "interactionRisks",
    "contraindications",
    "precautions",
    "precautionTriggers",
    "blackBoxWarnings",

    "commonEffects",
    "seriousEffects",
    "warningSigns",
    "monitoring",

    "clinicalPearls",
    "reasoningHints",
    "decisionRules",
    "confidenceModifiers",

    "relatedKnowledge",
    "followUpQuestions",
    "recommendedConsults",
    "references",
    "notes"
  ],

  validateAll() {
    const registry = window.Ari.medical.knowledgeRegistry;

    if (!registry?.getAllModules) {
      return {
        valid: false,
        error: "Knowledge Registry not loaded."
      };
    }

    const report = {
      valid: true,
      validatorVersion: this.version,
      modulesChecked: 0,
      entriesChecked: 0,
      errors: [],
      warnings: []
    };

    registry.getAllModules().forEach(module => {
      report.modulesChecked++;

      module.entries.forEach(entry => {
        report.entriesChecked++;
        this.validateEntry(entry, module, report);
      });
    });

    this.checkGlobalDuplicateAliases(report);
    this.checkGlobalDuplicateIDs(report);

    report.valid = report.errors.length === 0;

    return report;
  },

  validateEntry(entry = {}, module = {}, report = {}) {
    this.requiredFields.forEach(field => {
      if (!(field in entry)) {
        report.errors.push({
          module: module.id,
          entry: entry.id || "unknown",
          type: "missing_field",
          field
        });
      }
    });

this.checkUmkoBase(entry, module, report);
    this.checkArrayFields(entry, module, report);
    this.checkAliases(entry, module, report);
    this.checkDecisionRules(entry, module, report);
    this.checkConfidenceModifiers(entry, module, report);
    this.checkFollowUpQuestions(entry, module, report);
    this.checkReferences(entry, module, report);
    this.checkRelatedKnowledge(entry, module, report);
  },

checkUmkoBase(entry = {}, module = {}, report = {}) {
  const spec = window.Ari.medical.umkoSpec;

  if (spec?.validateBase) {
    const result = spec.validateBase(entry);

    if (!result.valid) {
      result.errors.forEach(error => {
        report.errors.push({
          module: module.id,
          entry: entry.id || "unknown",
          type: "umko_base_invalid",
          error
        });
      });
    }
  }

  if (entry.umkoId && spec?.isValidUmkoId && !spec.isValidUmkoId(entry.umkoId)) {
    report.errors.push({
      module: module.id,
      entry: entry.id || "unknown",
      type: "invalid_umko_id",
      umkoId: entry.umkoId
    });
  }
},

  checkArrayFields(entry = {}, module = {}, report = {}) {
    const arrayFields = [
      "aliases",
      "systems",
      "riskTags",
      "patternTags",
      "symptomLinks",
      "indications",
      "commonUseCases",
      "interactionRisks",
      "contraindications",
      "precautions",
      "precautionTriggers",
      "blackBoxWarnings",
      "commonEffects",
      "seriousEffects",
      "warningSigns",
      "monitoring",
      "clinicalPearls",
      "reasoningHints",
      "decisionRules",
      "relatedKnowledge",
      "followUpQuestions",
      "recommendedConsults",
      "references"
    ];

    arrayFields.forEach(field => {
      if (field in entry && !Array.isArray(entry[field])) {
        report.errors.push({
          module: module.id,
          entry: entry.id || "unknown",
          type: "invalid_field_type",
          field,
          expected: "array"
        });
      }
    });
  },

  checkAliases(entry = {}, module = {}, report = {}) {
    if (!Array.isArray(entry.aliases)) return;

    const seen = new Set();

    entry.aliases.forEach(alias => {
      const clean = this.normalize(alias);

      if (!clean) {
        report.warnings.push({
          module: module.id,
          entry: entry.id,
          type: "empty_alias"
        });
        return;
      }

      if (seen.has(clean)) {
        report.warnings.push({
          module: module.id,
          entry: entry.id,
          type: "duplicate_alias",
          alias
        });
      }

      seen.add(clean);
    });
  },

  checkDecisionRules(entry = {}, module = {}, report = {}) {
    if (!Array.isArray(entry.decisionRules)) return;

    entry.decisionRules.forEach(rule => {
      if (!rule || typeof rule !== "object") {
        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_invalid"
        });
        return;
      }

      if (!rule.id) {
        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_missing_id"
        });
      }

      if (!rule.priority) {
        report.warnings.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_missing_priority",
          ruleId: rule.id || "unknown"
        });
      }

      if (!Array.isArray(rule.when)) {
        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_when_invalid",
          ruleId: rule.id || "unknown"
        });
      }

      if (!Array.isArray(rule.then)) {
        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_then_invalid",
          ruleId: rule.id || "unknown"
        });
      }
    });
  },

  checkConfidenceModifiers(entry = {}, module = {}, report = {}) {
    const c = entry.confidenceModifiers;

    if (!c || typeof c !== "object") {
      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_confidence_modifiers"
      });
      return;
    }

    if (!Array.isArray(c.increases)) {
      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_confidence_increases"
      });
    }

    if (!Array.isArray(c.decreases)) {
      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_confidence_decreases"
      });
    }
  },

  checkFollowUpQuestions(entry = {}, module = {}, report = {}) {
    if (!Array.isArray(entry.followUpQuestions)) {
      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_followup_questions"
      });
      return;
    }

    if (entry.followUpQuestions.length === 0) {
      report.warnings.push({
        module: module.id,
        entry: entry.id,
        type: "empty_followup_questions"
      });
    }
  },

  checkReferences(entry = {}, module = {}, report = {}) {
    if (!Array.isArray(entry.references)) {
      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_references"
      });
      return;
    }

    if (entry.references.length === 0) {
      report.warnings.push({
        module: module.id,
        entry: entry.id,
        type: "empty_references"
      });
    }
  },

  checkRelatedKnowledge(entry = {}, module = {}, report = {}) {
    if (!Array.isArray(entry.relatedKnowledge)) return;

    entry.relatedKnowledge.forEach(node => {
      if (!node || typeof node !== "string") {
        report.warnings.push({
          module: module.id,
          entry: entry.id,
          type: "invalid_related_knowledge",
          node
        });
      }
    });
  },

  checkGlobalDuplicateAliases(report = {}) {
    const registry = window.Ari.medical.knowledgeRegistry;
    const aliases = {};

    registry.getAllModules().forEach(module => {
      module.entries.forEach(entry => {
        (entry.aliases || []).forEach(alias => {
          const key = this.normalize(alias);
          if (!key) return;

          if (!aliases[key]) aliases[key] = [];

          aliases[key].push({
            module: module.id,
            entry: entry.id
          });
        });
      });
    });

    Object.keys(aliases).forEach(alias => {
      if (aliases[alias].length > 1) {
        report.warnings.push({
          type: "duplicate_alias_across_registry",
          alias,
          locations: aliases[alias]
        });
      }
    });
  },

  checkGlobalDuplicateIDs(report = {}) {
    const registry = window.Ari.medical.knowledgeRegistry;
    const ids = {};

    registry.getAllModules().forEach(module => {
      module.entries.forEach(entry => {
        const key = this.normalize(entry.id);
        if (!key) return;

        if (!ids[key]) ids[key] = [];

        ids[key].push(module.id);
      });
    });

    Object.keys(ids).forEach(id => {
      if (ids[id].length > 1) {
        report.errors.push({
          type: "duplicate_entry_id",
          id,
          modules: ids[id]
        });
      }
    });
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

  print() {
    const report = this.validateAll();

    console.group("ARI MEDICAL REGISTRY VALIDATION");
    console.log("Valid:", report.valid);
    console.log("Validator Version:", report.validatorVersion);
    console.log("Modules:", report.modulesChecked);
    console.log("Entries:", report.entriesChecked);
    console.table(report.errors);
    console.table(report.warnings);
    console.groupEnd();

    return report;
  }
};

window.AriMedicalRegistryValidator =
  window.Ari.medical.registryValidator;

console.log(
  "ARI MEDICAL REGISTRY VALIDATOR LOADED:",
  window.Ari.medical.registryValidator.version
);