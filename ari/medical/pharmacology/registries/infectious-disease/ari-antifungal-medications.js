// ari/medical/pharmacology/registries/infectious-disease/ari-antifungal-medications.js
// Purpose: Register antifungal medication knowledge.
// V2.0.0 — Antifungal Registry / Universal Medical Knowledge Object (UMKO)

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.antifungals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "antifungal_medications",

        className: "Antifungal Medications",

        aliases: [
          "antifungal",

          "fluconazole",
          "diflucan",

          "itraconazole",
          "sporanox",

          "voriconazole",
          "vfend",

          "posaconazole",
          "noxafil",

          "isavuconazonium",
          "cresemba",

          "ketoconazole",

          "micafungin",
          "mycamine",

          "caspofungin",
          "cancidas",

          "anidulafungin",
          "eraxis",

          "amphotericin b",
          "ambisome",
          "amphotec",
          "abelcet",

          "flucytosine",
          "ancobon",

          "terbinafine",
          "lamisil",

          "nystatin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antifungal",
          "hepatic_risk",
          "renal_risk",
          "qt_risk",
          "electrolyte_risk",
          "infusion_reaction",
          "bone_marrow_suppression",
          "drug_interaction",
          "pregnancy_caution"
        ],

        patternTags: [
          "fungal_infection",
          "opportunistic_infection",
          "drug_induced_hepatitis",
          "electrolyte_disturbance"
        ],

        symptomLinks: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "muscle cramps",
          "weakness",
          "palpitations",
          "rash",
          "fever",
          "chills"
        ],

        indications: [
          "candidiasis",
          "aspergillosis",
          "cryptococcal infection",
          "histoplasmosis",
          "blastomycosis",
          "coccidioidomycosis",
          "onychomycosis",
          "oral candidiasis"
        ],

        commonUseCases: [
          "systemic fungal infections",
          "superficial fungal infections",
          "opportunistic fungal infections"
        ],

        interactionRisks: [
          "cyp450_interactions",
          "warfarin",
          "statins",
          "qt_prolonging_medications",
          "calcineurin_inhibitors"
        ],

        contraindications: [
          "history of severe antifungal allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "diarrhea",
          "headache",
          "rash",
          "abdominal pain"
        ],

        seriousEffects: [
          "liver injury",
          "acute kidney injury",
          "QT prolongation",
          "torsades de pointes",
          "electrolyte abnormalities",
          "bone marrow suppression",
          "anaphylaxis",
          "infusion reactions"
        ],

        warningSigns: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "decreased urination",
          "palpitations",
          "fainting",
          "muscle weakness",
          "muscle cramps",
          "persistent fever",
          "easy bruising",
          "bleeding",
          "difficulty breathing"
        ],

        monitoring: [
          "liver function",
          "renal function",
          "CBC when appropriate",
          "potassium",
          "magnesium",
          "QT interval when appropriate",
          "drug interactions"
        ],

        clinicalPearls: [
          "Azoles have numerous CYP450 drug interactions.",
          "Amphotericin B commonly causes kidney injury and electrolyte loss.",
          "Flucytosine often requires CBC monitoring because of bone marrow suppression.",
          "Echinocandins generally have fewer drug interactions than azoles.",
          "Terbinafine is commonly used for nail fungal infections.",
          "Nystatin is not systemically absorbed when used orally for oral candidiasis."
        ],

        reasoningHints: [
          "Always review the medication list before prescribing azoles.",
          "If creatinine rises during amphotericin therapy, increase nephrotoxicity suspicion.",
          "If potassium and magnesium fall together, consider amphotericin toxicity.",
          "If bruising develops during flucytosine therapy, evaluate bone marrow suppression.",
          "Review ECG risk factors when QT-prolonging medications are combined."
        ],

        decisionRules: [
          {
            id: "amphotericin_nephrotoxicity",
            priority: "high",
            when: [
              "amphotericin_b",
              "creatinine_rising"
            ],
            then: [
              "increase_renal_injury_probability",
              "recommend_renal_review"
            ]
          },
          {
            id: "azole_qt",
            priority: "high",
            when: [
              "azole",
              "palpitations"
            ],
            then: [
              "increase_qt_risk",
              "recommend_ecg_review"
            ]
          },
          {
            id: "flucytosine_cbc",
            priority: "high",
            when: [
              "flucytosine",
              "platelets_falling"
            ],
            then: [
              "increase_bone_marrow_suppression_probability"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive fungal culture",
            "immunocompromised",
            "recent antifungal therapy",
            "abnormal liver enzymes",
            "electrolyte abnormalities"
          ],
          decreases: [
            "negative fungal studies",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "candida",
          "aspergillus",
          "cryptococcus",
          "fungal_pneumonia",
          "opportunistic_infections",
          "drug_induced_liver_injury",
          "acute_kidney_injury"
        ],

        followUpQuestions: [
          "Which antifungal is being taken?",
          "When was it started?",
          "Any yellowing of the skin or eyes?",
          "Any decreased urination?",
          "Any palpitations or fainting?",
          "Any muscle weakness or cramps?",
          "Any recent liver or kidney blood work?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        references: [
          "FDA Prescribing Information",
          "Lexicomp",
          "IDSA Clinical Practice Guidelines",
          "Sanford Guide",
          "Johns Hopkins ABX Guide"
        ],

        notes:
          "Antifungal medications vary substantially by class. Azoles are notable for CYP-mediated drug interactions and liver toxicity. Amphotericin B is associated with nephrotoxicity and electrolyte disturbances. Flucytosine requires bone marrow monitoring, while echinocandins generally have fewer drug interactions."
      }
    ];
  }
};

window.AriInfectiousDiseaseAntifungals =
  window.Ari.medical.registries.infectiousDisease.antifungals;

console.log(
  "ARI INFECTIOUS DISEASE ANTIFUNGALS LOADED:",
  window.Ari.medical.registries.infectiousDisease.antifungals.version
);