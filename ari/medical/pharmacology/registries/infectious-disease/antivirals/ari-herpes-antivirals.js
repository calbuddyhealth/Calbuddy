// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-herpes-antivirals.js
// Purpose: Register herpesvirus antiviral medication knowledge.
// V2.0.0 — Herpes Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.herpesAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "herpes_antivirals",

        className: "Herpesvirus Antivirals",

        aliases: [
          "herpes antiviral",
          "hsv antiviral",
          "vzv antiviral",

          "acyclovir",
          "zovirax",

          "valacyclovir",
          "valtrex",

          "famciclovir",
          "famvir"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antiviral",
          "hsv_treatment",
          "vzv_treatment",
          "renal_adjustment_possible",
          "renal_risk",
          "neurotoxicity_risk",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        patternTags: [
          "hsv",
          "genital_herpes",
          "cold_sores",
          "shingles",
          "varicella_zoster",
          "drug_induced_neurotoxicity",
          "renal_injury"
        ],

        symptomLinks: [
          "confusion",
          "hallucinations",
          "decreased urination",
          "flank pain",
          "nausea",
          "vomiting",
          "headache",
          "rash"
        ],

        indications: [
          "HSV infection",
          "genital herpes",
          "cold sores",
          "varicella zoster",
          "shingles",
          "viral suppression in selected patients"
        ],

        commonUseCases: [
          "episodic HSV treatment",
          "HSV suppressive therapy",
          "shingles treatment",
          "varicella treatment in selected settings"
        ],

        interactionRisks: [
          "renal_risk",
          "nephrotoxic_medications",
          "renal_dose_adjustment"
        ],

        contraindications: [
          "history of severe acyclovir, valacyclovir, or famciclovir allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "headache",
          "fatigue"
        ],

        seriousEffects: [
          "kidney injury",
          "crystalluria",
          "neurotoxicity",
          "confusion",
          "hallucinations",
          "seizure",
          "severe allergic reaction"
        ],

        warningSigns: [
          "decreased urination",
          "confusion",
          "hallucinations",
          "seizure",
          "severe weakness",
          "trouble breathing",
          "swollen lips",
          "swollen tongue",
          "severe rash"
        ],

        monitoring: [
          "renal function",
          "hydration status",
          "mental status changes",
          "urine output",
          "dose adjustment in renal impairment"
        ],

        clinicalPearls: [
          "Acyclovir and valacyclovir may require renal dose adjustment.",
          "Hydration matters, especially with higher-dose acyclovir.",
          "Confusion or hallucinations during therapy should raise concern for neurotoxicity, especially with renal impairment.",
          "Early treatment is more effective for HSV and shingles outbreaks.",
          "Suppressive therapy may reduce recurrence frequency in selected patients."
        ],

        reasoningHints: [
          "If confusion occurs after starting acyclovir or valacyclovir, review renal function and hydration.",
          "If decreased urination appears during therapy, increase concern for kidney injury.",
          "If symptoms started before antiviral therapy, do not over-attribute them to the medication.",
          "If shingles is present, timing from rash onset affects expected benefit."
        ],

        decisionRules: [
          {
            id: "acyclovir_neurotoxicity_signal",
            priority: "high",
            when: [
              "acyclovir",
              "confusion"
            ],
            then: [
              "increase_neurotoxicity_probability",
              "recommend_renal_function_review"
            ]
          },
          {
            id: "valacyclovir_neurotoxicity_signal",
            priority: "high",
            when: [
              "valacyclovir",
              "hallucinations"
            ],
            then: [
              "increase_neurotoxicity_probability",
              "recommend_renal_function_review"
            ]
          },
          {
            id: "renal_injury_signal",
            priority: "high",
            when: [
              "acyclovir",
              "decreased_urination"
            ],
            then: [
              "increase_renal_injury_probability",
              "increase_urgency"
            ]
          },
          {
            id: "early_outbreak_treatment",
            priority: "medium",
            when: [
              "hsv_outbreak",
              "early_symptom_onset"
            ],
            then: [
              "increase_expected_antiviral_benefit"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "recent herpes antiviral start",
            "renal impairment",
            "dehydration",
            "confusion after medication start",
            "decreased urination after medication start"
          ],
          decreases: [
            "symptoms started before antiviral therapy",
            "normal renal function",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "hsv",
          "genital_herpes",
          "varicella_zoster",
          "shingles",
          "renal_dosing",
          "drug_induced_neurotoxicity",
          "acute_kidney_injury"
        ],

        followUpQuestions: [
          "Which antiviral is being taken?",
          "When was it started?",
          "Is it for HSV, shingles, or another viral infection?",
          "Any kidney disease or decreased urination?",
          "Any confusion, hallucinations, severe weakness, or seizure?",
          "Is the patient drinking fluids normally?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: false,

        references: [
          "FDA Prescribing Information",
          "CDC STI Treatment Guidelines",
          "Lexicomp"
        ],

        notes:
          "Herpesvirus antivirals include acyclovir, valacyclovir, and famciclovir. High-yield safety concerns include renal dose adjustment, hydration, kidney injury, and neurotoxicity, especially in renal impairment or older adults."
      }
    ];
  }
};

window.AriHerpesAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.herpesAntivirals;

console.log(
  "ARI HERPES ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.herpesAntivirals.version
);