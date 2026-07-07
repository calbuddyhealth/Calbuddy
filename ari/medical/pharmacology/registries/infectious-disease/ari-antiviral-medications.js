// ari/medical/pharmacology/registries/infectious-disease/ari-antiviral-medications.js
// Purpose: Register antiviral medication knowledge.
// V2.0.0 — Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.antivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "antiviral_medications",

        className: "Antiviral Medications",

        aliases: [
          "antiviral",

          "acyclovir", "zovirax",
          "valacyclovir", "valtrex",
          "famciclovir", "famvir",

          "oseltamivir", "tamiflu",
          "zanamivir", "relenza",
          "baloxavir", "xofluza",

          "nirmatrelvir ritonavir", "paxlovid",
          "remdesivir", "veklury",
          "molnupiravir", "lagevrio",

          "tenofovir",
          "emtricitabine",
          "dolutegravir",
          "bictegravir",
          "efavirenz",
          "ritonavir",

          "sofosbuvir",
          "ledipasvir",
          "velpatasvir",
          "glecaprevir",
          "pibrentasvir",

          "ribavirin",
          "palivizumab"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antiviral",
          "renal_adjustment_possible",
          "hepatic_risk",
          "cyp_interaction",
          "drug_interaction",
          "neuropsychiatric_effect_risk",
          "resistance_risk",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        patternTags: [
          "viral_infection",
          "hsv",
          "influenza",
          "covid",
          "hiv",
          "hepatitis",
          "rsv"
        ],

        symptomLinks: [
          "confusion",
          "hallucinations",
          "nausea",
          "vomiting",
          "diarrhea",
          "yellow skin",
          "yellow eyes",
          "decreased urination",
          "rash"
        ],

        indications: [
          "HSV infection",
          "varicella zoster infection",
          "influenza",
          "COVID-19",
          "HIV",
          "hepatitis B",
          "hepatitis C",
          "RSV prevention in selected high-risk patients"
        ],

        commonUseCases: [
          "treatment of viral infections",
          "viral suppression",
          "post-exposure prophylaxis in selected settings",
          "prevention in high-risk patients"
        ],

        interactionRisks: [
          "cyp3a_interactions",
          "ritonavir_boosting_interactions",
          "renal_risk",
          "hepatic_risk",
          "immunosuppressant_interactions",
          "statin_interactions",
          "anticoagulant_interactions"
        ],

        contraindications: [
          "history of severe antiviral allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "headache",
          "fatigue",
          "rash"
        ],

        seriousEffects: [
          "kidney injury",
          "liver injury",
          "severe allergic reaction",
          "neuropsychiatric effects",
          "severe drug interaction",
          "anemia with ribavirin",
          "birth defect risk with ribavirin"
        ],

        warningSigns: [
          "decreased urination",
          "confusion",
          "hallucinations",
          "severe rash",
          "swollen lips",
          "swollen tongue",
          "trouble breathing",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "severe weakness",
          "fainting"
        ],

        monitoring: [
          "renal function",
          "liver function",
          "drug interaction review",
          "mental status changes",
          "CBC when clinically relevant",
          "pregnancy status when relevant"
        ],

        clinicalPearls: [
          "Paxlovid has many clinically important drug interactions because of ritonavir.",
          "Acyclovir and valacyclovir may require renal dose adjustment.",
          "Oseltamivir works best when started early in influenza illness.",
          "HIV medications should not be stopped or changed casually because resistance and viral rebound can occur.",
          "Ribavirin has important pregnancy-related risks.",
          "Hepatitis C antivirals are regimen-specific and should be handled with specialist-level accuracy."
        ],

        reasoningHints: [
          "If Paxlovid is mentioned, immediately review medication interactions.",
          "If confusion occurs with acyclovir or valacyclovir, consider renal impairment and neurotoxicity.",
          "If decreased urination occurs during acyclovir therapy, increase kidney injury concern.",
          "If HIV therapy is interrupted, consider adherence, resistance, and viral rebound.",
          "If ribavirin is mentioned, pregnancy risk must be treated as high importance."
        ],

        decisionRules: [
          {
            id: "paxlovid_interaction_review",
            priority: "high",
            when: [
              "paxlovid"
            ],
            then: [
              "activate_interaction_engine",
              "increase_drug_interaction_weight"
            ]
          },
          {
            id: "acyclovir_renal_neurotoxicity",
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
            id: "acyclovir_kidney_signal",
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
            id: "hiv_med_interruption",
            priority: "high",
            when: [
              "hiv_medication",
              "stopped_medication"
            ],
            then: [
              "increase_resistance_concern",
              "recommend_clinician_review"
            ]
          },
          {
            id: "ribavirin_pregnancy_risk",
            priority: "emergency",
            when: [
              "ribavirin",
              "pregnant"
            ],
            then: [
              "increase_pregnancy_safety_weight",
              "recommend_immediate_clinician_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "known viral diagnosis",
            "positive viral test",
            "recent antiviral start",
            "renal impairment with acyclovir symptoms",
            "ritonavir-containing regimen",
            "known HIV or hepatitis treatment"
          ],
          decreases: [
            "symptoms began before antiviral therapy",
            "negative viral testing",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "hsv",
          "influenza",
          "covid_19",
          "hiv",
          "hepatitis_b",
          "hepatitis_c",
          "rsv",
          "renal_dosing",
          "drug_interactions"
        ],

        followUpQuestions: [
          "Which antiviral is being taken?",
          "When was it started?",
          "What infection is it being used for?",
          "Any kidney disease or decreased urination?",
          "Any confusion, hallucinations, rash, or trouble breathing?",
          "What other medications are being taken?",
          "Is the patient pregnant or could they be pregnant?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        references: [
          "FDA Prescribing Information",
          "NIH HIV Guidelines",
          "NIH COVID-19 Treatment Guidelines",
          "CDC Influenza Guidance",
          "AASLD-IDSA HCV Guidance",
          "Lexicomp"
        ],

        notes:
          "Antivirals vary widely by virus and regimen. The most important high-yield safety issues include renal dosing for acyclovir-family drugs, ritonavir-mediated interactions with Paxlovid and HIV regimens, pregnancy risks with ribavirin, and adherence/resistance concerns with HIV therapy."
      }
    ];
  }
};

window.AriInfectiousDiseaseAntivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals;

console.log(
  "ARI INFECTIOUS DISEASE ANTIVIRALS LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.version
);