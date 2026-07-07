// ari/medical/pharmacology/registries/infectious-disease/antivirals/ari-hiv-antiretrovirals.js
// Purpose: Register HIV antiretroviral and PrEP/PEP medication knowledge.
// V2.0.0 — HIV Antiretroviral Registry / UMKO Standard

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};
window.Ari.medical.registries.infectiousDisease.antivirals =
  window.Ari.medical.registries.infectiousDisease.antivirals || {};

window.Ari.medical.registries.infectiousDisease.antivirals.hivAntiretrovirals = {
  version: "2.0.0",

  entries() {
    return [
      {
        id: "hiv_antiretrovirals",
        className: "HIV Antiretrovirals and PrEP/PEP Medications",

        aliases: [
          "hiv medication", "antiretroviral", "art", "prep", "pep",
          "truvada", "emtricitabine tenofovir df", "tdf ftc",
          "descovy", "emtricitabine tenofovir af", "taf ftc",
          "apretude", "cabotegravir",
          "biktarvy", "bictegravir emtricitabine tenofovir",
          "dolutegravir", "tivicay",
          "raltegravir", "isentress",
          "efavirenz", "sustiva",
          "rilpivirine", "edurant",
          "darunavir", "prezista",
          "atazanavir", "reyataz",
          "ritonavir", "norvir",
          "lopinavir ritonavir", "kaletra",
          "abacavir", "ziagen",
          "lamivudine", "epivir",
          "zidovudine", "retrovir",
          "cabenuva"
        ],

        systems: ["infectious_disease", "pharmacology"],
        specialty: "infectious_disease",

        riskTags: [
          "antiviral", "hiv_treatment", "prep", "pep",
          "renal_risk", "bone_density_risk", "hepatic_risk",
          "drug_interaction", "resistance_risk", "adherence_sensitive",
          "hepatitis_b_flare_risk", "pregnancy_caution"
        ],

        patternTags: [
          "hiv", "prep", "pep", "viral_suppression",
          "drug_resistance", "hepatitis_b_coinfection"
        ],

        symptomLinks: [
          "nausea", "diarrhea", "headache", "fatigue",
          "yellow skin", "yellow eyes", "dark urine",
          "decreased urination", "bone pain", "rash"
        ],

        indications: [
          "HIV treatment",
          "HIV pre-exposure prophylaxis",
          "HIV post-exposure prophylaxis"
        ],

        commonUseCases: [
          "chronic HIV treatment",
          "PrEP for HIV prevention",
          "PEP after potential HIV exposure",
          "long-acting injectable HIV therapy in selected patients"
        ],

        interactionRisks: [
          "cyp3a_interactions",
          "ritonavir_boosting",
          "cobicistat_boosting",
          "renal_risk",
          "hepatitis_b_flare",
          "anticonvulsant_interactions",
          "rifamycin_interactions"
        ],

        contraindications: [
          "history of severe antiretroviral allergy"
        ],

        precautions: [
          "renal impairment",
          "hepatitis B coinfection",
          "osteoporosis or bone-density risk",
          "pregnancy",
          "drug interaction risk",
          "adherence barriers",
          "known or suspected antiretroviral resistance"
        ],

        precautionTriggers: [
          "renal_impairment",
          "hepatitis_b",
          "pregnancy",
          "missed_doses",
          "drug_interactions",
          "rifampin",
          "seizure_medications"
        ],

        blackBoxWarnings: [
          "Severe acute exacerbations of hepatitis B can occur after stopping emtricitabine/tenofovir-containing products in patients with hepatitis B."
        ],

        commonEffects: [
          "nausea", "diarrhea", "headache", "fatigue", "insomnia"
        ],

        seriousEffects: [
          "kidney injury",
          "bone mineral density loss",
          "liver injury",
          "hypersensitivity reaction",
          "lactic acidosis",
          "immune reconstitution inflammatory syndrome",
          "drug resistance",
          "hepatitis B flare after stopping"
        ],

        warningSigns: [
          "decreased urination",
          "yellow skin",
          "yellow eyes",
          "dark urine",
          "severe rash",
          "trouble breathing",
          "facial swelling",
          "severe weakness",
          "right upper abdominal pain"
        ],

        monitoring: [
          "HIV viral load",
          "CD4 count when applicable",
          "renal function",
          "liver function",
          "hepatitis B status",
          "HIV testing for PrEP",
          "STI screening for PrEP",
          "bone health when clinically relevant",
          "medication adherence"
        ],

        clinicalPearls: [
          "Truvada is emtricitabine/tenofovir disoproxil fumarate and is used for HIV treatment combinations, PrEP, and PEP contexts.",
          "Descovy is emtricitabine/tenofovir alafenamide and has different renal/bone considerations than TDF.",
          "Do not casually stop HIV therapy because viral rebound and resistance can occur.",
          "Check hepatitis B status before starting or stopping tenofovir/emtricitabine-containing regimens.",
          "PrEP requires confirmed HIV-negative status before use.",
          "PEP is time-sensitive and should be started as soon as possible after exposure."
        ],

        reasoningHints: [
          "If Truvada or Descovy is mentioned, clarify whether it is being used for HIV treatment, PrEP, or PEP.",
          "If missed doses are reported, increase adherence and resistance concern.",
          "If hepatitis B is present, stopping tenofovir/emtricitabine can trigger flare risk.",
          "If renal symptoms or abnormal creatinine appear with tenofovir DF, increase renal safety weighting.",
          "If ritonavir or cobicistat is present, activate medication interaction review."
        ],

        decisionRules: [
          {
            id: "truvada_context_check",
            priority: "high",
            when: ["truvada"],
            then: ["clarify_prep_pep_or_hiv_treatment_context"]
          },
          {
            id: "hep_b_flare_risk",
            priority: "high",
            when: ["tenofovir_emtricitabine", "stopped_medication", "hepatitis_b"],
            then: ["increase_hepatitis_b_flare_probability", "recommend_clinician_review"]
          },
          {
            id: "prep_hiv_testing",
            priority: "critical",
            when: ["prep"],
            then: ["confirm_hiv_negative_status_required"]
          },
          {
            id: "pep_time_sensitive",
            priority: "critical",
            when: ["pep", "recent_exposure"],
            then: ["increase_time_sensitive_guidance"]
          },
          {
            id: "booster_interaction_review",
            priority: "high",
            when: ["ritonavir"],
            then: ["activate_medication_interaction_engine"]
          }
        ],

        confidenceModifiers: {
          increases: [
            "known HIV diagnosis",
            "PrEP prescription",
            "recent exposure requiring PEP",
            "positive HIV viral load",
            "missed ART doses",
            "hepatitis B coinfection"
          ],
          decreases: [
            "no antiretroviral exposure",
            "symptoms started before medication",
            "alternative diagnosis identified"
          ]
        },

        relatedKnowledge: [
          "hiv", "prep", "pep", "hepatitis_b",
          "renal_dosing", "drug_interactions",
          "immune_reconstitution_inflammatory_syndrome",
          "antiretroviral_resistance"
        ],

        followUpQuestions: [
          "Is this for HIV treatment, PrEP, or PEP?",
          "Which medication or regimen is being taken?",
          "Any missed doses or recent stopping?",
          "Any kidney disease or abnormal creatinine?",
          "Any hepatitis B history?",
          "Any new medications, especially seizure meds, rifampin, or boosters like ritonavir/cobicistat?",
          "Was HIV testing done recently?"
        ],

        pediatricCaution: true,
        pregnancyCaution: true,
        geriatricCaution: true,
        renalCaution: true,
        hepaticCaution: true,

        recommendedConsults: [
          "Infectious Disease",
          "Clinical Pharmacy"
        ],

        references: [
          "NIH HIV Guidelines",
          "CDC PrEP Guidance",
          "CDC PEP Guidance",
          "FDA Prescribing Information",
          "Lexicomp"
        ],

        notes:
          "HIV antiretroviral therapy is regimen-specific and adherence-sensitive. Ari should clarify treatment context, avoid casual stop/start advice, check for interactions, and treat PrEP/PEP timing and HIV testing as high-priority context."
      }
    ];
  }
};

window.AriHivAntiretroviralsRegistry =
  window.Ari.medical.registries.infectiousDisease.antivirals.hivAntiretrovirals;

console.log(
  "ARI HIV ANTIRETROVIRALS REGISTRY LOADED:",
  window.Ari.medical.registries.infectiousDisease.antivirals.hivAntiretrovirals.version
);