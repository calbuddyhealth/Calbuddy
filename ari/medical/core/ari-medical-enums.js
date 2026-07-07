// ari/medical/core/ari-medical-enums.js
// Purpose: Shared medical enums.
// V1.0.0

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.enums = {
  urgency: {
    NONE: "none",
    ROUTINE: "routine",
    SOON: "soon",
    URGENT: "urgent",
    EMERGENCY: "emergency"
  },

  confidence: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    UNCERTAIN: "uncertain"
  },

  evidenceType: {
    SYMPTOM: "symptom",
    SIGN: "sign",
    HISTORY: "history",
    MEDICATION: "medication",
    LAB: "lab",
    IMAGING: "imaging",
    PROCEDURE: "procedure",
    RISK_FACTOR: "risk_factor",
    RED_FLAG: "red_flag",
    CONTRADICTION: "contradiction"
  },

  population: {
    ADULT: "adult",
    PEDIATRIC: "pediatric",
    NEONATAL: "neonatal",
    PREGNANT: "pregnant",
    POSTPARTUM: "postpartum",
    GERIATRIC: "geriatric",
    UNKNOWN: "unknown"
  },

  medicalAuthority: {
    ADVISORY_ONLY: "clinical_decision_support_only",
    NO_DIAGNOSIS: "does_not_diagnose",
    SAFETY_FIRST: "safety_first"
  }
};

console.log("ARI MEDICAL ENUMS LOADED");