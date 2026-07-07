// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-covid-antivirals.js
// Purpose: Register COVID-19 antiviral medication knowledge.
// V2.0.0 — COVID Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.covidAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "covid_antivirals",

        className: "COVID-19 Antivirals",

        aliases: [
          "covid antiviral",
          "covid medication",

          "paxlovid",
          "nirmatrelvir",
          "ritonavir",

          "remdesivir",
          "veklury",

          "molnupiravir",
          "lagevrio"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "covid_treatment",
          "drug_interaction",
          "ritonavir_interactions",
          "hepatic_risk",
          "renal_risk",
          "pregnancy_caution",
          "high_risk_patient"
        ],

        patternTags: [
          "covid_19",
          "viral_infection",
          "early_antiviral_treatment"
        ],

        symptomLinks: [
          "fever",
          "cough",
          "shortness of breath",
          "fatigue",
          "confusion",
          "yellow skin",
          "yellow eyes",
          "decreased urination"
        ],

        indications: [
          "mild to moderate COVID-19 in selected high-risk patients",
          "early outpatient treatment",
          "hospitalized COVID-19 (selected patients)"
        ],

        commonUseCases: [
          "high-risk outpatient COVID treatment",
          "early antiviral therapy",
          "hospital treatment with remdesivir when appropriate"
        ],

        interactionRisks: [
          "cyp3a_interactions",
          "ritonavir_boosting",
          "statins",
          "antiarrhythmics",
          "anticoagulants",
          "immunosuppressants",
          "renal_impairment"
        ],

        contraindications: [
          "history of severe allergy to a component medication"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "altered taste",
          "diarrhea",
          "nausea",
          "headache"
        ],

        seriousEffects: [
          "serious drug interactions",
          "liver injury",
          "hypersensitivity reaction",
          "kidney injury"
        ],

        warningSigns: [
          "yellow skin",
          "yellow eyes",
          "difficulty breathing",
          "facial swelling",
          "decreased urination",
          "persistent vomiting",
          "severe weakness"
        ],

        monitoring: [
          "medication interaction review",
          "renal function",
          "hepatic function",
          "symptom progression",
          "oxygen needs"
        ],

        clinicalPearls: [
          "Paxlovid has numerous clinically important CYP3A drug interactions because of ritonavir.",
          "Treatment is most beneficial when started early after symptom onset.",
          "Remdesivir is administered intravenously.",
          "COVID rebound has been reported after Paxlovid treatment, but rebound can also occur without antiviral therapy.",
          "Medication review is essential before prescribing Paxlovid."
        ],

        reasoningHints: [
          "Always perform a medication interaction review before recommending Paxlovid.",
          "Do not attribute worsening respiratory symptoms to the medication before considering progression of COVID-19.",
          "Review renal and hepatic function when selecting antiviral therapy.",
          "Differentiate COVID rebound from treatment failure."
        ],

        decisionRules: [
          {
            id: "paxlovid_interactions",
            priority: "critical",
            when: [
              "paxlovid"
            ],
            then: [
              "activate_medication_interaction_engine",
              "increase_drug_interaction_weight"
            ]
          },
          {
            id: "covid_high_risk",
            priority: "high",
            when: [
              "covid_19",
              "high_risk_patient"
            ],
            then: [
              "increase_antiviral_consideration"
            ]
          },
          {
            id: "renal_review",
            priority: "high",
            when: [
              "renal_impairment",
              "paxlovid"
            ],
            then: [
              "recommend_renal_function_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive covid test",
            "high-risk medical conditions",
            "early symptom onset",
            "known exposure"
          ],
          decreases: [
            "negative testing",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "covid_19",
          "viral_pneumonia",
          "ritonavir",
          "drug_interactions",
          "renal_dosing",
          "hepatic_impairment"
        ],

        followUpQuestions: [
          "When did symptoms begin?",
          "Was the COVID test positive?",
          "Which antiviral is being taken?",
          "What other prescription medications are being taken?",
          "Any kidney or liver disease?",
          "Any worsening shortness of breath or chest pain?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        references: [
          "NIH COVID-19 Treatment Guidelines",
          "CDC COVID-19 Clinical Guidance",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "COVID-19 antivirals include Paxlovid (nirmatrelvir/ritonavir), remdesivir, and molnupiravir. The highest-yield safety issue is ritonavir-mediated drug interactions. Therapy selection should consider timing of illness, patient risk factors, renal and hepatic function, and potential medication interactions."
      }
    ];
  }
};

window.AriCovidAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.covidAntivirals;

console.log(
  "ARI COVID ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.covidAntivirals.version
);