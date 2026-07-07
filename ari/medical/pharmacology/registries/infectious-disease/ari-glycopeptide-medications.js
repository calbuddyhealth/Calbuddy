// ari/medical/pharmacology/registries/infectious-disease/ari-glycopeptide-medications.js
// Purpose: Register glycopeptide antibiotic medication knowledge.
// V1.0.0 — Glycopeptide Registry / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.registries = window.Ari.medical.registries || {};
window.Ari.medical.registries.infectiousDisease =
  window.Ari.medical.registries.infectiousDisease || {};

window.Ari.medical.registries.infectiousDisease.glycopeptides = {
  version: "1.0.0",

  entries() {
    return [
      {
        
  id: "glycopeptide_antibiotics",

  className: "Glycopeptide Antibiotics",

  aliases: [
    "glycopeptide",

    "vancomycin",
    "vancocin",
    "vanco",

    "telavancin",
    "vibativ",

    "dalbavancin",
    "dalvance",

    "oritavancin",
    "orbactiv"
  ],

  systems: [
    "infectious_disease",
    "pharmacology"
  ],

  riskTags: [
    "antibiotic",
    "mrsa_coverage",
    "renal_risk",
    "ototoxicity_risk",
    "infusion_reaction",
    "therapeutic_drug_monitoring",
    "pregnancy_caution"
  ],

  interactionRisks: [
    "renal_risk",
    "ototoxicity_risk",
    "nephrotoxic_medications"
  ],

  contraindications: [
    "history of severe glycopeptide allergy"
  ],

  blackBoxWarnings: [],

  commonEffects: [
    "infusion flushing",
    "rash",
    "nausea",
    "headache",
    "phlebitis"
  ],

  seriousEffects: [
    "kidney injury",
    "ototoxicity",
    "anaphylaxis",
    "red man syndrome",
    "neutropenia",
    "severe allergic reaction"
  ],

  warningSigns: [
    "decreased urination",
    "swelling",
    "hearing loss",
    "ringing in ears",
    "dizziness",
    "severe rash",
    "difficulty breathing",
    "facial swelling",
    "persistent fever"
  ],

  monitoring: [
    "kidney function",
    "vancomycin AUC or trough when appropriate",
    "hearing changes",
    "CBC during prolonged therapy",
    "infusion reactions"
  ],

  clinicalPearls: [
    "Vancomycin commonly requires therapeutic drug monitoring.",
    "Infuse slowly to reduce infusion-related reactions such as Red Man Syndrome.",
    "Evaluate renal function throughout treatment.",
    "Frequently used for suspected or confirmed MRSA infections.",
    "Oral vancomycin is used for C. difficile infection, while IV vancomycin is not effective for treating C. difficile within the colon."
  ],

  reasoningHints: [
    "Differentiate Red Man Syndrome from IgE-mediated anaphylaxis.",
    "Always review kidney function before increasing concern for nephrotoxicity.",
    "Consider concomitant nephrotoxic medications when renal injury develops.",
    "If hearing changes occur during therapy, increase suspicion for ototoxicity.",
    "If oral vancomycin is mentioned, consider C. difficile rather than systemic infection."
  ],

  decisionRules: [
    {
      trigger: "decreased_urination",
      action: "increase_renal_safety_weight"
    },
    {
      trigger: "hearing_loss",
      action: "increase_ototoxicity_probability"
    },
    {
      trigger: "ringing_in_ears",
      action: "increase_ototoxicity_probability"
    },
    {
      trigger: "infusion_flushing",
      action: "evaluate_red_man_syndrome"
    },
    {
      trigger: "oral_vancomycin",
      action: "increase_c_diff_probability"
    },
    {
      trigger: "iv_vancomycin",
      action: "exclude_c_diff_treatment_assumption"
    }
  ],

  pediatricCaution: true,
  pregnancyCaution: true,

  notes:
    "Glycopeptides are important agents for resistant gram-positive infections. Renal function, infusion rate, therapeutic drug monitoring, and hearing symptoms are key safety considerations."
}
    ];
  }
};

window.AriInfectiousDiseaseGlycopeptides =
  window.Ari.medical.registries.infectiousDisease.glycopeptides;

console.log(
  "ARI INFECTIOUS DISEASE GLYCOPEPTIDES LOADED:",
  window.Ari.medical.registries.infectiousDisease.glycopeptides.version
);