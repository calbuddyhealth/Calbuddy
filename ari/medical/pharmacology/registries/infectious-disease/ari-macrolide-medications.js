// ari/medical/pharmacology/registries/infectious-disease/ari-macrolide-medications.js
// Purpose: Register macrolide antibiotic medication knowledge.
// V1.0.0 — Macrolide Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.macrolides = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "macrolide_antibiotics",

        className: "Macrolide Antibiotics",

        aliases: [
          "macrolide",

          "azithromycin",
          "zithromax",
          "z pak",
          "zpack",

          "clarithromycin",
          "biaxin",

          "erythromycin",
          "ery-tab",
          "eryped",

          "fidaxomicin",
          "dificid"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        riskTags: [
          "antibiotic",
          "qt_risk",
          "gi_risk",
          "hepatic_risk",
          "cyp_inhibitor",
          "c_diff_risk"
        ],

        interactionRisks: [
          "qt_risk",
          "cyp_inhibitor",
          "gi_risk",
          "hepatic_risk"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "abdominal pain",
          "stomach upset"
        ],

        seriousEffects: [
          "qt prolongation",
          "torsades de pointes",
          "arrhythmia",
          "liver injury",
          "hearing loss",
          "c diff infection"
        ],

        warningSigns: [
          "palpitations",
          "fainting",
          "irregular heartbeat",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "severe diarrhea",
          "bloody diarrhea"
        ],

        monitoring: [
          "ECG if QT risk",
          "liver function",
          "diarrhea severity",
          "drug interactions"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Macrolides commonly interact through CYP enzymes and may prolong the QT interval. Evaluate other QT-prolonging medications, electrolyte abnormalities, and cardiac history."
      }
    ];
  }
};

window.AriInfectiousDiseaseMacrolides =
  window.Ari.medical.registries.infectiousDisease.macrolides;

console.log(
  "ARI INFECTIOUS DISEASE MACROLIDES LOADED:",
  window.Ari.medical.registries.infectiousDisease.macrolides.version
);