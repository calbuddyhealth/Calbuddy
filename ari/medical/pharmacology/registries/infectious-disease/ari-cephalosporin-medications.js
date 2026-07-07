// ari/medical/pharmacology/registries/infectious-disease/ari-cephalosporin-medications.js
// Purpose: Register cephalosporin-class antibiotic medication knowledge.
// V1.0.0 — Cephalosporin Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.cephalosporins = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "cephalosporin_antibiotics",
        className: "Cephalosporin Antibiotics",
        aliases: [
          "cephalosporin",
          "cephalexin",
          "keflex",
          "cefazolin",
          "ancef",
          "cefadroxil",
          "cefuroxime",
          "ceftin",
          "cefdinir",
          "omnicef",
          "cefpodoxime",
          "vantin",
          "ceftriaxone",
          "rocephin",
          "cefotaxime",
          "ceftazidime",
          "fortaz",
          "cefepime",
          "maxipime",
          "ceftaroline",
          "teflaro"
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
          "stomach upset",
          "rash",
          "yeast infection"
        ],

        seriousEffects: [
          "anaphylaxis",
          "severe allergic reaction",
          "c diff infection",
          "severe diarrhea",
          "stevens johnson syndrome",
          "seizure risk with cefepime in renal impairment"
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
          "severe abdominal pain",
          "confusion",
          "seizure"
        ],

        monitoring: [
          "allergy symptoms",
          "rash",
          "diarrhea severity",
          "kidney function when clinically relevant",
          "mental status with cefepime risk"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Cephalosporins are beta-lactam antibiotics. Allergy history, severe diarrhea, renal dosing, and neurologic symptoms with some agents matter."
      }
    ];
  }
};

window.AriInfectiousDiseaseCephalosporins =
  window.Ari.medical.registries.infectiousDisease.cephalosporins;

console.log(
  "ARI INFECTIOUS DISEASE CEPHALOSPORINS LOADED:",
  window.Ari.medical.registries.infectiousDisease.cephalosporins.version
);