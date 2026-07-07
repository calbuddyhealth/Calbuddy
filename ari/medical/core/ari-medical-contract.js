// ari/medical/core/ari-medical-contract.js
// Purpose: Standard return packet for every Ari medical engine.
// V1.0.0

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.contract = {
  create({
    engine = "unknown_medical_engine",
    version = "0.0.0",
    activated = false,
    confidence = "uncertain",
    urgency = "none",
    population = "unknown",
    findings = [],
    supportingEvidence = [],
    conflictingEvidence = [],
    missingEvidence = [],
    differentialDiagnoses = [],
    recommendedQuestions = [],
    suggestedLabs = [],
    suggestedImaging = [],
    suggestedProcedures = [],
    medicationConcerns = [],
    redFlags = [],
    reasoning = "",
    safetyMessage = null
  } = {}) {
    return {
      engine,
      version,
      activated,

      authority: "clinical_decision_support_only",
      cannotDiagnose: true,
      cannotReplaceClinician: true,

      confidence,
      urgency,
      population,

      findings,
      supportingEvidence,
      conflictingEvidence,
      missingEvidence,

      differentialDiagnoses,
      recommendedQuestions,

      suggestedLabs,
      suggestedImaging,
      suggestedProcedures,
      medicationConcerns,
      redFlags,

      reasoning,
      safetyMessage,

      cannotSet: [
        "finalDiagnosis",
        "finalResponse",
        "prescription",
        "medicalOrder",
        "emergencyDecision"
      ]
    };
  }
};

console.log("ARI MEDICAL CONTRACT LOADED");