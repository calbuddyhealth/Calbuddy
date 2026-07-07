// ari/medical/red-flags/ari-medical-red-flag-engine.js
// Purpose: Detect medical red flags and recommend urgency level without diagnosing.
// V1.0.0 — Red Flag Safety Router / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.redFlagEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const summary = input.summary || input || {};

    const text = window.Ari.medical.utils.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const emergency = this.findMatches(text, this.emergencyRedFlags());
    const urgent = this.findMatches(text, this.urgentRedFlags());
    const special = this.findMatches(text, this.specialPopulationRedFlags());

    const urgency =
      emergency.length ? "emergency" :
      urgent.length || special.length ? "urgent" :
      "routine";

    return window.Ari.medical.contract.create({
      engine: "ari-medical-red-flag-engine",
      version: this.version,
      activated: emergency.length || urgent.length || special.length,
      confidence: emergency.length ? "high" : urgent.length || special.length ? "medium" : "low",
      urgency,
      emergencyRedFlags: emergency,
      urgentRedFlags: urgent,
      specialPopulationRedFlags: special,
      findings: [...emergency, ...urgent, ...special],
      reasoning: this.reasoningFor(urgency),
      nextStep: this.nextStepFor(urgency),
      responsePosture: {
        label: "medical_red_flag_screening",
        safetyFirst: true,
        advisoryOnly: true,
        avoidDiagnosis: true
      }
    });
  },

  emergencyRedFlags() {
    return [
      "chest pain",
      "severe chest pain",
      "shortness of breath at rest",
      "trouble breathing",
      "blue lips",
      "fainting",
      "passed out",
      "new facial droop",
      "slurred speech",
      "one sided weakness",
      "worst headache",
      "seizure",
      "confusion",
      "coughing blood",
      "severe allergic reaction",
      "swollen lips",
      "swollen tongue",
      "throat swelling",
      "suicidal",
      "homicidal",
      "overdose",
      "severe bleeding",
      "black stool with weakness",
      "blood pressure very low",
      "oxygen low",
      "neck stiffness with fever"
    ];
  },

  urgentRedFlags() {
    return [
      "fever for several days",
      "high fever",
      "worsening pain",
      "severe abdominal pain",
      "blood in urine",
      "blood in stool",
      "dehydration",
      "not peeing",
      "new leg swelling",
      "calf pain",
      "pregnant with bleeding",
      "pregnant with severe headache",
      "vision changes",
      "right upper belly pain",
      "decreased fetal movement",
      "testicle pain",
      "severe back pain with weakness",
      "new numbness",
      "wound infection",
      "rapidly spreading rash",
      "skin peeling"
    ];
  },

  specialPopulationRedFlags() {
    return [
      "newborn fever",
      "baby not feeding",
      "no wet diapers",
      "infant trouble breathing",
      "pregnant",
      "immunocompromised",
      "chemotherapy",
      "elderly confusion",
      "diabetic with vomiting"
    ];
  },

  findMatches(text = "", terms = []) {
    return terms
      .filter(term => window.Ari.medical.utils.hasTerm(text, term))
      .map(term => ({
        term,
        category: "red_flag",
        confidence: "medium"
      }));
  },

  reasoningFor(urgency = "routine") {
    if (urgency === "emergency") {
      return "The message contains symptoms that can represent time-sensitive or life-threatening problems.";
    }

    if (urgency === "urgent") {
      return "The message contains symptoms that may need same-day medical evaluation depending on severity and context.";
    }

    return "No major red-flag phrase was detected from the available message.";
  },

  nextStepFor(urgency = "routine") {
    if (urgency === "emergency") {
      return "Recommend emergency care now or calling emergency services if symptoms are current, severe, or worsening.";
    }

    if (urgency === "urgent") {
      return "Recommend same-day contact with a clinician, urgent care, OB triage, pediatric advice line, or emergency care if worsening.";
    }

    return "Continue with focused questions, general education, and clear return precautions.";
  }
};

window.AriMedicalRedFlagEngine = window.Ari.medical.redFlagEngine;

console.log(
  "ARI MEDICAL RED FLAG ENGINE LOADED:",
  window.Ari.medical.redFlagEngine.version
);