// ari/medical/pharmacology/registries/infectious-disease/ari-nitroimidazole-medications.js
// Purpose: Register nitroimidazole-class antimicrobial medication knowledge.
// V1.0.0 — Nitroimidazole Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.nitroimidazoles = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "nitroimidazole_antimicrobials",

        className: "Nitroimidazole Antimicrobials",

        aliases: [
          "nitroimidazole",

          "metronidazole",
          "flagyl",

          "tinidazole",
          "tindamax",

          "secnidazole",
          "solosec"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "gastroenterology"
        ],

        riskTags: [
          "antimicrobial",
          "anaerobic_coverage",
          "gi_risk",
          "neuropathy_risk",
          "seizure_risk",
          "hepatic_risk",
          "warfarin_interaction",
          "alcohol_reaction_warning"
        ],

        interactionRisks: [
          "warfarin_interaction",
          "hepatic_risk",
          "neuropathy_risk",
          "alcohol_reaction_warning"
        ],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "abdominal pain",
          "metallic taste",
          "dry mouth",
          "headache",
          "dark urine"
        ],

        seriousEffects: [
          "peripheral neuropathy",
          "seizure",
          "encephalopathy",
          "liver injury",
          "severe allergic reaction"
        ],

        warningSigns: [
          "new numbness",
          "tingling",
          "burning pain",
          "difficulty walking",
          "confusion",
          "seizure",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "hives",
          "swollen lips",
          "swollen tongue",
          "throat swelling",
          "trouble breathing"
        ],

        monitoring: [
          "neurologic symptoms",
          "GI symptoms",
          "liver symptoms",
          "warfarin/INR if applicable",
          "alcohol exposure"
        ],

        clinicalPearls: [
          "Avoid alcohol during therapy and for the recommended period after the last dose because of the potential for a disulfiram-like reaction.",
          "A metallic taste is a common side effect.",
          "Longer courses increase the risk of peripheral neuropathy.",
          "Can significantly increase INR in patients taking warfarin.",
          "Dark urine may occur and is usually harmless."
        ],

        pediatricCaution: true,
        pregnancyCaution: true,

        notes:
          "Nitroimidazoles are commonly used for anaerobic infections, bacterial vaginosis, certain protozoal infections, and C. difficile (oral metronidazole historically, though treatment recommendations evolve). Evaluate alcohol use, neurologic symptoms, liver disease, and interacting medications."
      }
    ];
  }
};

window.AriInfectiousDiseaseNitroimidazoles =
  window.Ari.medical.registries.infectiousDisease.nitroimidazoles;

console.log(
  "ARI INFECTIOUS DISEASE NITROIMIDAZOLES LOADED:",
  window.Ari.medical.registries.infectiousDisease.nitroimidazoles.version
);