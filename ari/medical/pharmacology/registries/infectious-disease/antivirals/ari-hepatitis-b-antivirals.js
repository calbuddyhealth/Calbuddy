// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-hepatitis-b-antivirals.js
// Purpose: Register Hepatitis B antiviral medication knowledge.
// V2.0.0 — Hepatitis B Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisBAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "hepatitis_b_antivirals",

        className: "Hepatitis B Antiviral Medications",

        aliases: [
          "hepatitis b medication",
          "hbv medication",
          "hbv antiviral",

          "tenofovir disoproxil fumarate",
          "tdf",
          "viread",

          "tenofovir alafenamide",
          "taf",
          "vemlidy",

          "entecavir",
          "baraclude",

          "lamivudine",
          "epivir hbv",

          "adefovir",
          "hepsera",

          "telbivudine",
          "tyzeka",

          "peginterferon alfa",
          "pegasys"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "hepatitis_b_treatment",
          "renal_risk",
          "hepatic_risk",
          "bone_density_risk",
          "lactic_acidosis_risk",
          "hepatitis_b_flare_risk",
          "pregnancy_caution"
        ],

        patternTags: [
          "chronic_hepatitis_b",
          "viral_hepatitis",
          "hepatic_disease"
        ],

        symptomLinks: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "right upper abdominal pain",
          "fatigue",
          "abdominal swelling",
          "decreased urination"
        ],

        indications: [
          "chronic hepatitis B infection",
          "suppression of HBV replication"
        ],

        commonUseCases: [
          "long-term HBV treatment",
          "HBV viral suppression"
        ],

        interactionRisks: [
          "renal_risk",
          "nephrotoxic_medications",
          "hepatic_risk"
        ],

        contraindications: [
          "history of severe allergy to medication components"
        ],

        precautions: [
          "renal impairment",
          "advanced liver disease",
          "pregnancy",
          "osteoporosis",
          "coinfection with HIV"
        ],

        precautionTriggers: [
          "renal_impairment",
          "cirrhosis",
          "pregnancy",
          "hiv_coinfection",
          "stopped_hbv_medication"
        ],

        blackBoxWarnings: [
          "Severe acute exacerbations of hepatitis B have occurred after discontinuation of HBV therapy."
        ],

        commonEffects: [
          "headache",
          "fatigue",
          "nausea",
          "diarrhea"
        ],

        seriousEffects: [
          "hepatitis B flare",
          "lactic acidosis",
          "acute kidney injury",
          "hepatic failure",
          "bone mineral density loss",
          "severe allergic reaction"
        ],

        warningSigns: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "abdominal swelling",
          "confusion",
          "decreased urination",
          "severe weakness",
          "persistent vomiting"
        ],

        monitoring: [
          "HBV DNA",
          "AST",
          "ALT",
          "bilirubin",
          "renal function",
          "bone health when appropriate",
          "liver ultrasound when indicated"
        ],

        clinicalPearls: [
          "Do not stop hepatitis B therapy without medical supervision.",
          "Tenofovir DF and TAF have different renal and bone safety profiles.",
          "Long-term viral suppression reduces progression to cirrhosis and liver cancer.",
          "Monitor renal function throughout therapy.",
          "Always evaluate HIV status before HBV treatment because some HBV medications are also active against HIV."
        ],

        reasoningHints: [
          "If antiviral therapy was recently stopped, consider hepatitis B flare.",
          "If jaundice worsens after stopping therapy, increase concern for hepatic decompensation.",
          "Review renal function before selecting tenofovir formulations.",
          "Always ask about HIV coinfection before recommending HBV medications."
        ],

        decisionRules: [
          {
            id: "hbv_flare_after_discontinuation",
            priority: "critical",
            when: [
              "stopped_hbv_medication",
              "jaundice"
            ],
            then: [
              "increase_hepatitis_b_flare_probability",
              "recommend_urgent_clinician_review"
            ]
          },
          {
            id: "renal_review",
            priority: "high",
            when: [
              "tenofovir",
              "renal_impairment"
            ],
            then: [
              "recommend_renal_function_review"
            ]
          },
          {
            id: "hiv_coinfection",
            priority: "high",
            when: [
              "hepatitis_b",
              "hiv"
            ],
            then: [
              "increase_coinfection_importance",
              "recommend_specialist_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "known chronic hepatitis B",
            "positive HBV DNA",
            "recent medication discontinuation",
            "cirrhosis"
          ],
          decreases: [
            "alternative liver disease identified",
            "negative HBV testing"
          ]
        },

        relatedKnowledge: [
          "hepatitis_b",
          "cirrhosis",
          "hepatocellular_carcinoma",
          "renal_dosing",
          "hiv_coinfection"
        ],

        followUpQuestions: [
          "Which hepatitis B medication is being taken?",
          "Has any medication recently been stopped?",
          "Any jaundice or dark urine?",
          "Any kidney disease?",
          "Any history of HIV?",
          "When were the last liver blood tests?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        recommendedConsults: [
          "Infectious Disease",
          "Hepatology"
        ],

        references: [
          "AASLD Hepatitis B Guidance",
          "WHO Hepatitis B Guidelines",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "Hepatitis B antiviral therapy is typically long-term. Abrupt discontinuation may lead to severe hepatitis B flare. Therapy selection should consider renal function, HIV coinfection, bone health, pregnancy, and ongoing liver monitoring."
      }
    ];
  }
};

window.AriHepatitisBAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisBAntivirals;

console.log(
  "ARI HEPATITIS B ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisBAntivirals.version
);