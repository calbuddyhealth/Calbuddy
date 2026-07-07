// ari/medical/pharmacology/ari-medical-medication-class-engine.js
// Purpose: Identify medication names/classes from the medical knowledge registry.
// V1.0.0 — Medication Class Identifier / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.medicationClassEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const registry = window.Ari.medical.knowledgeRegistry;

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const matches = this.findMedicationMatches(text, registry);
    const primaryMedication = matches[0] || null;

    return window.Ari.medical.contract.create({
      engine: "ari-medical-medication-class-engine",
      version: this.version,
      activated: matches.length > 0,
      confidence: primaryMedication ? primaryMedication.confidence : "low",
      urgency: this.resolveUrgency(matches),

      medicationsDetected: matches,
      primaryMedication,

      findings: matches,
      supportingEvidence: matches.map(match => ({
        claim: `${match.name} maps to ${match.className}.`,
        source: "ari-medical-medication-class-engine",
        confidence: match.confidence,
        raw: match
      })),

      reasoning:
        primaryMedication
          ? `Detected medication/class match: ${primaryMedication.name} → ${primaryMedication.className}.`
          : "No medication name or class was detected.",

      nextStep:
        primaryMedication
          ? "Use medication side-effect and interaction engines to compare symptoms against medication risks."
          : "Continue without medication-class evidence unless the user provides medication names.",

      responsePosture: {
        label: "medication_class_identification",
        advisoryOnly: true,
        avoidDiagnosis: true,
        avoidMedicationChangeAdvice: true
      },

      cannotSet: [
        "diagnosis",
        "prescription",
        "medicationDoseChange",
        "stopMedication",
        "startMedication"
      ]
    });
  },

  findMedicationMatches(text = "", registry = null) {
    if (!registry) return [];

    const medicationEntries = registry.findByDomain("pharmacology", {
      category: "medication_class"
    });

    const matches = [];

    medicationEntries.forEach(result => {
      const entry = result.entry || {};
      const aliases = this.entryAliases(entry);

      const hitAliases = aliases.filter(alias =>
        window.Ari.medical.utils.hasTerm(text, alias)
      );

      if (!hitAliases.length) return;

      matches.push({
        id: entry.id,
        name: entry.name || entry.className || entry.id,
        className: entry.className || entry.name || entry.id,
        aliases: hitAliases,
        systems: entry.systems || [],
        commonEffects: entry.commonEffects || [],
        seriousEffects: entry.seriousEffects || [],
        withdrawalEffects: entry.withdrawalEffects || [],
        interactionRisks: entry.interactionRisks || [],
        warningSigns: entry.warningSigns || [],
        pediatricCaution: entry.pediatricCaution === true,
        pregnancyCaution: entry.pregnancyCaution === true,
        confidence: hitAliases.length >= 2 ? "high" : "medium",
        source: "ari-medical-knowledge-registry",
        advisoryOnly: true
      });
    });

    return this.dedupe(matches);
  },

  entryAliases(entry = {}) {
    return [
      entry.id,
      entry.name,
      entry.className,
      ...(entry.aliases || [])
    ].filter(Boolean);
  },

  resolveUrgency(matches = []) {
    const hasSeriousRisk = matches.some(match =>
      (match.warningSigns || []).length ||
      (match.seriousEffects || []).length
    );

    return hasSeriousRisk ? "soon" : "routine";
  },

  dedupe(matches = []) {
    const seen = new Set();

    return matches.filter(match => {
      const key = String(match.id || match.name || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

window.AriMedicalMedicationClassEngine =
  window.Ari.medical.medicationClassEngine;

console.log(
  "ARI MEDICAL MEDICATION CLASS ENGINE LOADED:",
  window.Ari.medical.medicationClassEngine.version
);