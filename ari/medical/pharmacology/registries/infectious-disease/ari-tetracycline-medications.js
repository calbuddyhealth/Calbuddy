// ari/medical/pharmacology/registries/infectious-disease/ari-tetracycline-medications.js
// Purpose: Register tetracycline-class antibiotic medication knowledge.
// V1.0.0 — Tetracycline Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.tetracyclines = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "tetracycline_antibiotics",
        className: "Tetracycline Antibiotics",

        aliases: [
          "tetracycline",
          "tetracyclines",
          "doxycycline",
          "vibramycin",
          "doryx",
          "monodox",
          "minocycline",
          "minocin",
          "solodyn",
          "tetracycline",
          "sumycin",
          "tigecycline",
          "tygacil",
          "omadacycline",
          "nuzyra",
          "eravacycline",
          "xerava"
        ],

        systems: ["infectious_disease", "pharmacology", "dermatology"],

        riskTags: [
          "antibiotic",
          "gi_risk",
          "photosensitivity_risk",
          "esophagitis_risk",
          "hepatic_risk",
          "intracranial_hypertension_risk",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        interactionRisks: [
          "gi_risk",
          "hepatic_risk",
          "photosensitivity_risk",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "stomach upset",
          "photosensitivity",
          "sun sensitivity",
          "heartburn",
          "esophagitis"
        ],

        seriousEffects: [
          "severe allergic reaction",
          "intracranial hypertension",
          "liver injury",
          "severe diarrhea",
          "c diff infection",
          "tooth discoloration in young children",
          "bone growth effects in young children"
        ],

        warningSigns: [
          "severe headache",
          "vision changes",
          "blurred vision",
          "severe abdominal pain",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "severe diarrhea",
          "bloody diarrhea",
          "hives",
          "swollen lips",
          "swollen tongue",
          "throat swelling",
          "trouble breathing"
        ],

        monitoring: [
          "GI symptoms",
          "sun sensitivity",
          "esophageal irritation",
          "headache with vision changes",
          "liver symptoms",
          "diarrhea severity",
          "pregnancy status",
          "child age"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Tetracyclines can cause GI upset, photosensitivity, and esophageal irritation. Pregnancy and young-child use require caution because of fetal/child tooth and bone concerns."
      }
    ];
  }
};

window.AriInfectiousDiseaseTetracyclines =
  window.Ari.medical.registries.infectiousDisease.tetracyclines;

console.log(
  "ARI INFECTIOUS DISEASE TETRACYCLINES LOADED:",
  window.Ari.medical.registries.infectiousDisease.tetracyclines.version
);