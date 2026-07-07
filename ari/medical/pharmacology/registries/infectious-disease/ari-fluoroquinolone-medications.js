// ari/medical/pharmacology/registries/infectious-disease/ari-fluoroquinolone-medications.js
// Purpose: Register fluoroquinolone-class antibiotic medication knowledge.
// V1.0.0 — Fluoroquinolone Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.fluoroquinolones = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "fluoroquinolone_antibiotics",
        className: "Fluoroquinolone Antibiotics",

        aliases: [
          "fluoroquinolone",
          "fluoroquinolones",
          "quinolone",
          "ciprofloxacin",
          "cipro",
          "levofloxacin",
          "levaquin",
          "moxifloxacin",
          "avelox",
          "ofloxacin",
          "floxin",
          "delafloxacin",
          "baxdela"
        ],

        systems: ["infectious_disease", "pharmacology"],

        riskTags: [
          "antibiotic",
          "qt_risk",
          "c_diff_risk",
          "tendon_rupture_risk",
          "neuropathy_risk",
          "cns_effect_risk",
          "glucose_abnormality_risk",
          "aortic_aneurysm_caution",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        interactionRisks: [
          "qt_risk",
          "cns_effect_risk",
          "glucose_abnormality_risk",
          "tendon_rupture_risk",
          "c_diff_risk"
        ],

        commonEffects: [
          "nausea",
          "diarrhea",
          "stomach upset",
          "headache",
          "dizziness",
          "insomnia"
        ],

        seriousEffects: [
          "tendon rupture",
          "tendinitis",
          "qt prolongation",
          "arrhythmia",
          "peripheral neuropathy",
          "confusion",
          "seizure",
          "blood sugar changes",
          "c diff infection",
          "aortic aneurysm complication"
        ],

        warningSigns: [
          "tendon pain",
          "heel pain",
          "achilles pain",
          "new numbness",
          "tingling",
          "burning pain",
          "confusion",
          "hallucinations",
          "seizure",
          "palpitations",
          "fainting",
          "irregular heartbeat",
          "severe diarrhea",
          "bloody diarrhea",
          "severe chest pain",
          "severe back pain",
          "severe abdominal pain"
        ],

        monitoring: [
          "tendon pain",
          "neuropathy symptoms",
          "mental status changes",
          "blood sugar symptoms",
          "QT risk",
          "diarrhea severity",
          "aortic aneurysm history",
          "pregnancy status",
          "child age"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Fluoroquinolones have important safety warnings including tendon injury, neuropathy, CNS effects, QT risk, glucose changes, C. diff, and aortic aneurysm/dissection caution in higher-risk patients."
      }
    ];
  }
};

window.AriInfectiousDiseaseFluoroquinolones =
  window.Ari.medical.registries.infectiousDisease.fluoroquinolones;

console.log(
  "ARI INFECTIOUS DISEASE FLUOROQUINOLONES LOADED:",
  window.Ari.medical.registries.infectiousDisease.fluoroquinolones.version
);