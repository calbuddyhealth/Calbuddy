// ari/medical/pharmacology/registries/infectious-disease/ari-oxazolidinone-medications.js
// Purpose: Register oxazolidinone antibiotic medication knowledge.
// V2.0.0 — Oxazolidinone Registry / Universal Medical Registry Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.oxazolidinones = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "oxazolidinone_antibiotics",

        className: "Oxazolidinone Antibiotics",

        aliases: [
          "oxazolidinone",

          "linezolid",
          "zyvox",

          "tedizolid",
          "sivextro"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antibiotic",
          "mrsa_coverage",
          "vre_coverage",
          "serotonin_syndrome_risk",
          "myelosuppression_risk",
          "thrombocytopenia_risk",
          "neuropathy_risk",
          "lactic_acidosis_risk",
          "maoi_activity"
        ],

        patternTags: [
          "bone_marrow_suppression",
          "neuropathy",
          "drug_interaction"
        ],

        symptomLinks: [
          "fever",
          "easy bruising",
          "bleeding",
          "fatigue",
          "numbness",
          "tingling",
          "vision changes",
          "confusion",
          "muscle rigidity"
        ],

        indications: [
          "MRSA infections",
          "VRE infections",
          "skin and soft tissue infections",
          "pneumonia",
          "resistant gram-positive infections"
        ],

        commonUseCases: [
          "drug-resistant gram-positive infections",
          "alternative to vancomycin in selected situations"
        ],

        interactionRisks: [
          "ssri",
          "snri",
          "maoi",
          "tramadol",
          "meperidine",
          "dextromethorphan",
          "serotonergic_medications"
        ],

        contraindications: [
          "history of severe oxazolidinone allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "headache",
          "nausea",
          "vomiting",
          "diarrhea",
          "metallic taste"
        ],

        seriousEffects: [
          "serotonin syndrome",
          "thrombocytopenia",
          "anemia",
          "leukopenia",
          "optic neuropathy",
          "peripheral neuropathy",
          "lactic acidosis",
          "severe allergic reaction"
        ],

        warningSigns: [
          "easy bruising",
          "unusual bleeding",
          "persistent fever",
          "vision loss",
          "blurred vision",
          "numbness",
          "tingling",
          "muscle rigidity",
          "high fever",
          "confusion",
          "agitation",
          "rapid heart rate"
        ],

        monitoring: [
          "CBC",
          "platelet count",
          "vision changes",
          "neuropathy symptoms",
          "medication interaction review"
        ],

        clinicalPearls: [
          "Review serotonergic medications before prescribing.",
          "Weekly CBC monitoring is recommended during prolonged therapy.",
          "Linezolid has mild MAOI activity.",
          "Peripheral and optic neuropathy become more likely with prolonged treatment.",
          "Often reserved for resistant gram-positive organisms."
        ],

        reasoningHints: [
          "Evaluate the medication list before suspecting serotonin syndrome.",
          "If bruising or bleeding develops, increase suspicion for thrombocytopenia.",
          "Persistent numbness or vision changes should increase neuropathy probability.",
          "If multiple serotonergic medications are present, increase interaction risk."
        ],

        decisionRules: [
          {
            trigger: "ssri_plus_linezolid",
            action: "increase_serotonin_syndrome_probability"
          },
          {
            trigger: "easy_bruising",
            action: "increase_thrombocytopenia_probability"
          },
          {
            trigger: "vision_changes",
            action: "increase_optic_neuropathy_probability"
          },
          {
            trigger: "persistent_numbness",
            action: "increase_peripheral_neuropathy_probability"
          },
          {
            trigger: "cbc_platelets_falling",
            action: "increase_myelosuppression_probability"
          }
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: false,
        hepaticCaution: false,

        notes:
          "Oxazolidinones are reserved for resistant gram-positive infections. The most important safety considerations include serotonin syndrome, bone marrow suppression, thrombocytopenia, neuropathy, and medication interaction review."
      }
    ];
  }
};

window.AriInfectiousDiseaseOxazolidinones =
  window.Ari.medical.registries.infectiousDisease.oxazolidinones;

console.log(
  "ARI INFECTIOUS DISEASE OXAZOLIDINONES LOADED:",
  window.Ari.medical.registries.infectiousDisease.oxazolidinones.version
);