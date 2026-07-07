// ari/medical/pharmacology/registries/infectious-disease/ari-aminoglycoside-medications.js
// Purpose: Register aminoglycoside antibiotic medication knowledge.
// V2.0.0 — Aminoglycoside Registry / Universal Medical Registry Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.aminoglycosides = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "aminoglycoside_antibiotics",

        className: "Aminoglycoside Antibiotics",

        aliases: [
          "aminoglycoside",

          "gentamicin",
          "garamycin",

          "tobramycin",
          "nebcin",

          "amikacin",

          "streptomycin",

          "neomycin",

          "plazomicin",
          "zemdri"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antibiotic",
          "renal_risk",
          "ototoxicity_risk",
          "vestibular_toxicity",
          "therapeutic_drug_monitoring",
          "neuromuscular_blockade",
          "pregnancy_caution"
        ],

        patternTags: [
          "kidney_injury",
          "hearing_loss",
          "vertigo",
          "gram_negative_coverage"
        ],

        symptomLinks: [
          "hearing loss",
          "ringing in ears",
          "vertigo",
          "balance problems",
          "decreased urination",
          "muscle weakness"
        ],

        indications: [
          "serious gram-negative infections",
          "sepsis",
          "hospital-acquired infections",
          "combination therapy for selected infections"
        ],

        commonUseCases: [
          "serious bacterial infections",
          "multidrug-resistant infections",
          "synergistic therapy with selected beta-lactams"
        ],

        interactionRisks: [
          "renal_risk",
          "ototoxicity_risk",
          "loop_diuretics",
          "vancomycin",
          "amphotericin_b",
          "neuromuscular_blockers"
        ],

        contraindications: [
          "history of severe aminoglycoside allergy"
        ],

        blackBoxWarnings: [
          "Nephrotoxicity",
          "Ototoxicity",
          "Neuromuscular blockade",
          "Fetal harm during pregnancy"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "headache",
          "injection site discomfort"
        ],

        seriousEffects: [
          "acute kidney injury",
          "hearing loss",
          "tinnitus",
          "vestibular toxicity",
          "respiratory paralysis",
          "neuromuscular blockade",
          "severe allergic reaction"
        ],

        warningSigns: [
          "decreased urination",
          "ringing in ears",
          "hearing loss",
          "vertigo",
          "difficulty walking",
          "balance problems",
          "muscle weakness",
          "difficulty breathing",
          "facial swelling",
          "hives"
        ],

        monitoring: [
          "renal function",
          "peak levels when appropriate",
          "trough levels when appropriate",
          "hearing changes",
          "vestibular symptoms",
          "urine output"
        ],

        clinicalPearls: [
          "Therapeutic drug monitoring is critical.",
          "Renal function should be followed closely.",
          "Ototoxicity may be irreversible.",
          "Vestibular toxicity may present before hearing loss.",
          "Risk increases with prolonged therapy.",
          "Extended-interval dosing is commonly used for many indications."
        ],

        reasoningHints: [
          "If renal function worsens during therapy, increase suspicion for nephrotoxicity.",
          "If tinnitus or hearing loss develops, increase ototoxicity probability.",
          "If vertigo develops, evaluate vestibular toxicity.",
          "Review concomitant nephrotoxic medications.",
          "Review aminoglycoside serum levels when available."
        ],

        decisionRules: [
          {
            trigger: "creatinine_rising",
            action: "increase_renal_safety_weight"
          },
          {
            trigger: "decreased_urination",
            action: "increase_renal_injury_probability"
          },
          {
            trigger: "tinnitus",
            action: "increase_ototoxicity_probability"
          },
          {
            trigger: "hearing_loss",
            action: "increase_ototoxicity_probability"
          },
          {
            trigger: "vertigo",
            action: "increase_vestibular_toxicity_probability"
          },
          {
            trigger: "peak_or_trough_abnormal",
            action: "increase_medication_toxicity_probability"
          }
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: false,

        notes:
          "Aminoglycosides are potent antibiotics primarily used for serious gram-negative infections. They require therapeutic drug monitoring because nephrotoxicity and ototoxicity are major dose-limiting toxicities. Renal function, hearing, and vestibular symptoms should be assessed throughout therapy."
      }
    ];
  }
};

window.AriInfectiousDiseaseAminoglycosides =
  window.Ari.medical.registries.infectiousDisease.aminoglycosides;

console.log(
  "ARI INFECTIOUS DISEASE AMINOGLYCOSIDES LOADED:",
  window.Ari.medical.registries.infectiousDisease.aminoglycosides.version
);