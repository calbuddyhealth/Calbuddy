// ari/medical/pharmacology/registries/infectious-disease/ari-antiparasitic-medications.js
// Purpose: Register antiparasitic medication knowledge.
// V2.0.0 — Antiparasitic Medication Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.antiparasiticMedications = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "antiparasitic_medications",

        className: "Antiparasitic Medications",

        aliases: [
          "antiparasitic",
          "anthelmintic",
          "antimalarial",
          "antiprotozoal",

          "albendazole",
          "albenza",

          "mebendazole",
          "vermox",

          "ivermectin",
          "stromectol",

          "praziquantel",
          "biltricide",

          "nitazoxanide",
          "alinia",

          "atovaquone proguanil",
          "malarone",

          "chloroquine",
          "aralen",

          "hydroxychloroquine",
          "plaquenil",

          "primaquine",

          "tafenoquine",
          "krintafel",
          "kozenis",

          "artemether lumefantrine",
          "coartem",

          "quinine",
          "quinidine",

          "metronidazole",
          "flagyl",

          "tinidazole",
          "tindamax"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "travel_medicine"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "parasitic_infection",
          "malaria",
          "helminth",
          "protozoa",
          "travel_medicine",
          "g6pd_risk",
          "qt_prolongation",
          "hepatic_risk",
          "neurotoxicity",
          "pregnancy_caution"
        ],

        patternTags: [
          "malaria",
          "intestinal_parasites",
          "tapeworm",
          "roundworm",
          "hookworm",
          "pinworm",
          "strongyloidiasis",
          "giardiasis",
          "amebiasis",
          "schistosomiasis"
        ],

        symptomLinks: [
          "fever",
          "diarrhea",
          "bloody diarrhea",
          "abdominal pain",
          "anemia",
          "dark urine",
          "yellow skin",
          "vision changes",
          "dizziness",
          "palpitations"
        ],

        indications: [
          "malaria",
          "intestinal helminths",
          "tapeworm infections",
          "strongyloidiasis",
          "schistosomiasis",
          "giardiasis",
          "amebiasis",
          "selected protozoal infections"
        ],

        commonUseCases: [
          "travel-related infections",
          "intestinal parasites",
          "malaria treatment",
          "malaria prophylaxis"
        ],

        interactionRisks: [
          "qt_prolonging_medications",
          "warfarin",
          "antiepileptics",
          "cyp_interactions"
        ],

        contraindications: [
          "history of severe antiparasitic allergy"
        ],

        precautions: [
          "pregnancy",
          "breastfeeding",
          "hepatic impairment",
          "renal impairment",
          "G6PD deficiency",
          "cardiac arrhythmias",
          "seizure disorder"
        ],

        precautionTriggers: [
          "pregnancy",
          "g6pd_deficiency",
          "travel_history",
          "arrhythmia",
          "qt_prolongation",
          "hepatic_impairment",
          "renal_impairment"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "abdominal pain",
          "diarrhea",
          "headache",
          "dizziness"
        ],

        seriousEffects: [
          "hemolytic anemia",
          "QT prolongation",
          "torsades de pointes",
          "liver injury",
          "neurotoxicity",
          "seizures",
          "severe allergic reaction"
        ],

        warningSigns: [
          "dark urine",
          "yellow skin",
          "yellow eyes",
          "palpitations",
          "fainting",
          "confusion",
          "seizures",
          "difficulty breathing",
          "facial swelling"
        ],

        monitoring: [
          "CBC",
          "liver function",
          "renal function",
          "G6PD status before primaquine or tafenoquine",
          "ECG when QT risk exists",
          "parasite clearance",
          "travel history"
        ],

        clinicalPearls: [
          "Always obtain a travel history when evaluating parasitic infections.",
          "Primaquine and tafenoquine require G6PD testing before use because of hemolysis risk.",
          "Malaria therapy depends on species and local resistance patterns.",
          "Hydroxychloroquine is no longer appropriate for many malaria regions because of resistance.",
          "Metronidazole and tinidazole cover several protozoal infections but are also used for anaerobic bacterial infections.",
          "Many antiparasitic regimens are organism-specific."
        ],

        reasoningHints: [
          "Travel history often changes the differential diagnosis dramatically.",
          "If primaquine or tafenoquine is mentioned, verify G6PD status.",
          "If palpitations occur while taking an antimalarial with QT risk, increase cardiac concern.",
          "Differentiate protozoal infections from helminth infections before reasoning about therapy.",
          "Always ask which country the patient recently visited."
        ],

        decisionRules: [
          {
            id: "primaquine_g6pd",
            priority: "critical",
            when: [
              "primaquine"
            ],
            then: [
              "confirm_g6pd_status_before_use"
            ]
          },
          {
            id: "tafenoquine_g6pd",
            priority: "critical",
            when: [
              "tafenoquine"
            ],
            then: [
              "confirm_g6pd_status_before_use"
            ]
          },
          {
            id: "malaria_travel_history",
            priority: "high",
            when: [
              "malaria"
            ],
            then: [
              "request_recent_travel_history"
            ]
          },
          {
            id: "qt_risk",
            priority: "high",
            when: [
              "palpitations",
              "qt_prolonging_antimalarial"
            ],
            then: [
              "increase_qt_risk",
              "recommend_ecg_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "recent international travel",
            "positive parasite testing",
            "known malaria exposure",
            "known parasitic diagnosis"
          ],
          decreases: [
            "negative parasite testing",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "malaria",
          "giardiasis",
          "amebiasis",
          "strongyloidiasis",
          "schistosomiasis",
          "tapeworm",
          "travel_medicine",
          "g6pd_deficiency"
        ],

        followUpQuestions: [
          "Which country or countries were recently visited?",
          "Which antiparasitic medication is being taken?",
          "Has G6PD testing been performed?",
          "Any liver disease?",
          "Any palpitations or fainting?",
          "Was malaria testing positive?",
          "Any pregnancy or breastfeeding?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        recommendedConsults: [
          "Infectious Disease",
          "Travel Medicine",
          "Clinical Pharmacy"
        ],

        references: [
          "CDC Yellow Book",
          "CDC Malaria Guidelines",
          "WHO Malaria Guidelines",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "Antiparasitic therapy is organism-specific. Ari should prioritize travel history, organism identification, G6PD screening before primaquine or tafenoquine, malaria resistance patterns, QT risk, and specialist consultation for complex tropical infections."
      }
    ];
  }
};

window.AriAntiparasiticMedicationsRegistry =
  window.Ari.medical.registries.infectiousDisease.antiparasiticMedications;

console.log(
  "ARI ANTIPARASITIC MEDICATIONS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antiparasiticMedications.version
);