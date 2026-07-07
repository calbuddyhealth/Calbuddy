// ari/medical/core/ari-medical-knowledge-schema.js
// Purpose: Standardize all Ari Medical knowledge entries.
// V1.0.0 — Universal Medical Knowledge Schema / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.knowledgeSchema = {
  version: "1.0.0",

  create(entry = {}) {
    return {
      id: entry.id || "",
      type: entry.type || "general_medical_knowledge",
      version: entry.version || "1.0.0",
      updated: entry.updated || "2026-07",

      identity: {
        name: "",
        className: "",
        aliases: [],
        systems: [],
        specialty: "",
        ...(entry.identity || {})
      },

      recognition: {
        riskTags: [],
        symptomLinks: [],
        patternLinks: [],
        commonContexts: [],
        ...(entry.recognition || {})
      },

      clinicalUse: {
        indications: [],
        notFor: [],
        commonUseCases: [],
        ...(entry.clinicalUse || {})
      },

      safety: {
        redFlags: [],
        contraindications: [],
        precautions: [],
        blackBoxWarnings: [],
        emergencyTriggers: [],
        ...(entry.safety || {})
      },

      effects: {
        common: [],
        serious: [],
        withdrawal: [],
        overdose: [],
        toxicity: [],
        ...(entry.effects || {})
      },

      interactions: {
        riskTags: [],
        highRiskCombos: [],
        substanceRisks: [],
        ...(entry.interactions || {})
      },

      monitoring: {
        vitals: [],
        labs: [],
        symptoms: [],
        followUp: [],
        ...(entry.monitoring || {})
      },

      populations: {
        pediatrics: {
          caution: false,
          notes: []
        },
        pregnancy: {
          caution: false,
          notes: []
        },
        geriatrics: {
          caution: false,
          notes: []
        },
        renal: {
          caution: false,
          notes: []
        },
        hepatic: {
          caution: false,
          notes: []
        },
        ...(entry.populations || {})
      },

      diagnostics: {
        labs: [],
        imaging: [],
        procedures: [],
        clinicalFindings: [],
        ...(entry.diagnostics || {})
      },

      reasoning: {
        supports: [],
        arguesAgainst: [],
        mimics: [],
        differentiatedBy: [],
        uncertainty: [],
        ...(entry.reasoning || {})
      },

      education: {
        plainLanguage: "",
        avoidSaying: [],
        clinicianPrompt: [],
        ...(entry.education || {})
      },

      metadata: {
        source: "",
        evidenceLevel: "reference",
        advisoryOnly: true,
        ...(entry.metadata || {})
      },

      schema: {
        name: "ari-medical-knowledge-schema",
        version: this.version
      }
    };
  },

  normalizeLegacyMedication(entry = {}) {
    return this.create({
      id: entry.id,
      type: "medication_class",
      version: entry.version || "1.0.0",
      updated: entry.updated || "2026-07",

      identity: {
        name: entry.name || entry.className || entry.id || "",
        className: entry.className || entry.name || entry.id || "",
        aliases: entry.aliases || [],
        systems: entry.systems || [],
        specialty: entry.specialty || "pharmacology"
      },

      recognition: {
        riskTags: entry.riskTags || [],
        symptomLinks: entry.relatedSymptoms || [],
        patternLinks: entry.patternLinks || [],
        commonContexts: entry.commonContexts || []
      },

      safety: {
        redFlags: entry.warningSigns || [],
        contraindications: entry.contraindications || [],
        precautions: entry.precautions || [],
        blackBoxWarnings: entry.blackBoxWarnings || [],
        emergencyTriggers: entry.emergencyTriggers || []
      },

      effects: {
        common: entry.commonEffects || [],
        serious: entry.seriousEffects || [],
        withdrawal: entry.withdrawalEffects || [],
        overdose: entry.overdoseEffects || [],
        toxicity: entry.toxicityEffects || []
      },

      interactions: {
        riskTags: entry.interactionRisks || entry.riskTags || [],
        highRiskCombos: entry.highRiskCombos || [],
        substanceRisks: entry.substanceRisks || []
      },

      monitoring: {
        labs: entry.monitoringLabs || [],
        vitals: entry.monitoringVitals || [],
        symptoms: entry.monitoring || [],
        followUp: entry.followUp || []
      },

      populations: {
        pediatrics: {
          caution: entry.pediatricCaution === true,
          notes: entry.pediatricNotes || []
        },
        pregnancy: {
          caution: entry.pregnancyCaution === true,
          notes: entry.pregnancyNotes || []
        },
        geriatrics: {
          caution: entry.geriatricCaution === true,
          notes: entry.geriatricNotes || []
        },
        renal: {
          caution:
            entry.renalCaution === true ||
            (entry.riskTags || []).includes("renal_risk") ||
            (entry.riskTags || []).includes("renal_adjustment_possible"),
          notes: entry.renalNotes || []
        },
        hepatic: {
          caution:
            entry.hepaticCaution === true ||
            (entry.riskTags || []).includes("hepatic_risk"),
          notes: entry.hepaticNotes || []
        }
      },

      education: {
        plainLanguage: entry.notes || "",
        avoidSaying: [],
        clinicianPrompt: []
      },

      metadata: {
        source: entry.source || "legacy_medication_registry",
        evidenceLevel: "reference",
        advisoryOnly: true
      }
    });
  },

  validate(entry = {}) {
    const errors = [];

    if (!entry.id) errors.push("Missing id.");
    if (!entry.type) errors.push("Missing type.");
    if (!entry.identity?.aliases) errors.push("Missing identity.aliases array.");
    if (!entry.metadata?.advisoryOnly) errors.push("metadata.advisoryOnly should be true.");

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

window.AriMedicalKnowledgeSchema = window.Ari.medical.knowledgeSchema;

console.log(
  "ARI MEDICAL KNOWLEDGE SCHEMA LOADED:",
  window.Ari.medical.knowledgeSchema.version
);