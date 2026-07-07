// ari/medical/pharmacology/registries/infectious-disease/ari-sulfonamide-medications.js
// Purpose: Register sulfonamide antibiotic medication knowledge.
// V1.0.0 — Sulfonamide Antibiotic Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.sulfonamides = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "sulfonamide_antibiotics",

        className: "Sulfonamide Antibiotics",

        aliases: [
          "sulfonamide",
          "sulfa",
          "sulfa antibiotic",

          "trimethoprim sulfamethoxazole",
          "trimethoprim/sulfamethoxazole",
          "tmp smx",
          "tmp/smx",
          "bactrim",
          "septra",

          "sulfadiazine",
          "silver sulfadiazine",
          "silvadene",

          "sulfasalazine",
          "azulfidine"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        riskTags: [
          "antibiotic",
          "allergy_risk",
          "rash_risk",
          "photosensitivity_risk",
          "hyperkalemia_risk",
          "renal_risk",
          "bone_marrow_suppression_risk",
          "g6pd_caution",
          "warfarin_interaction",
          "pregnancy_caution",
          "newborn_caution"
        ],

        interactionRisks: [
          "hyperkalemia_risk",
          "renal_risk",
          "warfarin_interaction",
          "photosensitivity_risk"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "rash",
          "photosensitivity",
          "loss of appetite"
        ],

        seriousEffects: [
          "stevens johnson syndrome",
          "toxic epidermal necrolysis",
          "anaphylaxis",
          "kidney injury",
          "hyperkalemia",
          "bone marrow suppression",
          "hemolytic anemia in g6pd deficiency",
          "c diff infection"
        ],

        warningSigns: [
          "skin peeling",
          "blistering rash",
          "mouth sores",
          "fever with rash",
          "hives",
          "swollen lips",
          "swollen tongue",
          "throat swelling",
          "trouble breathing",
          "decreased urination",
          "dark urine",
          "yellow skin",
          "yellow eyes",
          "easy bruising",
          "bleeding",
          "palpitations",
          "muscle weakness",
          "bloody diarrhea",
          "watery diarrhea"
        ],

        monitoring: [
          "rash progression",
          "kidney function",
          "potassium",
          "CBC",
          "photosensitivity",
          "bleeding risk with warfarin",
          "G6PD history",
          "pregnancy status",
          "newborn exposure"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Sulfonamides can cause severe allergic skin reactions, kidney injury, hyperkalemia, bone marrow suppression, and important drug interactions. TMP-SMX requires additional caution in patients with renal impairment, G6PD deficiency, pregnancy near term, and those taking warfarin."
      }
    ];
  }
};

window.AriInfectiousDiseaseSulfonamides =
  window.Ari.medical.registries.infectiousDisease.sulfonamides;

console.log(
  "ARI INFECTIOUS DISEASE SULFONAMIDES LOADED:",
  window.Ari.medical.registries.infectiousDisease.sulfonamides.version
);