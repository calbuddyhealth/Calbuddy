// ari/medical/pharmacology/registries/infectious-disease/ari-carbapenem-medications.js
// Purpose: Register carbapenem-class antibiotic medication knowledge.
// V1.0.0 — Carbapenem Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.carbapenems = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "carbapenem_antibiotics",
        className: "Carbapenem Antibiotics",
        aliases: [
          "carbapenem",
          "meropenem",
          "merrem",
          "imipenem",
          "cilastatin",
          "primaxin",
          "ertapenem",
          "invanz",
          "doripenem",
          "doribax"
        ],

        systems: ["infectious_disease", "pharmacology"],

        riskTags: [
          "antibiotic",
          "beta_lactam",
          "allergy_risk",
          "gi_risk",
          "c_diff_risk",
          "renal_adjustment_possible",
          "seizure_risk"
        ],

        interactionRisks: [
          "allergy_risk",
          "gi_risk",
          "c_diff_risk",
          "renal_risk",
          "seizure_risk"
        ],

        commonEffects: [
          "nausea",
          "diarrhea",
          "rash",
          "headache",
          "stomach upset"
        ],

        seriousEffects: [
          "anaphylaxis",
          "severe allergic reaction",
          "c diff infection",
          "seizure",
          "kidney injury",
          "stevens johnson syndrome"
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
          "seizure",
          "confusion"
        ],

        monitoring: [
          "allergy symptoms",
          "diarrhea severity",
          "rash",
          "kidney function",
          "mental status",
          "seizure risk"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Carbapenems are broad-spectrum beta-lactam antibiotics. Renal function, seizure risk, allergy history, and severe diarrhea matter."
      }
    ];
  }
};

window.AriInfectiousDiseaseCarbapenems =
  window.Ari.medical.registries.infectiousDisease.carbapenems;

console.log(
  "ARI INFECTIOUS DISEASE CARBAPENEMS LOADED:",
  window.Ari.medical.registries.infectiousDisease.carbapenems.version
);