// ari/medical/pharmacology/registries/infectious-disease/ari-nitrofuran-medications.js
// Purpose: Register nitrofuran antimicrobial medication knowledge.
// V1.0.0 — Nitrofuran Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.nitrofurans = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "nitrofuran_antimicrobials",

        className: "Nitrofuran Antimicrobials",

        aliases: [
          "nitrofuran",
          "nitrofurantoin",
          "macrobid",
          "macrodantin",
          "furadantin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "urology"
        ],

        riskTags: [
          "antibiotic",
          "uti_medication",
          "renal_caution",
          "pulmonary_toxicity_risk",
          "hepatic_risk",
          "neuropathy_risk",
          "g6pd_caution",
          "pregnancy_caution"
        ],

        interactionRisks: [
          "renal_risk",
          "neuropathy_risk",
          "hepatic_risk"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "loss of appetite",
          "headache",
          "dark urine"
        ],

        seriousEffects: [
          "pulmonary toxicity",
          "interstitial lung disease",
          "peripheral neuropathy",
          "liver injury",
          "hemolytic anemia",
          "severe allergic reaction"
        ],

        warningSigns: [
          "shortness of breath",
          "persistent cough",
          "chest pain",
          "fever",
          "new numbness",
          "tingling",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "decreased urination",
          "hives",
          "swollen lips",
          "swollen tongue",
          "trouble breathing"
        ],

        monitoring: [
          "renal function",
          "pulmonary symptoms",
          "neuropathy symptoms",
          "liver symptoms",
          "G6PD history"
        ],

        clinicalPearls: [
          "Primarily used for uncomplicated lower urinary tract infections.",
          "Not appropriate for suspected pyelonephritis because tissue penetration is poor.",
          "Renal impairment may reduce effectiveness and increase toxicity.",
          "Long-term use increases pulmonary and neurologic toxicity risk.",
          "Urine may appear darker while taking nitrofurantoin."
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Nitrofurantoin is primarily used for uncomplicated cystitis. Evaluate renal function, pulmonary symptoms, neuropathy, and G6PD deficiency before prolonged use."
      }
    ];
  }
};

window.AriInfectiousDiseaseNitrofurans =
  window.Ari.medical.registries.infectiousDisease.nitrofurans;

console.log(
  "ARI INFECTIOUS DISEASE NITROFURANS LOADED:",
  window.Ari.medical.registries.infectiousDisease.nitrofurans.version
);