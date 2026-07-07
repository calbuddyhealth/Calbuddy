// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-influenza-antivirals.js
// Purpose: Register influenza antiviral medication knowledge.
// V2.0.0 — Influenza Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.influenzaAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "influenza_antivirals",

        className: "Influenza Antivirals",

        aliases: [
          "influenza antiviral",
          "flu antiviral",

          "oseltamivir",
          "tamiflu",

          "zanamivir",
          "relenza",

          "peramivir",
          "rapivab",

          "baloxavir",
          "xofluza"
        ],

        systems: [
          "infectious_disease",
          "pharmacology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "antiviral",
          "influenza_treatment",
          "early_treatment_window",
          "renal_adjustment_possible",
          "bronchospasm_risk",
          "neuropsychiatric_effect_risk",
          "resistance_risk",
          "pregnancy_caution",
          "pediatric_caution"
        ],

        patternTags: [
          "influenza",
          "flu_like_illness",
          "viral_respiratory_infection",
          "high_risk_influenza"
        ],

        symptomLinks: [
          "fever",
          "cough",
          "body aches",
          "fatigue",
          "sore throat",
          "shortness of breath",
          "wheezing",
          "confusion",
          "hallucinations"
        ],

        indications: [
          "influenza treatment",
          "influenza post-exposure prophylaxis in selected patients",
          "high-risk influenza infection"
        ],

        commonUseCases: [
          "confirmed influenza",
          "suspected influenza in high-risk patients",
          "early influenza symptoms",
          "influenza outbreak exposure"
        ],

        interactionRisks: [
          "renal_risk",
          "bronchospasm_risk",
          "neuropsychiatric_effect_risk",
          "vaccine_timing_considerations"
        ],

        contraindications: [
          "history of severe influenza antiviral allergy"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "nausea",
          "vomiting",
          "headache",
          "diarrhea",
          "dizziness"
        ],

        seriousEffects: [
          "bronchospasm",
          "neuropsychiatric symptoms",
          "severe allergic reaction",
          "skin reaction"
        ],

        warningSigns: [
          "trouble breathing",
          "wheezing",
          "confusion",
          "hallucinations",
          "severe rash",
          "swollen lips",
          "swollen tongue",
          "throat swelling",
          "fainting"
        ],

        monitoring: [
          "symptom onset timing",
          "renal function when relevant",
          "breathing symptoms with zanamivir",
          "mental status changes",
          "high-risk conditions",
          "pregnancy status"
        ],

        clinicalPearls: [
          "Influenza antivirals work best when started early, ideally within 48 hours of symptom onset.",
          "High-risk patients may still benefit even when presenting later.",
          "Oseltamivir and peramivir may require renal dose adjustment.",
          "Zanamivir is inhaled and can worsen bronchospasm in patients with asthma or COPD.",
          "Baloxavir is single-dose but resistance concerns may matter in selected situations."
        ],

        reasoningHints: [
          "Always ask when flu symptoms started.",
          "If the patient is high-risk, do not dismiss treatment benefit solely because symptoms started more than 48 hours ago.",
          "If zanamivir is mentioned with wheezing or asthma, increase bronchospasm concern.",
          "If confusion or hallucinations occur after starting therapy, consider neuropsychiatric adverse effects but also evaluate influenza severity.",
          "If symptoms are worsening with shortness of breath, consider influenza complications rather than medication side effect alone."
        ],

        decisionRules: [
          {
            id: "early_flu_treatment_window",
            priority: "medium",
            when: [
              "influenza",
              "symptom_onset_under_48_hours"
            ],
            then: [
              "increase_expected_antiviral_benefit"
            ]
          },
          {
            id: "high_risk_late_flu_treatment",
            priority: "high",
            when: [
              "influenza",
              "high_risk_patient"
            ],
            then: [
              "do_not_exclude_antiviral_benefit_due_to_late_presentation"
            ]
          },
          {
            id: "zanamivir_bronchospasm",
            priority: "high",
            when: [
              "zanamivir",
              "wheezing"
            ],
            then: [
              "increase_bronchospasm_probability",
              "recommend_clinician_review"
            ]
          },
          {
            id: "renal_dosing_signal",
            priority: "medium",
            when: [
              "oseltamivir",
              "renal_impairment"
            ],
            then: [
              "recommend_renal_dose_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive influenza test",
            "known influenza exposure",
            "classic flu-like illness",
            "symptom onset under 48 hours",
            "high-risk condition"
          ],
          decreases: [
            "negative influenza testing",
            "symptoms not consistent with influenza",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "influenza",
          "viral_respiratory_infection",
          "pneumonia",
          "asthma",
          "copd",
          "renal_dosing",
          "pregnancy_infection_risk"
        ],

        followUpQuestions: [
          "When did symptoms start?",
          "Was influenza testing positive?",
          "Any high-risk conditions like pregnancy, asthma, COPD, diabetes, heart disease, immune suppression, or age over 65?",
          "Which antiviral was started?",
          "Any wheezing or trouble breathing?",
          "Any confusion, hallucinations, or severe rash?",
          "Any kidney disease?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: false,

        references: [
          "CDC Influenza Antiviral Guidance",
          "FDA Prescribing Information",
          "IDSA Influenza Guidelines",
          "Lexicomp"
        ],

        notes:
          "Influenza antivirals include oseltamivir, zanamivir, peramivir, and baloxavir. Timing from symptom onset, high-risk status, renal function, respiratory comorbidities, and neuropsychiatric symptoms are key reasoning factors."
      }
    ];
  }
};

window.AriInfluenzaAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.influenzaAntivirals;

console.log(
  "ARI INFLUENZA ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.influenzaAntivirals.version
);