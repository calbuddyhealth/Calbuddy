// ari/medical/pharmacology/registries/infectious-disease/ari-penicillin-medications.js
// Purpose: Register penicillin-class antibiotic medication knowledge.
// V1.0.0 — Penicillin Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.penicillins = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "penicillin_antibiotics",
        className: "Penicillin Antibiotics",
        aliases: [
          "penicillin",
          "penicillin v",
          "penicillin vk",
          "penicillin g",
          "amoxicillin",
          "amoxil",
          "ampicillin",
          "dicloxacillin",
          "nafcillin",
          "oxacillin",
          "piperacillin",
          "tazobactam",
          "zosyn",
          "amoxicillin clavulanate",
          "augmentin",
          "ampicillin sulbactam",
          "unasyn"
        ],

        systems: ["infectious_disease", "pharmacology"],

        riskTags: [
          "antibiotic",
          "beta_lactam",
          "allergy_risk",
          "rash_risk",
          "gi_risk",
          "c_diff_risk",
          "renal_adjustment_possible"
        ],

        interactionRisks: [
          "allergy_risk",
          "gi_risk",
          "c_diff_risk",
          "renal_risk"
        ],

        commonEffects: [
          "nausea",
          "diarrhea",
          "rash",
          "stomach upset",
          "yeast infection"
        ],

        seriousEffects: [
          "anaphylaxis",
          "severe allergic reaction",
          "c diff infection",
          "severe diarrhea",
          "stevens johnson syndrome",
          "kidney injury"
        ],

        warningSigns: [
          "hives",
          "swollen lips",
          "swollen tongue",
          "throat swelling",
          "trouble breathing",
          "severe rash",
          "skin peeling",
          "bloody diarrhea",
          "watery diarrhea",
          "severe abdominal pain"
        ],

        monitoring: [
          "allergy symptoms",
          "rash",
          "diarrhea severity",
          "kidney function when clinically relevant"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Penicillins are common antibiotics. Allergy history, rash, breathing symptoms, and severe diarrhea matter."
      }
    ];
  }
};

window.AriInfectiousDiseasePenicillins =
  window.Ari.medical.registries.infectiousDisease.penicillins;

console.log(
  "ARI INFECTIOUS DISEASE PENICILLINS LOADED:",
  window.Ari.medical.registries.infectiousDisease.penicillins.version
);