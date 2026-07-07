// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-rsv-antivirals.js
// Purpose: Register RSV antiviral / monoclonal antibody medication knowledge.
// V2.0.0 — RSV Antiviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.rsvAntivirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "rsv_antivirals",

        className: "RSV Antivirals and Preventive Monoclonal Antibodies",

        aliases: [
          "rsv medication",
          "rsv antiviral",
          "rsv prevention",

          "palivizumab",
          "synagis",

          "nirsevimab",
          "beyfortus",

          "ribavirin"
        ],

        systems: [
          "infectious_disease",
          "pharmacology",
          "pediatrics",
          "pulmonology"
        ],

        specialty: "infectious_disease",

        riskTags: [
          "rsv",
          "antiviral",
          "monoclonal_antibody",
          "pediatric_caution",
          "infant_context",
          "high_risk_infant",
          "respiratory_monitoring",
          "ribavirin_pregnancy_risk",
          "anemia_risk",
          "specialist_regimen"
        ],

        patternTags: [
          "rsv_bronchiolitis",
          "infant_respiratory_illness",
          "high_risk_pediatric_prevention",
          "immunocompromised_rsv"
        ],

        symptomLinks: [
          "cough",
          "wheezing",
          "trouble breathing",
          "poor feeding",
          "fever",
          "lethargy",
          "blue lips",
          "apnea"
        ],

        indications: [
          "RSV prevention in selected high-risk infants and young children",
          "RSV prevention in eligible infants",
          "specialist-directed RSV treatment in selected severe or high-risk cases"
        ],

        commonUseCases: [
          "RSV prophylaxis in eligible infants",
          "RSV prevention in high-risk pediatric patients",
          "selected severe RSV cases under specialist guidance"
        ],

        interactionRisks: [
          "pregnancy_exposure_risk_with_ribavirin",
          "anemia_risk",
          "respiratory_status_monitoring"
        ],

        contraindications: [
          "history of severe allergy to medication components"
        ],

        precautions: [
          "premature infant",
          "chronic lung disease",
          "congenital heart disease",
          "immunocompromised status",
          "pregnancy exposure risk with ribavirin",
          "severe respiratory distress"
        ],

        precautionTriggers: [
          "infant",
          "premature",
          "chronic_lung_disease",
          "congenital_heart_disease",
          "immunocompromised",
          "pregnant",
          "ribavirin",
          "trouble_breathing",
          "poor_feeding",
          "apnea"
        ],

        blackBoxWarnings: [],

        commonEffects: [
          "injection site reaction",
          "fever",
          "rash",
          "nausea"
        ],

        seriousEffects: [
          "severe allergic reaction",
          "anaphylaxis",
          "bronchospasm",
          "anemia with ribavirin",
          "birth defect risk with ribavirin",
          "worsening respiratory status"
        ],

        warningSigns: [
          "trouble breathing",
          "blue lips",
          "apnea",
          "poor feeding",
          "lethargy",
          "severe rash",
          "facial swelling",
          "wheezing",
          "severe weakness"
        ],

        monitoring: [
          "respiratory effort",
          "oxygen saturation when available",
          "feeding",
          "hydration",
          "fever",
          "allergic reaction symptoms",
          "CBC when ribavirin is used",
          "pregnancy exposure risk when ribavirin is involved"
        ],

        clinicalPearls: [
          "RSV risk assessment is heavily age- and risk-factor dependent.",
          "Infants can deteriorate quickly when feeding worsens or work of breathing increases.",
          "Nirsevimab and palivizumab are preventive monoclonal antibody strategies, not routine treatment for every RSV infection.",
          "Ribavirin use is specialist-level and uncommon in routine RSV cases.",
          "Poor feeding, apnea, blue lips, or significant work of breathing in an infant should raise urgency."
        ],

        reasoningHints: [
          "If the patient is an infant with RSV symptoms, prioritize breathing, feeding, hydration, and alertness.",
          "If ribavirin is mentioned, pregnancy exposure and anemia risk become important.",
          "If RSV prophylaxis is mentioned, clarify whether the patient is high-risk or eligible by age/risk criteria.",
          "Do not treat monoclonal antibody RSV prevention as acute symptom treatment.",
          "If apnea or blue lips are reported, route to emergency-level concern."
        ],

        decisionRules: [
          {
            id: "infant_rsv_breathing_red_flag",
            priority: "critical",
            when: [
              "infant",
              "trouble_breathing"
            ],
            then: [
              "increase_urgency",
              "recommend_same_day_or_emergency_assessment"
            ]
          },
          {
            id: "infant_rsv_poor_feeding",
            priority: "high",
            when: [
              "infant",
              "poor_feeding"
            ],
            then: [
              "increase_dehydration_risk",
              "recommend_pediatric_review"
            ]
          },
          {
            id: "rsv_apnea",
            priority: "critical",
            when: [
              "rsv",
              "apnea"
            ],
            then: [
              "increase_emergency_risk",
              "recommend_emergency_care"
            ]
          },
          {
            id: "ribavirin_pregnancy_exposure",
            priority: "critical",
            when: [
              "ribavirin",
              "pregnancy"
            ],
            then: [
              "increase_pregnancy_safety_weight",
              "recommend_immediate_clinician_review"
            ]
          }
        ],

        confidenceModifiers: {
          increases: [
            "positive RSV test",
            "infant age",
            "prematurity",
            "chronic lung disease",
            "congenital heart disease",
            "immunocompromised status",
            "poor feeding",
            "increased work of breathing"
          ],
          decreases: [
            "negative RSV testing",
            "alternative diagnosis identified",
            "normal feeding and breathing"
          ]
        },

        relatedKnowledge: [
          "rsv",
          "bronchiolitis",
          "pediatrics",
          "infant_respiratory_distress",
          "dehydration",
          "monoclonal_antibodies",
          "ribavirin"
        ],

        followUpQuestions: [
          "How old is the child?",
          "Was RSV testing positive?",
          "Is there trouble breathing, wheezing, blue lips, or pauses in breathing?",
          "Is the baby feeding normally?",
          "How many wet diapers have there been today?",
          "Was this medication given for prevention or treatment?",
          "Is ribavirin involved, and is anyone pregnant or possibly pregnant?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: false,
        renalCaution: false,
        hepaticCaution: false,

        recommendedConsults: [
          "Pediatrics",
          "Infectious Disease",
          "Pulmonology"
        ],

        references: [
          "CDC RSV Guidance",
          "AAP Red Book",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "RSV medication knowledge is highly population-specific. Nirsevimab and palivizumab are prevention strategies for selected infants/children, while ribavirin is specialist-level and uncommon. Ari should prioritize respiratory effort, feeding, hydration, age, and high-risk pediatric context."
      }
    ];
  }
};

window.AriRsvAntiviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.rsvAntivirals;

console.log(
  "ARI RSV ANTIVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.rsvAntivirals.version
);