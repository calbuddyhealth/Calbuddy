// ari/medical/pharmacology/registries/infectious-disease/ari-lipopeptide-medications.js
// Purpose: Register lipopeptide antibiotic medication knowledge.
// V2.0.0 — Lipopeptide Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.lipopeptides = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "lipopeptide_antibiotics",

        className: "Lipopeptide Antibiotics",

        aliases: [
          "lipopeptide",
          "daptomycin",
          "cubicin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antibiotic",
          "mrsa_coverage",
          "vre_coverage",
          "muscle_injury_risk",
          "myopathy_risk",
          "rhabdomyolysis_risk",
          "eosinophilic_pneumonia_risk",
          "renal_adjustment_possible"
        ],

        patternTags: [
          "muscle_injury",
          "resistant_gram_positive_infection",
          "drug_induced_lung_injury"
        ],

        symptomLinks: [
          "muscle pain",
          "muscle weakness",
          "dark urine",
          "shortness of breath",
          "new cough",
          "fever",
          "chest discomfort"
        ],

        indications: [
          "MRSA infections",
          "VRE infections",
          "complicated skin and soft tissue infections",
          "bacteremia",
          "right-sided endocarditis"
        ],

        commonUseCases: [
          "resistant gram-positive infections",
          "alternative to vancomycin in selected infections"
        ],

        interactionRisks: [
          "statins",
          "muscle_injury_risk",
          "renal_risk"
        ],

        contraindications: [
          "history of severe daptomycin allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "diarrhea",
          "headache",
          "injection site reaction"
        ],

        seriousEffects: [
          "myopathy",
          "rhabdomyolysis",
          "eosinophilic pneumonia",
          "peripheral neuropathy",
          "severe allergic reaction"
        ],

        warningSigns: [
          "new muscle pain",
          "muscle weakness",
          "dark urine",
          "shortness of breath",
          "new cough",
          "fever",
          "trouble breathing",
          "hives",
          "facial swelling"
        ],

        monitoring: [
          "CK level",
          "muscle symptoms",
          "renal function",
          "respiratory symptoms",
          "statin use"
        ],

        clinicalPearls: [
          "Daptomycin is not used for pneumonia because pulmonary surfactant inactivates it.",
          "Monitor CK levels during therapy.",
          "Ask about statin use because muscle toxicity risk may increase.",
          "Consider eosinophilic pneumonia if new fever, cough, or shortness of breath develops during therapy.",
          "Useful for selected resistant gram-positive bloodstream infections."
        ],

        reasoningHints: [
          "If pneumonia is the suspected infection, do not treat daptomycin as appropriate lung coverage.",
          "If new muscle pain or weakness appears, increase suspicion for myopathy or rhabdomyolysis.",
          "If dark urine appears with muscle pain, increase urgency for rhabdomyolysis evaluation.",
          "If new respiratory symptoms develop after starting daptomycin, consider eosinophilic pneumonia.",
          "Review concurrent statin use when muscle symptoms occur."
        ],

        decisionRules: [
          {
            id: "daptomycin_not_for_pneumonia",
            priority: "high",
            when: [
              "daptomycin",
              "pneumonia"
            ],
            then: [
              "flag_inappropriate_pulmonary_coverage",
              "increase_need_for_clinician_review"
            ]
          },
          {
            id: "myopathy_signal",
            priority: "high",
            when: [
              "daptomycin",
              "muscle_pain"
            ],
            then: [
              "increase_myopathy_probability",
              "recommend_ck_review"
            ]
          },
          {
            id: "rhabdomyolysis_signal",
            priority: "emergency",
            when: [
              "daptomycin",
              "muscle_weakness",
              "dark_urine"
            ],
            then: [
              "increase_rhabdomyolysis_probability",
              "increase_urgency"
            ]
          },
          {
            id: "eosinophilic_pneumonia_signal",
            priority: "high",
            when: [
              "daptomycin",
              "new_cough",
              "shortness_of_breath",
              "fever"
            ],
            then: [
              "increase_eosinophilic_pneumonia_probability",
              "recommend_same_day_clinician_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "recent daptomycin start",
            "CK elevated",
            "new muscle pain",
            "dark urine",
            "concurrent statin use",
            "new respiratory symptoms after starting therapy"
          ],
          decreases: [
            "symptoms started before daptomycin",
            "normal CK with no muscle symptoms",
            "alternative cause identified"
          ]
        },

        relatedKnowledge: [
          "mrsa",
          "vre",
          "rhabdomyolysis",
          "myopathy",
          "eosinophilic_pneumonia",
          "ck_lab",
          "statin_medications"
        ],

        followUpQuestions: [
          "When was daptomycin started?",
          "Any new muscle pain or weakness?",
          "Any dark urine?",
          "Are they also taking a statin?",
          "Any new cough, fever, or shortness of breath?",
          "Has a CK level or kidney function been checked?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: false,

        references: [
          "FDA Prescribing Information",
          "Lexicomp",
          "IDSA Guidelines",
          "Sanford Guide"
        ],

        notes:
          "Lipopeptides such as daptomycin are important agents for resistant gram-positive infections. Key safety concerns include myopathy, rhabdomyolysis, eosinophilic pneumonia, and renal adjustment. Daptomycin should not be treated as pneumonia coverage."
      }
    ];
  }
};

window.AriInfectiousDiseaseLipopeptides =
  window.Ari.medical.registries.infectiousDisease.lipopeptides;

console.log(
  "ARI INFECTIOUS DISEASE LIPOPEPTIDES LOADED:",
  window.Ari.medical.registries.infectiousDisease.lipopeptides.version
);