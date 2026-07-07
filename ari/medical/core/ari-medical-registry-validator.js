// ari/medical/core/ari-medical-registry-validator.js
// Purpose: Validate Ari Medical registries against the UMKO standard.
// V1.0.0 — Universal Medical Registry Validator

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.registryValidator = {
  version: "1.0.0",

  requiredFields: [
    "id",
    "className",
    "aliases",
    "systems",
    "specialty",

    "riskTags",
    "patternTags",
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

    "references",
    "notes"
  ],

  validateAll() {

    const registry =
      window.Ari.medical.knowledgeRegistry;

    if (!registry) {
      return {
        valid: false,
        error: "Knowledge Registry not loaded."
      };
    }

    const report = {
      valid: true,
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

    report.valid = report.errors.length === 0;

    return report;

  },

  validateEntry(entry, module, report) {

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

    this.checkAliases(entry, module, report);
    this.checkDecisionRules(entry, module, report);
    this.checkReferences(entry, module, report);
    this.checkRelatedKnowledge(entry, module, report);

  },

  checkAliases(entry, module, report) {

    if (!Array.isArray(entry.aliases)) return;

    const seen = new Set();

    entry.aliases.forEach(alias => {

      const clean = String(alias).toLowerCase().trim();

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

  checkDecisionRules(entry, module, report) {

    if (!Array.isArray(entry.decisionRules)) return;

    entry.decisionRules.forEach(rule => {

      if (!rule.id) {

        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_missing_id"
        });

      }

      if (!Array.isArray(rule.when)) {

        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_when_invalid"
        });

      }

      if (!Array.isArray(rule.then)) {

        report.errors.push({
          module: module.id,
          entry: entry.id,
          type: "decision_rule_then_invalid"
        });

      }

    });

  },

  checkReferences(entry, module, report) {

    if (!Array.isArray(entry.references)) {

      report.errors.push({
        module: module.id,
        entry: entry.id,
        type: "missing_references"
      });

    }

  },

  checkRelatedKnowledge(entry, module, report) {

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

  print() {

    const report = this.validateAll();

    console.group("ARI MEDICAL REGISTRY VALIDATION");

    console.log("Valid:", report.valid);
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