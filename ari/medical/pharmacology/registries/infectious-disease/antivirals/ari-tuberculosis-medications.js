// ari/medical/pharmacology/registries/infectious-disease/ari-tuberculosis-medications.js
// Purpose: Register tuberculosis medication knowledge.
// V2.0.0 — Tuberculosis Medication Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.tuberculosisMedications = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "tuberculosis_medications",

        className: "Tuberculosis Medications",

        aliases: [
          "tb medications",
          "tuberculosis medications",
          "anti tuberculosis",

          "isoniazid",
          "inh",

          "rifampin",
          "rifampicin",
          "rifadin",

          "rifabutin",
          "mycobutin",

          "rifapentine",
          "priftin",

          "pyrazinamide",
          "pza",

          "ethambutol",
          "embutol",

          "streptomycin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "pulmonology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "tuberculosis",
          "hepatotoxicity",
          "drug_interactions",
          "peripheral_neuropathy",
          "optic_neuritis",
          "hyperuricemia",
          "ototoxicity",
          "pregnancy_caution",
          "directly_observed_therapy",
          "resistance_risk"
        ],

        patternTags: [
          "active_tb",
          "latent_tb",
          "mycobacterium_tuberculosis",
          "multidrug_resistant_tb"
        ],

        symptomLinks: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "vision changes",
          "blurred vision",
          "numbness",
          "tingling",
          "joint pain",
          "hearing loss"
        ],

        indications: [
          "active tuberculosis",
          "latent tuberculosis infection",
          "drug-resistant tuberculosis"
        ],

        commonUseCases: [
          "combination tuberculosis therapy",
          "latent TB treatment",
          "public health tuberculosis management"
        ],

        interactionRisks: [
          "cyp450_interactions",
          "warfarin",
          "oral_contraceptives",
          "hiv_medications",
          "anticonvulsants",
          "azole_antifungals"
        ],

        contraindications: [
          "history of severe allergy to medication components"
        ],

        precautions: [
          "pre-existing liver disease",
          "heavy alcohol use",
          "renal impairment",
          "pregnancy",
          "diabetes",
          "gout",
          "baseline vision disorders",
          "HIV coinfection"
        ],

        precautionTriggers: [
          "cirrhosis",
          "heavy_alcohol_use",
          "pregnancy",
          "renal_impairment",
          "vision_changes",
          "gout",
          "hiv"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "fatigue",
          "orange urine",
          "orange tears",
          "orange sweat"
        ],

        seriousEffects: [
          "drug-induced hepatitis",
          "acute liver failure",
          "optic neuritis",
          "peripheral neuropathy",
          "hyperuricemia",
          "gout flare",
          "ototoxicity",
          "severe allergic reaction"
        ],

        warningSigns: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "vision loss",
          "blurred vision",
          "numbness",
          "tingling",
          "hearing loss",
          "severe joint pain",
          "persistent vomiting"
        ],

        monitoring: [
          "AST",
          "ALT",
          "bilirubin",
          "renal function",
          "visual acuity",
          "color vision",
          "uric acid",
          "hearing when appropriate",
          "medication adherence"
        ],

        clinicalPearls: [
          "Tuberculosis treatment almost always requires combination therapy.",
          "Never treat active tuberculosis with a single medication.",
          "Rifampin commonly causes harmless orange discoloration of body fluids.",
          "Isoniazid commonly requires vitamin B6 (pyridoxine) supplementation to reduce neuropathy risk in selected patients.",
          "Ethambutol can cause optic neuritis, making vision monitoring important.",
          "Pyrazinamide can increase uric acid and precipitate gout.",
          "Medication adherence is critical to prevent resistance."
        ],

        reasoningHints: [
          "If rifampin is present, immediately review medication interactions.",
          "If numbness develops while taking isoniazid, increase peripheral neuropathy concern.",
          "If vision changes occur while taking ethambutol, increase optic neuritis probability.",
          "If gout symptoms develop while taking pyrazinamide, consider hyperuricemia.",
          "Always determine whether the patient has active or latent tuberculosis before reasoning about therapy."
        ],

        decisionRules: [
          {
            id: "ethambutol_vision",
            priority: "critical",
            when: [
              "ethambutol",
              "vision_changes"
            ],
            then: [
              "increase_optic_neuritis_probability",
              "recommend_ophthalmology_review"
            ]
          },
          {
            id: "isoniazid_neuropathy",
            priority: "high",
            when: [
              "isoniazid",
              "numbness"
            ],
            then: [
              "increase_peripheral_neuropathy_probability",
              "review_b6_status"
            ]
          },
          {
            id: "rifampin_interactions",
            priority: "critical",
            when: [
              "rifampin"
            ],
            then: [
              "activate_medication_interaction_engine"
            ]
          },
          {
            id: "pyrazinamide_gout",
            priority: "high",
            when: [
              "pyrazinamide",
              "joint_pain"
            ],
            then: [
              "increase_hyperuricemia_probability"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive_tb_test",
            "positive_tb_culture",
            "known_active_tb",
            "known_latent_tb",
            "recent_tb_exposure"
          ],
          decreases: [
            "negative_tb_testing",
            "alternative_diagnosis_identified"
          ]
        },

        relatedKnowledge: [
          "tuberculosis",
          "latent_tb",
          "multidrug_resistant_tb",
          "drug_induced_hepatitis",
          "optic_neuritis",
          "peripheral_neuropathy",
          "hiv_coinfection"
        ],

        followUpQuestions: [
          "Is this active tuberculosis or latent TB?",
          "Which TB medications are being taken?",
          "Any yellowing of the skin or eyes?",
          "Any numbness or tingling?",
          "Any vision changes?",
          "Any history of liver disease or heavy alcohol use?",
          "Any HIV infection?",
          "Has medication adherence been consistent?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        recommendedConsults: [
          "Infectious Disease",
          "Pulmonology",
          "Public Health",
          "Clinical Pharmacy"
        ],

        references: [
          "CDC Tuberculosis Guidelines",
          "WHO Tuberculosis Guidelines",
          "ATS/CDC/IDSA Tuberculosis Treatment Guidelines",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "Tuberculosis treatment requires multidrug therapy, careful monitoring, adherence, and public health coordination. Ari should recognize medication interactions, hepatotoxicity, optic neuritis, neuropathy, and resistance prevention as major reasoning priorities."
      }
    ];
  }
};

window.AriTuberculosisMedicationsRegistry =
  window.Ari.medical.registries.infectiousDisease.tuberculosisMedications;

console.log(
  "ARI TUBERCULOSIS MEDICATIONS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.tuberculosisMedications.version
);