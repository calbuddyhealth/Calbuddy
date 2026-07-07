// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-hepatitis-c-antivirals.js
// Purpose: Register Hepatitis C antiviral medication knowledge.
// V2.0.0 — Hepatitis C Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisCAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "hepatitis_c_antivirals",

        className: "Hepatitis C Direct-Acting Antivirals",

        aliases: [
          "hepatitis c medication",
          "hcv medication",
          "hcv antiviral",
          "direct acting antiviral",
          "daa",

          "sofosbuvir",
          "sovaldi",

          "ledipasvir sofosbuvir",
          "harvoni",

          "velpatasvir sofosbuvir",
          "epclusa",

          "glecaprevir pibrentasvir",
          "mavyret",

          "voxilaprevir velpatasvir sofosbuvir",
          "vosevi",

          "elbasvir grazoprevir",
          "zepatier",

          "dasabuvir ombitasvir paritaprevir ritonavir",
          "viekira",

          "ribavirin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "hepatology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "hepatitis_c_treatment",
          "hepatic_risk",
          "drug_interaction",
          "ribavirin_pregnancy_risk",
          "hepatitis_b_reactivation_risk",
          "adherence_sensitive",
          "specialist_regimen"
        ],

        patternTags: [
          "chronic_hepatitis_c",
          "viral_hepatitis",
          "liver_disease",
          "hepatitis_b_reactivation"
        ],

        symptomLinks: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "fatigue",
          "right upper abdominal pain",
          "shortness of breath",
          "severe weakness",
          "rash"
        ],

        indications: [
          "chronic hepatitis C infection",
          "selected hepatitis C genotypes and treatment contexts"
        ],

        commonUseCases: [
          "curative hepatitis C treatment",
          "specialist-directed antiviral regimen",
          "treatment after HCV RNA confirmation"
        ],

        interactionRisks: [
          "acid_reducing_medications",
          "amiodarone",
          "statins",
          "anticonvulsants",
          "rifamycin_interactions",
          "ritonavir_boosting",
          "warfarin_monitoring",
          "pregnancy_risk_with_ribavirin"
        ],

        contraindications: [
          "history of severe allergy to medication components"
        ],

        precautions: [
          "hepatitis B coinfection",
          "decompensated cirrhosis",
          "pregnancy when ribavirin is involved",
          "significant drug interaction risk",
          "renal impairment for selected regimens",
          "adherence barriers"
        ],

        precautionTriggers: [
          "hepatitis_b",
          "cirrhosis",
          "decompensated_liver_disease",
          "pregnancy",
          "ribavirin",
          "amiodarone",
          "rifampin",
          "seizure_medications",
          "missed_doses"
        ],

        blackBoxWarnings: [
          "Hepatitis B reactivation has been reported in patients treated with hepatitis C direct-acting antivirals."
        ],

        commonEffects: [
          "fatigue",
          "headache",
          "nausea",
          "diarrhea",
          "insomnia"
        ],

        seriousEffects: [
          "hepatitis B reactivation",
          "serious bradycardia with amiodarone and sofosbuvir-containing regimens",
          "liver decompensation in vulnerable patients",
          "anemia with ribavirin",
          "birth defect risk with ribavirin",
          "severe allergic reaction"
        ],

        warningSigns: [
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "confusion",
          "abdominal swelling",
          "severe weakness",
          "fainting",
          "slow heart rate",
          "shortness of breath",
          "severe rash"
        ],

        monitoring: [
          "HCV RNA",
          "genotype or regimen eligibility when relevant",
          "liver function",
          "hepatitis B status",
          "drug interaction review",
          "pregnancy status when ribavirin is involved",
          "CBC when ribavirin is used",
          "INR monitoring when clinically relevant"
        ],

        clinicalPearls: [
          "Confirm hepatitis C infection with HCV RNA before treatment decisions.",
          "Screen for hepatitis B before starting HCV direct-acting antivirals.",
          "Regimen selection depends on genotype, cirrhosis status, prior treatment, renal function, and drug interactions.",
          "Ribavirin has major pregnancy-related precautions.",
          "Sofosbuvir-containing regimens with amiodarone can cause serious bradycardia.",
          "Acid-reducing medications can affect absorption of some HCV regimens."
        ],

        reasoningHints: [
          "If hepatitis B history exists, increase reactivation-risk weighting before HCV treatment.",
          "If amiodarone is present with sofosbuvir, treat interaction risk as high priority.",
          "If ribavirin is present, pregnancy safety becomes high priority.",
          "If cirrhosis or decompensation is present, avoid simple medication reasoning and recommend specialist-level review.",
          "If missed doses occur, increase adherence and treatment-failure concern."
        ],

        decisionRules: [
          {
            id: "hbv_reactivation_screen",
            priority: "critical",
            when: [
              "hcv_daa",
              "hepatitis_b"
            ],
            then: [
              "increase_hepatitis_b_reactivation_probability",
              "recommend_specialist_review"
            ]
          },
          {
            id: "sofosbuvir_amiodarone_bradycardia",
            priority: "critical",
            when: [
              "sofosbuvir",
              "amiodarone"
            ],
            then: [
              "increase_serious_bradycardia_risk",
              "recommend_immediate_clinician_review"
            ]
          },
          {
            id: "ribavirin_pregnancy",
            priority: "critical",
            when: [
              "ribavirin",
              "pregnancy"
            ],
            then: [
              "increase_pregnancy_safety_weight",
              "recommend_immediate_clinician_review"
            ]
          },
          {
            id: "cirrhosis_hcv_treatment",
            priority: "high",
            when: [
              "hcv",
              "cirrhosis"
            ],
            then: [
              "increase_specialist_management_need",
              "activate_hepatology_context"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive HCV RNA",
            "known chronic hepatitis C",
            "current direct-acting antiviral therapy",
            "hepatitis B coinfection",
            "cirrhosis",
            "ribavirin use"
          ],
          decreases: [
            "negative HCV RNA",
            "alternative liver disease identified",
            "symptoms started before HCV therapy"
          ]
        },

        relatedKnowledge: [
          "hepatitis_c",
          "hepatitis_b_reactivation",
          "cirrhosis",
          "hepatocellular_carcinoma",
          "drug_interactions",
          "ribavirin",
          "amiodarone",
          "bradycardia"
        ],

        followUpQuestions: [
          "Which hepatitis C medication is being taken?",
          "Was HCV RNA positive?",
          "Any history of hepatitis B?",
          "Any cirrhosis or liver failure history?",
          "Is ribavirin part of the regimen?",
          "Is the patient pregnant or could they be pregnant?",
          "Any amiodarone use?",
          "Any yellowing of the skin or eyes, dark urine, confusion, or abdominal swelling?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        recommendedConsults: [
          "Hepatology",
          "Infectious Disease",
          "Clinical Pharmacy"
        ],

        references: [
          "AASLD-IDSA HCV Guidance",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "Hepatitis C direct-acting antiviral therapy is highly regimen-specific. Ari should treat HCV medication questions as specialist-level when cirrhosis, hepatitis B coinfection, pregnancy, ribavirin, amiodarone, renal impairment, or complex interactions are present."
      }
    ];
  }
};

window.AriHepatitisCAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisCAntivirals;

console.log(
  "ARI HEPATITIS C ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.hepatitisCAntivirals.version
);